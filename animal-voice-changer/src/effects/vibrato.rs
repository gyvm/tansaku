use std::f32::consts::PI;

/// Vibrato: periodic pitch modulation using a variable delay line.
/// `rate_hz`: modulation speed (e.g. 5-8 Hz for cat meow)
/// `depth_samples`: max delay variation in samples (higher = wider pitch swing)
pub fn apply(samples: &[f32], sample_rate: u32, rate_hz: f32, depth_samples: f32) -> Vec<f32> {
    let mut output = vec![0.0f32; samples.len()];
    let phase_inc = 2.0 * PI * rate_hz / sample_rate as f32;
    let max_delay = depth_samples.ceil() as usize + 1;

    for i in 0..samples.len() {
        let delay = depth_samples * (phase_inc * i as f32).sin();
        let read_pos = i as f32 - delay - max_delay as f32;

        if read_pos >= 0.0 && (read_pos as usize + 1) < samples.len() {
            let idx = read_pos.floor() as usize;
            let frac = read_pos - read_pos.floor();
            output[i] = samples[idx] * (1.0 - frac) + samples[idx + 1] * frac;
        } else if i < samples.len() {
            output[i] = samples[i];
        }
    }
    output
}
