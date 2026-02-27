abstract class IAudioPlayerService {
  Future<void> play(String path);
  Future<void> stop();
  Future<void> pause();
  Future<void> resume();
  Stream<Duration> get positionStream;
  Stream<Duration> get durationStream;
  Stream<bool> get isPlayingStream;
}
