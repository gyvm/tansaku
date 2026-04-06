use vozoo_core::{AudioBuffer, AudioNode};

/// Feed-forward compressor with peak detection, soft knee, and makeup gain.
pub struct Compressor {
    threshold_db: f32,
    ratio: f32,
    attack_ms: f32,
    release_ms: f32,
    knee_db: f32,
    makeup_db: f32,
    envelope_db: f32,
}

impl Compressor {
    pub fn new(
        threshold_db: f32,
        ratio: f32,
        attack_ms: f32,
        release_ms: f32,
        knee_db: f32,
        makeup_db: f32,
    ) -> Self {
        Self {
            threshold_db,
            ratio: ratio.max(1.0),
            attack_ms,
            release_ms,
            knee_db: knee_db.max(0.0),
            makeup_db,
            envelope_db: -96.0,
        }
    }

    /// Compute gain reduction in dB for a given input level in dB.
    fn gain_reduction_db(&self, input_db: f32) -> f32 {
        let half_knee = self.knee_db / 2.0;
        let diff = input_db - self.threshold_db;

        let output_db = if diff < -half_knee {
            // Below knee: no compression
            input_db
        } else if diff > half_knee {
            // Above knee: full compression
            self.threshold_db + diff / self.ratio
        } else {
            // Within knee: smooth transition
            let x = diff + half_knee;
            input_db + (1.0 / self.ratio - 1.0) * x * x / (2.0 * self.knee_db)
        };

        output_db - input_db + self.makeup_db
    }
}

impl AudioNode for Compressor {
    fn process(&mut self, buffer: &mut AudioBuffer) {
        let sr = buffer.sample_rate() as f32;
        let attack_coeff = (-1.0 / (self.attack_ms * 0.001 * sr)).exp();
        let release_coeff = (-1.0 / (self.release_ms * 0.001 * sr)).exp();

        for s in &mut buffer.samples {
            let input_db = 20.0 * s.abs().max(1e-10).log10();

            // Smooth envelope
            if input_db > self.envelope_db {
                self.envelope_db =
                    attack_coeff * self.envelope_db + (1.0 - attack_coeff) * input_db;
            } else {
                self.envelope_db =
                    release_coeff * self.envelope_db + (1.0 - release_coeff) * input_db;
            }

            let gain_db = self.gain_reduction_db(self.envelope_db);
            let gain = 10.0f32.powf(gain_db / 20.0);
            *s *= gain;
        }
    }

    fn reset(&mut self) {
        self.envelope_db = -96.0;
    }

    fn name(&self) -> &str {
        "Compressor"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compressor_reduces_loud_signal() {
        let samples: Vec<f32> = (0..4800)
            .map(|i| (i as f32 / 4800.0 * 440.0 * std::f32::consts::TAU).sin() * 0.9)
            .collect();
        let original_rms: f32 =
            (samples.iter().map(|s| s * s).sum::<f32>() / samples.len() as f32).sqrt();

        let mut buffer = AudioBuffer::new(samples, 48000);
        let mut comp = Compressor::new(-20.0, 4.0, 10.0, 100.0, 6.0, 0.0);
        comp.process(&mut buffer);

        let compressed_rms: f32 = (buffer.samples.iter().map(|s| s * s).sum::<f32>()
            / buffer.samples.len() as f32)
            .sqrt();
        assert!(
            compressed_rms < original_rms,
            "Compressor should reduce level: original {original_rms} vs compressed {compressed_rms}"
        );
    }

    #[test]
    fn test_compressor_no_nans() {
        let samples = vec![0.0f32; 4800];
        let mut buffer = AudioBuffer::new(samples, 48000);
        let mut comp = Compressor::new(-20.0, 4.0, 10.0, 100.0, 6.0, 0.0);
        comp.process(&mut buffer);
        assert!(buffer.samples.iter().all(|s| s.is_finite()));
    }
}
