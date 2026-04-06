use vozoo_core::{AudioBuffer, AudioNode};
use std::f32::consts::PI;

#[derive(Clone, Copy)]
pub enum FilterType {
    LowPass,
    HighPass,
}

/// Biquad filter (Direct Form II Transposed).
pub struct BiquadFilter {
    filter_type: FilterType,
    freq: f32,
    q: f32,
    // coefficients
    b0: f32,
    b1: f32,
    b2: f32,
    a1: f32,
    a2: f32,
    // state
    z1: f32,
    z2: f32,
    configured_sr: u32,
}

impl BiquadFilter {
    pub fn new(filter_type: FilterType, freq: f32, q: f32) -> Self {
        let mut f = Self {
            filter_type,
            freq,
            q,
            b0: 1.0,
            b1: 0.0,
            b2: 0.0,
            a1: 0.0,
            a2: 0.0,
            z1: 0.0,
            z2: 0.0,
            configured_sr: 0,
        };
        f.compute_coefficients(48000);
        f
    }

    fn compute_coefficients(&mut self, sample_rate: u32) {
        self.configured_sr = sample_rate;
        let w0 = 2.0 * PI * self.freq / sample_rate as f32;
        let alpha = w0.sin() / (2.0 * self.q);
        let cos_w0 = w0.cos();

        let (b0, b1, b2) = match self.filter_type {
            FilterType::LowPass => {
                let b0 = (1.0 - cos_w0) / 2.0;
                let b1 = 1.0 - cos_w0;
                let b2 = (1.0 - cos_w0) / 2.0;
                (b0, b1, b2)
            }
            FilterType::HighPass => {
                let b0 = (1.0 + cos_w0) / 2.0;
                let b1 = -(1.0 + cos_w0);
                let b2 = (1.0 + cos_w0) / 2.0;
                (b0, b1, b2)
            }
        };
        let a0 = 1.0 + alpha;
        self.b0 = b0 / a0;
        self.b1 = b1 / a0;
        self.b2 = b2 / a0;
        self.a1 = -2.0 * cos_w0 / a0;
        self.a2 = (1.0 - alpha) / a0;
    }
}

impl AudioNode for BiquadFilter {
    fn process(&mut self, buffer: &mut AudioBuffer) {
        if buffer.sample_rate() != self.configured_sr {
            self.compute_coefficients(buffer.sample_rate());
        }
        for s in &mut buffer.samples {
            let x = *s;
            let y = self.b0 * x + self.z1;
            self.z1 = self.b1 * x - self.a1 * y + self.z2;
            self.z2 = self.b2 * x - self.a2 * y;
            *s = y;
        }
    }

    fn reset(&mut self) {
        self.z1 = 0.0;
        self.z2 = 0.0;
    }

    fn name(&self) -> &str {
        match self.filter_type {
            FilterType::LowPass => "LowPass Filter",
            FilterType::HighPass => "HighPass Filter",
        }
    }
}
