use std::f32::consts::PI;

/// Tremolo: periodic amplitude modulation.
/// `rate_hz`: modulation speed (e.g. 15-30 Hz for flutter/chirp effects)
/// `depth`: modulation depth (0.0 = no effect, 1.0 = full on/off)
pub fn apply(samples: &[f32], sample_rate: u32, rate_hz: f32, depth: f32) -> Vec<f32> {
    let phase_inc = 2.0 * PI * rate_hz / sample_rate as f32;
    samples
        .iter()
        .enumerate()
        .map(|(i, &s)| {
            // LFO oscillates between (1-depth) and 1.0
            let lfo = 1.0 - depth * 0.5 * (1.0 - (phase_inc * i as f32).sin());
            s * lfo
        })
        .collect()
}
