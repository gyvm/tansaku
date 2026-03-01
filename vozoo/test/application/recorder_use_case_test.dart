import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vozoo/application/recorder_use_case.dart';
import 'package:vozoo/application/providers.dart';
import 'package:vozoo/domain/entities/recorded_audio.dart';
import 'package:vozoo/domain/interfaces/i_recorder_service.dart';

class MockRecorderService implements IRecorderService {
  final _durationController = StreamController<Duration>.broadcast();
  final _isRecordingController = StreamController<bool>.broadcast();
  bool startCalled = false;
  bool stopCalled = false;
  RecordedAudio? stopResult;
  Exception? startError;
  Exception? stopError;

  @override
  Future<void> start() async {
    startCalled = true;
    if (startError != null) throw startError!;
  }

  @override
  Future<RecordedAudio?> stop() async {
    stopCalled = true;
    if (stopError != null) throw stopError!;
    return stopResult;
  }

  @override
  Stream<Duration> get durationStream => _durationController.stream;

  @override
  Stream<bool> get isRecordingStream => _isRecordingController.stream;

  void dispose() {
    _durationController.close();
    _isRecordingController.close();
  }
}

void main() {
  group('RecorderNotifier', () {
    late MockRecorderService service;
    late ProviderContainer container;

    setUp(() {
      service = MockRecorderService();
      container = ProviderContainer(overrides: [
        recorderServiceProvider.overrideWithValue(service),
      ]);
    });

    tearDown(() {
      container.dispose();
      service.dispose();
    });

    test('initial state is idle', () {
      final state = container.read(recorderStateProvider);
      expect(state.status, RecorderStatus.idle);
      expect(state.duration, Duration.zero);
      expect(state.lastRecording, isNull);
      expect(state.error, isNull);
    });

    test('startRecording sets state to recording', () async {
      final notifier = container.read(recorderStateProvider.notifier);
      await notifier.startRecording();

      expect(service.startCalled, isTrue);
      final state = container.read(recorderStateProvider);
      expect(state.status, RecorderStatus.recording);
      expect(state.error, isNull);
    });

    test('startRecording handles error', () async {
      service.startError = Exception('mic denied');
      final notifier = container.read(recorderStateProvider.notifier);
      await notifier.startRecording();

      final state = container.read(recorderStateProvider);
      expect(state.status, RecorderStatus.idle);
      expect(state.error, contains('mic denied'));
    });

    test('stopRecording returns audio and sets idle', () async {
      const audio = RecordedAudio(
        path: '/tmp/test.wav',
        duration: Duration(seconds: 3),
      );
      service.stopResult = audio;

      final notifier = container.read(recorderStateProvider.notifier);
      await notifier.startRecording();
      await notifier.stopRecording();

      expect(service.stopCalled, isTrue);
      final state = container.read(recorderStateProvider);
      expect(state.status, RecorderStatus.idle);
      expect(state.lastRecording, equals(audio));
    });

    test('stopRecording handles error', () async {
      service.stopError = Exception('stop failed');

      final notifier = container.read(recorderStateProvider.notifier);
      await notifier.startRecording();
      await notifier.stopRecording();

      final state = container.read(recorderStateProvider);
      expect(state.status, RecorderStatus.idle);
      expect(state.error, contains('stop failed'));
    });
  });

  group('RecorderState', () {
    test('copyWith preserves values when no args', () {
      const state = RecorderState(
        status: RecorderStatus.recording,
        duration: Duration(seconds: 5),
      );

      final copy = state.copyWith();

      expect(copy.status, RecorderStatus.recording);
      expect(copy.duration, const Duration(seconds: 5));
    });

    test('copyWith overrides specified values', () {
      const state = RecorderState();

      final updated = state.copyWith(
        status: RecorderStatus.recording,
        duration: const Duration(seconds: 3),
      );

      expect(updated.status, RecorderStatus.recording);
      expect(updated.duration, const Duration(seconds: 3));
    });
  });
}
