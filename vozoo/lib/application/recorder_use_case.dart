import 'package:flutter_riverpod/flutter_riverpod.dart';

enum RecorderStatus { idle, recording, processing }

class RecorderState {
  final RecorderStatus status;
  final Duration duration;
  final RecordedAudio? lastRecording;
  final String? error;

  const RecorderState({
    this.status = RecorderStatus.idle,
    this.duration = Duration.zero,
    this.lastRecording,
    this.error,
  });

  RecorderState copyWith({
    RecorderStatus? status,
    Duration? duration,
    RecordedAudio? lastRecording,
    String? error,
  }) {
    return RecorderState(
      status: status ?? this.status,
      duration: duration ?? this.duration,
      lastRecording: lastRecording ?? this.lastRecording,
      error: error,
    );
  }
}

class RecorderNotifier extends StateNotifier<RecorderState> {
  final IRecorderService _service;

  RecorderNotifier(this._service) : super(const RecorderState()) {
    _service.durationStream.listen((d) {
      if (state.status == RecorderStatus.recording) {
        state = state.copyWith(duration: d);
      }
    });
    _service.isRecordingStream.listen((isRecording) {
      if (isRecording) {
        state = state.copyWith(status: RecorderStatus.recording);
      } else {
        // If stopped externally or error
        if (state.status == RecorderStatus.recording) {
          state = state.copyWith(status: RecorderStatus.idle);
        }
      }
    });
  }

  Future<void> startRecording() async {
    try {
      state = state.copyWith(status: RecorderStatus.recording, error: null, duration: Duration.zero);
      await _service.start();
    } catch (e) {
      state = state.copyWith(status: RecorderStatus.idle, error: e.toString());
    }
  }

  Future<void> stopRecording() async {
    try {
      final audio = await _service.stop();
      state = state.copyWith(status: RecorderStatus.idle, lastRecording: audio);
    } catch (e) {
      state = state.copyWith(status: RecorderStatus.idle, error: e.toString());
    }
  }
}
