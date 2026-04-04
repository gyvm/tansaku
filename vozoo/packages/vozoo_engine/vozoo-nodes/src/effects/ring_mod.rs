use vozoo_core::{AudioBuffer, AudioNode};
use std::f32::consts::TAU;

/// Ring modulation + bitcrush effect (Robot voice).
pub struct RingMod {
    mod_freq: f32,
    quantize_steps: f32,
    phase: f32,
}

impl RingMod {
    pub fn new(mod_freq: f32, quantize_steps: f32) -> Self {
        Self {
            mod_freq,
            quantize_steps,
            phase: 0.0,
        }
    }
}

impl AudioNode for RingMod {
    fn process(&mut self, buffer: &mut AudioBuffer) {
        let phase_inc = TAU * self.mod_freq / buffer.sample_rate() as f32;

        for s in &mut buffer.samples {
            let modulator = self.phase.sin();
            *s *= modulator;

            // Bitcrush quantization
            if self.quantize_steps > 0.0 {
                *s = (*s * self.quantize_steps).round() / self.quantize_steps;
            }

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
