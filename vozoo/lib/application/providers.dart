import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vozoo_engine/vozoo_engine.dart';
import '../domain/interfaces/i_recorder_service.dart';
import '../domain/interfaces/i_audio_processor_service.dart';
import '../domain/interfaces/i_audio_player_service.dart';
import '../domain/interfaces/i_share_service.dart';
import '../infrastructure/engine_recorder_service.dart';
import '../infrastructure/audio_processor_service.dart';
import '../infrastructure/audio_player_service.dart';
import '../infrastructure/share_service.dart';
import 'recorder_use_case.dart';
import 'processor_use_case.dart';
import 'player_use_case.dart';

// Real-time engine (singleton)
final engineProvider = Provider<VozooEngine>((ref) {
  final engine = VozooEngine();
  ref.onDispose(() => engine.dispose());
  return engine;
});

// Services
final recorderServiceProvider = Provider<IRecorderService>((ref) {
  final engine = ref.watch(engineProvider);
  return EngineRecorderService(engine);
});

final processorServiceProvider = Provider<IAudioProcessorService>((ref) {
  return AudioProcessorService();
});

final playerServiceProvider = Provider<IAudioPlayerService>((ref) {
  return AudioPlayerService();
});

final shareServiceProvider = Provider<IShareService>((ref) {
  return ShareService();
});

// Notifiers
final recorderStateProvider = NotifierProvider<RecorderNotifier, RecorderState>(
  RecorderNotifier.new,
);

final processorStateProvider = NotifierProvider<ProcessorNotifier, ProcessorState>(
  ProcessorNotifier.new,
);

final playerStateProvider = NotifierProvider<PlayerNotifier, PlayerState>(
  PlayerNotifier.new,
);
