/// Definition of a single effect node in the processing chain.
class EffectNode {
  final String type;
  final Map<String, double> params;

  const EffectNode({
    required this.type,
    this.params = const {},
  });

  EffectNode copyWith({
    String? type,
    Map<String, double>? params,
  }) {
    return EffectNode(
      type: type ?? this.type,
      params: params ?? Map.of(this.params),
    );
  }

  Map<String, dynamic> toJson() => {
        'type': type,
        'params': params,
      };

  factory EffectNode.fromJson(Map<String, dynamic> json) {
    final rawParams = json['params'] as Map<String, dynamic>? ?? {};
    return EffectNode(
      type: json['type'] as String,
      params: rawParams.map((k, v) => MapEntry(k, (v as num).toDouble())),
    );
  }
}
