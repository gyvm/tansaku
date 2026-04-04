import 'dart:async';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:vozoo_engine/vozoo_engine.dart';
import '../domain/entities/recorded_audio.dart';
import '../domain/interfaces/i_recorder_service.dart';

/// Recorder service backed by the Rust real-time engine.
class EngineRecorderService implements IRecorderService {
  final VozooEngine _engine;
  final _durationController = StreamController<Duration>.broadcast();
  final _isRecordingController = StreamController<bool>.broadcast();
  Timer? _durationTimer;
  String? _currentRecordingPath;
  bool _engineStartedByUs = false;

  EngineRecorderService(this._engine) {
    _isRecordingController.add(false);
  }

  @override
  Future<void> start() async {
    if (!_engine.isRunning) {
      print('[VozooRecorder] Starting real-time engine...');
      final result = _engine.startRealtime();
      print('[VozooRecorder] startRealtime result: $result');
      if (result != 0) {
        throw Exception('Failed to start audio engine (code: $result)');
      }
      _engineStartedByUs = true;
    }

    final dir = await getApplicationDocumentsDirectory();
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    _currentRecordingPath = '${dir.path}/recording_$timestamp.wav';
    print('[VozooRecorder] Recording to: $_currentRecordingPath');

    final result = _engine.startRecording(_currentRecordingPath!);
    print('[VozooRecorder] startRecording result: $result');
    if (result != 0) {
      throw Exception('Failed to start recording (code: $result)');
    }

    _isRecordingController.add(true);

    _durationTimer = Timer.periodic(const Duration(milliseconds: 100), (_) {
      final ms = _engine.getDurationMs();
      _durationController.add(Duration(milliseconds: ms));
    });
  }

  @override
  Future<RecordedAudio?> stop() async {
    _durationTimer?.cancel();
    _durationTimer = null;

    final durationMs = _engine.stopRecording();
    print('[VozooRecorder] stopRecording: durationMs=$durationMs');
    _isRecordingController.add(false);

    // Stop the engine if we started it (not externally managed)
    if (_engineStartedByUs) {
      _engine.stopRealtime();
      _engineStartedByUs = false;
    }

    if (_currentRecordingPath == null) {
      throw Exception('Recording failed: no output path');
    }

    final file = File(_currentRecordingPath!);
    final exists = await file.exists();
    final size = exists ? await file.length() : 0;
    print('[VozooRecorder] File exists=$exists, size=$size bytes, path=$_currentRecordingPath');

    if (!exists) {
      throw Exception('Recording failed: output file was not created at $_currentRecordingPath');
    }

    return RecordedAudio(
      path: _currentRecordingPath!,
      duration: Duration(milliseconds: durationMs),
    );
  }

  @override
  Stream<Duration> get durationStream => _durationController.stream;

  @override
  Stream<bool> get isRecordingStream => _isRecordingController.stream;

  void dispose() {
    _durationTimer?.cancel();
    _durationController.close();
    _isRecordingController.close();
  }
}
