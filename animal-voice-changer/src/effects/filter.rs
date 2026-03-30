use std::f32::consts::PI;

/// Highpass filter (biquad, 2nd order).
/// Removes frequencies below `cutoff_hz`.
pub fn highpass(samples: &[f32], sample_rate: u32, cutoff_hz: f32, q: f32) -> Vec<f32> {
    let w0 = 2.0 * PI * cutoff_hz / sample_rate as f32;
    let alpha = w0.sin() / (2.0 * q);

    let b0 = (1.0 + w0.cos()) / 2.0;
    let b1 = -(1.0 + w0.cos());
    let b2 = (1.0 + w0.cos()) / 2.0;
    let a0 = 1.0 + alpha;
    let a1 = -2.0 * w0.cos();
    let a2 = 1.0 - alpha;

    biquad_process(samples, b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0)
}

/// Lowpass filter (biquad, 2nd order).
/// Removes frequencies above `cutoff_hz`.
pub fn lowpass(samples: &[f32], sample_rate: u32, cutoff_hz: f32, q: f32) -> Vec<f32> {
    let w0 = 2.0 * PI * cutoff_hz / sample_rate as f32;
    let alpha = w0.sin() / (2.0 * q);

    let b0 = (1.0 - w0.cos()) / 2.0;
    let b1 = 1.0 - w0.cos();
    let b2 = (1.0 - w0.cos()) / 2.0;
    let a0 = 1.0 + alpha;
    let a1 = -2.0 * w0.cos();
    let a2 = 1.0 - alpha;

    biquad_process(samples, b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0)
}

fn biquad_process(samples: &[f32], b0: f32, b1: f32, b2: f32, a1: f32, a2: f32) -> Vec<f32> {
    let mut x1 = 0.0f32;
    let mut x2 = 0.0f32;
    let mut y1 = 0.0f32;
    let mut y2 = 0.0f32;

    samples
        .iter()
        .map(|&x| {
            let y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
            x2 = x1;
            x1 = x;
            y2 = y1;
            y1 = y;
            y
        })
        .collect()
}
