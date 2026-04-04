import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/entities/recorded_audio.dart';
import '../domain/entities/effect_chain.dart';
import '../domain/entities/effect_node.dart';
import '../application/providers.dart';
import 'result_screen.dart';

/// Available node types organized by category.
const _nodeTypes = [
  // Pre Processing
  _NodeType('noise_reduction', 'Noise Reduction', Icons.noise_aware, Colors.cyan, {}, 'Pre Processing'),
  _NodeType('dc_blocker', 'DC Blocker', Icons.remove_circle_outline, Colors.cyan, {}, 'Pre Processing'),
  _NodeType('normalizer', 'Normalizer', Icons.equalizer, Colors.cyan, {'target_rms': 0.2}, 'Pre Processing'),
  _NodeType('vad', 'Voice Activity Detection', Icons.mic_external_on, Colors.cyan, {'threshold_db': -40.0}, 'Pre Processing'),

  // Core Processing
  _NodeType('pitch_shift', 'Pitch Shift', Icons.speed, Colors.teal, {'factor': 1.0}, 'Core'),
  _NodeType('lowpass', 'Low-Pass Filter', Icons.filter_alt, Colors.blue, {'freq': 1000.0, 'q': 0.707}, 'Core'),
  _NodeType('highpass', 'High-Pass Filter', Icons.filter_alt_off, Colors.indigo, {'freq': 500.0, 'q': 0.707}, 'Core'),
  _NodeType('gain', 'Gain', Icons.volume_up, Colors.green, {'factor': 1.0}, 'Core'),

  // Character / Spatial
  _NodeType('ring_mod', 'Ring Modulator', Icons.settings_input_component, Colors.red, {'mod_freq': 50.0, 'quantize_steps': 8.0}, 'Character'),
  _NodeType('chorus', 'Chorus', Icons.groups, Colors.blue, {'delay_ms': 25.0, 'depth_ms': 5.0, 'rate_hz': 1.5, 'mix': 0.5}, 'Character'),
  _NodeType('reverb', 'Reverb', Icons.church, Colors.purple, {}, 'Character'),

  // Post Processing
  _NodeType('limiter', 'Limiter', Icons.compress, Colors.orange, {}, 'Post'),
  _NodeType('lookahead_limiter', 'Lookahead Limiter', Icons.shield, Colors.orange, {'ceiling_db': -1.0}, 'Post'),
  _NodeType('loudness_norm', 'Loudness Normalizer', Icons.tune, Colors.orange, {'target_lufs': -14.0}, 'Post'),
];

class ChainEditorScreen extends ConsumerStatefulWidget {
  final RecordedAudio audio;

  const ChainEditorScreen({super.key, required this.audio});

  @override
  ConsumerState<ChainEditorScreen> createState() => _ChainEditorScreenState();
}

class _ChainEditorScreenState extends ConsumerState<ChainEditorScreen> {
  bool _previewActive = false;

  final List<EffectNode> _nodes = [
    // Default Pre Processing
    const EffectNode(type: 'dc_blocker'),
    const EffectNode(type: 'noise_reduction'),
    const EffectNode(type: 'normalizer', params: {'target_rms': 0.2}),
    // Default Post Processing
    const EffectNode(type: 'lookahead_limiter', params: {'ceiling_db': -1.0}),
    const EffectNode(type: 'loudness_norm', params: {'target_lufs': -14.0}),
  ];

  void _addNode(String type, Map<String, double> defaultParams) {
    setState(() {
      final insertIdx = _nodes.isNotEmpty ? _nodes.length - 1 : 0;
      _nodes.insert(insertIdx, EffectNode(type: type, params: Map.of(defaultParams)));
    });
    _updatePreviewChain();
  }

  void _removeNode(int index) {
    setState(() {
      _nodes.removeAt(index);
    });
    _updatePreviewChain();
  }

  void _reorderNodes(int oldIndex, int newIndex) {
    if (oldIndex == newIndex) return;
    if (newIndex > oldIndex) newIndex -= 1;

    setState(() {
      final node = _nodes.removeAt(oldIndex);
      _nodes.insert(newIndex, node);
    });
    _updatePreviewChain();
  }

  void _updateParam(int nodeIndex, String key, double value) {
    setState(() {
      final node = _nodes[nodeIndex];
      final newParams = Map<String, double>.from(node.params);
      newParams[key] = value;
      _nodes[nodeIndex] = node.copyWith(params: newParams);
    });
    _updatePreviewChain();
  }

  EffectChain _buildChain() => EffectChain(
        name: 'Custom',
        nodes: List.from(_nodes),
      );

  void _processChain() {
    if (_nodes.isEmpty) return;
    ref.read(processorStateProvider.notifier).processWithChain(widget.audio, _buildChain());
  }

  void _togglePreview() {
    final engine = ref.read(engineProvider);
    setState(() {
      _previewActive = !_previewActive;
    });

    if (_previewActive) {
      engine.setChain(_buildChain().toJson());
      engine.startRealtime();
    } else {
      engine.stopRealtime();
    }
  }

