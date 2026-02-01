# local-whisper-cli

Local transcription CLI that auto-downloads FFmpeg and whisper.cpp models.

## Usage

```bash
cargo run --release -- <input-file>
```

Options:

```bash
cargo run --release -- <input-file> --model base --language ja --output-dir ./transcripts
```

The output markdown file is named by timestamp (e.g. `20260201-041200.md`).

## Auto-download behavior

- FFmpeg: downloaded on first run unless `--ffmpeg-path` is provided or `ffmpeg` is already in PATH.
- Model: downloaded on first run from Hugging Face.

Environment overrides:

- `LOCAL_WHISPER_FFMPEG_URL`: custom FFmpeg archive URL.
- `LOCAL_WHISPER_MODEL_URL`: custom model file URL.

## Notes

The data directory is OS-specific (Application Support on macOS, AppData on Windows).
Both FFmpeg and models are stored there for reuse.

### macOS FFmpeg source

On macOS, the default download uses Evermeet's snapshot ZIP via their download API
(`https://evermeet.cx/ffmpeg/get/zip`).
Note: Evermeet does not provide native Apple Silicon builds, so this relies on Rosetta.
