use vozoo_core::{AudioBuffer, AudioNode};

/// Wideband de-esser: highpass sidechain detects sibilance,
/// then applies gain reduction to the full signal.
pub struct DeEsser {
    frequency: f32,
    threshold_db: f32,
    ratio: f32,
    attack_ms: f32,
    release_ms: f32,
    // Sidechain biquad state (highpass)
    b0: f32,
    b1: f32,
    b2: f32,
    a1: f32,
    a2: f32,
    z1: f32,
    z2: f32,
    envelope_db: f32,
    configured_sr: u32,
}

impl DeEsser {
    pub fn new(frequency: f32, threshold_db: f32, ratio: f32) -> Self {
        let mut d = Self {
            frequency,
            threshold_db,
            ratio: ratio.max(1.0),
            attack_ms: 0.5,
            release_ms: 50.0,
            b0: 1.0,
            b1: 0.0,
            b2: 0.0,
            a1: 0.0,
            a2: 0.0,
            z1: 0.0,
            z2: 0.0,
            envelope_db: -96.0,
            configured_sr: 0,
        };
        d.compute_coefficients(48000);
        d
    }

    fn compute_coefficients(&mut self, sample_rate: u32) {
        self.configured_sr = sample_rate;
        let w0 = 2.0 * std::f32::consts::PI * self.frequency / sample_rate as f32;
        let alpha = w0.sin() / (2.0 * 0.707); // Q = 0.707 (Butterworth)
        let cos_w0 = w0.cos();

        let b0 = (1.0 + cos_w0) / 2.0;
        let b1 = -(1.0 + cos_w0);
        let b2 = (1.0 + cos_w0) / 2.0;
        let a0 = 1.0 + alpha;

        self.b0 = b0 / a0;
        self.b1 = b1 / a0;
        self.b2 = b2 / a0;
        self.a1 = -2.0 * cos_w0 / a0;
        self.a2 = (1.0 - alpha) / a0;
    }

    fn sidechain_filter(&mut self, x: f32) -> f32 {
        let y = self.b0 * x + self.z1;
        self.z1 = self.b1 * x - self.a1 * y + self.z2;
        self.z2 = self.b2 * x - self.a2 * y;
        y
    }
}

impl AudioNode for DeEsser {
    fn process(&mut self, buffer: &mut AudioBuffer) {
        if buffer.sample_rate() != self.configured_sr {
            self.compute_coefficients(buffer.sample_rate());
        }

        let sr = buffer.sample_rate() as f32;
        let attack_coeff = (-1.0 / (self.attack_ms * 0.001 * sr)).exp();
        let release_coeff = (-1.0 / (self.release_ms * 0.001 * sr)).exp();

        for s in &mut buffer.samples {
            let sc = self.sidechain_filter(*s);
            let sc_db = 20.0 * sc.abs().max(1e-10).log10();

            // Smooth envelope
            if sc_db > self.envelope_db {
                self.envelope_db =
                    attack_coeff * self.envelope_db + (1.0 - attack_coeff) * sc_db;
            } else {
                self.envelope_db =
                    release_coeff * self.envelope_db + (1.0 - release_coeff) * sc_db;
            }

            // Compute gain reduction when sidechain exceeds threshold
            let over_db = self.envelope_db - self.threshold_db;
            if over_db > 0.0 {
                let gain_reduction_db = over_db * (1.0 - 1.0 / self.ratio);
                let gain = 10.0f32.powf(-gain_reduction_db / 20.0);
                *s *= gain;
            }
        }
    }

    fn reset(&mut self) {
        self.z1 = 0.0;
        self.z2 = 0.0;
        self.envelope_db = -96.0;
    }

    fn name(&self) -> &str {
        "De-Esser"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_deesser_reduces_high_frequency() {
        // Generate a signal with strong high-frequency content (8kHz)
        let sr = 48000u32;
        let samples: Vec<f32> = (0..sr)
            .map(|i| (i as f32 / sr as f32 * 8000.0 * std::f32::consts::TAU).sin() * 0.8)
            .collect();
        let original_rms: f32 =
            (samples.iter().map(|s| s * s).sum::<f32>() / samples.len() as f32).sqrt();

        let mut buffer = AudioBuffer::new(samples, sr);
        let mut deesser = DeEsser::new(5000.0, -20.0, 6.0);
        deesser.process(&mut buffer);

        let processed_rms: f32 = (buffer.samples.iter().map(|s| s * s).sum::<f32>()
            / buffer.samples.len() as f32)
            .sqrt();
        assert!(
            processed_rms < original_rms,
            "De-esser should reduce 8kHz signal: original {original_rms} vs processed {processed_rms}"
        );
    }

    #[test]
    fn test_deesser_passes_low_frequency() {
        // Generate a low-frequency signal (200Hz) - should pass mostly unchanged
        let sr = 48000u32;
        let samples: Vec<f32> = (0..sr)
            .map(|i| (i as f32 / sr as f32 * 200.0 * std::f32::consts::TAU).sin() * 0.3)
            .collect();
        let original_rms: f32 =
            (samples.iter().map(|s| s * s).sum::<f32>() / samples.len() as f32).sqrt();

        let mut buffer = AudioBuffer::new(samples, sr);
        let mut deesser = DeEsser::new(5000.0, -20.0, 6.0);
        deesser.process(&mut buffer);

        let processed_rms: f32 = (buffer.samples.iter().map(|s| s * s).sum::<f32>()
            / buffer.samples.len() as f32)
            .sqrt();
        // Low-frequency signal should be mostly preserved (within 10%)
        let ratio = processed_rms / original_rms;
        assert!(
            ratio > 0.9,
            "De-esser should preserve 200Hz signal: ratio {ratio}"
        );
    }
}
