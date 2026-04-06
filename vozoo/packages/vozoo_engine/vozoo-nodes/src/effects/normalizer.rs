use vozoo_core::{AudioBuffer, AudioNode};

/// RMS normalizer — scales audio to a target RMS level.
pub struct Normalizer {
    target_rms: f32,
}

impl Normalizer {
    /// Create a normalizer with a target RMS level (e.g., 0.2 for moderate volume).
    pub fn new(target_rms: f32) -> Self {
        Self { target_rms }
    }
}

impl AudioNode for Normalizer {
    fn process(&mut self, buffer: &mut AudioBuffer) {
        if buffer.samples.is_empty() {
            return;
        }

        // Calculate current RMS
        let sum_sq: f64 = buffer.samples.iter().map(|s| (*s as f64) * (*s as f64)).sum();
        let rms = (sum_sq / buffer.samples.len() as f64).sqrt() as f32;

        if rms < 1e-6 {
            return; // Signal is silence
        }

        let gain = self.target_rms / rms;

        // Limit gain to avoid extreme amplification of quiet signals
        let gain = gain.min(10.0);

        for s in &mut buffer.samples {
            *s *= gain;
        }
    }

    fn reset(&mut self) {}

    fn name(&self) -> &str {
        "Normalizer"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalizer_adjusts_level() {
        let samples: Vec<f32> = (0..4800)
            .map(|i| (i as f32 / 4800.0 * 440.0 * std::f32::consts::TAU).sin() * 0.1)
            .collect();

        let mut buffer = AudioBuffer::new(samples, 48000);
        let mut normalizer = Normalizer::new(0.2);
        normalizer.process(&mut buffer);

        let sum_sq: f64 = buffer.samples.iter().map(|s| (*s as f64) * (*s as f64)).sum();
        let rms = (sum_sq / buffer.samples.len() as f64).sqrt() as f32;
        assert!((rms - 0.2).abs() < 0.02, "RMS not normalized: got {rms}");
    }
}
