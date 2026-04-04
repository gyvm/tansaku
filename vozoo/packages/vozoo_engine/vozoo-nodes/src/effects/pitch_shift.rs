use rustfft::num_complex::Complex;
use rustfft::Fft;
use std::sync::Arc;
use vozoo_core::{AudioBuffer, AudioNode};

use super::fft_utils;

/// Phase Vocoder pitch shifter. Shifts pitch without changing duration.
/// Uses STFT analysis-resynthesis with frequency-domain bin shifting.
pub struct PitchShift {
    semitones: f32,
    fft_size: usize,
    hop_size: usize,
    window: Vec<f32>,
    last_phase: Vec<f32>,
    sum_phase: Vec<f32>,
    fft_forward: Arc<dyn Fft<f32>>,
    fft_inverse: Arc<dyn Fft<f32>>,
}

impl PitchShift {
    pub fn new(semitones: f32) -> Self {
        let fft_size = 2048;
        let hop_size = fft_size / 4; // 75% overlap
        let (fft_forward, fft_inverse) = fft_utils::create_fft_pair(fft_size);

        Self {
            semitones,
            fft_size,
            hop_size,
            window: fft_utils::hann_window(fft_size),
            last_phase: vec![0.0; fft_size],
            sum_phase: vec![0.0; fft_size],
            fft_forward,
            fft_inverse,
        }
    }

    /// Legacy constructor for backward compatibility with "factor" parameter.
    /// Converts factor to semitones: factor = 2^(semitones/12).
    pub fn from_factor(factor: f32) -> Self {
        let semitones = 12.0 * factor.max(0.01).ln() / 2.0f32.ln();
        Self::new(semitones)
    }
}

impl AudioNode for PitchShift {
    fn process(&mut self, buffer: &mut AudioBuffer) {
        if self.semitones.abs() < 0.01 || buffer.samples.is_empty() {
            return;
        }

        let factor = 2.0f32.powf(self.semitones / 12.0);
        let fft_size = self.fft_size;
        let hop_size = self.hop_size;
        let num_bins = fft_size / 2 + 1;
        let expected_phase_diff = 2.0 * std::f32::consts::PI * hop_size as f32 / fft_size as f32;
        let inv_fft_size = 1.0 / fft_size as f32;

        let input = &buffer.samples;
        let input_len = input.len();

        // Pad input to ensure we can process full frames
        let padded_len = input_len + fft_size;
        let mut padded = vec![0.0f32; padded_len];
        padded[..input_len].copy_from_slice(input);

        // Output accumulator
        let mut output = vec![0.0f32; padded_len];
        let mut window_sum = vec![0.0f32; padded_len];

        // Temporary buffers
        let mut fft_buf = vec![Complex::new(0.0f32, 0.0); fft_size];
        let mut magnitudes = vec![0.0f32; num_bins];
        let mut frequencies = vec![0.0f32; num_bins];
        let mut synth_magnitudes = vec![0.0f32; num_bins];
        let mut synth_frequencies = vec![0.0f32; num_bins];

        let mut pos = 0;
        while pos + fft_size <= padded_len {
            // Analysis: window and FFT
            for i in 0..fft_size {
                fft_buf[i] = Complex::new(padded[pos + i] * self.window[i], 0.0);
            }
            self.fft_forward.process(&mut fft_buf);

            // Convert to magnitude/frequency
            for k in 0..num_bins {
                let re = fft_buf[k].re;
                let im = fft_buf[k].im;
                let mag = (re * re + im * im).sqrt();
                let phase = im.atan2(re);

                // Compute instantaneous frequency
                let phase_diff = phase - self.last_phase[k];
                self.last_phase[k] = phase;

                // Remove expected phase advance
                let mut deviation = phase_diff - k as f32 * expected_phase_diff;

                // Map to [-PI, PI]
                deviation -= (deviation / std::f32::consts::PI).round() * 2.0 * std::f32::consts::PI;

                // True frequency of this bin
                let true_freq = k as f32 + deviation / expected_phase_diff;

                magnitudes[k] = mag;
                frequencies[k] = true_freq;
            }

            // Pitch shift: move bins
            synth_magnitudes.fill(0.0);
            synth_frequencies.fill(0.0);
            let mut bin_count = vec![0u32; num_bins];

            for k in 0..num_bins {
                let new_bin = (k as f32 * factor) as usize;
                if new_bin < num_bins {
                    synth_magnitudes[new_bin] += magnitudes[k];
                    synth_frequencies[new_bin] = frequencies[k] * factor;
                    bin_count[new_bin] += 1;
                }
            }

            // Average magnitudes when multiple bins contribute to the same output bin
            for k in 0..num_bins {
                if bin_count[k] > 1 {
                    synth_magnitudes[k] /= bin_count[k] as f32;
                }
            }

            // Resynthesize: frequency to phase
            for k in 0..num_bins {
                let deviation = (synth_frequencies[k] - k as f32) * expected_phase_diff;
                self.sum_phase[k] += k as f32 * expected_phase_diff + deviation;

                let phase = self.sum_phase[k];
                let mag = synth_magnitudes[k];
                fft_buf[k] = Complex::new(mag * phase.cos(), mag * phase.sin());
            }
            // Mirror for inverse FFT
            for k in num_bins..fft_size {
                fft_buf[k] = fft_buf[fft_size - k].conj();
            }

            self.fft_inverse.process(&mut fft_buf);

            // Overlap-add
            for i in 0..fft_size {
                output[pos + i] += fft_buf[i].re * inv_fft_size * self.window[i];
                window_sum[pos + i] += self.window[i] * self.window[i];
            }

            pos += hop_size;
        }

        // Normalize by window sum
        let mut result = Vec::with_capacity(input_len);
        for i in 0..input_len {
            if window_sum[i] > 1e-6 {
                result.push(output[i] / window_sum[i]);
            } else {
                result.push(0.0);
            }
        }

        // Prevent amplitude explosion: scale output to match input RMS
        let input_rms: f32 = (buffer.samples.iter().map(|s| s * s).sum::<f32>()
            / buffer.samples.len().max(1) as f32)
            .sqrt();
        let output_rms: f32 =
            (result.iter().map(|s| s * s).sum::<f32>() / result.len().max(1) as f32).sqrt();
        if output_rms > 1e-6 && input_rms > 1e-6 {
            let scale = input_rms / output_rms;
            for s in &mut result {
                *s *= scale;
            }
        }

        buffer.samples = result;
    }

