/// Generate subharmonics (octave below) and mix with original.
/// Uses half-wave rectification to create sub-octave content.
/// `amount`: mix level of subharmonic (0.0-1.0)
pub fn apply(samples: &[f32], amount: f32) -> Vec<f32> {
    // Simple sub-octave generator via flip-flop triggered by zero crossings
    let mut sub = 0.0f32;
    let mut prev = 0.0f32;
    let mut flip = 1.0f32;

    samples
        .iter()
        .map(|&s| {
            // Detect zero crossing
            if (prev >= 0.0 && s < 0.0) || (prev < 0.0 && s >= 0.0) {
                flip = -flip;
            }
            sub = s * flip;
            prev = s;
            s + sub * amount
        })
        .collect()
}
