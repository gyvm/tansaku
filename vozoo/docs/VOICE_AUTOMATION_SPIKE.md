# Voice Automation Spike

## Goal

Investigate two concrete paths for more expressive post-processing such as:

- 語尾だけ上げる
- 途中から急に高くする
- フレーズの一部だけグニョグニョに曲げる

This document is intentionally implementation-oriented so the next pass can move straight into a PoC.

## Option 1: Pitch Automation on Top of Existing `pitch_shift`

### Idea

Split one recording into short regions and process each region with a different `semitones` value. Stitch the rendered regions back together with short crossfades.

### What it unlocks

- End-rise intonation such as `こんにちは↗`
- Sudden jumps in pitch halfway through a phrase
- Cartoon curves made from a handful of semitone control points

### Required work

- Add a new request model instead of overloading `VoicePreset`
- Represent an envelope as timed segments, for example:
  - `start_ms`
  - `end_ms`
  - `semitones`
- Extend Rust processing with segmented offline rendering
- Add overlap / crossfade handling to hide boundary clicks

### Strengths

- Reuses the current DSP stack
- No new heavy dependency
- Good fit for offline rendering from Flutter

### Risks

- Segment joins can sound artificial without careful crossfades
- Expressiveness is limited compared with true resynthesis
- Real-time support is harder than offline support

### Fit

- Best short-term route for "語尾だけ上げる" and "途中で急に高くする"

## Option 2: WORLD-Style Resynthesis

### Idea

Extract F0, spectral envelope, and aperiodicity, then resynthesize after editing the contour.

### What it unlocks

- Much more natural pitch contour rewriting
- Better control over speaking style than fixed chains
- Cleaner phrase-end rises and animated intonation curves

### Candidate source

- `animal-voice-changer/world-sys/`

This tree is currently untracked in the repo, so treat it as a reference only, not a dependency to wire in directly.

### Required work

- Wrap WORLD analysis / synthesis in a stable Rust-facing interface
- Define how Flutter passes contour edits into the engine
- Measure output latency and mobile build complexity
- Validate license and packaging implications before adoption

### Strengths

- Higher quality contour edits
- Better long-term foundation for expressive voice play

### Risks

- Larger integration cost
- More complex mobile build story
- More moving parts than the current chain-based engine

### Fit

- Best medium-term route if we want expressive prosody editing instead of just timbre changes

## Recommendation

- Build the first PoC with Option 1 for offline rendering.
- Use WORLD-style resynthesis only if Option 1 sounds too segmented or too synthetic for target phrases.

## PoC Scenarios

- Flat voice -> last 20 percent rises by +4 semitones
- Flat voice -> midpoint jumps from 0 to +7 semitones
- Whole phrase follows three control regions: low -> high -> low
