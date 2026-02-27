import 'dart:async';
import 'package:flutter/services.dart';
import '../../domain/entities/recorded_audio.dart';
import '../../domain/interfaces/i_recorder_service.dart';

class RecorderService implements IRecorderService {
  static const _methodChannel = MethodChannel('com.example.vozoo/recorder');
  static const _eventChannel = EventChannel('com.example.vozoo/recorder_events');

  final _durationController = StreamController<Duration>.broadcast();
  final _isRecordingController = StreamController<bool>.broadcast();

  StreamSubscription? _eventSubscription;

  RecorderService() {
    _isRecordingController.add(false);
  }

  @override
  Future<void> start() async {
    try {
      await _methodChannel.invokeMethod('start');
      _isRecordingController.add(true);

      _eventSubscription?.cancel();
      _eventSubscription = _eventChannel.receiveBroadcastStream().listen((event) {
        if (event is int) {
           _durationController.add(Duration(milliseconds: event));
        }
      });
    } on PlatformException catch (e) {
      throw Exception('Failed to start recording: ${e.message}');
    }
  }

  @override
  Future<RecordedAudio?> stop() async {
    try {
      final result = await _methodChannel.invokeMethod('stop');
      _isRecordingController.add(false);
      _eventSubscription?.cancel();

      if (result is Map) {
        // Handle Map<Object?, Object?> conversion
        final map = Map<String, dynamic>.from(result);
        final path = map['path'] as String;
        final durationMs = map['duration'] as int;
        return RecordedAudio(
          path: path,
          duration: Duration(milliseconds: durationMs),
        );
      }
      return null;
    } on PlatformException catch (e) {
       _isRecordingController.add(false);
      throw Exception('Failed to stop recording: ${e.message}');
    }
  }

  @override
  Stream<Duration> get durationStream => _durationController.stream;

  @override
  Stream<bool> get isRecordingStream => _isRecordingController.stream;

  void dispose() {
    _durationController.close();
    _isRecordingController.close();
    _eventSubscription?.cancel();
  }
}
