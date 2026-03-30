/// Jitter: random micro-variations in timing (pitch instability).
/// Shimmer: random micro-variations in amplitude.
/// These make the voice sound less "clean" and more organic/animal-like.
pub fn apply(
    samples: &[f32],
    jitter_amount: f32,
    shimmer_amount: f32,
) -> Vec<f32> {
    let mut rng = SimpleRng::new(1337);
    let mut output = Vec::with_capacity(samples.len());

    for i in 0..samples.len() {
        // Jitter: read from a slightly randomized position
        let jitter_offset = (rng.next_f32() * 2.0 - 1.0) * jitter_amount;
        let read_pos = i as f32 + jitter_offset;
        let idx = read_pos.floor().max(0.0) as usize;
        let frac = read_pos - read_pos.floor();

        let sample = if idx + 1 < samples.len() {
            samples[idx] * (1.0 - frac) + samples[idx + 1] * frac
        } else if idx < samples.len() {
            samples[idx]
        } else {
            0.0
        };

        // Shimmer: random amplitude variation
        let shimmer = 1.0 + (rng.next_f32() * 2.0 - 1.0) * shimmer_amount;
        output.push(sample * shimmer);
    }
    output
}

struct SimpleRng {
    state: u32,
}

impl SimpleRng {
    fn new(seed: u32) -> Self {
        Self {
            state: if seed == 0 { 1 } else { seed },
        }
    }

    fn next_u32(&mut self) -> u32 {
        self.state ^= self.state << 13;
        self.state ^= self.state >> 17;
        self.state ^= self.state << 5;
        self.state
    }

    fn next_f32(&mut self) -> f32 {
        self.next_u32() as f32 / u32::MAX as f32
    }
}
