use std::f32::consts::PI;

/// Apply a resonant bandpass filter (biquad BPF).
/// Based on Robert Bristow-Johnson's Audio EQ Cookbook.
pub fn apply(samples: &[f32], sample_rate: u32, center_hz: f32, q: f32, gain_db: f32) -> Vec<f32> {
    let gain = 10.0f32.powf(gain_db / 20.0);
    let w0 = 2.0 * PI * center_hz / sample_rate as f32;
    let alpha = w0.sin() / (2.0 * q);

    // BPF coefficients (constant skirt gain, peak gain = Q)
    let b0 = alpha;
    let b1 = 0.0;
    let b2 = -alpha;
    let a0 = 1.0 + alpha;
    let a1 = -2.0 * w0.cos();
    let a2 = 1.0 - alpha;

    // Normalize
    let b0 = b0 / a0;
    let b1 = b1 / a0;
    let b2 = b2 / a0;
    let a1 = a1 / a0;
    let a2 = a2 / a0;

    // Apply as parallel blend: output = dry + gain * filtered
    let mut x1 = 0.0f32;
    let mut x2 = 0.0f32;
    let mut y1 = 0.0f32;
    let mut y2 = 0.0f32;

    samples
        .iter()
        .map(|&x| {
            let filtered = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
            x2 = x1;
            x1 = x;
            y2 = y1;
            y1 = filtered;
            x + gain * filtered
        })
        .collect()
}
