import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/entities/recorded_audio.dart';
import '../domain/entities/effect_graph.dart';
import '../application/providers.dart';
import 'result_screen.dart';

/// Available node types for the graph editor (same categories as chain editor + spatial).
const _graphNodeTypes = [
  _GNodeType('noise_reduction', 'Noise Reduction', Icons.noise_aware, Colors.cyan, {}, 'Pre'),
  _GNodeType('dc_blocker', 'DC Blocker', Icons.remove_circle_outline, Colors.cyan, {}, 'Pre'),
  _GNodeType('normalizer', 'Normalizer', Icons.equalizer, Colors.cyan, {'target_rms': 0.2}, 'Pre'),
  _GNodeType('vad', 'VAD', Icons.mic_external_on, Colors.cyan, {'threshold_db': -40.0}, 'Pre'),
  _GNodeType('pitch_shift', 'Pitch Shift', Icons.speed, Colors.teal, {'semitones': 0.0}, 'Core'),
  _GNodeType('formant_shift', 'Formant Shift', Icons.record_voice_over, Colors.teal, {'shift_factor': 1.0}, 'Core'),
  _GNodeType('lowpass', 'Low-Pass', Icons.filter_alt, Colors.blue, {'freq': 1000.0, 'q': 0.707}, 'Core'),
  _GNodeType('highpass', 'High-Pass', Icons.filter_alt_off, Colors.indigo, {'freq': 500.0, 'q': 0.707}, 'Core'),
  _GNodeType('gain', 'Gain', Icons.volume_up, Colors.green, {'factor': 1.0}, 'Core'),
  _GNodeType('ring_mod', 'Ring Mod', Icons.settings_input_component, Colors.red, {'mod_freq': 50.0, 'quantize_steps': 8.0}, 'Character'),
  _GNodeType('chorus', 'Chorus', Icons.groups, Colors.blue, {'delay_ms': 25.0, 'depth_ms': 5.0, 'rate_hz': 1.5, 'mix': 0.5}, 'Character'),
  _GNodeType('reverb', 'Reverb', Icons.church, Colors.purple, {}, 'Character'),
  _GNodeType('convolution_reverb', 'Conv Reverb', Icons.church, Colors.deepPurple, {'room_size': 0.5, 'damping': 0.5, 'dry_wet': 0.3}, 'Character'),
  _GNodeType('hrtf', 'HRTF 3D', Icons.spatial_audio, Colors.amber, {'azimuth': 0.0, 'elevation': 0.0, 'distance': 1.0}, 'Spatial'),
  _GNodeType('compressor', 'Compressor', Icons.compress, Colors.deepOrange, {'threshold_db': -20.0, 'ratio': 4.0}, 'Dynamics'),
  _GNodeType('deesser', 'De-Esser', Icons.graphic_eq, Colors.deepOrange, {'frequency': 5000.0, 'threshold_db': -20.0, 'ratio': 6.0}, 'Dynamics'),
  _GNodeType('limiter', 'Limiter', Icons.compress, Colors.orange, {}, 'Post'),
  _GNodeType('lookahead_limiter', 'Lookahead Limiter', Icons.shield, Colors.orange, {'ceiling_db': -1.0}, 'Post'),
  _GNodeType('loudness_norm', 'Loudness Norm', Icons.tune, Colors.orange, {'target_lufs': -14.0}, 'Post'),
  _GNodeType('mix', 'Mix', Icons.merge_type, Colors.grey, {}, 'Routing'),
];

const _nodeWidth = 140.0;
const _nodeHeight = 50.0;
const _portRadius = 8.0;

class GraphEditorScreen extends ConsumerStatefulWidget {
  final RecordedAudio audio;

  const GraphEditorScreen({super.key, required this.audio});

  @override
  ConsumerState<GraphEditorScreen> createState() => _GraphEditorScreenState();
}

class _GraphEditorScreenState extends ConsumerState<GraphEditorScreen> {
  bool _previewActive = false;
  int _nextId = 2;
  int? _selectedNodeId;
  int? _connectingFromId;

  final List<GraphNode> _nodes = [
    GraphNode(id: 0, type: 'input', x: 50, y: 200),
    GraphNode(id: 1, type: 'output', x: 600, y: 200),
  ];
  final List<GraphEdge> _edges = [];

  EffectGraph _buildGraph() => EffectGraph(
        name: 'Custom Graph',
        nodes: List.from(_nodes),
        edges: List.from(_edges),
      );

