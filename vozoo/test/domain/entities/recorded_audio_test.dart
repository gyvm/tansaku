import 'package:flutter_test/flutter_test.dart';
import 'package:vozoo/domain/entities/recorded_audio.dart';

void main() {
  group('RecordedAudio', () {
    test('creates with required fields', () {
      const audio = RecordedAudio(
        path: '/tmp/test.wav',
        duration: Duration(seconds: 5),
      );

      expect(audio.path, '/tmp/test.wav');
      expect(audio.duration, const Duration(seconds: 5));
    });

    test('copyWith updates path', () {
      const original = RecordedAudio(
        path: '/tmp/test.wav',
        duration: Duration(seconds: 5),
      );

      final updated = original.copyWith(path: '/tmp/output.wav');

      expect(updated.path, '/tmp/output.wav');
      expect(updated.duration, const Duration(seconds: 5));
    });

    test('copyWith updates duration', () {
      const original = RecordedAudio(
        path: '/tmp/test.wav',
        duration: Duration(seconds: 5),
      );

      final updated = original.copyWith(duration: const Duration(seconds: 10));

      expect(updated.path, '/tmp/test.wav');
      expect(updated.duration, const Duration(seconds: 10));
    });

    test('equality', () {
      const a = RecordedAudio(
        path: '/tmp/test.wav',
        duration: Duration(seconds: 5),
      );
      const b = RecordedAudio(
        path: '/tmp/test.wav',
        duration: Duration(seconds: 5),
      );

      expect(a, equals(b));
      expect(a.hashCode, equals(b.hashCode));
    });

    test('inequality with different path', () {
      const a = RecordedAudio(
        path: '/tmp/test.wav',
        duration: Duration(seconds: 5),
      );
      const b = RecordedAudio(
        path: '/tmp/other.wav',
        duration: Duration(seconds: 5),
      );

      expect(a, isNot(equals(b)));
    });

    test('toString contains fields', () {
      const audio = RecordedAudio(
        path: '/tmp/test.wav',
        duration: Duration(seconds: 5),
      );

      expect(audio.toString(), contains('/tmp/test.wav'));
    });
  });
}
