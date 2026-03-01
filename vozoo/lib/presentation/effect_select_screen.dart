import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/entities/recorded_audio.dart';
import '../domain/entities/voice_preset.dart';
import '../application/providers.dart';
import '../application/processor_use_case.dart'; // Import for ProcessorNotifier type
import 'result_screen.dart';

class EffectSelectScreen extends ConsumerWidget {
  final RecordedAudio audio;

  const EffectSelectScreen({super.key, required this.audio});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(processorStateProvider);
    final notifier = ref.read(processorStateProvider.notifier);

    // Listen for completion
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
      appBar: AppBar(title: const Text('Select Voice Effect')),
      body: Stack(
        children: [
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _buildEffectTile(context, notifier, VoicePreset.gorilla, 'Gorilla', Icons.pets, Colors.brown),
              _buildEffectTile(context, notifier, VoicePreset.cat, 'Cat', Icons.cruelty_free, Colors.orange), // cruelty_free looks like cat paw/face
              _buildEffectTile(context, notifier, VoicePreset.robot, 'Robot', Icons.smart_toy, Colors.grey),
              _buildEffectTile(context, notifier, VoicePreset.chorus, 'Chorus', Icons.groups, Colors.blue),
              _buildEffectTile(context, notifier, VoicePreset.reverb, 'Reverb', Icons.church, Colors.purple),
            ],
          ),
          if (state.isProcessing)
            Container(
              color: Colors.black54,
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildEffectTile(
    BuildContext context,
    ProcessorNotifier notifier,
    VoicePreset preset,
    String title,
    IconData icon,
    Color color,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color,
          child: Icon(icon, color: Colors.white),
        ),
        title: Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        trailing: const Icon(Icons.arrow_forward_ios),
        onTap: () {
          notifier.process(audio, preset);
        },
      ),
    );
  }
}
