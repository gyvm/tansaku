use anyhow::{anyhow, Context, Result};
use chrono::Local;
use clap::Parser;
use directories::ProjectDirs;
use reqwest::blocking::Client;
use std::env;
use std::fmt::Write;
use std::fs;
use std::io::{self, Read, Write as IoWrite};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tar::Archive;
use whisper_rs::{FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters};
use xz2::read::XzDecoder;
use zip::ZipArchive;

const DEFAULT_MODEL: &str = "base";
const MODEL_URL_BASE: &str = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main";

#[derive(Parser, Debug)]
#[command(name = "local-whisper-cli")]
#[command(about = "Local transcription with bundled FFmpeg and whisper.cpp model", long_about = None)]
struct Args {
    #[arg(help = "Input audio or video file path")]
    input: PathBuf,

    #[arg(short, long, help = "Output directory (default: current directory)")]
    output_dir: Option<PathBuf>,

    #[arg(short, long, default_value = DEFAULT_MODEL, help = "Model name (e.g., base, small, medium, large-v3)")]
    model: String,

    #[arg(
        short,
        long,
        help = "Language code (e.g., ja, en). Omit for auto-detect"
    )]
    language: Option<String>,

    #[arg(long, help = "Path to ffmpeg binary (overrides auto-download)")]
    ffmpeg_path: Option<PathBuf>,

    #[arg(long, help = "Number of threads for inference (default: CPU count)")]
    threads: Option<u32>,
}

fn main() -> Result<()> {
    let args = Args::parse();
    let input = args
        .input
        .canonicalize()
        .with_context(|| format!("Input not found: {}", args.input.display()))?;

    let project_dirs = ProjectDirs::from("com", "local", "local-whisper-cli")
        .ok_or_else(|| anyhow!("Failed to determine application data directory"))?;

    let ffmpeg_path = ensure_ffmpeg(&args.ffmpeg_path, project_dirs.data_dir())?;
    let model_path = ensure_model(&args.model, project_dirs.data_dir())?;

    let samples = load_audio_samples(&ffmpeg_path, &input)?;
    if samples.is_empty() {
        return Err(anyhow!(
            "No audio samples extracted. Check input and ffmpeg."
        ));
    }
    let threads = args.threads.unwrap_or_else(default_threads);
    let segments = transcribe(&model_path, &samples, args.language.as_deref(), threads)?;

    let output_dir = args
        .output_dir
        .unwrap_or_else(|| env::current_dir().unwrap());
    fs::create_dir_all(&output_dir)?;

    let timestamp = Local::now().format("%Y%m%d-%H%M%S");
    let output_path = output_dir.join(format!("{}.md", timestamp));
    let markdown = render_markdown(&input, &args.model, args.language.as_deref(), &segments);
    fs::write(&output_path, markdown.as_bytes())?;

    println!("Transcript saved: {}", output_path.display());
    Ok(())
}

fn ensure_ffmpeg(explicit_path: &Option<PathBuf>, data_dir: &Path) -> Result<PathBuf> {
    if let Some(path) = explicit_path {
        if path.exists() {
            return Ok(path.clone());
        }
        return Err(anyhow!("ffmpeg not found at {}", path.display()));
    }

    let bin_dir = data_dir.join("bin");
    let exe_name = if cfg!(windows) {
        "ffmpeg.exe"
    } else {
        "ffmpeg"
    };
    let bundled = bin_dir.join(exe_name);
    if bundled.exists() {
        return Ok(bundled);
    }

    if let Ok(path) = which::which(exe_name) {
        return Ok(path);
    }

    fs::create_dir_all(&bin_dir)?;
    let url = ffmpeg_download_url()?;
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

    Ok(bundled)
}

fn ffmpeg_download_url() -> Result<String> {
    if let Ok(url) = env::var("LOCAL_WHISPER_FFMPEG_URL") {
        return Ok(url);
    }

    let os = env::consts::OS;
    let arch = env::consts::ARCH;
    let url = match (os, arch) {
        ("windows", "x86_64") => "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-n6.1-latest-win64-gpl-6.1.zip",
        ("linux", "x86_64") => "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-n6.1-latest-linux64-gpl-6.1.tar.xz",
        ("macos", "x86_64") => "https://evermeet.cx/ffmpeg/get/zip",
        ("macos", "aarch64") => "https://evermeet.cx/ffmpeg/get/zip",
        _ => return Err(anyhow!("Unsupported platform: {}-{}", os, arch)),
    };

    Ok(url.to_string())
}

fn ensure_model(model: &str, data_dir: &Path) -> Result<PathBuf> {
    let models_dir = data_dir.join("models");
    fs::create_dir_all(&models_dir)?;
    let filename = format!("ggml-{}.bin", model);
    let model_path = models_dir.join(&filename);
    if model_path.exists() {
        return Ok(model_path);
    }

    let url = env::var("LOCAL_WHISPER_MODEL_URL")
        .unwrap_or_else(|_| format!("{}/{}", MODEL_URL_BASE, filename));
    download_file(&url, &model_path)?;
    Ok(model_path)
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

fn load_audio_samples(ffmpeg_path: &Path, input: &Path) -> Result<Vec<f32>> {
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

    Ok(samples)
}

fn transcribe(
    model_path: &Path,
    samples: &[f32],
    language: Option<&str>,
    threads: u32,
) -> Result<Vec<(f32, f32, String)>> {
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
            segments.push((start, end, text));
        }
    }
    Ok(segments)
}

fn render_markdown(
    input: &Path,
    model: &str,
    language: Option<&str>,
    segments: &[(f32, f32, String)],
) -> String {
    let mut output = String::new();
    let _ = writeln!(&mut output, "# Transcript");
    let _ = writeln!(&mut output, "- Source: {}", input.display());
    let _ = writeln!(&mut output, "- Model: {}", model);
    let _ = writeln!(&mut output, "- Language: {}", language.unwrap_or("auto"));
    let _ = writeln!(&mut output, "");
    let _ = writeln!(&mut output, "## Segments");

    for (start, end, text) in segments {
        let _ = writeln!(
            &mut output,
            "- [{} - {}] {}",
            format_timestamp(*start),
            format_timestamp(*end),
            text
        );
    }

    output
}

fn format_timestamp(seconds: f32) -> String {
    let total = seconds.round() as u64;
    let hours = total / 3600;
    let minutes = (total % 3600) / 60;
    let secs = total % 60;
    format!("{:02}:{:02}:{:02}", hours, minutes, secs)
}

fn default_threads() -> u32 {
    let cpu_count = num_cpus::get() as u32;
    if cfg!(target_os = "macos") && cfg!(target_arch = "aarch64") {
        1
    } else {
        cpu_count.max(1)
    }
}
