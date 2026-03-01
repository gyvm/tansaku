import '../entities/recorded_audio.dart';

abstract class IRecorderService {
  Future<void> start();
  Future<RecordedAudio?> stop();
  Stream<Duration> get durationStream;
  Stream<bool> get isRecordingStream;
}
