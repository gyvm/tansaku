use vozoo_core::{AudioBuffer, AudioNode};

/// Voice Activity Detection — zeroes out frames below an energy threshold.
/// Saves CPU by allowing downstream nodes to skip silent frames.
pub struct Vad {
    threshold_db: f32,
    frame_size: usize,
}

impl Vad {
    /// Create a VAD with the given threshold in dB (e.g., -40.0).
    pub fn new(threshold_db: f32) -> Self {
        Self {
            threshold_db,
            frame_size: 480, // 10ms at 48kHz
        }
    }
}

impl AudioNode for Vad {
    fn process(&mut self, buffer: &mut AudioBuffer) {
        let threshold_linear = 10.0f32.powf(self.threshold_db / 20.0);
        let threshold_energy = threshold_linear * threshold_linear * self.frame_size as f32;

        for chunk in buffer.samples.chunks_mut(self.frame_size) {
            let energy: f32 = chunk.iter().map(|s| s * s).sum();
            if energy < threshold_energy {
                for s in chunk.iter_mut() {
                    *s = 0.0;
                }
            }
        }
    }

    fn reset(&mut self) {}

    fn name(&self) -> &str {
        "Voice Activity Detection"
    }
}
