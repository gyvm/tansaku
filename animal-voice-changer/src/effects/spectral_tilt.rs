use std::f32::consts::PI;

/// Spectral tilt: boost or cut high frequencies relative to low.
/// `tilt_db_per_octave`: positive = brighter, negative = darker/more nasal.
/// Implemented as a 1-pole shelving filter.
pub fn apply(samples: &[f32], sample_rate: u32, tilt_db_per_octave: f32) -> Vec<f32> {
    // Simple 1-pole filter for spectral tilt
    // Positive tilt = emphasis on highs (pre-emphasis)
    // Negative tilt = emphasis on lows (de-emphasis)
    let gain_per_sample = tilt_db_per_octave / (sample_rate as f32 / 2.0).log2();
    let coeff = 1.0 - (-gain_per_sample.abs() * PI / 20.0).exp();
    let coeff = coeff.clamp(0.0, 0.99);

    if tilt_db_per_octave.abs() < 0.1 {
        return samples.to_vec();
    }

    let mut prev = 0.0f32;
    if tilt_db_per_octave > 0.0 {
        // High emphasis: y[n] = x[n] - coeff * x[n-1]
        samples
            .iter()
            .map(|&x| {
                let y = x - coeff * prev;
                prev = x;
                y
            })
            .collect()
    } else {
        // Low emphasis: y[n] = coeff * y[n-1] + (1-coeff) * x[n]
        samples
            .iter()
            .map(|&x| {
                let y = coeff * prev + (1.0 - coeff) * x;
                prev = y;
                y
            })
            .collect()
    }
}
