use vozoo_core::{AudioBuffer, AudioNode};
use std::f32::consts::TAU;

/// Chorus effect: delay line modulated by LFO.
pub struct Chorus {
    delay_ms: f32,
    depth_ms: f32,
    rate_hz: f32,
    mix: f32,
    lfo_phase: f32,
}

impl Chorus {
    pub fn new(delay_ms: f32, depth_ms: f32, rate_hz: f32, mix: f32) -> Self {
        Self {
            delay_ms,
            depth_ms,
            rate_hz,
            mix,
            lfo_phase: 0.0,
        }
    }
}

impl AudioNode for Chorus {
    fn process(&mut self, buffer: &mut AudioBuffer) {
        let sr = buffer.sample_rate() as f32;
        let delay_samples = self.delay_ms * sr / 1000.0;
        let depth_samples = self.depth_ms * sr / 1000.0;
        let lfo_inc = TAU * self.rate_hz / sr;

        // We need the original samples for reading delayed values
        let dry = buffer.samples.clone();

        for (i, s) in buffer.samples.iter_mut().enumerate() {
            let lfo = self.lfo_phase.sin();
            self.lfo_phase += lfo_inc;
            if self.lfo_phase > TAU {
                self.lfo_phase -= TAU;
            }

            let current_delay = delay_samples + lfo * depth_samples;
            let read_idx = i as f32 - current_delay;

            let delayed = if read_idx >= 0.0 && (read_idx as usize) < dry.len() - 1 {
                let base = read_idx as usize;
                let frac = read_idx - base as f32;
                dry[base] * (1.0 - frac) + dry[base + 1] * frac
            } else {
                0.0
            };

            *s = dry[i] * (1.0 - self.mix) + delayed * self.mix;
        }
    }

    fn reset(&mut self) {
        self.lfo_phase = 0.0;
    }

    fn name(&self) -> &str {
        "Chorus"
    }
}
