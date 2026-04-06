use rustfft::num_complex::Complex;
use rustfft::Fft;
use std::sync::Arc;
use vozoo_core::{AudioBuffer, AudioNode};

use super::fft_utils;

/// Formant shifter using LPC (Linear Predictive Coding) analysis-resynthesis.
/// Separates the spectral envelope (formants) from the excitation (residual),
/// shifts the envelope, and recombines.
pub struct FormantShift {
    shift_factor: f32,
    lpc_order: usize,
    fft_size: usize,
    hop_size: usize,
    window: Vec<f32>,
    fft_forward: Arc<dyn Fft<f32>>,
    fft_inverse: Arc<dyn Fft<f32>>,
}

impl FormantShift {
    pub fn new(shift_factor: f32) -> Self {
        Self::with_order(shift_factor, 16)
    }

    pub fn with_order(shift_factor: f32, lpc_order: usize) -> Self {
        let fft_size = 2048;
        let hop_size = fft_size / 4;
        let (fft_forward, fft_inverse) = fft_utils::create_fft_pair(fft_size);

        Self {
            shift_factor,
            lpc_order,
            fft_size,
            hop_size,
            window: fft_utils::hann_window(fft_size),
            fft_forward,
            fft_inverse,
        }
    }

    /// Levinson-Durbin recursion: compute LPC coefficients from autocorrelation.
    fn levinson_durbin(autocorr: &[f32], order: usize) -> Vec<f32> {
        let mut coeffs = vec![0.0f32; order + 1];
        let mut temp = vec![0.0f32; order + 1];
        coeffs[0] = 1.0;

        if autocorr[0].abs() < 1e-10 {
            return coeffs;
        }

        let mut error = autocorr[0];

        for i in 1..=order {
            // Compute reflection coefficient
            let mut lambda = 0.0f32;
            for j in 1..i {
                lambda += coeffs[j] * autocorr[i - j];
            }
            lambda = -(autocorr[i] + lambda) / error;

            // Update coefficients
            temp[..=order].copy_from_slice(&coeffs[..=order]);
            for j in 1..i {
                coeffs[j] = temp[j] + lambda * temp[i - j];
            }
            coeffs[i] = lambda;

            error *= 1.0 - lambda * lambda;
            if error < 1e-10 {
                break;
            }
        }

        coeffs
    }

    /// Compute LPC spectral envelope magnitude at each FFT bin.
    fn lpc_envelope(&self, coeffs: &[f32], num_bins: usize) -> Vec<f32> {
        let mut envelope = vec![0.0f32; num_bins];
        let fft_size = self.fft_size;

        for k in 0..num_bins {
            let freq = 2.0 * std::f32::consts::PI * k as f32 / fft_size as f32;
            let mut re = 0.0f32;
            let mut im = 0.0f32;
            for (j, &c) in coeffs.iter().enumerate() {
                let angle = freq * j as f32;
                re += c * angle.cos();
                im -= c * angle.sin();
            }
            let mag_sq = re * re + im * im;
            // Envelope = 1 / |A(z)| — clamp to avoid division by zero
            envelope[k] = 1.0 / mag_sq.sqrt().max(1e-6);
        }

        envelope
    }

    /// Shift envelope by resampling in frequency domain.
    fn shift_envelope(&self, envelope: &[f32]) -> Vec<f32> {
        let len = envelope.len();
        let mut shifted = vec![0.0f32; len];

        for k in 0..len {
            let src = k as f32 / self.shift_factor;
            let src_idx = src as usize;
            let frac = src - src_idx as f32;

            if src_idx + 1 < len {
                shifted[k] = envelope[src_idx] * (1.0 - frac) + envelope[src_idx + 1] * frac;
            } else if src_idx < len {
                shifted[k] = envelope[src_idx];
            }
            // else: leave as 0.0 (frequency beyond original range)
        }

        shifted
    }
}

