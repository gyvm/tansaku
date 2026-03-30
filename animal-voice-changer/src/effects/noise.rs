use super::chain::NoiseColor;

/// Inject noise into the signal.
/// `amount`: noise level relative to signal (0.0-1.0)
pub fn apply(samples: &[f32], amount: f32, color: &NoiseColor) -> Vec<f32> {
    let mut rng = SimpleRng::new(42);

    match color {
        NoiseColor::White => samples
            .iter()
            .map(|&s| {
                let noise = rng.next_f32() * 2.0 - 1.0;
                s + noise * amount
            })
            .collect(),
        NoiseColor::Pink => {
            let mut pink = PinkNoise::new();
            samples
                .iter()
                .map(|&s| {
                    let noise = pink.next(&mut rng);
                    s + noise * amount
                })
                .collect()
        }
    }
}

/// Simple xorshift32 PRNG (deterministic, no external deps)
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

/// Voss-McCartney pink noise generator (3-octave)
struct PinkNoise {
    octaves: [f32; 3],
    counter: u32,
}

impl PinkNoise {
    fn new() -> Self {
        Self {
            octaves: [0.0; 3],
            counter: 0,
        }
    }

    fn next(&mut self, rng: &mut SimpleRng) -> f32 {
        self.counter = self.counter.wrapping_add(1);

        // Update octaves at different rates
        if self.counter % 1 == 0 {
            self.octaves[0] = rng.next_f32() * 2.0 - 1.0;
        }
        if self.counter % 2 == 0 {
            self.octaves[1] = rng.next_f32() * 2.0 - 1.0;
        }
        if self.counter % 4 == 0 {
            self.octaves[2] = rng.next_f32() * 2.0 - 1.0;
        }

        (self.octaves[0] + self.octaves[1] + self.octaves[2]) / 3.0
    }
}
