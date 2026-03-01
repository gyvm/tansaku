import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/entities/recorded_audio.dart';
import '../domain/entities/voice_preset.dart';
import 'providers.dart';

class ProcessorState {
  final bool isProcessing;
  final double progress;
  final RecordedAudio? processedAudio;
  final String? error;

  const ProcessorState({
    this.isProcessing = false,
    this.progress = 0.0,
    this.processedAudio,
    this.error,
  });

  ProcessorState copyWith({
    bool? isProcessing,
    double? progress,
    RecordedAudio? processedAudio,
    String? error,
  }) {
    return ProcessorState(
      isProcessing: isProcessing ?? this.isProcessing,
      progress: progress ?? this.progress,
      processedAudio: processedAudio ?? this.processedAudio,
      error: error,
    );
  }
}

class ProcessorNotifier extends Notifier<ProcessorState> {
  @override
  ProcessorState build() {
    final service = ref.watch(processorServiceProvider);

    final progressSub = service.progressStream.listen((p) {
      if (state.isProcessing) {
        state = state.copyWith(progress: p);
      }
    });

    ref.onDispose(() {
      progressSub.cancel();
    });

    return const ProcessorState();
  }

  Future<void> process(RecordedAudio input, VoicePreset preset) async {
    final service = ref.read(processorServiceProvider);
    try {
      state = state.copyWith(isProcessing: true, error: null, progress: 0.0);
      final result = await service.process(input, preset);
      state = state.copyWith(isProcessing: false, processedAudio: result, progress: 1.0);
    } catch (e) {
      state = state.copyWith(isProcessing: false, error: e.toString());
    }
  }
}
