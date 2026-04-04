import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../application/providers.dart';
import '../application/recorder_use_case.dart';
import '../domain/entities/effect_chain.dart';
import '../domain/entities/effect_node.dart';
import 'effect_select_screen.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  bool _monitorEnabled = false;

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    final millis = (d.inMilliseconds % 1000 ~/ 100).toString();
    return '$minutes:$seconds.$millis';
  }

  void _toggleMonitor() {
    final engine = ref.read(engineProvider);
    setState(() {
      _monitorEnabled = !_monitorEnabled;
    });

    if (_monitorEnabled) {
      // Start real-time with a passthrough chain (just limiter)
      final chain = const EffectChain(
        name: 'Monitor',
        nodes: [EffectNode(type: 'limiter')],
      );
      engine.setChain(chain.toJson());
      engine.startRealtime();
    } else {
      engine.stopRealtime();
    }
  }

  @override
  void dispose() {
    // Stop monitoring when leaving screen
    if (_monitorEnabled) {
      ref.read(engineProvider).stopRealtime();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(recorderStateProvider);
    final notifier = ref.read(recorderStateProvider.notifier);

    ref.listen(recorderStateProvider, (previous, next) {
      if (previous?.status == RecorderStatus.recording &&
          next.status == RecorderStatus.idle &&
          next.lastRecording != null) {
        Future.microtask(() {
          if (context.mounted) {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => EffectSelectScreen(audio: next.lastRecording!),
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
        title: const Text('Vozoo'),
        actions: [
          // Monitor toggle
          IconButton(
            icon: Icon(
              _monitorEnabled ? Icons.headset : Icons.headset_off,
              color: _monitorEnabled ? Colors.green : null,
            ),
            tooltip: _monitorEnabled ? 'Monitor On' : 'Monitor Off',
            onPressed: state.status != RecorderStatus.recording ? _toggleMonitor : null,
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (state.status == RecorderStatus.recording) ...[
              const Text(
                'Recording...',
                style: TextStyle(color: Colors.red, fontSize: 24, fontWeight: FontWeight.bold),
              ),
              if (_monitorEnabled)
                const Text(
                  'Live monitoring enabled',
                  style: TextStyle(color: Colors.green, fontSize: 14),
                ),
              const SizedBox(height: 20),
              Text(
                _formatDuration(state.duration),
                style: const TextStyle(fontSize: 48, fontFamily: 'Monospace'),
              ),
              const SizedBox(height: 40),
              ElevatedButton.icon(
                onPressed: () => notifier.stopRecording(),
                icon: const Icon(Icons.stop, size: 32),
                label: const Text('STOP RECORDING'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red.shade100,
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                ),
              ),
            ] else ...[
              const Text(
                'Ready to Record',
                style: TextStyle(fontSize: 24),
              ),
              const SizedBox(height: 16),
              if (_monitorEnabled)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.green.shade200),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.headset, color: Colors.green, size: 16),
                      SizedBox(width: 4),
                      Text('Monitor active', style: TextStyle(color: Colors.green, fontSize: 12)),
                    ],
                  ),
                ),
              const SizedBox(height: 40),
              ElevatedButton.icon(
                onPressed: () => notifier.startRecording(),
                icon: const Icon(Icons.mic, size: 32),
                label: const Text('START RECORDING'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.deepPurple.shade100,
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
