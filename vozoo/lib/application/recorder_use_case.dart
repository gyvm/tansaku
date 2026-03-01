import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/entities/recorded_audio.dart';
import 'providers.dart';

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

class RecorderNotifier extends Notifier<RecorderState> {
  @override
  RecorderState build() {
    final service = ref.watch(recorderServiceProvider);

    final durationSub = service.durationStream.listen((d) {
      if (state.status == RecorderStatus.recording) {
        state = state.copyWith(duration: d);
      }
    });
    final isRecordingSub = service.isRecordingStream.listen((isRecording) {
      if (isRecording) {
        state = state.copyWith(status: RecorderStatus.recording);
      } else {
        if (state.status == RecorderStatus.recording) {
          state = state.copyWith(status: RecorderStatus.idle);
        }
      }
    });

    ref.onDispose(() {
      durationSub.cancel();
      isRecordingSub.cancel();
    });

    return const RecorderState();
  }

  Future<void> startRecording() async {
    final service = ref.read(recorderServiceProvider);
    try {
      state = state.copyWith(status: RecorderStatus.recording, error: null, duration: Duration.zero);
      await service.start();
    } catch (e) {
      state = state.copyWith(status: RecorderStatus.idle, error: e.toString());
    }
  }

  Future<void> stopRecording() async {
    final service = ref.read(recorderServiceProvider);
    try {
      final audio = await service.stop();
      state = state.copyWith(status: RecorderStatus.idle, lastRecording: audio);
    } catch (e) {
      state = state.copyWith(status: RecorderStatus.idle, error: e.toString());
    }
  }
}
