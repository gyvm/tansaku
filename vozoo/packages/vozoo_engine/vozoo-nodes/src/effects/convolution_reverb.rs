use rustfft::num_complex::Complex;
use rustfft::Fft;
use std::sync::Arc;
use vozoo_core::{AudioBuffer, AudioNode};

use super::fft_utils;

/// Convolution reverb using FFT overlap-add with a synthetic impulse response.
/// The IR is generated from Schroeder parameters (4 comb + 2 allpass filters).
pub struct ConvolutionReverb {
    ir_partitions: Vec<Vec<Complex<f32>>>,
    block_size: usize,
    fft_size: usize,
    dry_wet: f32,
    // Processing state
    input_buf: Vec<f32>,
    output_tail: Vec<f32>,
    freq_delay_line: Vec<Vec<Complex<f32>>>,
    fft_forward: Arc<dyn Fft<f32>>,
    fft_inverse: Arc<dyn Fft<f32>>,
}

impl ConvolutionReverb {
    pub fn new(room_size: f32, damping: f32, dry_wet: f32) -> Self {
        let block_size = 1024;
        let fft_size = block_size * 2;
        let (fft_forward, fft_inverse) = fft_utils::create_fft_pair(fft_size);

        // Generate synthetic IR
        let sr = 48000.0f32;
        let ir_duration = room_size.clamp(0.1, 2.0) * 2.0; // seconds
        let ir_len = (sr * ir_duration) as usize;
        let ir = Self::generate_ir(ir_len, sr, room_size, damping);

        // Partition IR into FFT blocks
        let num_partitions = (ir.len() + block_size - 1) / block_size;
        let mut ir_partitions = Vec::with_capacity(num_partitions);

        for p in 0..num_partitions {
            let start = p * block_size;
            let mut padded = vec![Complex::new(0.0f32, 0.0); fft_size];
            for i in 0..block_size {
                if start + i < ir.len() {
                    padded[i] = Complex::new(ir[start + i], 0.0);
                }
            }
            fft_forward.process(&mut padded);
            ir_partitions.push(padded);
        }

        let freq_delay_line = vec![vec![Complex::new(0.0f32, 0.0); fft_size]; num_partitions];

        Self {
            ir_partitions,
            block_size,
            fft_size,
            dry_wet: dry_wet.clamp(0.0, 1.0),
            input_buf: Vec::new(),
            output_tail: vec![0.0; block_size],
            freq_delay_line,
            fft_forward,
            fft_inverse,
        }
    }

    /// Generate a synthetic impulse response using Schroeder design.
    fn generate_ir(length: usize, sr: f32, room_size: f32, damping: f32) -> Vec<f32> {
        let mut ir = vec![0.0f32; length];
        ir[0] = 1.0; // Initial impulse

        // 4 parallel comb filters with prime-number delays
        let base_delay = room_size * 0.04; // scale delay with room size
        let comb_delays_ms = [
            base_delay * 29.7,
            base_delay * 37.1,
            base_delay * 41.1,
            base_delay * 43.7,
        ];
        let rt60 = room_size * 2.0; // reverb time in seconds

        let mut comb_outputs = vec![vec![0.0f32; length]; 4];

        for (c, &delay_ms) in comb_delays_ms.iter().enumerate() {
            let delay_samples = (delay_ms * sr / 1000.0) as usize;
            if delay_samples == 0 || delay_samples >= length {
                continue;
            }
            // Feedback gain for desired RT60
            let feedback = (-3.0 * delay_samples as f32 / (rt60 * sr)).exp();
            let damp = damping.clamp(0.0, 1.0);

            let mut buf = vec![0.0f32; length];
            buf[0] = 1.0;
            let mut damp_state = 0.0f32;

            for i in delay_samples..length {
                let delayed = buf[i - delay_samples];
                // One-pole lowpass damping
                damp_state = delayed * (1.0 - damp) + damp_state * damp;
                buf[i] += damp_state * feedback;
            }
            comb_outputs[c] = buf;
        }

        // Sum comb outputs
        for i in 0..length {
            ir[i] = comb_outputs.iter().map(|c| c[i]).sum::<f32>() * 0.25;
        }

        // 2 series allpass filters for diffusion
        let allpass_delays_ms = [base_delay * 5.0, base_delay * 1.7];
        let allpass_gain = 0.7f32;

        for &delay_ms in &allpass_delays_ms {
            let delay_samples = (delay_ms * sr / 1000.0) as usize;
            if delay_samples == 0 || delay_samples >= length {
                continue;
            }
            let mut buf = ir.clone();
            for i in delay_samples..length {
                let delayed = buf[i - delay_samples];
                buf[i] = -allpass_gain * buf[i] + delayed + allpass_gain * buf[i - delay_samples];
            }
            // Fix: proper allpass structure
            let mut result = vec![0.0f32; length];
            let mut delay_line = vec![0.0f32; delay_samples];
            let mut write_pos = 0;

            for i in 0..length {
                let delayed = delay_line[write_pos];
                let input = ir[i];
                let v = input - allpass_gain * delayed;
                result[i] = allpass_gain * v + delayed;
                delay_line[write_pos] = v;
                write_pos = (write_pos + 1) % delay_samples;
            }
            ir = result;
        }

        // Normalize IR
        let max_val = ir.iter().map(|s| s.abs()).fold(0.0f32, f32::max);
        if max_val > 1e-6 {
            for s in &mut ir {
                *s /= max_val;
            }
        }

        ir
    }
}

