import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/interfaces/i_recorder_service.dart';
import '../domain/interfaces/i_audio_processor_service.dart';
import '../domain/interfaces/i_audio_player_service.dart';
import '../domain/interfaces/i_share_service.dart';
import '../infrastructure/recorder_service.dart';
import '../infrastructure/audio_processor_service.dart';
import '../infrastructure/audio_player_service.dart';
import '../infrastructure/share_service.dart';
import 'recorder_use_case.dart';
import 'processor_use_case.dart';
import 'player_use_case.dart';

// Services
final recorderServiceProvider = Provider<IRecorderService>((ref) {
  return RecorderService();
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
final recorderStateProvider = StateNotifierProvider<RecorderNotifier, RecorderState>((ref) {
  return RecorderNotifier(ref.watch(recorderServiceProvider));
});

final processorStateProvider = StateNotifierProvider<ProcessorNotifier, ProcessorState>((ref) {
  return ProcessorNotifier(ref.watch(processorServiceProvider));
});

final playerStateProvider = StateNotifierProvider<PlayerNotifier, PlayerState>((ref) {
  return PlayerNotifier(ref.watch(playerServiceProvider));
});
