use vozoo_core::{AudioBuffer, AudioNode};

/// Simple Schroeder-style reverb using comb filters.
pub struct Reverb {
    delay_times_ms: Vec<f32>,
    decay_factors: Vec<f32>,
}

impl Reverb {
    pub fn new(delay_times_ms: Vec<f32>, decay_factors: Vec<f32>) -> Self {
        Self {
            delay_times_ms,
            decay_factors,
        }
    }

    /// Default comb filter reverb matching the C++ implementation.
    pub fn default_comb() -> Self {
        Self::new(vec![30.0, 40.0, 50.0], vec![0.5, 0.4, 0.3])
    }
}

impl AudioNode for Reverb {
    fn process(&mut self, buffer: &mut AudioBuffer) {
        let sr = buffer.sample_rate as f32;
        let dry = buffer.samples.clone();

        for (delay_ms, decay) in self.delay_times_ms.iter().zip(self.decay_factors.iter()) {
            let delay_samples = (*delay_ms * sr / 1000.0) as usize;

            for i in delay_samples..buffer.samples.len() {
                buffer.samples[i] += dry[i - delay_samples] * decay;
            }
        }

        // Normalize to prevent clipping
        let max_val = buffer
            .samples
            .iter()
            .map(|s| s.abs())
            .fold(0.0f32, f32::max);
        if max_val > 1.0 {
            for s in &mut buffer.samples {
                *s /= max_val;
            }
        }
    }

    fn reset(&mut self) {}

    fn name(&self) -> &str {
        "Reverb"
    }
}
