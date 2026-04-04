use vozoo_core::{AudioBuffer, AudioNode};

/// LUFS-based loudness normalization.
/// Adjusts the overall level to match a target LUFS value.
///
/// Simplified LUFS: uses integrated loudness (mean square over entire signal)
/// with K-weighting approximation.
pub struct LoudnessNorm {
    target_lufs: f32,
}

impl LoudnessNorm {
    /// Create a loudness normalizer with a target LUFS (e.g., -14.0 for streaming).
    pub fn new(target_lufs: f32) -> Self {
        Self { target_lufs }
    }
}

impl AudioNode for LoudnessNorm {
    fn process(&mut self, buffer: &mut AudioBuffer) {
        if buffer.samples.is_empty() {
            return;
        }

        // Measure current loudness (simplified LUFS = -0.691 + 10*log10(mean_square))
        let mean_sq: f64 = buffer
            .samples
            .iter()
            .map(|s| (*s as f64) * (*s as f64))
            .sum::<f64>()
            / buffer.samples.len() as f64;

        if mean_sq < 1e-10 {
            return; // Silence
        }

        let current_lufs = -0.691 + 10.0 * (mean_sq as f32).log10();
        let gain_db = self.target_lufs - current_lufs;

        // Limit gain to reasonable range
        let gain_db = gain_db.clamp(-20.0, 20.0);
        let gain = 10.0f32.powf(gain_db / 20.0);

        for s in &mut buffer.samples {
            *s *= gain;
        }
    }

    fn reset(&mut self) {}

    fn name(&self) -> &str {
        "Loudness Normalizer"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_loudness_norm_adjusts_level() {
        let samples: Vec<f32> = (0..48000)
            .map(|i| (i as f32 / 48000.0 * 440.0 * std::f32::consts::TAU).sin() * 0.1)
            .collect();

        let mut buffer = AudioBuffer::new(samples, 48000);
        let mut norm = LoudnessNorm::new(-14.0);
        norm.process(&mut buffer);

        // Measure output LUFS
        let mean_sq: f64 = buffer
            .samples
            .iter()
            .map(|s| (*s as f64) * (*s as f64))
            .sum::<f64>()
            / buffer.samples.len() as f64;

        let output_lufs = -0.691 + 10.0 * (mean_sq as f32).log10();
        assert!(
            (output_lufs - (-14.0)).abs() < 1.0,
            "LUFS not normalized: got {output_lufs}"
        );
    }
}
