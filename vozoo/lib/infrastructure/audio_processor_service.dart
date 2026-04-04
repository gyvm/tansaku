import 'dart:async';
import 'dart:io';
import 'package:vozoo_engine/vozoo_engine.dart' as engine;
import 'package:vozoo/domain/entities/recorded_audio.dart';
import 'package:vozoo/domain/entities/voice_preset.dart';
import 'package:vozoo/domain/entities/effect_chain.dart';
import 'package:vozoo/domain/interfaces/i_audio_processor_service.dart';
import 'package:path/path.dart' as p;

class AudioProcessorService implements IAudioProcessorService {
  final _progressController = StreamController<double>.broadcast();

  @override
  Future<RecordedAudio> process(RecordedAudio input, VoicePreset preset) async {
    final outputPath = _getOutputPath(input.path, preset.name);

    final outputFile = File(outputPath);
    if (await outputFile.exists()) {
      await outputFile.delete();
    }

    _progressController.add(0.1);

    int presetId = preset.index;

    _progressController.add(0.3);

    final result = await engine.processFile(input.path, outputPath, presetId);
    if (result != 0) {
      final errors = {-1: 'Read error', -2: 'Write error'};
      throw Exception('DSP Processing failed: ${errors[result] ?? 'code $result'}');
    }

    _progressController.add(1.0);

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
  Future<RecordedAudio> processWithChain(RecordedAudio input, EffectChain chain) async {
    final outputPath = _getOutputPath(input.path, chain.name.toLowerCase().replaceAll(' ', '_'));

    final outputFile = File(outputPath);
    if (await outputFile.exists()) {
      await outputFile.delete();
    }

    _progressController.add(0.1);

    final chainJson = chain.toJson();

    _progressController.add(0.3);

    final result = await engine.processFileWithChain(input.path, outputPath, chainJson);
    if (result != 0) {
      final errors = {-1: 'Read error', -2: 'Write error', -3: 'Invalid chain definition'};
      throw Exception('DSP Processing failed: ${errors[result] ?? 'code $result'}');
    }

    _progressController.add(1.0);

    double speedFactor = 1.0;
    for (final node in chain.nodes) {
      if (node.type == 'pitch_shift') {
        speedFactor *= (node.params['factor'] ?? 1.0);
      }
    }

    Duration newDuration = speedFactor != 1.0
        ? Duration(milliseconds: (input.duration.inMilliseconds / speedFactor).round())
        : input.duration;

    return RecordedAudio(
      path: outputPath,
      duration: newDuration,
    );
  }

  @override
  Stream<double> get progressStream => _progressController.stream;

  String _getOutputPath(String inputPath, String suffix) {
    final dir = p.dirname(inputPath);
    final name = p.basenameWithoutExtension(inputPath);
    return p.join(dir, '${name}_$suffix.wav');
  }

  void dispose() {
    _progressController.close();
  }
}