  void _updatePreviewChain() {
    if (_previewActive) {
      ref.read(engineProvider).setChain(_buildChain().toJson());
    }
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
        title: const Text('Chain Editor'),
        actions: [
          // Live preview toggle
          IconButton(
            icon: Icon(
              _previewActive ? Icons.hearing : Icons.hearing_disabled,
              color: _previewActive ? Colors.green : null,
            ),
            tooltip: _previewActive ? 'Preview On' : 'Preview Off',
            onPressed: _togglePreview,
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
              // Chain visualization
              Expanded(
                child: _nodes.isEmpty
                    ? const Center(child: Text('Add effects to build your chain'))
                    : ReorderableListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _nodes.length,
                        onReorder: _reorderNodes,
                        itemBuilder: (context, index) {
                          final node = _nodes[index];
                          final meta = _nodeTypes.firstWhere(
                            (t) => t.type == node.type,
                            orElse: () => _nodeTypes.last,
                          );

                          return _NodeCard(
                            key: ValueKey('$index-${node.type}'),
                            node: node,
                            meta: meta,
                            isLocked: false,
                            onRemove: () => _removeNode(index),
                            onParamChanged: (key, value) => _updateParam(index, key, value),
                          );
                        },
                      ),
              ),

              // Process button
              Padding(
                padding: const EdgeInsets.all(16),
                child: SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton.icon(
                    onPressed: _nodes.isNotEmpty ? _processChain : null,
                    icon: const Icon(Icons.play_arrow, size: 28),
                    label: const Text('Apply Chain', style: TextStyle(fontSize: 18)),
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

  void _showAddNodeDialog(BuildContext context) {
    final categories = <String, List<_NodeType>>{};
    for (final meta in _nodeTypes) {
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
              child: Text('Add Effect', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            ),
            for (final entry in categories.entries) ...[
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                child: Text(
                  entry.key,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey.shade600,
                  ),
                ),
              ),
              ...entry.value.map((meta) => ListTile(
                    leading: CircleAvatar(
                      backgroundColor: meta.color,
                      child: Icon(meta.icon, color: Colors.white, size: 20),
                    ),
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
}

class _NodeCard extends StatelessWidget {
  final EffectNode node;
  final _NodeType meta;
  final bool isLocked;
  final VoidCallback? onRemove;
  final void Function(String key, double value) onParamChanged;

  const _NodeCard({
    super.key,
    required this.node,
    required this.meta,
    required this.isLocked,
    this.onRemove,
    required this.onParamChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (!isLocked) const Icon(Icons.drag_handle, color: Colors.grey),
                const SizedBox(width: 8),
                CircleAvatar(
                  radius: 16,
                  backgroundColor: meta.color,
                  child: Icon(meta.icon, color: Colors.white, size: 16),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    meta.name,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
                if (isLocked)
                  const Icon(Icons.lock, color: Colors.grey, size: 18)
                else if (onRemove != null)
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.red),
                    onPressed: onRemove,
                    iconSize: 20,
                  ),
              ],
            ),
            // Parameter sliders
            ...node.params.entries.map((entry) {
              final paramMeta = _getParamMeta(meta.type, entry.key);
              return Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Row(
                  children: [
                    SizedBox(
                      width: 80,
                      child: Text(
                        paramMeta?.name ?? entry.key,
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ),
                    Expanded(
                      child: Slider(
                        value: entry.value.clamp(paramMeta?.min ?? 0, paramMeta?.max ?? 100),
                        min: paramMeta?.min ?? 0,
                        max: paramMeta?.max ?? 100,
                        onChanged: (v) => onParamChanged(entry.key, v),
                      ),
                    ),
                    SizedBox(
                      width: 50,
                      child: Text(
                        entry.value.toStringAsFixed(entry.value < 10 ? 2 : 0),
                        style: const TextStyle(fontSize: 12),
                        textAlign: TextAlign.right,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

_ParamMeta? _getParamMeta(String nodeType, String key) {
  const paramDefs = {
    // Pre Processing
    'normalizer': {'target_rms': _ParamMeta('RMS', 0.01, 1.0)},
    'vad': {'threshold_db': _ParamMeta('Threshold dB', -60, -10)},
    // Core Processing
    'pitch_shift': {'factor': _ParamMeta('Speed', 0.25, 4.0)},
    'lowpass': {
      'freq': _ParamMeta('Freq (Hz)', 20, 20000),
      'q': _ParamMeta('Q', 0.1, 10),
    },
    'highpass': {
      'freq': _ParamMeta('Freq (Hz)', 20, 20000),
      'q': _ParamMeta('Q', 0.1, 10),
    },
    'gain': {'factor': _ParamMeta('Volume', 0, 4)},
    // Character
    'ring_mod': {
      'mod_freq': _ParamMeta('Mod Hz', 1, 1000),
      'quantize_steps': _ParamMeta('Steps', 0, 64),
    },
    'chorus': {
      'delay_ms': _ParamMeta('Delay ms', 1, 100),
      'depth_ms': _ParamMeta('Depth ms', 0.1, 20),
      'rate_hz': _ParamMeta('Rate Hz', 0.1, 10),
      'mix': _ParamMeta('Mix', 0, 1),
    },
    // Post Processing
    'lookahead_limiter': {'ceiling_db': _ParamMeta('Ceiling dB', -12, 0)},
    'loudness_norm': {'target_lufs': _ParamMeta('LUFS', -30, -6)},
  };
  return paramDefs[nodeType]?[key];
}

class _ParamMeta {
  final String name;
  final double min;
  final double max;

  const _ParamMeta(this.name, this.min, this.max);
}

class _NodeType {
  final String type;
  final String name;
  final IconData icon;
  final Color color;
  final Map<String, double> defaultParams;
  final String category;

  const _NodeType(this.type, this.name, this.icon, this.color, this.defaultParams, this.category);
}
