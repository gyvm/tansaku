class RecordedAudio {
  final String path;
  final Duration duration;

  const RecordedAudio({
    required this.path,
    required this.duration,
  });

  RecordedAudio copyWith({
    String? path,
    Duration? duration,
  }) {
    return RecordedAudio(
      path: path ?? this.path,
      duration: duration ?? this.duration,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RecordedAudio &&
          runtimeType == other.runtimeType &&
          path == other.path &&
          duration == other.duration;

  @override
  int get hashCode => path.hashCode ^ duration.hashCode;

  @override
  String toString() => 'RecordedAudio(path: $path, duration: $duration)';
}
