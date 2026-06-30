# Vozoo - Voice Playground

Vozoo is a Flutter-based voice playground for quick, playful voice changes. The main product flow is:

1. Record your voice
2. Pick a character or adjust four simple sliders
3. Listen, save, or share

The app uses a Rust DSP engine via FFI for local, on-device processing.

## Getting Started

### Prerequisites

- Flutter SDK (latest stable)
- Xcode (for iOS build)
- Android Studio / Android SDK (for Android build)
- CocoaPods (for iOS dependencies)
- CMake (for Android C++ build)

### Build Instructions

#### Android

1.  Connect an Android device or start an emulator.
2.  Run the following command in the `vozoo` directory:
    ```bash
    flutter run
    ```
    or build an APK:
    ```bash
    flutter build apk
    ```

#### iOS

1.  Connect an iOS device or start a simulator.
2.  Install pods:
    ```bash
    cd ios && pod install && cd ..
    ```
3.  Run the following command in the `vozoo` directory:
    ```bash
    flutter run
    ```
    or open `ios/Runner.xcworkspace` in Xcode and run from there.

**Note:** For physical iOS devices, you must sign the app with your development team in Xcode.

### Project Structure

- `lib/`: Flutter Dart code.
- `lib/presentation/home_screen.dart`: recording entry point.
- `lib/presentation/simple_voice_screen.dart`: main transform screen with one-tap characters and custom sliders.
- `lib/presentation/result_screen.dart`: playback, save, and share.
- `android/`: Android native project.
- `ios/`: iOS native project.
- `packages/vozoo_engine/`: Rust audio engine and FFI bridge.

## Features

- **Record**: Capture audio using native APIs (AVAudioRecorder / AudioRecord).
- **Transform**: Apply kid-friendly character presets and custom voice shaping.
- **Expand**: Built-in presets now include Gorilla, Cat, Robot, Chorus, Reverb, Monster, Helium, Radio, and Huge Hall.
- **Play**: Listen to the processed audio.
- **Share**: Share the result via system share sheet.
- **Offline**: Recording and processing stay on-device; only explicit sharing leaves the app.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
