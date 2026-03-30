use std::path::PathBuf;

use animal_voice_changer::{process, read_wav, write_wav, AnimalPreset};
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

    /// Pitch shift in semitones (overrides preset)
    #[arg(short, long, allow_hyphen_values = true)]
    semitones: Option<f32>,
}

fn main() {
    let cli = Cli::parse();

    let semitones = match (cli.semitones, cli.preset) {
        (Some(s), _) => s,
        (None, Some(p)) => {
            eprintln!("Using preset: {}", p.label());
            p.semitones()
        }
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

    eprintln!("Shifting pitch by {semitones:+.1} semitones...");
    let shifted = process(&audio.samples, audio.sample_rate, semitones);

    eprintln!("Writing: {}", cli.output.display());
    if let Err(e) = write_wav(&cli.output, &shifted, audio.sample_rate) {
        eprintln!("Error: {e}");
        std::process::exit(1);
    }

    eprintln!("Done!");
}
