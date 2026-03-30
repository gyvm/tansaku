use super::{
    distortion, filter, jitter_shimmer, noise, resonance, ring_mod, spectral_tilt, subharmonics,
    tremolo, vibrato,
};

#[derive(Debug, Clone)]
pub enum NoiseColor {
    White,
    Pink,
}

#[derive(Debug, Clone)]
pub enum PostEffect {
    ResonantBandpass {
        center_hz: f32,
        q: f32,
        gain_db: f32,
    },
    Distortion {
        drive: f32,
        mix: f32,
    },
    RingMod {
        freq_hz: f32,
        mix: f32,
    },
    NoiseInjection {
        amount: f32,
        color: NoiseColor,
    },
    Vibrato {
        rate_hz: f32,
        depth_samples: f32,
    },
    Tremolo {
        rate_hz: f32,
        depth: f32,
    },
    JitterShimmer {
        jitter: f32,
        shimmer: f32,
    },
    Highpass {
        cutoff_hz: f32,
        q: f32,
    },
    Lowpass {
        cutoff_hz: f32,
        q: f32,
    },
    SpectralTilt {
        tilt_db_per_octave: f32,
    },
    Subharmonics {
        amount: f32,
    },
    Gain {
        db: f32,
    },
}

impl PostEffect {
    pub fn name(&self) -> &'static str {
        match self {
            Self::ResonantBandpass { .. } => "resonant bandpass",
            Self::Distortion { .. } => "distortion",
            Self::RingMod { .. } => "ring modulation",
            Self::NoiseInjection { .. } => "noise injection",
            Self::Vibrato { .. } => "vibrato",
            Self::Tremolo { .. } => "tremolo",
            Self::JitterShimmer { .. } => "jitter/shimmer",
            Self::Highpass { .. } => "highpass filter",
            Self::Lowpass { .. } => "lowpass filter",
            Self::SpectralTilt { .. } => "spectral tilt",
            Self::Subharmonics { .. } => "subharmonics",
            Self::Gain { .. } => "gain",
        }
    }

    pub fn apply(&self, samples: &[f32], sample_rate: u32) -> Vec<f32> {
        match self {
            Self::ResonantBandpass {
                center_hz,
                q,
                gain_db,
            } => resonance::apply(samples, sample_rate, *center_hz, *q, *gain_db),
            Self::Distortion { drive, mix } => distortion::apply(samples, *drive, *mix),
            Self::RingMod { freq_hz, mix } => {
                ring_mod::apply(samples, sample_rate, *freq_hz, *mix)
            }
            Self::NoiseInjection { amount, color } => noise::apply(samples, *amount, color),
            Self::Vibrato {
                rate_hz,
                depth_samples,
            } => vibrato::apply(samples, sample_rate, *rate_hz, *depth_samples),
            Self::Tremolo { rate_hz, depth } => {
                tremolo::apply(samples, sample_rate, *rate_hz, *depth)
            }
            Self::JitterShimmer { jitter, shimmer } => {
                jitter_shimmer::apply(samples, *jitter, *shimmer)
            }
            Self::Highpass { cutoff_hz, q } => {
                filter::highpass(samples, sample_rate, *cutoff_hz, *q)
            }
            Self::Lowpass { cutoff_hz, q } => {
                filter::lowpass(samples, sample_rate, *cutoff_hz, *q)
            }
            Self::SpectralTilt { tilt_db_per_octave } => {
                spectral_tilt::apply(samples, sample_rate, *tilt_db_per_octave)
            }
            Self::Subharmonics { amount } => subharmonics::apply(samples, *amount),
            Self::Gain { db } => {
                let gain = 10.0f32.powf(*db / 20.0);
                samples.iter().map(|&s| s * gain).collect()
            }
        }
    }
}
