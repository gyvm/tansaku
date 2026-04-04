use vozoo_core::{AudioBuffer, AudioNode};

/// Hard limiter: clamps samples to [-1.0, 1.0].
pub struct HardLimiter;

impl AudioNode for HardLimiter {
    fn process(&mut self, buffer: &mut AudioBuffer) {
        buffer.hard_limit();
    }

    fn reset(&mut self) {}

    fn name(&self) -> &str {
        "Hard Limiter"
    }
}

/// Lookahead limiter with attack/release envelope.
/// Prevents clipping by looking ahead and smoothly reducing gain.
pub struct LookaheadLimiter {
    ceiling_db: f32,
    attack_ms: f32,
    release_ms: f32,
    lookahead_ms: f32,
    gain: f32,
}

impl LookaheadLimiter {
    pub fn new(ceiling_db: f32) -> Self {
        Self {
            ceiling_db,
            attack_ms: 5.0,
            release_ms: 50.0,
            lookahead_ms: 5.0,
            gain: 1.0,
        }
    }
}

impl AudioNode for LookaheadLimiter {
    fn process(&mut self, buffer: &mut AudioBuffer) {
        let ceiling = 10.0f32.powf(self.ceiling_db / 20.0);
        let sr = buffer.sample_rate as f32;
        let attack_coeff = (-1.0 / (self.attack_ms * 0.001 * sr)).exp();
        let release_coeff = (-1.0 / (self.release_ms * 0.001 * sr)).exp();
        let lookahead = (self.lookahead_ms * 0.001 * sr) as usize;

        // Pass 1: find peak envelope with lookahead
        let len = buffer.samples.len();
        let mut peaks = vec![0.0f32; len];
        for i in 0..len {
            let end = (i + lookahead).min(len);
            let mut peak = 0.0f32;
            for j in i..end {
                peak = peak.max(buffer.samples[j].abs());
            }
            peaks[i] = peak;
        }

        // Pass 2: apply gain reduction
        for (i, s) in buffer.samples.iter_mut().enumerate() {
            let peak = peaks[i];
            let target_gain = if peak > ceiling {
                ceiling / peak
            } else {
                1.0
            };

            // Smooth gain changes
            if target_gain < self.gain {
                self.gain = attack_coeff * self.gain + (1.0 - attack_coeff) * target_gain;
            } else {
                self.gain = release_coeff * self.gain + (1.0 - release_coeff) * target_gain;
            }

            *s *= self.gain;
        }
    }

    fn reset(&mut self) {
        self.gain = 1.0;
    }

    fn name(&self) -> &str {
        "Lookahead Limiter"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lookahead_limiter_prevents_clipping() {
        // Create signal that exceeds 0dB (ceiling at -1dB)
        let samples: Vec<f32> = (0..4800)
            .map(|i| (i as f32 / 4800.0 * 440.0 * std::f32::consts::TAU).sin() * 1.5)
            .collect();

        let mut buffer = AudioBuffer::new(samples, 48000);
        let mut limiter = LookaheadLimiter::new(-1.0);
        limiter.process(&mut buffer);

        let ceiling = 10.0f32.powf(-1.0 / 20.0); // ~0.891
        // After limiter settles, peaks should be near or below ceiling
        // (first few samples may overshoot during attack)
        let tail = &buffer.samples[480..]; // skip first 10ms
        let max_peak = tail.iter().map(|s| s.abs()).fold(0.0f32, f32::max);
        assert!(
            max_peak < ceiling * 1.1,
            "Limiter failed: max peak {max_peak} > ceiling {ceiling}"
        );
    }
}
