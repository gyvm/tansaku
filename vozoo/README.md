# Vozoo - Voice Changer App

Vozoo is a Flutter-based voice changer application that allows users to record their voice and apply various effects like Gorilla, Cat, Robot, Chorus, and Reverb. It uses a custom C++ DSP engine via FFI for processing.

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
- `packages/vozoo_dsp/`: C++ DSP plugin.
- `android/`: Android native project.
- `ios/`: iOS native project.

## Features

- **Record**: Capture audio using native APIs (AVAudioRecorder / AudioRecord).
- **Process**: Apply DSP effects using C++ core.
- **Play**: Listen to the processed audio.
- **Share**: Share the result via system share sheet.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
