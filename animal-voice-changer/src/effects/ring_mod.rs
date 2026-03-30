use std::f32::consts::PI;

/// Ring modulation: multiply signal by a sine wave carrier.
/// Creates inharmonic, metallic, or trumpet-like tones.
/// `freq_hz`: carrier frequency
/// `mix`: wet/dry blend (0.0 = fully dry, 1.0 = fully wet)
pub fn apply(samples: &[f32], sample_rate: u32, freq_hz: f32, mix: f32) -> Vec<f32> {
    let phase_inc = 2.0 * PI * freq_hz / sample_rate as f32;
    samples
        .iter()
        .enumerate()
        .map(|(i, &s)| {
            let carrier = (phase_inc * i as f32).sin();
            let wet = s * carrier;
            s * (1.0 - mix) + wet * mix
        })
        .collect()
}
