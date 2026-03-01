import 'dart:async';
import 'dart:io';
import 'package:vozoo_dsp/vozoo_dsp.dart' as dsp;
import 'package:vozoo/domain/entities/recorded_audio.dart';
import 'package:vozoo/domain/entities/voice_preset.dart';
import 'package:vozoo/domain/interfaces/i_audio_processor_service.dart';
import 'package:path/path.dart' as p;

class AudioProcessorService implements IAudioProcessorService {
  final _progressController = StreamController<double>.broadcast();

  @override
  Future<RecordedAudio> process(RecordedAudio input, VoicePreset preset) async {
    final outputPath = _getOutputPath(input.path, preset);

    // Clean up if exists
    final outputFile = File(outputPath);
    if (await outputFile.exists()) {
      await outputFile.delete();
    }

    _progressController.add(0.1); // Start

    int presetId = 0;
    switch (preset) {
      case VoicePreset.gorilla: presetId = 0; break;
      case VoicePreset.cat: presetId = 1; break;
      case VoicePreset.robot: presetId = 2; break;
      case VoicePreset.chorus: presetId = 3; break;
      case VoicePreset.reverb: presetId = 4; break;
    }

    _progressController.add(0.3);

    try {
      // Assuming dsp.processFile is available and returns int (0 = success)
      final result = await dsp.processFile(input.path, outputPath, presetId);

      if (result != 0) {
        throw Exception('DSP Processing failed with code $result');
      }
    } catch (e) {
      throw Exception('DSP Error: $e');
    }

    _progressController.add(1.0);

    // For MVP, just return same duration or re-read if needed.
    // Pitch shifting changes duration, but for MVP UI maybe okay to reuse input duration or estimate.
    // If we want exact duration, we'd need to read the new file.
    // Let's assume input duration for simplicity unless pitch shifted.
    // Gorilla (0.75x speed) -> duration / 0.75
    // Cat (1.4x speed) -> duration / 1.4
    Duration newDuration = input.duration;
    if (preset == VoicePreset.gorilla) {
      newDuration = Duration(milliseconds: (input.duration.inMilliseconds / 0.75).round());
    } else if (preset == VoicePreset.cat) {
      newDuration = Duration(milliseconds: (input.duration.inMilliseconds / 1.4).round());
    }

    return RecordedAudio(
      path: outputPath,
      duration: newDuration,
    );
  }

  @override
  Stream<double> get progressStream => _progressController.stream;

  String _getOutputPath(String inputPath, VoicePreset preset) {
    final dir = p.dirname(inputPath);
    final name = p.basenameWithoutExtension(inputPath);
    return p.join(dir, '${name}_${preset.name}.wav');
  }
}
