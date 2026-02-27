import 'package:freezed_annotation/freezed_annotation.dart';

part 'recorded_audio.freezed.dart';
part 'recorded_audio.g.dart';

@freezed
class RecordedAudio with _$RecordedAudio {
  const factory RecordedAudio({
    required String path,
    required Duration duration,
  }) = _RecordedAudio;

  factory RecordedAudio.fromJson(Map<String, dynamic> json) =>
      _$RecordedAudioFromJson(json);
}
