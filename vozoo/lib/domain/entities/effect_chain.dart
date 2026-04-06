import 'dart:convert';
import 'effect_node.dart';

/// Definition of an effect chain — an ordered list of nodes.
class EffectChain {
  final String name;
  final List<EffectNode> nodes;

  const EffectChain({
    required this.name,
    required this.nodes,
  });

  EffectChain copyWith({
    String? name,
    List<EffectNode>? nodes,
  }) {
    return EffectChain(
      name: name ?? this.name,
      nodes: nodes ?? List.of(this.nodes),
    );
  }

  String toJson() => jsonEncode({
        'name': name,
        'nodes': nodes.map((n) => n.toJson()).toList(),
      });

  factory EffectChain.fromJson(String jsonStr) {
    final map = jsonDecode(jsonStr) as Map<String, dynamic>;
    return EffectChain.fromMap(map);
  }

  factory EffectChain.fromMap(Map<String, dynamic> map) {
    return EffectChain(
      name: map['name'] as String,
      nodes: (map['nodes'] as List)
          .map((n) => EffectNode.fromJson(n as Map<String, dynamic>))
          .toList(),
    );
  }
}
