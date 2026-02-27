import 'dart:async';
import 'package:audioplayers/audioplayers.dart';
import '../../domain/interfaces/i_audio_player_service.dart';

class AudioPlayerService implements IAudioPlayerService {
  final _audioPlayer = AudioPlayer();
  final _durationController = StreamController<Duration>.broadcast();
  final _positionController = StreamController<Duration>.broadcast();
  final _isPlayingController = StreamController<bool>.broadcast();

  AudioPlayerService() {
    _audioPlayer.onDurationChanged.listen((d) => _durationController.add(d));
    _audioPlayer.onPositionChanged.listen((p) => _positionController.add(p));
    _audioPlayer.onPlayerStateChanged.listen((s) {
      _isPlayingController.add(s == PlayerState.playing);
    });
  }

  @override
  Future<void> play(String path) async {
    await _audioPlayer.play(DeviceFileSource(path));
  }

  @override
  Future<void> stop() async {
    await _audioPlayer.stop();
  }

  @override
  Future<void> pause() async {
    await _audioPlayer.pause();
  }

  @override
  Future<void> resume() async {
    await _audioPlayer.resume();
  }

  @override
  Stream<Duration> get durationStream => _durationController.stream;

  @override
  Stream<Duration> get positionStream => _positionController.stream;

  @override
  Stream<bool> get isPlayingStream => _isPlayingController.stream;

  void dispose() {
    _audioPlayer.dispose();
    _durationController.close();
    _positionController.close();
    _isPlayingController.close();
  }
}