  void _addNode(String type, Map<String, double> defaultParams) {
    setState(() {
      _nodes.add(GraphNode(
        id: _nextId++,
        type: type,
        params: Map.of(defaultParams),
        x: 300,
        y: 100 + (_nodes.length * 70.0) % 400,
      ));
    });
    _updatePreview();
  }

  void _removeNode(int id) {
    if (id == 0 || _nodes.firstWhere((n) => n.id == id).type == 'output') return;
    setState(() {
      _nodes.removeWhere((n) => n.id == id);
      _edges.removeWhere((e) => e.from == id || e.to == id);
      if (_selectedNodeId == id) _selectedNodeId = null;
    });
    _updatePreview();
  }

  void _addEdge(int fromId, int toId) {
    if (fromId == toId) return;
    if (_edges.any((e) => e.from == fromId && e.to == toId)) return;
    setState(() {
      _edges.add(GraphEdge(from: fromId, to: toId));
    });
    _updatePreview();
  }

  void _removeEdge(int fromId, int toId) {
    setState(() {
      _edges.removeWhere((e) => e.from == fromId && e.to == toId);
    });
    _updatePreview();
  }

  void _updateEdgeGain(int fromId, int toId, double gain) {
    setState(() {
      final idx = _edges.indexWhere((e) => e.from == fromId && e.to == toId);
      if (idx >= 0) {
        _edges[idx] = _edges[idx].copyWith(gain: gain);
      }
    });
    _updatePreview();
  }

  void _processGraph() {
    if (_nodes.length < 2) return;
    ref.read(processorStateProvider.notifier).processWithGraph(widget.audio, _buildGraph());
  }

  void _togglePreview() {
    final engine = ref.read(engineProvider);
    setState(() {
      _previewActive = !_previewActive;
    });
    if (_previewActive) {
      engine.setGraph(_buildGraph().toJson());
      engine.startRealtime();
    } else {
      engine.stopRealtime();
    }
  }

  void _updatePreview() {
    if (_previewActive) {
      ref.read(engineProvider).setGraph(_buildGraph().toJson());
    }
  }

  void _loadPreset(EffectGraph preset) {
    setState(() {
      _nodes.clear();
      _edges.clear();
      _nodes.addAll(preset.nodes.map((n) => n.copyWith()));
      _edges.addAll(preset.edges.map((e) => e.copyWith()));
      _nextId = preset.nextId;
      _selectedNodeId = null;
    });
    _updatePreview();
  }

