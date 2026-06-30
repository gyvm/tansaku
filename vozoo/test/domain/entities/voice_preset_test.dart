import 'package:flutter_test/flutter_test.dart';
import 'package:vozoo/domain/entities/voice_preset.dart';

void main() {
  group('VoicePreset', () {
    test('has all expected values', () {
      expect(VoicePreset.values, hasLength(9));
      expect(VoicePreset.values, contains(VoicePreset.gorilla));
      expect(VoicePreset.values, contains(VoicePreset.cat));
      expect(VoicePreset.values, contains(VoicePreset.robot));
      expect(VoicePreset.values, contains(VoicePreset.chorus));
      expect(VoicePreset.values, contains(VoicePreset.reverb));
      expect(VoicePreset.values, contains(VoicePreset.monster));
      expect(VoicePreset.values, contains(VoicePreset.helium));
      expect(VoicePreset.values, contains(VoicePreset.radio));
      expect(VoicePreset.values, contains(VoicePreset.hugeHall));
    });

    test('name returns correct string', () {
      expect(VoicePreset.gorilla.name, 'gorilla');
      expect(VoicePreset.cat.name, 'cat');
      expect(VoicePreset.robot.name, 'robot');
      expect(VoicePreset.chorus.name, 'chorus');
      expect(VoicePreset.reverb.name, 'reverb');
      expect(VoicePreset.monster.name, 'monster');
      expect(VoicePreset.helium.name, 'helium');
      expect(VoicePreset.radio.name, 'radio');
      expect(VoicePreset.hugeHall.name, 'hugeHall');
    });
  });
}
