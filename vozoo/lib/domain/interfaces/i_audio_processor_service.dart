import '../entities/recorded_audio.dart';
import '../entities/voice_preset.dart';
import '../entities/effect_chain.dart';
import '../entities/effect_graph.dart';

abstract class IAudioProcessorService {
  /// Process with a preset (legacy).
  Future<RecordedAudio> process(RecordedAudio input, VoicePreset preset);

  /// Process with a custom effect chain.
  Future<RecordedAudio> processWithChain(RecordedAudio input, EffectChain chain);

  /// Process with a DAG effect graph.
  Future<RecordedAudio> processWithGraph(RecordedAudio input, EffectGraph graph);

  Stream<double> get progressStream;
}
