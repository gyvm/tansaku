/// Metadata about an available effect node type.
class NodeParamInfo {
  final String key;
  final String name;
  final double min;
  final double max;
  final double defaultValue;

  const NodeParamInfo({
    required this.key,
    required this.name,
    required this.min,
    required this.max,
    required this.defaultValue,
  });

  factory NodeParamInfo.fromJson(Map<String, dynamic> json) {
    return NodeParamInfo(
      key: json['key'] as String,
      name: json['name'] as String,
      min: (json['min'] as num).toDouble(),
      max: (json['max'] as num).toDouble(),
      defaultValue: (json['default'] as num).toDouble(),
    );
  }
}

class NodeInfo {
  final String type;
  final String name;
  final List<NodeParamInfo> params;

  const NodeInfo({
    required this.type,
    required this.name,
    required this.params,
  });

  factory NodeInfo.fromJson(Map<String, dynamic> json) {
    return NodeInfo(
      type: json['type'] as String,
      name: json['name'] as String,
      params: (json['params'] as List)
          .map((p) => NodeParamInfo.fromJson(p as Map<String, dynamic>))
          .toList(),
    );
  }
}
