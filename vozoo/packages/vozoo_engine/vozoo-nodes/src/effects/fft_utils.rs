use rustfft::{num_complex::Complex, Fft, FftPlanner};
use std::sync::Arc;

/// Create a forward and inverse FFT pair of the given size.
pub fn create_fft_pair(size: usize) -> (Arc<dyn Fft<f32>>, Arc<dyn Fft<f32>>) {
    let mut planner = FftPlanner::new();
    let forward = planner.plan_fft_forward(size);
    let inverse = planner.plan_fft_inverse(size);
    (forward, inverse)
}

/// Generate a Hann window of the given size.
pub fn hann_window(size: usize) -> Vec<f32> {
    (0..size)
        .map(|i| {
            let phase = 2.0 * std::f32::consts::PI * i as f32 / size as f32;
            0.5 * (1.0 - phase.cos())
        })
        .collect()
}

/// Convert real samples to complex (imaginary = 0).
pub fn real_to_complex(samples: &[f32]) -> Vec<Complex<f32>> {
    samples.iter().map(|&s| Complex::new(s, 0.0)).collect()
}

/// Extract real parts from complex buffer.
pub fn complex_to_real(complex: &[Complex<f32>]) -> Vec<f32> {
    complex.iter().map(|c| c.re).collect()
}
