import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/recorded_audio.dart';
import '../../domain/entities/voice_preset.dart';
import '../../domain/interfaces/i_audio_processor_service.dart';

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

class ProcessorNotifier extends StateNotifier<ProcessorState> {
  final IAudioProcessorService _service;

  ProcessorNotifier(this._service) : super(const ProcessorState()) {
    _service.progressStream.listen((p) {
      if (state.isProcessing) {
        state = state.copyWith(progress: p);
      }
    });
  }

  Future<void> process(RecordedAudio input, VoicePreset preset) async {
    try {
      state = state.copyWith(isProcessing: true, error: null, progress: 0.0);
      final result = await _service.process(input, preset);
      state = state.copyWith(isProcessing: false, processedAudio: result, progress: 1.0);
    } catch (e) {
      state = state.copyWith(isProcessing: false, error: e.toString());
    }
  }
}
