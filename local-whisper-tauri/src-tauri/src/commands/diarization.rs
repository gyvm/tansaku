use anyhow::{anyhow, Context, Result};
use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::io::BufRead;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, Manager};

use crate::services::dependencies;

#[derive(Serialize, Deserialize)]
pub struct DiarizationSegment {
    pub speaker: String,
    pub start: f32,
    pub end: f32,
}

#[derive(Serialize)]
pub struct DiarizationResult {
    pub segments: Vec<DiarizationSegment>,
}

#[derive(Clone, Serialize)]
struct LogEvent {
    message: String,
}

#[tauri::command]
pub async fn diarize_file(
    app: AppHandle,
    input_path: String,
    num_speakers: Option<u32>,
) -> Result<DiarizationResult, String> {
    let handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let input = PathBuf::from(&input_path)
            .canonicalize()
            .with_context(|| format!("Input not found: {}", input_path))?;
        let data_dir = app_data_dir(&handle)?;

        let ffmpeg = dependencies::ensure_ffmpeg(&data_dir, &|message| {
            emit_log(&handle, message)
        })?;

        let timestamp = now_millis();
        let wav_path = data_dir.join(format!("diarize-input-{}.wav", timestamp));
        let output_path = data_dir.join(format!("diarize-output-{}.json", timestamp));

        emit_log(&handle, "Preparing audio");
        extract_wav(&ffmpeg, &input, &wav_path)?;

        let script_path = resolve_diarize_script(&handle)?;
        emit_log(&handle, format!("Using diarize script: {}", script_path.display()));
        let python = env::var("LOCAL_WHISPER_PYTHON").unwrap_or_else(|_| "python3".to_string());
        emit_log(&handle, format!("Using python: {}", python));
        let token = load_token().ok_or_else(|| anyhow!("PYANNOTE_AUTH_TOKEN is not set"))?;

        emit_log(&handle, "Starting diarization");
        let mut command = Command::new(&python);
        command
            .arg(script_path)
            .arg("--audio")
            .arg(&wav_path)
            .arg("--out")
            .arg(&output_path)
            .env("PYANNOTE_AUTH_TOKEN", token)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        if let Some(speakers) = num_speakers {
            command.arg("--num-speakers").arg(speakers.to_string());
        }

        let mut child = command
            .spawn()
            .with_context(|| "Failed to start diarization process")?;

        if let Some(stdout) = child.stdout.take() {
            let log_handle = handle.clone();
            stream_output(stdout, move |line| emit_log(&log_handle, line));
        }
        let stderr_output = child
            .wait_with_output()
            .with_context(|| "Failed to wait for diarization process")?;
        if !stderr_output.status.success() {
            let stderr_text = String::from_utf8_lossy(&stderr_output.stderr);
            return Err(anyhow!("Diarization failed: {}", stderr_text.trim()));
        }

        let contents = fs::read_to_string(&output_path)
            .with_context(|| "Failed to read diarization output")?;
        let segments: Vec<DiarizationSegment> = serde_json::from_str(&contents)
            .with_context(|| "Failed to parse diarization output")?;

        let _ = fs::remove_file(&wav_path);
        let _ = fs::remove_file(&output_path);

        Ok(DiarizationResult { segments })
    })
    .await
    .map_err(|error: tauri::Error| error.to_string())?
    .map_err(|error: anyhow::Error| error.to_string())
}

fn emit_log(app: &AppHandle, message: impl Into<String>) {
    let _ = app.emit(
        "diarization:log",
        LogEvent {
            message: message.into(),
        },
    );
}

fn app_data_dir(app: &AppHandle) -> Result<PathBuf> {
    app.path()
        .app_data_dir()
        .map_err(|error| anyhow!("Failed to resolve app data dir: {error}"))
}

fn now_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
}

fn extract_wav(ffmpeg_path: &Path, input: &Path, output: &Path) -> Result<()> {
    let output_status = Command::new(ffmpeg_path)
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
        .output()
        .with_context(|| "Failed to run ffmpeg")?;

    if !output_status.status.success() {
        let stderr_text = String::from_utf8_lossy(&output_status.stderr);
        return Err(anyhow!("ffmpeg failed: {}", stderr_text.trim()));
    }
    Ok(())
}

fn stream_output<R, F>(reader: R, log: F)
where
    R: std::io::Read + Send + 'static,
    F: Fn(&str) + Send + Sync + 'static,
{
    std::thread::spawn(move || {
        let mut buffer = String::new();
        let mut reader = std::io::BufReader::new(reader);
        loop {
            buffer.clear();
            let read = reader.read_line(&mut buffer);
            match read {
                Ok(0) | Err(_) => break,
                Ok(_) => {
                    let line = buffer.trim();
                    if !line.is_empty() {
                        log(line);
                    }
                }
            }
        }
    });
}

fn resolve_diarize_script(app: &AppHandle) -> Result<PathBuf> {
    let current = env::current_dir().with_context(|| "Failed to get current dir")?;
    if let Some(candidate) = search_upwards(&current, Path::new("sidecar/diarize.py")) {
        return Ok(candidate);
    }

    if let Ok(resource_dir) = app.path().resource_dir() {
        let candidate = resource_dir.join("sidecar").join("diarize.py");
        if candidate.exists() {
            return Ok(candidate);
        }
    }

    Err(anyhow!("diarize.py not found; ensure sidecar/diarize.py exists"))
}

fn load_token() -> Option<String> {
    if let Ok(value) = env::var("PYANNOTE_AUTH_TOKEN") {
        if !value.trim().is_empty() {
            return Some(value);
        }
    }

    let current = env::current_dir().ok()?;
    if let Some(candidate) = search_upwards(&current, Path::new(".env")) {
        if let Ok(contents) = fs::read_to_string(&candidate) {
            if let Some(token) = parse_env_value(&contents, "PYANNOTE_AUTH_TOKEN") {
                return Some(token);
            }
        }
    }
    None
}

fn search_upwards(start: &Path, relative: &Path) -> Option<PathBuf> {
    let mut current = Some(start);
    while let Some(path) = current {
        let candidate = path.join(relative);
        if candidate.exists() {
            return Some(candidate);
        }
        current = path.parent();
    }
    None
}

fn parse_env_value(contents: &str, key: &str) -> Option<String> {
    for line in contents.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let mut parts = line.splitn(2, '=');
        let name = parts.next()?.trim();
        let value = parts.next()?.trim();
        if name == key {
            return Some(value.trim_matches('"').to_string());
        }
    }
    None
}
