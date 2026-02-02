use anyhow::{anyhow, Context, Result};
use serde::Serialize;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager};

use crate::services::{dependencies, transcriber};

#[derive(Serialize)]
pub struct DependencyStatus {
    pub ffmpeg_path: String,
    pub model_path: String,
}

#[derive(Serialize)]
pub struct TranscriptionResult {
    pub text: String,
    pub segments: Vec<transcriber::Segment>,
    pub model: String,
    pub language: String,
}

#[derive(Clone, Serialize)]
struct LogEvent {
    message: String,
}

#[tauri::command]
pub async fn ensure_dependencies(app: AppHandle) -> Result<DependencyStatus, String> {
    let handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let data_dir = app_data_dir(&handle)?;
        emit_log(&handle, "Checking dependencies");
        let deps = dependencies::ensure_dependencies(&data_dir, dependencies::DEFAULT_MODEL, &|message| {
            emit_log(&handle, message)
        })?;
        Ok(DependencyStatus {
            ffmpeg_path: deps.ffmpeg.display().to_string(),
            model_path: deps.model.display().to_string(),
        })
    })
    .await
    .map_err(|error: tauri::Error| error.to_string())?
    .map_err(|error: anyhow::Error| error.to_string())
}

#[tauri::command]
pub async fn transcribe_file(app: AppHandle, input_path: String) -> Result<TranscriptionResult, String> {
    let handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let input = PathBuf::from(&input_path)
            .canonicalize()
            .with_context(|| format!("Input not found: {}", input_path))?;
        let data_dir = app_data_dir(&handle)?;
        let deps = dependencies::ensure_dependencies(&data_dir, dependencies::DEFAULT_MODEL, &|message| {
            emit_log(&handle, message)
        })?;

        let samples = transcriber::load_audio_samples(&deps.ffmpeg, &input, &|message| {
            emit_log(&handle, message)
        })?;
        let threads = default_threads();
        let segments = transcriber::transcribe(
            &deps.model,
            &samples,
            None,
            threads,
            &|message| emit_log(&handle, message),
        )?;

        let text = segments
            .iter()
            .map(|segment| segment.text.as_str())
            .collect::<Vec<_>>()
            .join("\n");

        Ok(TranscriptionResult {
            text,
            segments,
            model: dependencies::DEFAULT_MODEL.to_string(),
            language: "auto".to_string(),
        })
    })
    .await
    .map_err(|error: tauri::Error| error.to_string())?
    .map_err(|error: anyhow::Error| error.to_string())
}

fn emit_log(app: &AppHandle, message: impl Into<String>) {
    let _ = app.emit(
        "transcription:log",
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

fn default_threads() -> u32 {
    let cpu_count = num_cpus::get() as u32;
    if cfg!(target_os = "macos") && cfg!(target_arch = "aarch64") {
        1
    } else {
        cpu_count.max(1)
    }
}
