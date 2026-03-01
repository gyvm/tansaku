import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vozoo/application/providers.dart';
import 'package:vozoo/domain/entities/recorded_audio.dart';
import 'package:vozoo/domain/entities/voice_preset.dart';
import 'package:vozoo/domain/interfaces/i_audio_processor_service.dart';

class MockAudioProcessorService implements IAudioProcessorService {
  final _progressController = StreamController<double>.broadcast();
  RecordedAudio? processResult;
  Exception? processError;

  @override
  Future<RecordedAudio> process(RecordedAudio input, VoicePreset preset) async {
    if (processError != null) throw processError!;
    return processResult ??
        RecordedAudio(
          path: '${input.path}_processed.wav',
          duration: input.duration,
        );
  }

  @override
  Stream<double> get progressStream => _progressController.stream;

  void dispose() => _progressController.close();
}

void main() {
  group('ProcessorNotifier', () {
    late MockAudioProcessorService service;
    late ProviderContainer container;

    const inputAudio = RecordedAudio(
      path: '/tmp/input.wav',
      duration: Duration(seconds: 5),
    );

    setUp(() {
      service = MockAudioProcessorService();
      container = ProviderContainer(overrides: [
        processorServiceProvider.overrideWithValue(service),
      ]);
    });

    tearDown(() {
      container.dispose();
      service.dispose();
    });

    test('initial state', () {
      final state = container.read(processorStateProvider);
      expect(state.isProcessing, isFalse);
      expect(state.progress, 0.0);
      expect(state.processedAudio, isNull);
      expect(state.error, isNull);
    });

    test('process completes successfully', () async {
      const expected = RecordedAudio(
        path: '/tmp/output.wav',
        duration: Duration(seconds: 5),
      );
      service.processResult = expected;

      final notifier = container.read(processorStateProvider.notifier);
      await notifier.process(inputAudio, VoicePreset.gorilla);

      final state = container.read(processorStateProvider);
      expect(state.isProcessing, isFalse);
      expect(state.processedAudio, equals(expected));
      expect(state.progress, 1.0);
      expect(state.error, isNull);
    });

    test('process handles error', () async {
      service.processError = Exception('DSP failed');

      final notifier = container.read(processorStateProvider.notifier);
      await notifier.process(inputAudio, VoicePreset.robot);

      final state = container.read(processorStateProvider);
      expect(state.isProcessing, isFalse);
      expect(state.processedAudio, isNull);
      expect(state.error, contains('DSP failed'));
    });
  });
}
