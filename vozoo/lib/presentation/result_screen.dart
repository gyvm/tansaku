import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/entities/recorded_audio.dart';
import '../application/providers.dart';

class ResultScreen extends ConsumerStatefulWidget {
  final RecordedAudio audio;

  const ResultScreen({super.key, required this.audio});

  @override
  ConsumerState<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends ConsumerState<ResultScreen> {
  @override
  void dispose() {
    // Stop playing when leaving screen
    ref.read(playerStateProvider.notifier).stop();
    super.dispose();
  }

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    final playerState = ref.watch(playerStateProvider);
    final playerNotifier = ref.read(playerStateProvider.notifier);
    final shareService = ref.read(shareServiceProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Result')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.music_note, size: 100, color: Colors.deepPurple),
            const SizedBox(height: 40),

            // Progress Bar
            LinearProgressIndicator(
              value: playerState.duration.inMilliseconds > 0
                  ? playerState.position.inMilliseconds / playerState.duration.inMilliseconds
                  : 0.0,
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(_formatDuration(playerState.position)),
                Text(_formatDuration(playerState.duration)),
              ],
            ),

            const SizedBox(height: 40),

            // Play/Pause
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  icon: Icon(playerState.isPlaying ? Icons.pause_circle_filled : Icons.play_circle_filled),
                  iconSize: 80,
                  color: Colors.deepPurple,
                  onPressed: () {
                    if (playerState.isPlaying) {
                      playerNotifier.pause();
                    } else {
                      playerNotifier.play(widget.audio.path);
                    }
                  },
                ),
              ],
            ),

            const SizedBox(height: 60),

            // Actions
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton.icon(
                  onPressed: () {
                      // Save is technically already done (file exists).
                      // We can copy it to Downloads or Music folder if needed,
                      // but MVP requirement says "Save (write to device)" which we did.
                      // Maybe show "Saved" toast.
                      ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('File saved at: ${widget.audio.path}')),
                      );
                  },
                  icon: const Icon(Icons.save),
                  label: const Text('Save'),
                ),
                ElevatedButton.icon(
                  onPressed: () {
                    shareService.shareFile(widget.audio.path, text: 'Check out my voice!');
                  },
                  icon: const Icon(Icons.share),
                  label: const Text('Share'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
