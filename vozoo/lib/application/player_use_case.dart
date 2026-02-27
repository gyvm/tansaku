import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/interfaces/i_audio_player_service.dart';

class PlayerState {
  final bool isPlaying;
  final Duration position;
  final Duration duration;
  final String? error;

  const PlayerState({
    this.isPlaying = false,
    this.position = Duration.zero,
    this.duration = Duration.zero,
    this.error,
  });

  PlayerState copyWith({
    bool? isPlaying,
    Duration? position,
    Duration? duration,
    String? error,
  }) {
    return PlayerState(
      isPlaying: isPlaying ?? this.isPlaying,
      position: position ?? this.position,
      duration: duration ?? this.duration,
      error: error,
    );
  }
}

class PlayerNotifier extends StateNotifier<PlayerState> {
  final IAudioPlayerService _service;

  PlayerNotifier(this._service) : super(const PlayerState()) {
    _service.isPlayingStream.listen((p) {
      state = state.copyWith(isPlaying: p);
    });
    _service.positionStream.listen((p) {
      state = state.copyWith(position: p);
    });
    _service.durationStream.listen((d) {
      state = state.copyWith(duration: d);
    });
  }

  Future<void> play(String path) async {
    try {
      await _service.play(path);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> stop() async {
    await _service.stop();
  }

  Future<void> pause() async {
    await _service.pause();
  }

  Future<void> resume() async {
    await _service.resume();
  }
}
