---
name: local-whisper-deps-autodownload
description: Auto-download whisper.cpp models and ffmpeg for local transcription apps.
---

## What I do
- Store dependencies in the app data directory
- Download ffmpeg and whisper.cpp models on first run
- Reuse cached binaries and models on subsequent runs

## When to use me
Use this for offline/local transcription where users should not install dependencies.

## Steps
1) Choose storage layout
   - `app_data_dir/bin` for ffmpeg
   - `app_data_dir/models` for whisper models
2) Ensure ffmpeg
   - Check existing file
   - Download and extract per OS/arch
   - Mark executable on Unix
3) Ensure model
   - Default to `ggerganov/whisper.cpp` model URL
   - Download on first run
4) Run pipeline
   - ffmpeg extracts 16 kHz mono PCM
   - whisper inference consumes samples

## Notes
- Log each step for UI progress.
- Keep URLs overridable via env vars.
