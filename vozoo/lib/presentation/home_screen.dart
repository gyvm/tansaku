import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../application/providers.dart';
import '../application/recorder_use_case.dart'; // Import for RecorderStatus enum
import 'effect_select_screen.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    final millis = (d.inMilliseconds % 1000 ~/ 100).toString();
    return '$minutes:$seconds.$millis';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(recorderStateProvider);
    final notifier = ref.read(recorderStateProvider.notifier);

    // Listen for completion
    ref.listen(recorderStateProvider, (previous, next) {
      if (previous?.status == RecorderStatus.recording &&
          next.status == RecorderStatus.idle &&
          next.lastRecording != null) {

        // Use Future.microtask to navigate after build
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

      if (next.error != null) {
         // Show error only if it's new
         if (previous?.error != next.error) {
             ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Error: ${next.error}')),
             );
         }
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Vozoo Recorder')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (state.status == RecorderStatus.recording) ...[
              const Text(
                'Recording...',
                style: TextStyle(color: Colors.red, fontSize: 24, fontWeight: FontWeight.bold),
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
