import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vozoo/application/player_use_case.dart';
import 'package:vozoo/application/providers.dart';
import 'package:vozoo/domain/interfaces/i_audio_player_service.dart';

class MockAudioPlayerService implements IAudioPlayerService {
  final _positionController = StreamController<Duration>.broadcast();
  final _durationController = StreamController<Duration>.broadcast();
  final _isPlayingController = StreamController<bool>.broadcast();
  bool playCalled = false;
  bool stopCalled = false;
  bool pauseCalled = false;
  bool resumeCalled = false;
  Exception? playError;

  @override
  Future<void> play(String path) async {
    playCalled = true;
    if (playError != null) throw playError!;
  }

  @override
  Future<void> stop() async => stopCalled = true;

  @override
  Future<void> pause() async => pauseCalled = true;

  @override
  Future<void> resume() async => resumeCalled = true;

  @override
  Stream<Duration> get positionStream => _positionController.stream;

  @override
  Stream<Duration> get durationStream => _durationController.stream;

  @override
  Stream<bool> get isPlayingStream => _isPlayingController.stream;

  void dispose() {
    _positionController.close();
    _durationController.close();
    _isPlayingController.close();
  }
}

void main() {
  group('PlayerNotifier', () {
    late MockAudioPlayerService service;
    late ProviderContainer container;

    setUp(() {
      service = MockAudioPlayerService();
      container = ProviderContainer(overrides: [
        playerServiceProvider.overrideWithValue(service),
      ]);
    });

    tearDown(() {
      container.dispose();
      service.dispose();
    });

    test('initial state', () {
      final state = container.read(playerStateProvider);
      expect(state.isPlaying, isFalse);
      expect(state.position, Duration.zero);
      expect(state.duration, Duration.zero);
      expect(state.error, isNull);
    });

    test('play calls service', () async {
      final notifier = container.read(playerStateProvider.notifier);
      await notifier.play('/tmp/test.wav');
      expect(service.playCalled, isTrue);
    });

    test('play handles error', () async {
      service.playError = Exception('playback failed');
      final notifier = container.read(playerStateProvider.notifier);
      await notifier.play('/tmp/test.wav');

      final state = container.read(playerStateProvider);
      expect(state.error, contains('playback failed'));
    });

    test('stop calls service', () async {
      final notifier = container.read(playerStateProvider.notifier);
      await notifier.stop();
      expect(service.stopCalled, isTrue);
    });

    test('pause calls service', () async {
      final notifier = container.read(playerStateProvider.notifier);
      await notifier.pause();
      expect(service.pauseCalled, isTrue);
    });

    test('resume calls service', () async {
      final notifier = container.read(playerStateProvider.notifier);
      await notifier.resume();
      expect(service.resumeCalled, isTrue);
    });
  });

  group('PlayerState', () {
    test('copyWith preserves unspecified values', () {
      const state = PlayerState(
        isPlaying: true,
        position: Duration(seconds: 3),
        duration: Duration(seconds: 10),
      );

      final copy = state.copyWith();

      expect(copy.isPlaying, isTrue);
      expect(copy.position, const Duration(seconds: 3));
      expect(copy.duration, const Duration(seconds: 10));
    });
  });
}
