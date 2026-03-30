use clap::ValueEnum;

#[derive(Debug, Clone, Copy, ValueEnum)]
pub enum AnimalPreset {
    Gorilla,
    Cat,
    Bear,
    Mouse,
    Elephant,
}

impl AnimalPreset {
    pub fn semitones(self) -> f32 {
        match self {
            Self::Gorilla => -8.0,
            Self::Cat => 6.0,
            Self::Bear => -5.0,
            Self::Mouse => 12.0,
            Self::Elephant => -10.0,
        }
    }

    pub fn label(self) -> &'static str {
        match self {
            Self::Gorilla => "gorilla (-8 semitones)",
            Self::Cat => "cat (+6 semitones)",
            Self::Bear => "bear (-5 semitones)",
            Self::Mouse => "mouse (+12 semitones)",
            Self::Elephant => "elephant (-10 semitones)",
        }
    }
}
