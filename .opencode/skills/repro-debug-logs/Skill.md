# Skill: Reproducible Debug Logs

## When to use
- The app produces empty output with no visible errors.
- Users cannot access console logs (release builds or GUI-only apps).
- You need to distinguish between input, transform, and output failures.

## Goal
Make the runtime state observable without attaching a debugger.

## Steps
1) Add a file-based logger with timestamps.
2) Log inputs, configuration, and key runtime events (start/stop, permission checks).
3) Add lightweight numeric probes (peak values, frame counts, buffer formats).
4) Keep logs concise and consistent; include file path to the log.
5) Reproduce and read logs before changing behavior.

## Tips
- Log at low frequency (e.g., every N buffers) to avoid large files.
- Separate mic/system/mixer signals to isolate silence.
- Include OS version and feature flags in the log header.

## Success criteria
- Logs show whether data is zero at capture, transform, or write time.
- Users can send a single log file for diagnosis.
