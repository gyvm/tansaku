use vozoo_core::{AudioBuffer, AudioNode};

/// Simple gain (volume) node.
pub struct Gain {
    factor: f32,
}

impl Gain {
    pub fn new(factor: f32) -> Self {
        Self { factor }
    }
}

impl AudioNode for Gain {
    fn process(&mut self, buffer: &mut AudioBuffer) {
        for s in &mut buffer.samples {
            *s *= self.factor;
        }
    }

    fn reset(&mut self) {}

    fn name(&self) -> &str {
        "Gain"
    }
}
