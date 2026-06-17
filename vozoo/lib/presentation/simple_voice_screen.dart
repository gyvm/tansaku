import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/entities/recorded_audio.dart';
import '../domain/entities/simple_voice.dart';
import '../application/providers.dart';
import 'result_screen.dart';
import 'effect_select_screen.dart';

/// Kids-friendly voice transform screen (SIMPLE_VOICE_SPEC.md).
///
/// Two tabs: かんたん (one-tap characters) and カスタム (four big sliders).
/// Builds an [EffectChain] and processes it; the backend appends a limiter and
/// clamps params, so anything chosen here is safe.
class SimpleVoiceScreen extends ConsumerStatefulWidget {
  final RecordedAudio audio;

  const SimpleVoiceScreen({super.key, required this.audio});

  @override
  ConsumerState<SimpleVoiceScreen> createState() => _SimpleVoiceScreenState();
}

class _SimpleVoiceScreenState extends ConsumerState<SimpleVoiceScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tab = TabController(length: 2, vsync: this);
  CustomVoiceSettings _custom = CustomVoiceSettings.defaults;
  String? _selectedCharacterId;

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  void _processCharacter(SimpleCharacter c) {
    setState(() => _selectedCharacterId = c.id);
    ref.read(processorStateProvider.notifier).processWithChain(
          widget.audio,
          c.toChain(),
        );
  }

  void _processCustom() {
    ref.read(processorStateProvider.notifier).processWithChain(
          widget.audio,
          _custom.toChain(),
        );
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
          SnackBar(content: Text('うまくいかなかったよ: ${next.error}')),
        );
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('こえを へんしんしよう'),
        actions: [
          // Advanced (existing) editors live behind "もっと".
          TextButton(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => EffectSelectScreen(audio: widget.audio),
                ),
              );
            },
            child: const Text('もっと'),
          ),
        ],
        bottom: TabBar(
          controller: _tab,
          labelStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          tabs: const [
            Tab(text: 'かんたん'),
            Tab(text: 'カスタム'),
          ],
        ),
      ),
      body: Stack(
        children: [
          TabBarView(
            controller: _tab,
            children: [
              _buildEasyTab(),
              _buildCustomTab(),
            ],
          ),
          if (state.isProcessing)
            Container(
              color: Colors.black54,
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text(
                      'へんしんちゅう...',
                      style: TextStyle(color: Colors.white, fontSize: 18),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ---- かんたん tab -------------------------------------------------------

  Widget _buildEasyTab() {
    return GridView.count(
      padding: const EdgeInsets.all(16),
      crossAxisCount: 2,
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      childAspectRatio: 1.05,
      children: kSimpleCharacters
          .map((c) => _CharacterCard(
                character: c,
                selected: _selectedCharacterId == c.id,
                onTap: () => _processCharacter(c),
              ))
          .toList(),
    );
  }

  // ---- カスタム tab ------------------------------------------------------

  Widget _buildCustomTab() {
    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              _BigSlider(
                label: '🎵 こえの たかさ',
                leftHint: '🐘',
                rightHint: '🐭',
                value: _custom.pitchSemitones,
                min: -12,
                max: 12,
                center: 0,
                onChanged: (v) => setState(
                  () => _custom = _custom.copyWith(pitchSemitones: v),
                ),
              ),
              _BigSlider(
                label: '🫧 こえの ふとさ',
                leftHint: 'ふとい',
                rightHint: 'ほそい',
                value: _custom.formantFactor,
                min: 0.7,
                max: 1.4,
                center: 1.0,
                onChanged: (v) => setState(
                  () => _custom = _custom.copyWith(formantFactor: v),
                ),
              ),
              _BigSlider(
                label: '🏞 ひびき',
                leftHint: 'なし',
                rightHint: 'つよい',
                value: _custom.reverbDryWet,
                min: 0,
                max: 0.6,
                center: 0,
                onChanged: (v) => setState(
                  () => _custom = _custom.copyWith(reverbDryWet: v),
                ),
              ),
              _BigSlider(
                label: '🤖 ロボットみ',
                leftHint: 'オフ',
                rightHint: 'ぜんかい',
                value: _custom.robotMix,
                min: 0,
                max: 1,
                center: 0,
                onChanged: (v) => setState(
                  () => _custom = _custom.copyWith(robotMix: v),
                ),
              ),
            ],
          ),
        ),
        _buildBottomBar(),
      ],
    );
  }

  Widget _buildBottomBar() {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
        child: SizedBox(
          height: 60,
          child: ElevatedButton.icon(
            onPressed: _processCustom,
            icon: const Icon(Icons.play_arrow, size: 32),
            label: const Text(
              'きいてみる',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.deepOrange,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _CharacterCard extends StatelessWidget {
  final SimpleCharacter character;
  final bool selected;
  final VoidCallback onTap;

  const _CharacterCard({
    required this.character,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: character.color,
      borderRadius: BorderRadius.circular(24),
      elevation: selected ? 8 : 2,
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            border: selected
                ? Border.all(color: Colors.white, width: 4)
                : null,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(character.emoji, style: const TextStyle(fontSize: 64)),
              const SizedBox(height: 8),
              Text(
                character.label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A large, kid-friendly slider with emoji/word hints and center snapping.
class _BigSlider extends StatelessWidget {
  final String label;
  final String leftHint;
  final String rightHint;
  final double value;
  final double min;
  final double max;
  final double center;
  final ValueChanged<double> onChanged;

  const _BigSlider({
    required this.label,
    required this.leftHint,
    required this.rightHint,
    required this.value,
    required this.min,
    required this.max,
    required this.center,
    required this.onChanged,
  });

  /// Snap to [center] when within ±5% of the full range (SPEC §4.2).
  double _snap(double v) {
    final threshold = (max - min) * 0.05;
    if ((v - center).abs() <= threshold) return center;
    return v;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          Row(
            children: [
              Text(leftHint, style: const TextStyle(fontSize: 16)),
              Expanded(
                child: SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    trackHeight: 8,
                    thumbShape:
                        const RoundSliderThumbShape(enabledThumbRadius: 16),
                    overlayShape:
                        const RoundSliderOverlayShape(overlayRadius: 28),
                  ),
                  child: Slider(
                    value: value.clamp(min, max).toDouble(),
                    min: min,
                    max: max,
                    onChanged: (v) => onChanged(_snap(v)),
                  ),
                ),
              ),
              Text(rightHint, style: const TextStyle(fontSize: 16)),
            ],
          ),
        ],
      ),
    );
  }
}
