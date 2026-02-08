use anyhow::{anyhow, Context, Result};
use serde::Deserialize;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

use crate::services::diarization::SpeakerSegment;

#[derive(Debug, Deserialize)]
struct PyannoteSegment {
    start: f32,
    end: f32,
    speaker: String,
}

pub fn diarize(
    audio_path: &Path,
    script_path: &Path,
    log: &impl Fn(&str),
) -> Result<Vec<SpeakerSegment>> {
    let token = std::env::var("HF_TOKEN")
        .or_else(|_| std::env::var("HUGGINGFACE_TOKEN"))
        .or_else(|_| std::env::var("PYANNOTE_AUTH_TOKEN"))
        .map_err(|_| {
            anyhow!("Missing HF token. Set HF_TOKEN (or HUGGINGFACE_TOKEN/PYANNOTE_AUTH_TOKEN).")
        })?;

    let python = resolve_python()?;
    let output = Command::new(&python)
        .arg(script_path)
        .arg("--audio")
        .arg(audio_path)
        .arg("--token")
        .arg(token)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .with_context(|| "Failed to run pyannote diarization script")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(anyhow!("pyannote diarization failed: {}", stderr.trim()));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let segments: Vec<PyannoteSegment> = serde_json::from_str(stdout.trim())
        .with_context(|| "Failed to parse pyannote diarization output")?;
    if segments.is_empty() {
        log("pyannote diarization returned no segments");
        return Ok(Vec::new());
    }

    let mut map = HashMap::new();
    let mut next_id = 0usize;
    let mut speaker_segments = Vec::with_capacity(segments.len());
    for segment in segments {
        let speaker = *map.entry(segment.speaker).or_insert_with(|| {
            let current = next_id;
            next_id += 1;
            current
        });
        speaker_segments.push(SpeakerSegment {
            start: segment.start,
            end: segment.end,
            speaker,
        });
    }

    Ok(speaker_segments)
}

fn resolve_python() -> Result<PathBuf> {
    for candidate in ["python3", "python"].iter() {
        let output = Command::new(candidate)
            .arg("-c")
            .arg("import sys; print(sys.executable)")
            .output();
        if let Ok(output) = output {
            if output.status.success() {
                let exe = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !exe.is_empty() {
                    return Ok(PathBuf::from(exe));
                }
            }
        }
    }
    Err(anyhow!("Python interpreter not found"))
}
