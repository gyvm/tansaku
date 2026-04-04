use crate::buffer::AudioBuffer;
use std::fs::File;
use std::io::{self, Read, Write};

/// Read a WAV file into an AudioBuffer (mono, f32 normalized).
/// Supports 16-bit PCM and 32-bit float WAV files.
pub fn read_wav(path: &str) -> io::Result<AudioBuffer> {
    let mut file = File::open(path)?;
    let mut data = Vec::new();
    file.read_to_end(&mut data)?;

    if data.len() < 44 {
        return Err(io::Error::new(io::ErrorKind::InvalidData, "File too small for WAV"));
    }

    // Validate RIFF header
    if &data[0..4] != b"RIFF" || &data[8..12] != b"WAVE" {
        return Err(io::Error::new(io::ErrorKind::InvalidData, "Not a WAV file"));
    }

    // Parse fmt chunk — find it by scanning (handles extra chunks before data)
    let (audio_format, channels, sample_rate, bits_per_sample, data_start, data_size) =
        parse_wav_chunks(&data)?;

    let samples = decode_samples(
        &data[data_start..data_start + data_size],
        audio_format,
        bits_per_sample,
    )?;

    Ok(AudioBuffer::from_stereo(&samples, channels, sample_rate))
}

/// Write an AudioBuffer to a 16-bit PCM WAV file.
pub fn write_wav(path: &str, buffer: &AudioBuffer) -> io::Result<()> {
    let num_samples = buffer.samples.len();
    let data_size = (num_samples * 2) as u32;
    let file_size = data_size + 36;

    let mut out = Vec::with_capacity(44 + num_samples * 2);

    // RIFF header
    out.extend_from_slice(b"RIFF");
    out.extend_from_slice(&file_size.to_le_bytes());
    out.extend_from_slice(b"WAVE");

    // fmt chunk
    out.extend_from_slice(b"fmt ");
    out.extend_from_slice(&16u32.to_le_bytes()); // chunk size
    out.extend_from_slice(&1u16.to_le_bytes()); // PCM format
    out.extend_from_slice(&1u16.to_le_bytes()); // mono
    out.extend_from_slice(&buffer.sample_rate.to_le_bytes());
    out.extend_from_slice(&(buffer.sample_rate * 2).to_le_bytes()); // byte rate
    out.extend_from_slice(&2u16.to_le_bytes()); // block align
    out.extend_from_slice(&16u16.to_le_bytes()); // bits per sample

    // data chunk
    out.extend_from_slice(b"data");
    out.extend_from_slice(&data_size.to_le_bytes());

    for &s in &buffer.samples {
        let clamped = s.clamp(-1.0, 1.0);
        let i16_val = (clamped * 32767.0) as i16;
        out.extend_from_slice(&i16_val.to_le_bytes());
    }

    let mut file = File::create(path)?;
    file.write_all(&out)?;
    Ok(())
}

fn parse_wav_chunks(data: &[u8]) -> io::Result<(u16, u16, u32, u16, usize, usize)> {
    let mut pos = 12; // skip RIFF header
    let mut audio_format = 0u16;
    let mut channels = 0u16;
    let mut sample_rate = 0u32;
    let mut bits_per_sample = 0u16;
    let mut data_start = 0usize;
    let mut data_size = 0usize;

    while pos + 8 <= data.len() {
        let chunk_id = &data[pos..pos + 4];
        let chunk_size = u32::from_le_bytes([data[pos + 4], data[pos + 5], data[pos + 6], data[pos + 7]]) as usize;

        if chunk_id == b"fmt " {
            if chunk_size < 16 || pos + 8 + chunk_size > data.len() {
                return Err(io::Error::new(io::ErrorKind::InvalidData, "Invalid fmt chunk"));
            }
            let fmt = &data[pos + 8..];
            audio_format = u16::from_le_bytes([fmt[0], fmt[1]]);
            channels = u16::from_le_bytes([fmt[2], fmt[3]]);
            sample_rate = u32::from_le_bytes([fmt[4], fmt[5], fmt[6], fmt[7]]);
            bits_per_sample = u16::from_le_bytes([fmt[14], fmt[15]]);
        } else if chunk_id == b"data" {
            data_start = pos + 8;
            data_size = chunk_size.min(data.len() - data_start);
            break;
        }

        pos += 8 + chunk_size;
        // Chunks are word-aligned
        if chunk_size % 2 != 0 {
            pos += 1;
        }
    }

    if data_start == 0 {
        return Err(io::Error::new(io::ErrorKind::InvalidData, "No data chunk found"));
    }

    Ok((audio_format, channels, sample_rate, bits_per_sample, data_start, data_size))
}

fn decode_samples(raw: &[u8], audio_format: u16, bits_per_sample: u16) -> io::Result<Vec<f32>> {
    match (audio_format, bits_per_sample) {
        (1, 16) => {
            // PCM 16-bit
            Ok(raw
                .chunks_exact(2)
                .map(|b| i16::from_le_bytes([b[0], b[1]]) as f32 / 32768.0)
                .collect())
        }
        (3, 32) => {
            // IEEE Float 32-bit
            Ok(raw
                .chunks_exact(4)
                .map(|b| f32::from_le_bytes([b[0], b[1], b[2], b[3]]))
                .collect())
        }
        _ => Err(io::Error::new(
            io::ErrorKind::Unsupported,
            format!("Unsupported WAV format: format={audio_format}, bits={bits_per_sample}"),
        )),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_wav_roundtrip() {
        let samples: Vec<f32> = (0..480)
            .map(|i| (i as f32 / 480.0 * std::f32::consts::TAU).sin() * 0.5)
            .collect();
        let buffer = AudioBuffer::new(samples.clone(), 48000);

        let path = "/tmp/vozoo_test_roundtrip.wav";
        write_wav(path, &buffer).unwrap();
        let loaded = read_wav(path).unwrap();
        fs::remove_file(path).ok();

        assert_eq!(loaded.sample_rate, 48000);
        assert_eq!(loaded.samples.len(), 480);

        // 16-bit quantization loses some precision
        for (a, b) in samples.iter().zip(loaded.samples.iter()) {
            assert!((a - b).abs() < 0.001, "sample mismatch: {a} vs {b}");
        }
    }
}
