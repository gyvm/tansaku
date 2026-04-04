use vozoo_core::{AudioBuffer, AudioNode};

/// Legacy pitch shift by resampling (changes duration).
/// factor < 1.0 = slower/deeper, factor > 1.0 = faster/higher.
pub struct PitchShiftResample {
    factor: f32,
}

impl PitchShiftResample {
    pub fn new(factor: f32) -> Self {
        Self { factor }
    }
}

impl AudioNode for PitchShiftResample {
    fn process(&mut self, buffer: &mut AudioBuffer) {
        if (self.factor - 1.0).abs() < f32::EPSILON || buffer.samples.is_empty() {
            return;
        }

        let input = &buffer.samples;
        let out_len = (input.len() as f32 / self.factor) as usize;
        let mut out = Vec::with_capacity(out_len);

        let mut idx: f64 = 0.0;
        let last = input.len() - 1;

        while (idx as usize) < last {
            let i = idx as usize;
            let frac = idx as f32 - i as f32;
            let val = input[i] * (1.0 - frac) + input[i + 1] * frac;
            out.push(val);
            idx += self.factor as f64;
        }

        buffer.samples = out;
    }

    fn reset(&mut self) {}

    fn name(&self) -> &str {
        "Pitch Shift (Resample)"
    }
}
