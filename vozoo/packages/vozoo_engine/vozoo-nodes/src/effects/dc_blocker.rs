use vozoo_core::{AudioBuffer, AudioNode};

/// DC offset removal using a 1-pole high-pass filter.
/// Transfer function: H(z) = (1 - z^-1) / (1 - R * z^-1)
/// R close to 1.0 preserves low frequencies while removing DC.
pub struct DcBlocker {
    r: f32,
    x_prev: f32,
    y_prev: f32,
}

impl DcBlocker {
    pub fn new() -> Self {
        Self {
            r: 0.995,
            x_prev: 0.0,
            y_prev: 0.0,
        }
    }
}

impl AudioNode for DcBlocker {
    fn process(&mut self, buffer: &mut AudioBuffer) {
        for s in &mut buffer.samples {
            let x = *s;
            let y = x - self.x_prev + self.r * self.y_prev;
            self.x_prev = x;
            self.y_prev = y;
            *s = y;
        }
    }

    fn reset(&mut self) {
        self.x_prev = 0.0;
        self.y_prev = 0.0;
    }

    fn name(&self) -> &str {
        "DC Blocker"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dc_blocker_removes_offset() {
        let dc_offset = 0.3;
        let samples: Vec<f32> = (0..4800)
            .map(|i| (i as f32 / 4800.0 * 440.0 * std::f32::consts::TAU).sin() * 0.5 + dc_offset)
            .collect();

        let mut buffer = AudioBuffer::new(samples, 48000);
        let mut blocker = DcBlocker::new();
        blocker.process(&mut buffer);

        // After processing, the mean should be close to 0
        let mean: f32 = buffer.samples.iter().sum::<f32>() / buffer.samples.len() as f32;
        assert!(mean.abs() < 0.05, "DC offset not removed: mean = {mean}");
    }
}
