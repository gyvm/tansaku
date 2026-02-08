use anyhow::{anyhow, Context, Result};
use std::io::Read;
use std::path::Path;
use std::process::{Command, Stdio};
use whisper_rs::{FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters};

#[derive(Debug, Clone, serde::Serialize)]
pub struct Segment {
    pub start: f32,
    pub end: f32,
    pub text: String,
    pub speaker: Option<String>,
}

pub fn load_audio_samples(
    ffmpeg_path: &Path,
    input: &Path,
    log: &impl Fn(&str),
) -> Result<Vec<f32>> {
    log("Extracting audio with FFmpeg");
    let mut child = Command::new(ffmpeg_path)
        .arg("-hide_banner")
        .arg("-loglevel")
        .arg("error")
        .arg("-i")
        .arg(input)
        .arg("-vn")
        .arg("-f")
        .arg("s16le")
        .arg("-ac")
        .arg("1")
        .arg("-ar")
        .arg("16000")
        .arg("-")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .with_context(|| "Failed to run ffmpeg")?;

    let mut stdout = child
        .stdout
        .take()
        .ok_or_else(|| anyhow!("Failed to capture ffmpeg stdout"))?;
    let mut stderr = child
        .stderr
        .take()
        .ok_or_else(|| anyhow!("Failed to capture ffmpeg stderr"))?;

    let stderr_handle = std::thread::spawn(move || {
        let mut buffer = String::new();
        let _ = stderr.read_to_string(&mut buffer);
        buffer
    });

    let mut samples = Vec::new();
    let mut buf = [0u8; 8192];
    let mut pending: Option<u8> = None;

    loop {
        let read = stdout.read(&mut buf)?;
        if read == 0 {
            break;
        }
        let mut slice = &buf[..read];
        if let Some(byte) = pending.take() {
            if !slice.is_empty() {
                let value = i16::from_le_bytes([byte, slice[0]]);
                samples.push(value as f32 / 32768.0);
                slice = &slice[1..];
            } else {
                pending = Some(byte);
                continue;
            }
        }

        for chunk in slice.chunks_exact(2) {
            let value = i16::from_le_bytes([chunk[0], chunk[1]]);
            samples.push(value as f32 / 32768.0);
        }
        if slice.len() % 2 == 1 {
            pending = slice.last().copied();
        }
    }

    let status = child.wait()?;
    let stderr_output = stderr_handle.join().unwrap_or_default();
    if !status.success() {
        return Err(anyhow!("ffmpeg failed: {}", stderr_output.trim()));
    }

    if samples.is_empty() {
        return Err(anyhow!("No audio samples extracted. Check the input file."));
    }

    log("Audio extracted");
    Ok(samples)
}

pub fn export_audio_wav(
    ffmpeg_path: &Path,
    input: &Path,
    output: &Path,
    log: &impl Fn(&str),
) -> Result<()> {
    log("Exporting WAV for diarization");
    let status = Command::new(ffmpeg_path)
        .arg("-hide_banner")
        .arg("-loglevel")
        .arg("error")
        .arg("-y")
        .arg("-i")
        .arg(input)
        .arg("-vn")
        .arg("-ac")
        .arg("1")
        .arg("-ar")
        .arg("16000")
        .arg("-f")
        .arg("wav")
        .arg(output)
        .status()
        .with_context(|| "Failed to run ffmpeg for wav export")?;
    if !status.success() {
        return Err(anyhow!("ffmpeg wav export failed"));
    }
    Ok(())
}

pub fn transcribe(
    model_path: &Path,
    samples: &[f32],
    language: Option<&str>,
    threads: u32,
    log: &impl Fn(&str),
) -> Result<Vec<Segment>> {
    log("Loading whisper model");
    let mut ctx_params = WhisperContextParameters::default();
    ctx_params.use_gpu(false);
    let ctx = WhisperContext::new_with_params(
        model_path
            .to_str()
            .ok_or_else(|| anyhow!("Invalid model path"))?,
        ctx_params,
    )
    .with_context(|| "Failed to load model")?;
    let mut state = ctx
        .create_state()
        .with_context(|| "Failed to create whisper state")?;
    let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });

    params.set_n_threads(threads as i32);
    params.set_translate(false);
    params.set_print_progress(false);
    params.set_print_realtime(false);
    params.set_print_timestamps(false);
    if let Some(lang) = language {
        params.set_language(Some(lang));
    } else {
        params.set_language(None);
    }

    log("Running inference");
    state
        .full(params, samples)
        .with_context(|| "Whisper inference failed")?;

    let num_segments = state.full_n_segments();
    let mut segments = Vec::with_capacity(num_segments as usize);
    for i in 0..num_segments {
        let Some(segment) = state.get_segment(i) else {
            continue;
        };
        let start = segment.start_timestamp() as f32 / 100.0;
        let end = segment.end_timestamp() as f32 / 100.0;
        let text = segment.to_str()?.trim().to_string();
        if !text.is_empty() {
            segments.push(Segment {
                start,
                end,
                text,
                speaker: None,
            });
        }
    }
    log("Transcription complete");
    Ok(segments)
}
