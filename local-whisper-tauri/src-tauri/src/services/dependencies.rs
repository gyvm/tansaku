use anyhow::{anyhow, Result};
use reqwest::blocking::Client;
use std::env;
use std::fs;
use std::io::{self, Write as IoWrite};
use std::path::{Path, PathBuf};
use tar::Archive;
use xz2::read::XzDecoder;
use zip::ZipArchive;

pub const DEFAULT_MODEL: &str = "base";
const MODEL_URL_BASE: &str = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main";
const VAD_MODEL_URL: &str =
    "https://raw.githubusercontent.com/ricky0123/vad/master/silero_vad_legacy.onnx";
const SPEAKER_EMBEDDING_MODEL_URL: &str = "https://huggingface.co/csukuangfj/speaker-embedding-models/resolve/main/wespeaker_zh_cnceleb_resnet34_LM.onnx";

pub struct DependencyPaths {
    pub ffmpeg: PathBuf,
    pub model: PathBuf,
}

pub struct DiarizationPaths {
    pub vad: PathBuf,
    pub embedding: PathBuf,
}

pub fn ensure_dependencies(
    data_dir: &Path,
    model: &str,
    log: &impl Fn(&str),
) -> Result<DependencyPaths> {
    let ffmpeg = ensure_ffmpeg(data_dir, log)?;
    let model = ensure_model(model, data_dir, log)?;
    Ok(DependencyPaths { ffmpeg, model })
}

pub fn ensure_diarization_models(data_dir: &Path, log: &impl Fn(&str)) -> Result<DiarizationPaths> {
    let models_dir = data_dir.join("models").join("diarization");
    fs::create_dir_all(&models_dir)?;

    let vad = models_dir.join("silero_vad_legacy.onnx");
    if !vad.exists() {
        log("Downloading VAD model");
        download_file(VAD_MODEL_URL, &vad)?;
        log("VAD model installed");
    } else {
        log("VAD model ready");
    }

    let embedding = models_dir.join("wespeaker_zh_cnceleb_resnet34_LM.onnx");
    if !embedding.exists() {
        log("Downloading speaker embedding model");
        download_file(SPEAKER_EMBEDDING_MODEL_URL, &embedding)?;
        log("Speaker embedding model installed");
    } else {
        log("Speaker embedding model ready");
    }

    Ok(DiarizationPaths { vad, embedding })
}

pub fn ensure_ffmpeg(data_dir: &Path, log: &impl Fn(&str)) -> Result<PathBuf> {
    let bin_dir = data_dir.join("bin");
    let exe_name = if cfg!(windows) {
        "ffmpeg.exe"
    } else {
        "ffmpeg"
    };
    let bundled = bin_dir.join(exe_name);
    if bundled.exists() {
        log("FFmpeg ready");
        return Ok(bundled);
    }

    fs::create_dir_all(&bin_dir)?;
    let url = ffmpeg_download_url()?;
    log("Downloading FFmpeg");
    let archive_path = data_dir.join("ffmpeg-download");
    download_file(&url, &archive_path)?;

    if url.ends_with(".zip") || url.contains("/zip") {
        extract_ffmpeg_from_zip(&archive_path, &bundled)?;
    } else if url.ends_with(".tar.xz") || url.contains(".tar.xz") {
        extract_ffmpeg_from_tar_xz(&archive_path, &bundled)?;
    } else {
        return Err(anyhow!("Unsupported ffmpeg archive: {}", url));
    }

    #[cfg(unix)]
    set_executable(&bundled)?;

    let _ = fs::remove_file(&archive_path);
    log("FFmpeg installed");
    Ok(bundled)
}

pub fn ensure_model(model: &str, data_dir: &Path, log: &impl Fn(&str)) -> Result<PathBuf> {
    let models_dir = data_dir.join("models");
    fs::create_dir_all(&models_dir)?;
    let filename = format!("ggml-{}.bin", model);
    let model_path = models_dir.join(&filename);
    if model_path.exists() {
        log("Whisper model ready");
        return Ok(model_path);
    }

    let url = env::var("LOCAL_WHISPER_MODEL_URL")
        .unwrap_or_else(|_| format!("{}/{}", MODEL_URL_BASE, filename));
    log("Downloading whisper model");
    download_file(&url, &model_path)?;
    log("Whisper model installed");
    Ok(model_path)
}

fn ffmpeg_download_url() -> Result<String> {
    if let Ok(url) = env::var("LOCAL_WHISPER_FFMPEG_URL") {
        return Ok(url);
    }

    let os = env::consts::OS;
    let arch = env::consts::ARCH;
    // NOTE: Linux is currently unsupported here; add a Linux FFmpeg URL or fallback
    // to avoid returning Unsupported platform and blocking transcription.
    let url = match (os, arch) {
        ("windows", "x86_64") => {
            "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-n6.1-latest-win64-gpl-6.1.zip"
        }
        ("macos", "x86_64") => "https://evermeet.cx/ffmpeg/get/zip",
        ("macos", "aarch64") => "https://evermeet.cx/ffmpeg/get/zip",
        _ => return Err(anyhow!("Unsupported platform: {}-{}", os, arch)),
    };

    Ok(url.to_string())
}

fn download_file(url: &str, destination: &Path) -> Result<()> {
    let client = Client::new();
    let mut response = client.get(url).send()?.error_for_status()?;
    let mut temp_path = destination.to_path_buf();
    temp_path.set_extension("download");

    let mut file = fs::File::create(&temp_path)?;
    io::copy(&mut response, &mut file)?;
    file.flush()?;
    fs::rename(&temp_path, destination)?;
    Ok(())
}

fn extract_ffmpeg_from_zip(archive_path: &Path, destination: &Path) -> Result<()> {
    let file = fs::File::open(archive_path)?;
    let mut archive = ZipArchive::new(file)?;
    for i in 0..archive.len() {
        let mut entry = archive.by_index(i)?;
        let name = entry.name().to_string();
        if name.ends_with("/ffmpeg")
            || name.ends_with("/ffmpeg.exe")
            || name == "ffmpeg"
            || name == "ffmpeg.exe"
        {
            let mut out = fs::File::create(destination)?;
            io::copy(&mut entry, &mut out)?;
            return Ok(());
        }
    }

    Err(anyhow!("ffmpeg binary not found in archive"))
}

fn extract_ffmpeg_from_tar_xz(archive_path: &Path, destination: &Path) -> Result<()> {
    let file = fs::File::open(archive_path)?;
    let decoder = XzDecoder::new(file);
    let mut archive = Archive::new(decoder);
    for entry in archive.entries()? {
        let mut entry = entry?;
        let path = entry.path()?;
        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
            if name == "ffmpeg" || name == "ffmpeg.exe" {
                entry.unpack(destination)?;
                return Ok(());
            }
        }
    }

    Err(anyhow!("ffmpeg binary not found in archive"))
}

#[cfg(unix)]
fn set_executable(path: &Path) -> Result<()> {
    use std::os::unix::fs::PermissionsExt;
    let mut perms = fs::metadata(path)?.permissions();
    perms.set_mode(0o755);
    fs::set_permissions(path, perms)?;
    Ok(())
}
