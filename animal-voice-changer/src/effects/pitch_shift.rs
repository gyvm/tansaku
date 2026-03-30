use pitch_shift::PitchShifter;

const WINDOW_MS: usize = 50;
const OVERSAMPLING: usize = 16;

/// Apply pitch shift to mono f32 samples.
/// `semitones`: positive = higher pitch, negative = lower pitch.
pub fn shift(samples: &[f32], sample_rate: u32, semitones: f32) -> Vec<f32> {
    let mut shifter = PitchShifter::new(WINDOW_MS, sample_rate as usize);
    let mut output = vec![0.0f32; samples.len()];
    shifter.shift_pitch(OVERSAMPLING, semitones, samples, &mut output);
    output
}