impl AudioNode for FormantShift {
    fn process(&mut self, buffer: &mut AudioBuffer) {
        if (self.shift_factor - 1.0).abs() < 0.01 || buffer.samples.is_empty() {
            return;
        }

        let fft_size = self.fft_size;
        let hop_size = self.hop_size;
        let num_bins = fft_size / 2 + 1;
        let inv_fft_size = 1.0 / fft_size as f32;
        let input_len = buffer.samples.len();

        // Pad input
        let padded_len = input_len + fft_size;
        let mut padded = vec![0.0f32; padded_len];
        padded[..input_len].copy_from_slice(&buffer.samples);

        let mut output = vec![0.0f32; padded_len];
        let mut window_sum = vec![0.0f32; padded_len];

        let mut fft_buf = vec![Complex::new(0.0f32, 0.0); fft_size];
        let mut autocorr_buf = vec![Complex::new(0.0f32, 0.0); fft_size];

        let mut pos = 0;
        while pos + fft_size <= padded_len {
            // Window the frame
            let mut frame = vec![0.0f32; fft_size];
            for i in 0..fft_size {
                frame[i] = padded[pos + i] * self.window[i];
            }

            // Compute autocorrelation via FFT: autocorr = IFFT(|FFT(x)|^2)
            for i in 0..fft_size {
                autocorr_buf[i] = Complex::new(frame[i], 0.0);
            }
            self.fft_forward.process(&mut autocorr_buf);
            for c in &mut autocorr_buf {
                *c = Complex::new(c.norm_sqr(), 0.0);
            }
            self.fft_inverse.process(&mut autocorr_buf);

            // Extract autocorrelation values (normalized)
            let autocorr: Vec<f32> = (0..=self.lpc_order)
                .map(|i| autocorr_buf[i].re * inv_fft_size * inv_fft_size)
                .collect();

            // LPC analysis
            let lpc_coeffs = Self::levinson_durbin(&autocorr, self.lpc_order);

            // Compute original and shifted envelopes
            let original_env = self.lpc_envelope(&lpc_coeffs, num_bins);
            let shifted_env = self.shift_envelope(&original_env);

            // FFT the windowed frame
            for i in 0..fft_size {
                fft_buf[i] = Complex::new(frame[i], 0.0);
            }
            self.fft_forward.process(&mut fft_buf);

            // Apply envelope modification: divide by original, multiply by shifted
            for k in 0..num_bins {
                let ratio = shifted_env[k] / original_env[k].max(1e-6);
                fft_buf[k] *= ratio;
                if k > 0 && k < fft_size / 2 {
                    fft_buf[fft_size - k] = fft_buf[k].conj();
                }
            }

            // IFFT
            self.fft_inverse.process(&mut fft_buf);

            // Overlap-add
            for i in 0..fft_size {
                output[pos + i] += fft_buf[i].re * inv_fft_size * self.window[i];
                window_sum[pos + i] += self.window[i] * self.window[i];
            }

            pos += hop_size;
        }

        // Normalize and write back
        let mut result = Vec::with_capacity(input_len);
        for i in 0..input_len {
            if window_sum[i] > 1e-6 {
                result.push(output[i] / window_sum[i]);
            } else {
                result.push(0.0);
            }
        }

        buffer.samples = result;
    }

    fn reset(&mut self) {}

    fn name(&self) -> &str {
        "Formant Shift"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_formant_shift_preserves_length() {
        let sr = 48000u32;
        let samples: Vec<f32> = (0..sr)
            .map(|i| (i as f32 / sr as f32 * 440.0 * std::f32::consts::TAU).sin() * 0.5)
            .collect();
        let original_len = samples.len();

        let mut buffer = AudioBuffer::new(samples, sr);
        let mut fs = FormantShift::new(1.3);
        fs.process(&mut buffer);

        assert_eq!(buffer.samples.len(), original_len);
    }

    #[test]
    fn test_formant_shift_no_nans() {
        let sr = 48000u32;
        let samples: Vec<f32> = (0..sr)
            .map(|i| (i as f32 / sr as f32 * 440.0 * std::f32::consts::TAU).sin() * 0.5)
            .collect();

        let mut buffer = AudioBuffer::new(samples, sr);
        let mut fs = FormantShift::new(0.7);
        fs.process(&mut buffer);

        assert!(buffer.samples.iter().all(|s| s.is_finite()));
    }

    #[test]
    fn test_formant_shift_unity_passthrough() {
        let sr = 48000u32;
        let samples: Vec<f32> = (0..4800)
            .map(|i| (i as f32 / 4800.0 * 440.0 * std::f32::consts::TAU).sin() * 0.5)
            .collect();
        let original = samples.clone();

        let mut buffer = AudioBuffer::new(samples, sr);
        let mut fs = FormantShift::new(1.0);
        fs.process(&mut buffer);

        assert_eq!(buffer.samples, original);
    }

    #[test]
    fn test_levinson_durbin_basic() {
        // White noise autocorrelation: R[0] = 1.0, R[k>0] = 0.0
        let autocorr = vec![1.0, 0.0, 0.0, 0.0, 0.0];
        let coeffs = FormantShift::levinson_durbin(&autocorr, 4);
        // All reflection coefficients should be 0 for white noise
        assert!((coeffs[0] - 1.0).abs() < 1e-6);
        for c in &coeffs[1..] {
            assert!(c.abs() < 1e-6);
        }
    }
}
