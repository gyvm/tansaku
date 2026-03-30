pub mod effects;
pub mod preset;

use std::path::Path;

pub use preset::AnimalPreset;

pub struct AudioData {
    pub samples: Vec<f32>,
    pub sample_rate: u32,
    pub channels: u16,
    pub bits_per_sample: u16,
}

/// Read a WAV file and return mono f32 samples.
/// Stereo files are downmixed to mono.
pub fn read_wav(path: &Path) -> Result<AudioData, String> {
    let reader = hound::WavReader::open(path).map_err(|e| format!("Failed to open WAV: {e}"))?;
    let spec = reader.spec();
    let channels = spec.channels;
    let sample_rate = spec.sample_rate;
    let bits_per_sample = spec.bits_per_sample;

    let raw_samples: Vec<f32> = match spec.sample_format {
        hound::SampleFormat::Float => reader
            .into_samples::<f32>()
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("Failed to read samples: {e}"))?,
        hound::SampleFormat::Int => {
            let max_val = (1 << (bits_per_sample - 1)) as f32;
            reader
                .into_samples::<i32>()
                .collect::<Result<Vec<_>, _>>()
                .map_err(|e| format!("Failed to read samples: {e}"))?
                .into_iter()
                .map(|s| s as f32 / max_val)
                .collect()
        }
    };

    // Downmix to mono if stereo
    let mono = if channels > 1 {
        raw_samples
            .chunks(channels as usize)
            .map(|chunk| chunk.iter().sum::<f32>() / channels as f32)
            .collect()
    } else {
        raw_samples
    };

    Ok(AudioData {
        samples: mono,
        sample_rate,
        channels,
        bits_per_sample,
    })
}

/// Write mono f32 samples to a WAV file (16-bit PCM).
pub fn write_wav(path: &Path, samples: &[f32], sample_rate: u32) -> Result<(), String> {
    let spec = hound::WavSpec {
        channels: 1,
        sample_rate,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };
    let mut writer =
        hound::WavWriter::create(path, spec).map_err(|e| format!("Failed to create WAV: {e}"))?;
    for &s in samples {
        let clamped = s.clamp(-1.0, 1.0);
        let val = (clamped * i16::MAX as f32) as i16;
        writer
            .write_sample(val)
            .map_err(|e| format!("Failed to write sample: {e}"))?;
    }
    writer
        .finalize()
        .map_err(|e| format!("Failed to finalize WAV: {e}"))?;
    Ok(())
}

/// Apply pitch shift and return processed samples.
pub fn process(samples: &[f32], sample_rate: u32, semitones: f32) -> Vec<f32> {
    effects::pitch_shift::shift(samples, sample_rate, semitones)
}
