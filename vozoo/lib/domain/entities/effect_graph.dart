import 'dart:convert';

/// A node in the DAG effect graph with position for UI layout.
class GraphNode {
  final int id;
  final String type;
  final Map<String, double> params;
  double x;
  double y;

  GraphNode({
    required this.id,
    required this.type,
    this.params = const {},
    this.x = 0,
    this.y = 0,
  });

  GraphNode copyWith({
    int? id,
    String? type,
    Map<String, double>? params,
    double? x,
    double? y,
  }) {
    return GraphNode(
      id: id ?? this.id,
      type: type ?? this.type,
      params: params ?? Map.of(this.params),
      x: x ?? this.x,
      y: y ?? this.y,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'params': params,
        'x': x,
        'y': y,
      };

  factory GraphNode.fromJson(Map<String, dynamic> json) {
    final rawParams = json['params'] as Map<String, dynamic>? ?? {};
    return GraphNode(
      id: json['id'] as int,
      type: json['type'] as String,
      params: rawParams.map((k, v) => MapEntry(k, (v as num).toDouble())),
      x: (json['x'] as num?)?.toDouble() ?? 0,
      y: (json['y'] as num?)?.toDouble() ?? 0,
    );
  }
}

/// An edge connecting two nodes in the graph.
class GraphEdge {
  final int from;
  final int to;
  final double gain;

  const GraphEdge({
    required this.from,
    required this.to,
    this.gain = 1.0,
  });

  GraphEdge copyWith({int? from, int? to, double? gain}) {
    return GraphEdge(
      from: from ?? this.from,
      to: to ?? this.to,
      gain: gain ?? this.gain,
    );
  }

  Map<String, dynamic> toJson() => {
        'from': from,
        'to': to,
        'gain': gain,
      };

  factory GraphEdge.fromJson(Map<String, dynamic> json) {
    return GraphEdge(
      from: json['from'] as int,
      to: json['to'] as int,
      gain: (json['gain'] as num?)?.toDouble() ?? 1.0,
    );
  }
}

/// A DAG-based effect graph definition.
class EffectGraph {
  final String name;
  final List<GraphNode> nodes;
  final List<GraphEdge> edges;

  const EffectGraph({
    required this.name,
    required this.nodes,
    required this.edges,
  });

  EffectGraph copyWith({
    String? name,
    List<GraphNode>? nodes,
    List<GraphEdge>? edges,
  }) {
    return EffectGraph(
      name: name ?? this.name,
      nodes: nodes ?? List.of(this.nodes),
      edges: edges ?? List.of(this.edges),
    );
  }

  /// Get the next available node ID.
  int get nextId {
    if (nodes.isEmpty) return 0;
    return nodes.map((n) => n.id).reduce((a, b) => a > b ? a : b) + 1;
  }

  String toJson() => jsonEncode({
        'name': name,
        'nodes': nodes.map((n) => n.toJson()).toList(),
        'edges': edges.map((e) => e.toJson()).toList(),
      });

  factory EffectGraph.fromJson(String jsonStr) {
    final map = jsonDecode(jsonStr) as Map<String, dynamic>;
    return EffectGraph.fromMap(map);
  }

  factory EffectGraph.fromMap(Map<String, dynamic> map) {
    return EffectGraph(
      name: map['name'] as String,
      nodes: (map['nodes'] as List)
          .map((n) => GraphNode.fromJson(n as Map<String, dynamic>))
          .toList(),
      edges: (map['edges'] as List)
          .map((e) => GraphEdge.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
