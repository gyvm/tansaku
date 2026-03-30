use crate::effects::chain::PostEffect;
use crate::world::{self, WorldAnalysis};

pub struct VoiceParams {
    pub pitch_shift_semitones: f64,
    pub formant_shift_ratio: f64,
    pub breathiness: f64,
    /// F0 contour: apply a pitch bend pattern over time.
    /// Each entry is (position 0.0-1.0, semitone offset).
    /// Linearly interpolated between points.
    pub f0_contour: Option<Vec<(f64, f64)>>,
    /// Formant sweep: formant ratio changes over time.
    /// Each entry is (position 0.0-1.0, formant ratio).
    pub formant_sweep: Option<Vec<(f64, f64)>>,
    /// F0 jitter: random per-frame pitch variation in semitones.
    pub f0_jitter: f64,
    /// Spectral tilt applied in World domain (db/octave, negative = nasal/dark).
    pub spectral_tilt: f64,
    pub effects: Vec<PostEffect>,
}

impl VoiceParams {
    pub fn simple(semitones: f64, formant: f64, breathiness: f64) -> Self {
        Self {
            pitch_shift_semitones: semitones,
            formant_shift_ratio: formant,
            breathiness,
            f0_contour: None,
            formant_sweep: None,
            f0_jitter: 0.0,
            spectral_tilt: 0.0,
            effects: vec![],
        }
    }
}

pub fn process_voice(samples: &[f32], sample_rate: u32, params: &VoiceParams) -> Vec<f32> {
    eprintln!("  Analyzing with World vocoder...");
    let mut analysis = world::analyze(samples, sample_rate);

    if params.pitch_shift_semitones.abs() > f64::EPSILON {
        eprintln!(
            "  Shifting pitch by {:+.1} semitones...",
            params.pitch_shift_semitones
        );
        manipulate_pitch(&mut analysis, params.pitch_shift_semitones);
    }

    if let Some(ref contour) = params.f0_contour {
        eprintln!("  Applying F0 contour ({} points)...", contour.len());
        apply_f0_contour(&mut analysis, contour);
    }

    if params.f0_jitter > f64::EPSILON {
        eprintln!("  Adding F0 jitter ({:.2} st)...", params.f0_jitter);
        apply_f0_jitter(&mut analysis, params.f0_jitter);
    }

    if (params.formant_shift_ratio - 1.0).abs() > f64::EPSILON {
        eprintln!(
            "  Shifting formants by ratio {:.2}...",
            params.formant_shift_ratio
        );
        manipulate_formant_at(&mut analysis, params.formant_shift_ratio, None);
    }

    if let Some(ref sweep) = params.formant_sweep {
        eprintln!("  Applying formant sweep ({} points)...", sweep.len());
        apply_formant_sweep(&mut analysis, sweep);
    }

    if params.spectral_tilt.abs() > f64::EPSILON {
        eprintln!(
            "  Applying spectral tilt ({:+.1} dB/oct)...",
            params.spectral_tilt
        );
        apply_spectral_tilt(&mut analysis, params.spectral_tilt);
    }

    if params.breathiness > f64::EPSILON {
        eprintln!("  Adding breathiness ({:.2})...", params.breathiness);
        manipulate_breathiness(&mut analysis, params.breathiness);
    }

    eprintln!("  Resynthesizing...");
    let mut output = world::synthesize(&analysis);

    for effect in &params.effects {
        eprintln!("  Applying {}...", effect.name());
        output = effect.apply(&output, sample_rate);
    }

    // Peak normalize to -1 dB to prevent clipping
    let peak = output.iter().map(|s| s.abs()).fold(0.0f32, f32::max);
    if peak > 0.0 {
        let target = 10.0f32.powf(-1.0 / 20.0); // -1 dB
        let gain = target / peak;
        if gain < 1.0 {
            for s in &mut output {
                *s *= gain;
            }
        }
    }

    output
}

fn manipulate_pitch(analysis: &mut WorldAnalysis, semitones: f64) {
    let ratio = 2.0_f64.powf(semitones / 12.0);
    for f in &mut analysis.f0 {
        if *f > 0.0 {
            *f *= ratio;
        }
    }
}

/// Apply a pitch contour pattern: interpolate semitone offsets over time.
fn apply_f0_contour(analysis: &mut WorldAnalysis, contour: &[(f64, f64)]) {
    if contour.is_empty() {
        return;
    }
    let len = analysis.f0.len();
    for (i, f) in analysis.f0.iter_mut().enumerate() {
        if *f <= 0.0 {
            continue;
        }
        let pos = i as f64 / len as f64;
        let semitone_offset = interpolate_contour(contour, pos);
        let ratio = 2.0_f64.powf(semitone_offset / 12.0);
        *f *= ratio;
    }
}

