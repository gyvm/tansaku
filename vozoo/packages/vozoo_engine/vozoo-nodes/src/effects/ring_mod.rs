use vozoo_core::{AudioBuffer, AudioNode};
use std::f32::consts::TAU;

/// Ring modulation + bitcrush effect (Robot voice).
pub struct RingMod {
    mod_freq: f32,
    quantize_steps: f32,
    /// Dry/wet blend: 0.0 = dry (bypass), 1.0 = fully wet.
    mix: f32,
    phase: f32,
}

impl RingMod {
    /// Backward-compatible constructor: fully wet (mix = 1.0).
    pub fn new(mod_freq: f32, quantize_steps: f32) -> Self {
        Self::with_mix(mod_freq, quantize_steps, 1.0)
    }

    /// Construct with an explicit dry/wet mix (clamped to [0, 1]).
    pub fn with_mix(mod_freq: f32, quantize_steps: f32, mix: f32) -> Self {
        Self {
            mod_freq,
            quantize_steps,
            mix: mix.clamp(0.0, 1.0),
            phase: 0.0,
        }
    }
}

impl AudioNode for RingMod {
    fn process(&mut self, buffer: &mut AudioBuffer) {
        let phase_inc = TAU * self.mod_freq / buffer.sample_rate() as f32;

        for s in &mut buffer.samples {
            let dry = *s;
            let mut wet = dry * self.phase.sin();

            // Bitcrush quantization (on the wet path)
            if self.quantize_steps > 0.0 {
                wet = (wet * self.quantize_steps).round() / self.quantize_steps;
            }

            *s = dry * (1.0 - self.mix) + wet * self.mix;

            self.phase += phase_inc;
            if self.phase > TAU {
                self.phase -= TAU;
            }
        }
    }

    fn reset(&mut self) {
        self.phase = 0.0;
    }

    fn name(&self) -> &str {
        "Ring Modulator"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ring_mod_mix_zero_is_passthrough() {
        let input: Vec<f32> = (0..480)
            .map(|i| (i as f32 / 480.0 * 440.0 * TAU).sin() * 0.5)
            .collect();
        let mut buffer = AudioBuffer::new(input.clone(), 48000);

        let mut rm = RingMod::with_mix(50.0, 8.0, 0.0);
        rm.process(&mut buffer);

        for (a, b) in input.iter().zip(buffer.samples.iter()) {
            assert!((a - b).abs() < 1e-6, "mix=0 should be a passthrough");
        }
    }

    #[test]
    fn test_ring_mod_full_wet_changes_signal() {
        let input: Vec<f32> = (0..480)
            .map(|i| (i as f32 / 480.0 * 440.0 * TAU).sin() * 0.5)
            .collect();
        let mut buffer = AudioBuffer::new(input.clone(), 48000);

        let mut rm = RingMod::new(50.0, 8.0); // fully wet
        rm.process(&mut buffer);

        let changed = input
            .iter()
            .zip(buffer.samples.iter())
            .any(|(a, b)| (a - b).abs() > 1e-3);
        assert!(changed, "fully-wet ring mod should change the signal");
    }
}