    fn reset(&mut self) {
        self.last_phase.fill(0.0);
        self.sum_phase.fill(0.0);
    }

    fn name(&self) -> &str {
        "Pitch Shift"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_phase_vocoder_preserves_length() {
        let sr = 48000u32;
        let samples: Vec<f32> = (0..sr)
            .map(|i| (i as f32 / sr as f32 * 440.0 * std::f32::consts::TAU).sin() * 0.5)
            .collect();
        let original_len = samples.len();

        let mut buffer = AudioBuffer::new(samples, sr);
        let mut ps = PitchShift::new(-7.0); // shift down 7 semitones
        ps.process(&mut buffer);

        assert_eq!(
            buffer.samples.len(),
            original_len,
            "Phase vocoder should preserve audio length"
        );
    }

    #[test]
    fn test_phase_vocoder_no_nans() {
        let sr = 48000u32;
        let samples: Vec<f32> = (0..sr)
            .map(|i| (i as f32 / sr as f32 * 440.0 * std::f32::consts::TAU).sin() * 0.5)
            .collect();

        let mut buffer = AudioBuffer::new(samples, sr);
        let mut ps = PitchShift::new(5.0);
        ps.process(&mut buffer);

        assert!(buffer.samples.iter().all(|s| s.is_finite()));
    }

    #[test]
    fn test_phase_vocoder_zero_semitones_passthrough() {
        let sr = 48000u32;
        let samples: Vec<f32> = (0..4800)
            .map(|i| (i as f32 / 4800.0 * 440.0 * std::f32::consts::TAU).sin() * 0.5)
            .collect();
        let original = samples.clone();

        let mut buffer = AudioBuffer::new(samples, sr);
        let mut ps = PitchShift::new(0.0);
        ps.process(&mut buffer);

        // Zero semitones = passthrough, should be identical
        assert_eq!(buffer.samples, original);
    }

    #[test]
    fn test_from_factor_conversion() {
        // factor 0.75 (gorilla) should be about -4.98 semitones
        let ps = PitchShift::from_factor(0.75);
        let expected = 12.0 * 0.75f32.ln() / 2.0f32.ln();
        assert!((ps.semitones - expected).abs() < 0.01);
    }
}
