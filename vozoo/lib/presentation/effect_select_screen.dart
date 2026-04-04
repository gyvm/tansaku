import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/entities/recorded_audio.dart';
import '../domain/entities/voice_preset.dart';
import '../application/providers.dart';
import '../application/processor_use_case.dart';
import 'chain_editor_screen.dart';
import 'result_screen.dart';

class EffectSelectScreen extends ConsumerWidget {
  final RecordedAudio audio;

  const EffectSelectScreen({super.key, required this.audio});

  static const _presetMeta = [
    _PresetInfo('Gorilla', Icons.pets, Colors.brown, VoicePreset.gorilla),
    _PresetInfo('Cat', Icons.cruelty_free, Colors.orange, VoicePreset.cat),
    _PresetInfo('Robot', Icons.smart_toy, Colors.grey, VoicePreset.robot),
    _PresetInfo('Chorus', Icons.groups, Colors.blue, VoicePreset.chorus),
    _PresetInfo('Reverb', Icons.church, Colors.purple, VoicePreset.reverb),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(processorStateProvider);
    final notifier = ref.read(processorStateProvider.notifier);

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
              // Preset section
              const Padding(
                padding: EdgeInsets.only(bottom: 8),
                child: Text(
                  'Presets',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
              ..._presetMeta.map((info) => _buildPresetTile(
                    context, notifier, info.preset, info.title, info.icon, info.color)),

              const SizedBox(height: 24),

              // Custom chain section
              const Padding(
                padding: EdgeInsets.only(bottom: 8),
                child: Text(
                  'Custom Chain',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
              Card(
                margin: const EdgeInsets.only(bottom: 16),
                child: ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: Colors.deepPurple,
                    child: Icon(Icons.tune, color: Colors.white),
                  ),
                  title: const Text(
                    'Build Custom Chain',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  subtitle: const Text('Combine effects in any order'),
                  trailing: const Icon(Icons.arrow_forward_ios),
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) => ChainEditorScreen(audio: audio),
                      ),
                    );
                  },
                ),
              ),
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

  Widget _buildPresetTile(
    BuildContext context,
    ProcessorNotifier notifier,
    VoicePreset preset,
    String title,
    IconData icon,
    Color color,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
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

class _PresetInfo {
  final String title;
  final IconData icon;
  final Color color;
  final VoicePreset preset;

  const _PresetInfo(this.title, this.icon, this.color, this.preset);
}