impl AudioNode for ConvolutionReverb {
    fn process(&mut self, buffer: &mut AudioBuffer) {
        if buffer.samples.is_empty() || self.ir_partitions.is_empty() {
            return;
        }

        let dry = buffer.samples.clone();
        let input_len = buffer.samples.len();
        let block_size = self.block_size;
        let fft_size = self.fft_size;
        let num_partitions = self.ir_partitions.len();

        // Accumulate input
        self.input_buf.extend_from_slice(&buffer.samples);

        let mut wet_output = Vec::with_capacity(input_len);
        let mut produced = 0;

        while self.input_buf.len() >= block_size && produced < input_len {
            // Take one block from input buffer
            let block: Vec<f32> = self.input_buf.drain(..block_size).collect();

            // Zero-pad and FFT
            let mut fft_buf = vec![Complex::new(0.0f32, 0.0); fft_size];
            for (i, &s) in block.iter().enumerate() {
                fft_buf[i] = Complex::new(s, 0.0);
            }
            self.fft_forward.process(&mut fft_buf);

            // Shift frequency delay line
            for i in (1..num_partitions).rev() {
                // Move older entries back
                let (left, right) = self.freq_delay_line.split_at_mut(i);
                right[0].copy_from_slice(&left[i - 1]);
            }
            self.freq_delay_line[0].copy_from_slice(&fft_buf);

            // Multiply-accumulate all partitions
            let mut accum = vec![Complex::new(0.0f32, 0.0); fft_size];
            for (i, ir_part) in self.ir_partitions.iter().enumerate() {
                if i < self.freq_delay_line.len() {
                    for j in 0..fft_size {
                        accum[j] += self.freq_delay_line[i][j] * ir_part[j];
                    }
                }
            }

            // IFFT
            self.fft_inverse.process(&mut accum);
            let inv = 1.0 / fft_size as f32;

            // First half: add overlap tail and output
            let mut out_block = Vec::with_capacity(block_size);
            for i in 0..block_size {
                out_block.push(accum[i].re * inv + self.output_tail[i]);
            }

            // Second half: save as new overlap tail
            for i in 0..block_size {
                self.output_tail[i] = accum[block_size + i].re * inv;
            }

            let remaining = (input_len - produced).min(block_size);
            wet_output.extend_from_slice(&out_block[..remaining]);
            produced += remaining;
        }

        // If we didn't produce enough (input shorter than block_size), pad with silence
        while wet_output.len() < input_len {
            wet_output.push(0.0);
        }

        // Mix dry and wet
        for i in 0..input_len {
            buffer.samples[i] = dry[i] * (1.0 - self.dry_wet) + wet_output[i] * self.dry_wet;
        }
    }

    fn reset(&mut self) {
        self.input_buf.clear();
        self.output_tail.fill(0.0);
        for fdl in &mut self.freq_delay_line {
            fdl.fill(Complex::new(0.0, 0.0));
        }
    }

    fn name(&self) -> &str {
        "Convolution Reverb"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_convolution_reverb_preserves_length() {
        let sr = 48000u32;
        let samples: Vec<f32> = (0..sr)
            .map(|i| (i as f32 / sr as f32 * 440.0 * std::f32::consts::TAU).sin() * 0.5)
            .collect();
        let original_len = samples.len();

        let mut buffer = AudioBuffer::new(samples, sr);
        let mut rev = ConvolutionReverb::new(0.5, 0.5, 0.3);
        rev.process(&mut buffer);

        assert_eq!(buffer.samples.len(), original_len);
    }

    #[test]
    fn test_convolution_reverb_no_nans() {
        let sr = 48000u32;
        let samples: Vec<f32> = (0..sr)
            .map(|i| (i as f32 / sr as f32 * 440.0 * std::f32::consts::TAU).sin() * 0.5)
            .collect();

        let mut buffer = AudioBuffer::new(samples, sr);
        let mut rev = ConvolutionReverb::new(0.5, 0.5, 0.5);
        rev.process(&mut buffer);

        assert!(buffer.samples.iter().all(|s| s.is_finite()));
    }

    #[test]
    fn test_convolution_reverb_dry_wet() {
        let sr = 48000u32;
        let samples: Vec<f32> = (0..sr)
            .map(|i| (i as f32 / sr as f32 * 440.0 * std::f32::consts::TAU).sin() * 0.5)
            .collect();
        let dry_copy = samples.clone();

        // Full dry (wet=0) should preserve original signal
        let mut buffer = AudioBuffer::new(samples, sr);
        let mut rev = ConvolutionReverb::new(0.5, 0.5, 0.0);
        rev.process(&mut buffer);

        for (i, (&orig, &proc)) in dry_copy.iter().zip(buffer.samples.iter()).enumerate() {
            assert!(
                (orig - proc).abs() < 1e-6,
                "Sample {i}: dry mismatch {orig} vs {proc}"
            );
        }
    }

    #[test]
    fn test_generate_ir_valid() {
        let ir = ConvolutionReverb::generate_ir(48000, 48000.0, 0.5, 0.5);
        assert_eq!(ir.len(), 48000);
        assert!(ir.iter().all(|s| s.is_finite()));
        // IR should be normalized
        let max_val = ir.iter().map(|s| s.abs()).fold(0.0f32, f32::max);
        assert!(max_val <= 1.0 + 1e-6);
    }
}
