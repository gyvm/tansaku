use vozoo_core::{AudioBuffer, AudioNode};
use nnnoiseless::DenoiseState;

/// Noise reduction using nnnoiseless (Rust port of Xiph's RNNoise).
/// RNNoise operates on 480-sample frames at 48kHz.
pub struct NoiseReduction {
    state: Box<DenoiseState<'static>>,
}

impl NoiseReduction {
    pub fn new() -> Self {
        Self {
            state: DenoiseState::new(),
        }
    }
}

impl AudioNode for NoiseReduction {
    fn process(&mut self, buffer: &mut AudioBuffer) {
        // RNNoise expects 48kHz. If sample rate differs, skip.
        if buffer.sample_rate != 48000 || buffer.samples.is_empty() {
            return;
        }

        const FRAME_SIZE: usize = DenoiseState::FRAME_SIZE; // 480
        let mut output = Vec::with_capacity(buffer.samples.len());

        // RNNoise works with f32 samples scaled to roughly [-32768, 32768]
        // Our samples are [-1.0, 1.0], so scale up and back down
        let scale = 32767.0f32;

        let mut frame_in = [0.0f32; FRAME_SIZE];
        let mut frame_out = [0.0f32; FRAME_SIZE];

        let mut pos = 0;
        while pos + FRAME_SIZE <= buffer.samples.len() {
            // Scale up to RNNoise range
            for (i, s) in buffer.samples[pos..pos + FRAME_SIZE].iter().enumerate() {
                frame_in[i] = s * scale;
            }

            self.state.process_frame(&mut frame_out, &frame_in);

            // Scale back down
            for s in &frame_out {
                output.push(s / scale);
            }

            pos += FRAME_SIZE;
        }

        // Handle remaining samples (pass through unprocessed)
        if pos < buffer.samples.len() {
            output.extend_from_slice(&buffer.samples[pos..]);
        }

        buffer.samples = output;
    }

    fn reset(&mut self) {
        self.state = DenoiseState::new();
    }

    fn name(&self) -> &str {
        "Noise Reduction"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_noise_reduction_runs() {
        // Generate a sine wave with added noise
        let mut samples: Vec<f32> = (0..4800)
            .map(|i| (i as f32 / 4800.0 * 440.0 * std::f32::consts::TAU).sin() * 0.3)
            .collect();

        // Add some "noise"
        for (i, s) in samples.iter_mut().enumerate() {
            *s += (i as f32 * 7.3).sin() * 0.05; // pseudo-noise
        }

        let mut buffer = AudioBuffer::new(samples.clone(), 48000);
        let mut nr = NoiseReduction::new();
        nr.process(&mut buffer);

        // Should produce output of similar length
        assert_eq!(buffer.samples.len(), samples.len());
        // Samples should still be in valid range
        assert!(buffer.samples.iter().all(|s| s.abs() < 2.0));
    }
}
