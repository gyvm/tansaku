import 'package:flutter_test/flutter_test.dart';
import 'package:vozoo/domain/entities/voice_preset.dart';

void main() {
  group('VoicePreset', () {
    test('has all expected values', () {
      expect(VoicePreset.values, hasLength(5));
      expect(VoicePreset.values, contains(VoicePreset.gorilla));
      expect(VoicePreset.values, contains(VoicePreset.cat));
      expect(VoicePreset.values, contains(VoicePreset.robot));
      expect(VoicePreset.values, contains(VoicePreset.chorus));
      expect(VoicePreset.values, contains(VoicePreset.reverb));
    });

    test('name returns correct string', () {
      expect(VoicePreset.gorilla.name, 'gorilla');
      expect(VoicePreset.cat.name, 'cat');
      expect(VoicePreset.robot.name, 'robot');
      expect(VoicePreset.chorus.name, 'chorus');
      expect(VoicePreset.reverb.name, 'reverb');
    });
  });
}
