/// Mono audio buffer at a fixed sample rate.
/// All internal processing uses f32 samples normalized to [-1.0, 1.0].
#[derive(Clone)]
pub struct AudioBuffer {
    pub samples: Vec<f32>,
    pub sample_rate: u32,
}

impl AudioBuffer {
    pub fn new(samples: Vec<f32>, sample_rate: u32) -> Self {
        Self {
            samples,
            sample_rate,
        }
    }

    pub fn empty(sample_rate: u32) -> Self {
        Self {
            samples: Vec::new(),
            sample_rate,
        }
    }

    pub fn len(&self) -> usize {
        self.samples.len()
    }

    pub fn is_empty(&self) -> bool {
        self.samples.is_empty()
    }

    /// Convert stereo interleaved samples to mono by averaging channels.
    pub fn from_stereo(interleaved: &[f32], channels: u16, sample_rate: u32) -> Self {
        if channels <= 1 {
            return Self::new(interleaved.to_vec(), sample_rate);
        }
        let ch = channels as usize;
        let mono: Vec<f32> = interleaved
            .chunks_exact(ch)
            .map(|frame| frame.iter().sum::<f32>() / ch as f32)
            .collect();
        Self::new(mono, sample_rate)
    }

    /// Hard-limit all samples to [-1.0, 1.0].
    pub fn hard_limit(&mut self) {
        for s in &mut self.samples {
            *s = s.clamp(-1.0, 1.0);
        }
    }
}
