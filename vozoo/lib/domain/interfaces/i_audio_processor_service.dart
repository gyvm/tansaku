import '../entities/recorded_audio.dart';
import '../entities/voice_preset.dart';
import '../entities/effect_chain.dart';

abstract class IAudioProcessorService {
  /// Process with a preset (legacy).
  Future<RecordedAudio> process(RecordedAudio input, VoicePreset preset);

  /// Process with a custom effect chain.
  Future<RecordedAudio> processWithChain(RecordedAudio input, EffectChain chain);

  Stream<double> get progressStream;
}
