import 'dart:ui' show FontFeature;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../application/providers.dart';
import '../application/recorder_use_case.dart';
import '../domain/entities/effect_chain.dart';
import '../domain/entities/effect_node.dart';
import 'simple_voice_screen.dart';
import 'widgets.dart';

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
                builder: (context) => SimpleVoiceScreen(audio: next.lastRecording!),
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

    final recording = state.status == RecorderStatus.recording;

    return Scaffold(
      appBar: AppBar(
        title: const Text('こえ あそび'),
        centerTitle: true,
        actions: [
          // Live monitoring (advanced, kept subtle).
          IconButton(
            icon: Icon(
              _monitorEnabled ? Icons.headset : Icons.headset_off,
              color: _monitorEnabled ? Colors.green : null,
            ),
            tooltip: _monitorEnabled ? 'モニターオン' : 'モニターオフ',
            onPressed: !recording ? _toggleMonitor : null,
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              recording ? 'ろくおん ちゅう' : 'こえを ろくおん しよう',
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 24),
            Text(
              _formatDuration(state.duration),
              style: TextStyle(
                fontSize: 44,
                fontFeatures: const [FontFeature.tabularFigures()],
                color: recording ? Colors.red : Colors.black38,
              ),
            ),
            const SizedBox(height: 36),
            // One big, obvious button: tap to start, tap to stop.
            CircleButton(
              icon: recording ? Icons.stop_rounded : Icons.mic_rounded,
              color: recording ? Colors.red : kAccent,
              size: 160,
              onPressed: () =>
                  recording ? notifier.stopRecording() : notifier.startRecording(),
            ),
            const SizedBox(height: 20),
            Text(
              recording ? 'おしたら とまるよ' : 'おしてね',
              style: const TextStyle(fontSize: 16, color: Colors.black87),
            ),
            if (_monitorEnabled && !recording) ...[
              const SizedBox(height: 24),
              const _MonitorChip(),
            ],
          ],
        ),
      ),
    );
  }
}

class _MonitorChip extends StatelessWidget {
  const _MonitorChip();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.green.shade200),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.headset, color: Colors.green, size: 18),
          SizedBox(width: 6),
          Text('じぶんの こえが きこえるよ',
              style: TextStyle(color: Colors.green, fontSize: 13)),
        ],
      ),
    );
  }
}