  @override
  void dispose() {
    if (_previewActive) {
      ref.read(engineProvider).stopRealtime();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(processorStateProvider);

    ref.listen(processorStateProvider, (previous, next) {
      if (previous?.isProcessing == true &&
          !next.isProcessing &&
          next.processedAudio != null) {
        Future.microtask(() {
          if (context.mounted) {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => ResultScreen(audio: next.processedAudio!),
              ),
            );
          }
        });
      }
      if (next.error != null && previous?.error != next.error) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${next.error}')),
        );
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Graph Editor'),
        actions: [
          IconButton(
            icon: Icon(
              _previewActive ? Icons.hearing : Icons.hearing_disabled,
              color: _previewActive ? Colors.green : null,
            ),
            tooltip: _previewActive ? 'Preview On' : 'Preview Off',
            onPressed: _togglePreview,
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.auto_awesome),
            tooltip: 'Load Preset',
            onSelected: (name) {
              final presets = _getGraphPresets();
              final preset = presets.firstWhere((p) => p.name == name);
              _loadPreset(preset);
            },
            itemBuilder: (context) => _getGraphPresets()
                .map((p) => PopupMenuItem(value: p.name, child: Text(p.name)))
                .toList(),
          ),
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showAddNodeDialog(context),
          ),
        ],
      ),
      body: Stack(
        children: [
          Column(
            children: [
              Expanded(
                child: GestureDetector(
                  onTapDown: (details) {
                    // Deselect if tapping on empty canvas.
                    final tapPos = details.localPosition;
                    final hitNode = _nodeAtPosition(tapPos);
                    if (hitNode == null) {
                      setState(() {
                        _selectedNodeId = null;
                        _connectingFromId = null;
                      });
                    }
                  },
                  child: ClipRect(
                    child: CustomPaint(
                      painter: _GraphPainter(
                        nodes: _nodes,
                        edges: _edges,
                        selectedNodeId: _selectedNodeId,
                        connectingFromId: _connectingFromId,
                      ),
                      child: Stack(
                        children: [
                          for (final node in _nodes) _buildNodeWidget(node),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              // Selected node params panel
              if (_selectedNodeId != null) _buildParamsPanel(),
              // Process button
              Padding(
                padding: const EdgeInsets.all(16),
                child: SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton.icon(
                    onPressed: _edges.isNotEmpty ? _processGraph : null,
                    icon: const Icon(Icons.play_arrow, size: 28),
                    label: const Text('Apply Graph', style: TextStyle(fontSize: 18)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.deepPurple,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
          if (state.isProcessing)
            Container(
              color: Colors.black54,
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }

  GraphNode? _nodeAtPosition(Offset pos) {
    for (final node in _nodes.reversed) {
      final rect = Rect.fromLTWH(node.x, node.y, _nodeWidth, _nodeHeight);
      if (rect.contains(pos)) return node;
    }
    return null;
  }

  Widget _buildNodeWidget(GraphNode node) {
    final meta = _graphNodeTypes.firstWhere(
      (t) => t.type == node.type,
      orElse: () => _GNodeType(node.type, node.type, Icons.circle, Colors.grey, {}, 'Other'),
    );
    final isSelected = _selectedNodeId == node.id;
    final isConnecting = _connectingFromId != null;
    final isSpecial = node.type == 'input' || node.type == 'output';

    return Positioned(
      left: node.x,
      top: node.y,
      child: GestureDetector(
        onTap: () {
          if (_connectingFromId != null && _connectingFromId != node.id) {
            _addEdge(_connectingFromId!, node.id);
            setState(() { _connectingFromId = null; });
          } else {
            setState(() { _selectedNodeId = node.id; });
          }
        },
        onLongPress: () {
          setState(() { _connectingFromId = node.id; });
        },
        onPanUpdate: (details) {
          setState(() {
            final idx = _nodes.indexWhere((n) => n.id == node.id);
            if (idx >= 0) {
              _nodes[idx] = _nodes[idx].copyWith(
                x: _nodes[idx].x + details.delta.dx,
                y: _nodes[idx].y + details.delta.dy,
              );
            }
          });
        },
        child: Container(
          width: _nodeWidth,
          height: _nodeHeight,
          decoration: BoxDecoration(
            color: isSpecial
                ? (node.type == 'input' ? Colors.green.shade700 : Colors.red.shade700)
                : meta.color.withAlpha(220),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected
                  ? Colors.white
                  : isConnecting
                      ? Colors.amber
                      : Colors.transparent,
              width: isSelected ? 2.5 : 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(80),
                blurRadius: 4,
                offset: const Offset(2, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              const SizedBox(width: 8),
              Icon(
                isSpecial
                    ? (node.type == 'input' ? Icons.mic : Icons.speaker)
                    : meta.icon,
                color: Colors.white,
                size: 20,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  isSpecial ? node.type.toUpperCase() : meta.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (!isSpecial)
                GestureDetector(
                  onTap: () => _removeNode(node.id),
                  child: const Padding(
                    padding: EdgeInsets.all(4),
                    child: Icon(Icons.close, color: Colors.white70, size: 16),
                  ),
                ),
              const SizedBox(width: 4),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildParamsPanel() {
    final node = _nodes.firstWhere(
      (n) => n.id == _selectedNodeId,
      orElse: () => GraphNode(id: -1, type: 'none'),
    );
    if (node.id == -1 || node.type == 'input' || node.type == 'output') {
      return const SizedBox.shrink();
    }

    // Show edges to/from this node.
    final inEdges = _edges.where((e) => e.to == node.id).toList();
    final outEdges = _edges.where((e) => e.from == node.id).toList();

    return Container(
      constraints: const BoxConstraints(maxHeight: 250),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        border: Border(top: BorderSide(color: Colors.grey.shade600)),
      ),
      child: ListView(
        shrinkWrap: true,
        padding: const EdgeInsets.all(12),
        children: [
          Text(
            'Node #${node.id}: ${node.type}',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
          const SizedBox(height: 8),
          // Parameters
          for (final entry in node.params.entries)
            _buildParamSlider(node, entry.key, entry.value),
          // Edge gains
          if (inEdges.isNotEmpty) ...[
            const SizedBox(height: 8),
            const Text('Input Edges', style: TextStyle(fontSize: 12, color: Colors.grey)),
            for (final e in inEdges)
              _buildEdgeGainSlider(e),
          ],
          if (outEdges.isNotEmpty) ...[
            const SizedBox(height: 8),
            const Text('Output Edges', style: TextStyle(fontSize: 12, color: Colors.grey)),
            for (final e in outEdges)
              _buildEdgeGainSlider(e),
          ],
        ],
      ),
    );
  }

  Widget _buildParamSlider(GraphNode node, String key, double value) {
    final paramMeta = _getGraphParamMeta(node.type, key);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          SizedBox(width: 80, child: Text(paramMeta?.name ?? key, style: const TextStyle(fontSize: 12))),
          Expanded(
            child: Slider(
              value: value.clamp(paramMeta?.min ?? -100, paramMeta?.max ?? 100),
              min: paramMeta?.min ?? -100,
              max: paramMeta?.max ?? 100,
              onChanged: (v) {
                setState(() {
                  final idx = _nodes.indexWhere((n) => n.id == node.id);
                  if (idx >= 0) {
                    final newParams = Map<String, double>.from(_nodes[idx].params);
                    newParams[key] = v;
                    _nodes[idx] = _nodes[idx].copyWith(params: newParams);
                  }
                });
                _updatePreview();
              },
            ),
          ),
          SizedBox(width: 50, child: Text(value.toStringAsFixed(1), style: const TextStyle(fontSize: 12), textAlign: TextAlign.right)),
        ],
      ),
    );
  }

  Widget _buildEdgeGainSlider(GraphEdge edge) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          SizedBox(width: 80, child: Text('${edge.from}->${edge.to}', style: const TextStyle(fontSize: 12))),
          Expanded(
            child: Slider(
              value: edge.gain.clamp(0.0, 2.0),
              min: 0.0,
              max: 2.0,
              onChanged: (v) => _updateEdgeGain(edge.from, edge.to, v),
            ),
          ),
          SizedBox(width: 50, child: Text(edge.gain.toStringAsFixed(2), style: const TextStyle(fontSize: 12), textAlign: TextAlign.right)),
          IconButton(
            icon: const Icon(Icons.delete, size: 16, color: Colors.red),
            onPressed: () => _removeEdge(edge.from, edge.to),
            iconSize: 16,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 24, minHeight: 24),
          ),
        ],
      ),
    );
  }

  void _showAddNodeDialog(BuildContext context) {
    final categories = <String, List<_GNodeType>>{};
    for (final meta in _graphNodeTypes) {
      categories.putIfAbsent(meta.category, () => []).add(meta);
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.3,
        maxChildSize: 0.9,
        expand: false,
        builder: (context, scrollController) => ListView(
          controller: scrollController,
          children: [
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('Add Node', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            ),
            for (final entry in categories.entries) ...[
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                child: Text(entry.key, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.grey.shade600)),
              ),
              ...entry.value.map((meta) => ListTile(
                    leading: CircleAvatar(backgroundColor: meta.color, child: Icon(meta.icon, color: Colors.white, size: 20)),
                    title: Text(meta.name),
                    onTap: () {
                      Navigator.pop(context);
                      _addNode(meta.type, meta.defaultParams);
                    },
                  )),
            ],
          ],
        ),
      ),
    );
  }

  List<EffectGraph> _getGraphPresets() {
    return [
      EffectGraph(
        name: 'Parallel Compression',
        nodes: [
          GraphNode(id: 0, type: 'input', x: 50, y: 150),
          GraphNode(id: 1, type: 'dc_blocker', x: 200, y: 150),
          GraphNode(id: 2, type: 'compressor', params: {'threshold_db': -25.0, 'ratio': 8.0}, x: 380, y: 50),
          GraphNode(id: 3, type: 'mix', x: 550, y: 150),
          GraphNode(id: 4, type: 'loudness_norm', params: {'target_lufs': -14.0}, x: 700, y: 150),
          GraphNode(id: 5, type: 'output', x: 850, y: 150),
        ],
        edges: [
          const GraphEdge(from: 0, to: 1),
          const GraphEdge(from: 1, to: 2),
          const GraphEdge(from: 2, to: 3, gain: 0.6),
          const GraphEdge(from: 1, to: 3, gain: 0.4),
          const GraphEdge(from: 3, to: 4),
          const GraphEdge(from: 4, to: 5),
        ],
      ),
      EffectGraph(
        name: 'Dual Character',
        nodes: [
          GraphNode(id: 0, type: 'input', x: 50, y: 150),
          GraphNode(id: 1, type: 'noise_reduction', x: 200, y: 150),
          GraphNode(id: 2, type: 'pitch_shift', params: {'semitones': -5.0}, x: 400, y: 50),
          GraphNode(id: 3, type: 'chorus', params: {'delay_ms': 30.0, 'depth_ms': 8.0, 'rate_hz': 1.0, 'mix': 0.6}, x: 400, y: 250),
          GraphNode(id: 4, type: 'mix', x: 600, y: 150),
          GraphNode(id: 5, type: 'loudness_norm', params: {'target_lufs': -14.0}, x: 750, y: 150),
          GraphNode(id: 6, type: 'output', x: 900, y: 150),
        ],
        edges: [
          const GraphEdge(from: 0, to: 1),
          const GraphEdge(from: 1, to: 2),
          const GraphEdge(from: 1, to: 3),
          const GraphEdge(from: 2, to: 4, gain: 0.6),
          const GraphEdge(from: 3, to: 4, gain: 0.4),
          const GraphEdge(from: 4, to: 5),
          const GraphEdge(from: 5, to: 6),
        ],
      ),
      EffectGraph(
        name: '3D Spatial Voice',
        nodes: [
          GraphNode(id: 0, type: 'input', x: 50, y: 150),
          GraphNode(id: 1, type: 'dc_blocker', x: 200, y: 150),
          GraphNode(id: 2, type: 'pitch_shift', params: {'semitones': -3.0}, x: 380, y: 150),
          GraphNode(id: 3, type: 'hrtf', params: {'azimuth': 45.0, 'elevation': 0.0, 'distance': 1.5}, x: 560, y: 150),
          GraphNode(id: 4, type: 'output', x: 740, y: 150),
        ],
        edges: [
          const GraphEdge(from: 0, to: 1),
          const GraphEdge(from: 1, to: 2),
          const GraphEdge(from: 2, to: 3),
          const GraphEdge(from: 3, to: 4),
        ],
      ),
    ];
  }
}

// ── Canvas painter for edges ──────────────────────────────────────

class _GraphPainter extends CustomPainter {
  final List<GraphNode> nodes;
  final List<GraphEdge> edges;
  final int? selectedNodeId;
  final int? connectingFromId;

  _GraphPainter({
    required this.nodes,
    required this.edges,
    this.selectedNodeId,
    this.connectingFromId,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // Draw grid.
    final gridPaint = Paint()
      ..color = Colors.grey.withAlpha(30)
      ..strokeWidth = 1;
    for (double x = 0; x < size.width; x += 40) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (double y = 0; y < size.height; y += 40) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    // Draw edges.
    for (final edge in edges) {
      final fromNode = nodes.firstWhere((n) => n.id == edge.from, orElse: () => GraphNode(id: -1, type: ''));
      final toNode = nodes.firstWhere((n) => n.id == edge.to, orElse: () => GraphNode(id: -1, type: ''));
      if (fromNode.id == -1 || toNode.id == -1) continue;

      final start = Offset(fromNode.x + _nodeWidth, fromNode.y + _nodeHeight / 2);
      final end = Offset(toNode.x, toNode.y + _nodeHeight / 2);

      final edgePaint = Paint()
        ..color = edge.gain < 1.0
            ? Colors.amber.withAlpha((150 + edge.gain * 105).round())
            : Colors.white.withAlpha(180)
        ..strokeWidth = 2.0 + edge.gain
        ..style = PaintingStyle.stroke;

      // Draw bezier curve.
      final dx = (end.dx - start.dx).abs() * 0.4;
      final path = Path()
        ..moveTo(start.dx, start.dy)
        ..cubicTo(start.dx + dx, start.dy, end.dx - dx, end.dy, end.dx, end.dy);
      canvas.drawPath(path, edgePaint);

      // Arrow head.
      final arrowPaint = Paint()
        ..color = edgePaint.color
        ..style = PaintingStyle.fill;
      final arrowPath = Path();
      final arrowSize = 8.0;
      arrowPath.moveTo(end.dx, end.dy);
      arrowPath.lineTo(end.dx - arrowSize, end.dy - arrowSize / 2);
      arrowPath.lineTo(end.dx - arrowSize, end.dy + arrowSize / 2);
      arrowPath.close();
      canvas.drawPath(arrowPath, arrowPaint);

      // Gain label if not 1.0.
      if ((edge.gain - 1.0).abs() > 0.01) {
        final midX = (start.dx + end.dx) / 2;
        final midY = (start.dy + end.dy) / 2 - 12;
        final tp = TextPainter(
          text: TextSpan(
            text: 'x${edge.gain.toStringAsFixed(1)}',
            style: TextStyle(color: Colors.amber.shade200, fontSize: 10, fontWeight: FontWeight.bold),
          ),
          textDirection: TextDirection.ltr,
        )..layout();
        tp.paint(canvas, Offset(midX - tp.width / 2, midY));
      }
    }

    // Draw output ports (right side of each node).
    for (final node in nodes) {
      final portCenter = Offset(node.x + _nodeWidth, node.y + _nodeHeight / 2);
      final portPaint = Paint()
        ..color = connectingFromId == node.id ? Colors.amber : Colors.white70
        ..style = PaintingStyle.fill;
      canvas.drawCircle(portCenter, _portRadius, portPaint);

      // Input port (left side).
      final inPortCenter = Offset(node.x, node.y + _nodeHeight / 2);
      canvas.drawCircle(inPortCenter, _portRadius - 2, Paint()..color = Colors.white38..style = PaintingStyle.fill);
    }
  }

  @override
  bool shouldRepaint(covariant _GraphPainter oldDelegate) => true;
}

// ── Param metadata ───────────────────────────────────────────────

_GParamMeta? _getGraphParamMeta(String nodeType, String key) {
  const defs = {
    'normalizer': {'target_rms': _GParamMeta('RMS', 0.01, 1.0)},
    'vad': {'threshold_db': _GParamMeta('Thresh dB', -60, -10)},
    'pitch_shift': {'semitones': _GParamMeta('Semitones', -24, 24)},
    'formant_shift': {'shift_factor': _GParamMeta('Factor', 0.5, 2.0)},
    'lowpass': {'freq': _GParamMeta('Freq Hz', 20, 20000), 'q': _GParamMeta('Q', 0.1, 10)},
    'highpass': {'freq': _GParamMeta('Freq Hz', 20, 20000), 'q': _GParamMeta('Q', 0.1, 10)},
    'gain': {'factor': _GParamMeta('Volume', 0, 4)},
    'ring_mod': {'mod_freq': _GParamMeta('Mod Hz', 1, 1000), 'quantize_steps': _GParamMeta('Steps', 0, 64)},
    'chorus': {'delay_ms': _GParamMeta('Delay ms', 1, 100), 'depth_ms': _GParamMeta('Depth ms', 0.1, 20), 'rate_hz': _GParamMeta('Rate Hz', 0.1, 10), 'mix': _GParamMeta('Mix', 0, 1)},
    'convolution_reverb': {'room_size': _GParamMeta('Room', 0.1, 2), 'damping': _GParamMeta('Damp', 0, 1), 'dry_wet': _GParamMeta('Dry/Wet', 0, 1)},
    'hrtf': {'azimuth': _GParamMeta('Azimuth', -180, 180), 'elevation': _GParamMeta('Elevation', -90, 90), 'distance': _GParamMeta('Distance', 0.1, 10)},
    'compressor': {'threshold_db': _GParamMeta('Thresh dB', -60, 0), 'ratio': _GParamMeta('Ratio', 1, 20)},
    'deesser': {'frequency': _GParamMeta('Freq Hz', 2000, 10000), 'threshold_db': _GParamMeta('Thresh dB', -40, 0), 'ratio': _GParamMeta('Ratio', 1, 20)},
    'lookahead_limiter': {'ceiling_db': _GParamMeta('Ceiling dB', -12, 0)},
    'loudness_norm': {'target_lufs': _GParamMeta('LUFS', -30, -6)},
  };
  return defs[nodeType]?[key];
}

class _GParamMeta {
  final String name;
  final double min;
  final double max;
  const _GParamMeta(this.name, this.min, this.max);
}

class _GNodeType {
  final String type;
  final String name;
  final IconData icon;
  final Color color;
  final Map<String, double> defaultParams;
  final String category;
  const _GNodeType(this.type, this.name, this.icon, this.color, this.defaultParams, this.category);
}
