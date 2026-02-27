# Testing Strategy

## Overview

The Vozoo app uses unit tests for core logic (Repositories/Services) and widget tests for UI components. Since this is an MVP, the primary focus is on ensuring the core flow (Record -> Process -> Play) works correctly.

## Unit Testing

Run unit tests with:

```bash
flutter test
```

### Coverage Goals

- **Domain Entities**: Ensure entities are created correctly and serialized/deserialized properly.
- **Use Cases**: Mock dependencies (e.g., `IRecorderService`) to test state transitions (e.g., `RecorderNotifier` correctly updates `RecorderState`).
- **Repositories**: Mock external dependencies (e.g., MethodChannel) to test interaction logic.

## Integration Testing (Manual)

Since DSP processing involves native code and file I/O, manual testing is crucial.

### Manual Test Procedure

1.  **Launch App**: Open Vozoo on a physical device or emulator.
2.  **Record**:
    - Tap "START RECORDING".
    - Speak for 5-10 seconds.
    - Tap "STOP RECORDING".
    - Verify: UI transitions to Effect Select screen.
3.  **Process**:
    - Tap "Gorilla".
    - Verify: Loading indicator appears, then Result screen opens.
4.  **Playback**:
    - Tap Play button.
    - Verify: Audio plays with pitch-shifted effect.
    - Tap Pause.
    - Verify: Audio pauses.
5.  **Share**:
    - Tap "Share".
    - Verify: System share sheet opens with the file attached.
6.  **Error Handling**:
    - Deny microphone permission on first launch.
    - Verify: App shows appropriate error message.

## Future Improvements

- Add Golden Tests for UI snapshot verification.
- Add Integration Tests using `integration_test` package to automate the manual flow.
