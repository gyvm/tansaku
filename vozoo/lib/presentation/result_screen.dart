import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/entities/recorded_audio.dart';
import '../application/providers.dart';
import 'widgets.dart';

class ResultScreen extends ConsumerStatefulWidget {
  final RecordedAudio audio;

  const ResultScreen({super.key, required this.audio});

  @override
  ConsumerState<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends ConsumerState<ResultScreen> {
  @override
  void initState() {
    super.initState();
    // Auto-play the transformed voice on open so kids hear it immediately
    // (SIMPLE_VOICE_SPEC.md §8). Deferred until after first frame.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        ref.read(playerStateProvider.notifier).play(widget.audio.path);
      }
    });
  }

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

    final progress = playerState.duration.inMilliseconds > 0
        ? playerState.position.inMilliseconds / playerState.duration.inMilliseconds
        : 0.0;

    return Scaffold(
      appBar: AppBar(title: const Text('できた！'), centerTitle: true),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              const Spacer(),
              // Friendly hero.
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: kAccent.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Text('🎉', style: TextStyle(fontSize: 64)),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'あたらしい こえ ができたよ',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 32),

              // Progress bar
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(value: progress, minHeight: 8),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(_formatDuration(playerState.position)),
                  Text(_formatDuration(playerState.duration)),
                ],
              ),
              const SizedBox(height: 24),

              // Big play / pause
              CircleButton(
                icon: playerState.isPlaying
                    ? Icons.pause_rounded
                    : Icons.play_arrow_rounded,
                color: kAccent,
                size: 96,
                onPressed: () {
                  if (playerState.isPlaying) {
                    playerNotifier.pause();
                  } else {
                    playerNotifier.play(widget.audio.path);
                  }
                },
              ),

              const Spacer(),

              // Primary action: try another voice.
              BigButton(
                icon: Icons.refresh_rounded,
                label: 'もう いちど',
                onPressed: () => Navigator.of(context).pop(),
              ),
              const SizedBox(height: 16),

              // Secondary actions.
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  PillButton(
                    icon: Icons.save_alt_rounded,
                    label: 'ほぞん',
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('ほぞん したよ')),
                      );
                    },
                  ),
                  PillButton(
                    icon: Icons.ios_share_rounded,
                    label: 'おくる',
                    onPressed: () {
                      shareService.shareFile(widget.audio.path,
                          text: 'ぼく・わたしの こえ きいてね！');
                    },
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Text(
                'しらない人に じぶんの こえを おくらないでね',
                style: TextStyle(fontSize: 12, color: Colors.black54),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
