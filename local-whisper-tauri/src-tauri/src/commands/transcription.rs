use anyhow::{anyhow, Context, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager};
use time::OffsetDateTime;

use crate::services::{dependencies, diarization, pyannote, transcriber};

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

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranscriptionOptions {
    pub diarization: Option<DiarizationOptions>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiarizationOptions {
    pub enabled: bool,
    pub speaker_count: Option<u32>,
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
pub async fn transcribe_file(
    app: AppHandle,
    input_path: String,
    options: Option<TranscriptionOptions>,
) -> Result<TranscriptionResult, String> {
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
        let mut segments = transcriber::transcribe(
            &deps.model,
            &samples,
            None,
            threads,
            &|message| emit_log(&handle, message),
        )?;

        let diarization_options = options
            .and_then(|options| options.diarization)
            .unwrap_or(DiarizationOptions {
                enabled: false,
                speaker_count: None,
            });
        if diarization_options.enabled {
            emit_log(&handle, "Preparing speaker separation");
            let diarization_paths = dependencies::ensure_diarization_models(&data_dir, &|message| {
                emit_log(&handle, message)
            })?;
            let script_path = ensure_pyannote_script(&data_dir)?;
            let wav_path = export_diarization_wav(&deps.ffmpeg, &input, &data_dir, &|message| {
                emit_log(&handle, message)
            })?;
            emit_log(&handle, "Running pyannote diarization");
            let speaker_segments = match pyannote::diarize(&wav_path, &script_path, &|message| {
                emit_log(&handle, message)
            }) {
                Ok(segments) => segments,
                Err(error) => {
                    emit_log(&handle, "pyannote diarization failed, falling back to local diarization");
                    let diarization_config = diarization::DiarizationConfig {
                        speaker_count: diarization_options.speaker_count.map(|count| count as usize),
                    };
                    diarization::diarize(
                        &samples,
                        &diarization_paths,
                        &diarization_config,
                        &|message| emit_log(&handle, message),
                    )
                    .with_context(|| format!("pyannote error: {error}"))?
                }
            };
            let _ = fs::remove_file(&wav_path);
            apply_speaker_labels(&mut segments, &speaker_segments);
        }

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

fn apply_speaker_labels(
    segments: &mut [transcriber::Segment],
    speaker_segments: &[diarization::SpeakerSegment],
) {
    for segment in segments {
        let mut best_overlap = 0.0_f32;
        let mut best_speaker = None;
        for speaker_segment in speaker_segments {
            let overlap_start = segment.start.max(speaker_segment.start);
            let overlap_end = segment.end.min(speaker_segment.end);
            let overlap = (overlap_end - overlap_start).max(0.0);
            if overlap > best_overlap {
                best_overlap = overlap;
                best_speaker = Some(speaker_segment.speaker);
            }
        }
        segment.speaker = best_speaker.map(|speaker| format!("Speaker {}", speaker + 1));
    }
}

fn emit_log(app: &AppHandle, message: impl Into<String>) {
    let message = message.into();
    let _ = app.emit(
        "transcription:log",
        LogEvent {
            message: message.clone(),
        },
    );
    let _ = append_log_to_file(app, &message);
}

fn export_diarization_wav(
    ffmpeg_path: &PathBuf,
    input: &PathBuf,
    data_dir: &PathBuf,
    log: &impl Fn(&str),
) -> Result<PathBuf> {
    let tmp_dir = data_dir.join("tmp");
    fs::create_dir_all(&tmp_dir)?;
    let filename = format!("diarization-{}.wav", OffsetDateTime::now_utc().unix_timestamp());
    let output = tmp_dir.join(filename);
    transcriber::export_audio_wav(ffmpeg_path, input, &output, log)?;
    Ok(output)
}

fn ensure_pyannote_script(data_dir: &PathBuf) -> Result<PathBuf> {
    const SCRIPT_NAME: &str = "pyannote_diarize.py";
    const SCRIPT_CONTENT: &str = include_str!("../../scripts/pyannote_diarize.py");
    let script_dir = data_dir.join("scripts");
    fs::create_dir_all(&script_dir)?;
    let script_path = script_dir.join(SCRIPT_NAME);
    if !script_path.exists() {
        let mut file = fs::OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(&script_path)?;
        file.write_all(SCRIPT_CONTENT.as_bytes())?;
    }
    Ok(script_path)
}

fn append_log_to_file(app: &AppHandle, message: &str) -> Result<()> {
    let data_dir = app_data_dir(app)?;
    let log_dir = data_dir.join("logs");
    fs::create_dir_all(&log_dir)?;
    let log_path = log_dir.join("transcription.log");
    let timestamp = OffsetDateTime::now_utc()
        .format(&time::format_description::well_known::Rfc3339)
        .unwrap_or_else(|_| "unknown-time".to_string());
    let mut file = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_path)?;
    writeln!(file, "[{timestamp}] {message}")?;
    Ok(())
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
