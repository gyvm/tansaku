use std::path::PathBuf;

use animal_voice_changer::{process_with_params, read_wav, write_wav, AnimalPreset, VoiceParams};
use clap::Parser;

#[derive(Parser)]
#[command(name = "animal-voice-changer")]
#[command(about = "Transform your voice to sound like an animal")]
struct Cli {
    /// Input WAV file
    #[arg(short, long)]
    input: PathBuf,

    /// Output WAV file
    #[arg(short, long)]
    output: PathBuf,

    /// Animal preset (gorilla, cat, bear, mouse, elephant)
    #[arg(short, long, value_enum)]
    preset: Option<AnimalPreset>,

    /// Pitch shift in semitones (used when no preset given)
    #[arg(short, long, allow_hyphen_values = true)]
    semitones: Option<f64>,

    /// Formant shift ratio (default: 1.0, <1.0 = smaller animal, >1.0 = larger)
    #[arg(short, long)]
    formant: Option<f64>,

    /// Breathiness amount (0.0-1.0)
    #[arg(short, long)]
    breathiness: Option<f64>,
}

fn main() {
    let cli = Cli::parse();

    let params = match (cli.preset, cli.semitones) {
        (Some(preset), _) => {
            let mut params = preset.voice_params();
            // Allow overriding individual parameters
            if let Some(f) = cli.formant {
                params.formant_shift_ratio = f;
            }
            if let Some(b) = cli.breathiness {
                params.breathiness = b;
            }
            if let Some(s) = cli.semitones {
                params.pitch_shift_semitones = s;
            }
            eprintln!("Using preset: {}", preset.label());
            params
        }
        (None, Some(s)) => VoiceParams::simple(
            s,
            cli.formant.unwrap_or(1.0),
            cli.breathiness.unwrap_or(0.0),
        ),
        (None, None) => {
            eprintln!("Error: specify --preset or --semitones");
            std::process::exit(1);
        }
    };

    eprintln!("Reading: {}", cli.input.display());
    let audio = match read_wav(&cli.input) {
        Ok(a) => a,
        Err(e) => {
            eprintln!("Error: {e}");
            std::process::exit(1);
        }
    };
    eprintln!(
        "  {} samples, {}Hz, {} ch, {}bit",
        audio.samples.len(),
        audio.sample_rate,
        audio.channels,
        audio.bits_per_sample
    );

    let shifted = process_with_params(&audio.samples, audio.sample_rate, &params);

    eprintln!("Writing: {}", cli.output.display());
    if let Err(e) = write_wav(&cli.output, &shifted, audio.sample_rate) {
        eprintln!("Error: {e}");
        std::process::exit(1);
    }

    eprintln!("Done!");
}
