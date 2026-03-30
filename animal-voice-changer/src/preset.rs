use clap::ValueEnum;

use crate::effects::chain::{NoiseColor, PostEffect};
use crate::pipeline::VoiceParams;

#[derive(Debug, Clone, Copy, ValueEnum)]
pub enum AnimalPreset {
    Gorilla,
    Cat,
    Bear,
    Mouse,
    Elephant,
    Frog,
    Bird,
    Dog,
    Pig,
    Lion,
    Dolphin,
}

fn default_world_params(
    pitch: f64,
    formant: f64,
    breathiness: f64,
    effects: Vec<PostEffect>,
) -> VoiceParams {
    VoiceParams {
        pitch_shift_semitones: pitch,
        formant_shift_ratio: formant,
        breathiness,
        f0_contour: None,
        formant_sweep: None,
        f0_jitter: 0.0,
        spectral_tilt: 0.0,
        effects,
    }
}

impl AnimalPreset {
    pub fn voice_params(self) -> VoiceParams {
        match self {
            Self::Gorilla => default_world_params(
                -10.0,
                1.6,
                0.3,
                vec![
                    PostEffect::Lowpass {
                        cutoff_hz: 3000.0,
                        q: 0.7,
                    },
                    PostEffect::Distortion {
                        drive: 4.0,
                        mix: 0.35,
                    },
                    PostEffect::ResonantBandpass {
                        center_hz: 250.0,
                        q: 1.5,
                        gain_db: 8.0,
                    },
                    PostEffect::ResonantBandpass {
                        center_hz: 600.0,
                        q: 1.2,
                        gain_db: 4.0,
                    },
                    PostEffect::Subharmonics { amount: 0.15 },
                    PostEffect::Tremolo {
                        rate_hz: 4.0,
                        depth: 0.15,
                    },
                    PostEffect::Gain { db: -2.0 },
                ],
            ),
            // Cat: "にゃ〜お" — pitch rises then falls, formant sweeps (mouth opens/closes),
            // nasal spectral tilt, vibrato, F0 jitter for organic feel
            Self::Cat => VoiceParams {
                pitch_shift_semitones: 8.0,
                formant_shift_ratio: 0.55,
                breathiness: 0.06,
                // Pitch contour: rise then fall like "nyaa~o"
                f0_contour: Some(vec![
                    (0.0, 0.0),
                    (0.15, 3.0),  // rise at start
                    (0.35, 5.0),  // peak
                    (0.6, 2.0),   // gradual fall
                    (0.85, -1.0), // dip below
                    (1.0, -2.0),  // end low
                ]),
                // Formant sweep: mouth opens then closes
                formant_sweep: Some(vec![
                    (0.0, 0.7),  // mouth closed (nasal)
                    (0.3, 0.5),  // mouth opening
                    (0.5, 0.45), // wide open
                    (0.7, 0.55), // closing
                    (1.0, 0.75), // closed again
                ]),
                f0_jitter: 0.3,
                spectral_tilt: -2.0, // nasal/dark quality
                effects: vec![
                    PostEffect::Vibrato {
                        rate_hz: 6.0,
                        depth_samples: 25.0,
                    },
                    PostEffect::ResonantBandpass {
                        center_hz: 900.0,
                        q: 4.0,
                        gain_db: 12.0,
                    },
                    PostEffect::ResonantBandpass {
                        center_hz: 2800.0,
                        q: 3.0,
                        gain_db: 7.0,
                    },
                    PostEffect::Highpass {
                        cutoff_hz: 350.0,
                        q: 0.7,
                    },
                    PostEffect::SpectralTilt {
                        tilt_db_per_octave: -1.5,
                    },
                    PostEffect::JitterShimmer {
                        jitter: 0.6,
                        shimmer: 0.05,
                    },
                    PostEffect::Gain { db: -1.0 },
                ],
            },
            Self::Bear => default_world_params(
                -7.0,
                1.4,
                0.35,
                vec![
                    PostEffect::Distortion {
                        drive: 6.0,
                        mix: 0.5,
                    },
                    PostEffect::Lowpass {
                        cutoff_hz: 2500.0,
                        q: 0.7,
                    },
                    PostEffect::ResonantBandpass {
                        center_hz: 350.0,
                        q: 2.0,
                        gain_db: 7.0,
                    },
                    PostEffect::Subharmonics { amount: 0.1 },
                    PostEffect::NoiseInjection {
                        amount: 0.12,
                        color: NoiseColor::Pink,
                    },
                    PostEffect::Tremolo {
                        rate_hz: 3.0,
                        depth: 0.2,
                    },
                    PostEffect::Gain { db: -2.0 },
                ],
            ),
            Self::Mouse => {
                let mut p = default_world_params(
                    16.0,
                    0.35,
                    0.0,
                    vec![
                        PostEffect::Highpass {
                            cutoff_hz: 1500.0,
                            q: 0.7,
                        },
                        PostEffect::ResonantBandpass {
                            center_hz: 5000.0,
                            q: 2.0,
                            gain_db: 8.0,
                        },
                        PostEffect::SpectralTilt {
                            tilt_db_per_octave: 2.0,
                        },
                        PostEffect::JitterShimmer {
                            jitter: 1.5,
                            shimmer: 0.1,
                        },
                        PostEffect::Tremolo {
                            rate_hz: 25.0,
                            depth: 0.3,
                        },
                        PostEffect::Vibrato {
                            rate_hz: 12.0,
                            depth_samples: 15.0,
                        },
                        PostEffect::Gain { db: 3.0 },
                    ],
                );
                p.f0_jitter = 0.5;
                p.spectral_tilt = 3.0; // very bright
                p
            }
            Self::Elephant => {
                let mut p = default_world_params(
                    -12.0,
                    1.8,
                    0.15,
                    vec![
                        PostEffect::RingMod {
                            freq_hz: 150.0,
                            mix: 0.3,
                        },
                        PostEffect::ResonantBandpass {
                            center_hz: 400.0,
                            q: 3.0,
                            gain_db: 9.0,
                        },
                        PostEffect::ResonantBandpass {
                            center_hz: 1200.0,
                            q: 2.0,
                            gain_db: 5.0,
                        },
                        PostEffect::Subharmonics { amount: 0.2 },
                        PostEffect::Distortion {
                            drive: 2.5,
                            mix: 0.2,
                        },
                        PostEffect::Lowpass {
                            cutoff_hz: 4000.0,
                            q: 0.7,
                        },
                        PostEffect::Vibrato {
                            rate_hz: 3.0,
                            depth_samples: 20.0,
                        },
                        PostEffect::Gain { db: -1.0 },
                    ],
                );
                p.spectral_tilt = -2.0;
                p
            }
            Self::Frog => {
                let mut p = default_world_params(
                    -3.0,
                    1.3,
                    0.1,
                    vec![
                        PostEffect::RingMod {
                            freq_hz: 80.0,
                            mix: 0.4,
                        },
                        PostEffect::ResonantBandpass {
                            center_hz: 500.0,
                            q: 4.0,
                            gain_db: 12.0,
                        },
                        PostEffect::ResonantBandpass {
                            center_hz: 1800.0,
                            q: 3.0,
                            gain_db: 6.0,
                        },
                        PostEffect::Tremolo {
                            rate_hz: 8.0,
                            depth: 0.5,
                        },
                        PostEffect::Lowpass {
                            cutoff_hz: 3500.0,
                            q: 0.7,
                        },
                        PostEffect::Gain { db: -1.0 },
                    ],
                );
                p.f0_jitter = 0.4;
                p
            }
            Self::Bird => {
                let mut p = default_world_params(
                    18.0,
                    0.3,
                    0.0,
                    vec![
                        PostEffect::Highpass {
                            cutoff_hz: 2000.0,
                            q: 0.7,
                        },
                        PostEffect::Vibrato {
                            rate_hz: 20.0,
                            depth_samples: 25.0,
                        },
                        PostEffect::ResonantBandpass {
                            center_hz: 4500.0,
                            q: 3.0,
                            gain_db: 10.0,
                        },
                        PostEffect::ResonantBandpass {
                            center_hz: 7000.0,
                            q: 2.5,
                            gain_db: 6.0,
                        },
                        PostEffect::SpectralTilt {
                            tilt_db_per_octave: 3.0,
                        },
                        PostEffect::Tremolo {
                            rate_hz: 30.0,
                            depth: 0.35,
                        },
                        PostEffect::JitterShimmer {
                            jitter: 2.0,
                            shimmer: 0.12,
                        },
                        PostEffect::Gain { db: 2.0 },
                    ],
                );
                p.f0_jitter = 0.8;
                p.spectral_tilt = 4.0;
                // Fast pitch chirps
                p.f0_contour = Some(vec![
                    (0.0, 0.0),
                    (0.1, 4.0),
                    (0.2, -2.0),
                    (0.3, 5.0),
                    (0.4, -1.0),
                    (0.5, 3.0),
                    (0.6, -3.0),
                    (0.7, 4.0),
                    (0.8, 0.0),
                    (0.9, 3.0),
                    (1.0, -1.0),
                ]);
                p
            }
            Self::Dog => default_world_params(
                -2.0,
                1.15,
                0.15,
                vec![
                    PostEffect::Distortion {
                        drive: 3.5,
                        mix: 0.3,
                    },
                    PostEffect::ResonantBandpass {
                        center_hz: 500.0,
                        q: 2.0,
                        gain_db: 7.0,
                    },
                    PostEffect::ResonantBandpass {
                        center_hz: 2000.0,
                        q: 2.5,
                        gain_db: 5.0,
                    },
                    PostEffect::Tremolo {
                        rate_hz: 6.0,
                        depth: 0.25,
                    },
                    PostEffect::JitterShimmer {
                        jitter: 0.5,
                        shimmer: 0.04,
                    },
                    PostEffect::Gain { db: -1.0 },
                ],
            ),
            Self::Pig => {
                let mut p = default_world_params(
                    3.0,
                    0.75,
                    0.2,
                    vec![
                        PostEffect::ResonantBandpass {
                            center_hz: 800.0,
                            q: 5.0,
                            gain_db: 14.0,
                        },
                        PostEffect::ResonantBandpass {
                            center_hz: 2500.0,
                            q: 3.0,
                            gain_db: 6.0,
                        },
                        PostEffect::SpectralTilt {
                            tilt_db_per_octave: -2.0,
                        },
                        PostEffect::Distortion {
                            drive: 2.0,
                            mix: 0.2,
                        },
                        PostEffect::NoiseInjection {
                            amount: 0.06,
                            color: NoiseColor::Pink,
                        },
                        PostEffect::Vibrato {
                            rate_hz: 8.0,
                            depth_samples: 12.0,
                        },
                        PostEffect::Gain { db: -1.0 },
                    ],
                );
                p.spectral_tilt = -3.0; // very nasal
                p
            }
            Self::Lion => {
                let mut p = default_world_params(
                    -8.0,
                    1.5,
                    0.25,
                    vec![
                        PostEffect::Distortion {
                            drive: 8.0,
                            mix: 0.5,
                        },
                        PostEffect::Lowpass {
                            cutoff_hz: 3500.0,
                            q: 0.7,
                        },
                        PostEffect::ResonantBandpass {
                            center_hz: 200.0,
                            q: 1.5,
                            gain_db: 10.0,
                        },
                        PostEffect::ResonantBandpass {
                            center_hz: 700.0,
                            q: 2.0,
                            gain_db: 6.0,
                        },
                        PostEffect::Subharmonics { amount: 0.2 },
                        PostEffect::NoiseInjection {
                            amount: 0.1,
                            color: NoiseColor::Pink,
                        },
                        PostEffect::Tremolo {
                            rate_hz: 2.5,
                            depth: 0.2,
                        },
                        PostEffect::Gain { db: -2.0 },
                    ],
                );
                p.spectral_tilt = -1.5;
                p
            }
            Self::Dolphin => {
                let mut p = default_world_params(
                    20.0,
                    0.3,
                    0.0,
                    vec![
                        PostEffect::Highpass {
                            cutoff_hz: 2500.0,
                            q: 0.7,
                        },
                        PostEffect::RingMod {
                            freq_hz: 600.0,
                            mix: 0.35,
                        },
                        PostEffect::ResonantBandpass {
                            center_hz: 6000.0,
                            q: 4.0,
                            gain_db: 12.0,
                        },
                        PostEffect::SpectralTilt {
                            tilt_db_per_octave: 3.0,
                        },
                        PostEffect::Vibrato {
                            rate_hz: 15.0,
                            depth_samples: 20.0,
                        },
                        PostEffect::JitterShimmer {
                            jitter: 1.0,
                            shimmer: 0.08,
                        },
                        PostEffect::Gain { db: 2.0 },
                    ],
                );
                p.spectral_tilt = 4.0;
                p.f0_contour = Some(vec![
                    (0.0, 0.0),
                    (0.2, 6.0),
                    (0.4, -3.0),
                    (0.6, 8.0),
                    (0.8, -2.0),
                    (1.0, 4.0),
                ]);
                p
            }
        }
    }

    pub fn label(self) -> &'static str {
        match self {
            Self::Gorilla => "gorilla",
            Self::Cat => "cat",
            Self::Bear => "bear",
            Self::Mouse => "mouse",
            Self::Elephant => "elephant",
            Self::Frog => "frog",
            Self::Bird => "bird",
            Self::Dog => "dog",
            Self::Pig => "pig",
            Self::Lion => "lion",
            Self::Dolphin => "dolphin",
        }
    }
}
