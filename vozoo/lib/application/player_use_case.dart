import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'providers.dart';

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

class PlayerNotifier extends Notifier<PlayerState> {
  @override
  PlayerState build() {
    final service = ref.watch(playerServiceProvider);

    final isPlayingSub = service.isPlayingStream.listen((p) {
      state = state.copyWith(isPlaying: p);
    });
    final positionSub = service.positionStream.listen((p) {
      state = state.copyWith(position: p);
    });
    final durationSub = service.durationStream.listen((d) {
      state = state.copyWith(duration: d);
    });

    ref.onDispose(() {
      isPlayingSub.cancel();
      positionSub.cancel();
      durationSub.cancel();
    });

    return const PlayerState();
  }

  Future<void> play(String path) async {
    final service = ref.read(playerServiceProvider);
    try {
      await service.play(path);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> stop() async {
    final service = ref.read(playerServiceProvider);
    await service.stop();
  }

  Future<void> pause() async {
    final service = ref.read(playerServiceProvider);
    await service.pause();
  }

  Future<void> resume() async {
    final service = ref.read(playerServiceProvider);
    await service.resume();
  }
}
