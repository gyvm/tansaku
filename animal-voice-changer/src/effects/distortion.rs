/// Soft clipping distortion using tanh waveshaping.
/// `drive`: pre-gain before clipping (1.0-20.0 typical)
/// `mix`: wet/dry blend (0.0 = fully dry, 1.0 = fully wet)
pub fn apply(samples: &[f32], drive: f32, mix: f32) -> Vec<f32> {
    samples
        .iter()
        .map(|&s| {
            let wet = (s * drive).tanh();
            s * (1.0 - mix) + wet * mix
        })
        .collect()
}