/// Apply random per-frame F0 jitter (in semitones).
fn apply_f0_jitter(analysis: &mut WorldAnalysis, jitter_semitones: f64) {
    let mut rng = SimpleRng64::new(9999);
    for f in &mut analysis.f0 {
        if *f > 0.0 {
            let offset = (rng.next_f64() * 2.0 - 1.0) * jitter_semitones;
            let ratio = 2.0_f64.powf(offset / 12.0);
            *f *= ratio;
        }
    }
}

/// Apply formant shift with optional per-frame ratio.
fn manipulate_formant_at(analysis: &mut WorldAnalysis, ratio: f64, _frame_idx: Option<usize>) {
    let spec_size = analysis.spectrogram[0].len();
    for frame in &mut analysis.spectrogram {
        resample_spectrum(frame, spec_size, ratio);
    }
}

/// Apply time-varying formant sweep.
fn apply_formant_sweep(analysis: &mut WorldAnalysis, sweep: &[(f64, f64)]) {
    let len = analysis.spectrogram.len();
    let spec_size = analysis.spectrogram[0].len();
    for (i, frame) in analysis.spectrogram.iter_mut().enumerate() {
        let pos = i as f64 / len as f64;
        let ratio = interpolate_contour(sweep, pos);
        resample_spectrum(frame, spec_size, ratio);
    }
}

fn resample_spectrum(frame: &mut Vec<f64>, spec_size: usize, ratio: f64) {
    let original = frame.clone();
    for k in 0..spec_size {
        let src = k as f64 * ratio;
        let src_idx = src.floor() as usize;
        let frac = src - src.floor();

        if src_idx + 1 < spec_size {
            frame[k] = original[src_idx] * (1.0 - frac) + original[src_idx + 1] * frac;
        } else if src_idx < spec_size {
            frame[k] = original[src_idx];
        } else {
            frame[k] = 1e-16;
        }
    }
}

/// Apply spectral tilt in World domain.
/// Modifies the spectral envelope directly: positive = brighter, negative = darker/nasal.
fn apply_spectral_tilt(analysis: &mut WorldAnalysis, tilt_db_per_octave: f64) {
    let spec_size = analysis.spectrogram[0].len();
    let fs = analysis.fs as f64;
    let freq_per_bin = fs / (2.0 * (spec_size - 1) as f64);

    for frame in &mut analysis.spectrogram {
        for k in 1..spec_size {
            let freq = k as f64 * freq_per_bin;
            let octaves_from_ref = (freq / 100.0).log2(); // reference at 100 Hz
            let gain_db = tilt_db_per_octave * octaves_from_ref;
            let gain_linear = 10.0_f64.powf(gain_db / 20.0);
            frame[k] *= gain_linear;
        }
    }
}

fn manipulate_breathiness(analysis: &mut WorldAnalysis, amount: f64) {
    for frame in &mut analysis.aperiodicity {
        for val in frame.iter_mut() {
            *val += amount * (1.0 - *val);
        }
    }
}

/// Linearly interpolate a value from a set of (position, value) points.
fn interpolate_contour(points: &[(f64, f64)], pos: f64) -> f64 {
    if points.is_empty() {
        return 0.0;
    }
    if pos <= points[0].0 {
        return points[0].1;
    }
    if pos >= points[points.len() - 1].0 {
        return points[points.len() - 1].1;
    }
    for i in 0..points.len() - 1 {
        if pos >= points[i].0 && pos < points[i + 1].0 {
            let t = (pos - points[i].0) / (points[i + 1].0 - points[i].0);
            return points[i].1 * (1.0 - t) + points[i + 1].1 * t;
        }
    }
    points[points.len() - 1].1
}

struct SimpleRng64 {
    state: u64,
}

impl SimpleRng64 {
    fn new(seed: u64) -> Self {
        Self {
            state: if seed == 0 { 1 } else { seed },
        }
    }

    fn next_u64(&mut self) -> u64 {
        self.state ^= self.state << 13;
        self.state ^= self.state >> 7;
        self.state ^= self.state << 17;
        self.state
    }

    fn next_f64(&mut self) -> f64 {
        self.next_u64() as f64 / u64::MAX as f64
    }
}
