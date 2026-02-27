import '../entities/recorded_audio.dart';
import '../entities/voice_preset.dart';

abstract class IAudioProcessorService {
  Future<RecordedAudio> process(RecordedAudio input, VoicePreset preset);
  Stream<double> get progressStream;
}
