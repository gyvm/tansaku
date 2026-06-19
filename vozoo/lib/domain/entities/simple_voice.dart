import 'package:flutter/material.dart';
import 'effect_chain.dart';
import 'effect_node.dart';

/// Domain definitions for the kids-friendly "Simple Voice" feature.
///
/// See docs/SIMPLE_VOICE_SPEC.md. Everything here is built only from effect
/// nodes that actually exist in the Rust engine (`chain_def.rs`). Pitch always
/// uses the `semitones` convention; reverb is always `convolution_reverb`
/// (whose strength is controlled by `dry_wet`).
///
/// No limiter node is added here on purpose: the backend appends a limiter to
/// every chain (SIMPLE_VOICE_SPEC.md §6), so chains stay declarative and safe.

/// One tappable character on the かんたん (easy) tab.
class SimpleCharacter {
  /// ASCII id, used for the output file name (kept filename-safe).
  final String id;

  /// Japanese display label (kana, no furigana needed).
  final String label;
  final String emoji;
  final Color color;
  final List<EffectNode> nodes;

  const SimpleCharacter({
    required this.id,
    required this.label,
    required this.emoji,
    required this.color,
    required this.nodes,
  });

  EffectChain toChain() => EffectChain(name: id, nodes: nodes);
}

/// The six characters from SIMPLE_VOICE_SPEC.md §4.1.
const List<SimpleCharacter> kSimpleCharacters = [
  SimpleCharacter(
    id: 'gorilla',
    label: 'ゴリラ',
    emoji: '🦍',
    color: Color(0xFF8D6E63), // brown
    nodes: [
      EffectNode(type: 'pitch_shift', params: {'semitones': -5.0}),
      EffectNode(type: 'formant_shift', params: {'shift_factor': 0.8}),
    ],
  ),
  SimpleCharacter(
    id: 'cat',
    label: 'ねこ',
    emoji: '🐱',
    color: Color(0xFFFFB74D), // orange
    nodes: [
      EffectNode(type: 'pitch_shift', params: {'semitones': 6.0}),
      EffectNode(type: 'formant_shift', params: {'shift_factor': 1.25}),
    ],
  ),
  SimpleCharacter(
    id: 'robot',
    label: 'ロボット',
    emoji: '🤖',
    color: Color(0xFF90A4AE), // blue grey
    nodes: [
      EffectNode(
        type: 'ring_mod',
        params: {'mod_freq': 50.0, 'quantize_steps': 8.0, 'mix': 0.8},
      ),
      EffectNode(type: 'convolution_reverb', params: {'dry_wet': 0.15}),
    ],
  ),
  SimpleCharacter(
    id: 'ghost',
    label: 'おばけ',
    emoji: '👻',
    color: Color(0xFF9575CD), // purple
    nodes: [
      EffectNode(type: 'pitch_shift', params: {'semitones': -2.0}),
      EffectNode(type: 'convolution_reverb', params: {'dry_wet': 0.5}),
    ],
  ),
  SimpleCharacter(
    id: 'fairy',
    label: 'ようせい',
    emoji: '🧚',
    color: Color(0xFF4FC3F7), // light blue
    nodes: [
      EffectNode(type: 'pitch_shift', params: {'semitones': 9.0}),
      EffectNode(type: 'formant_shift', params: {'shift_factor': 1.3}),
      EffectNode(type: 'chorus', params: {'mix': 0.4}),
      EffectNode(type: 'convolution_reverb', params: {'dry_wet': 0.2}),
    ],
  ),
  SimpleCharacter(
    id: 'alien',
    label: 'うちゅうじん',
    emoji: '👽',
    color: Color(0xFF81C784), // green
    nodes: [
      EffectNode(type: 'pitch_shift', params: {'semitones': -3.0}),
      EffectNode(
        type: 'ring_mod',
        params: {'mod_freq': 80.0, 'quantize_steps': 6.0, 'mix': 0.6},
      ),
      EffectNode(type: 'convolution_reverb', params: {'dry_wet': 0.3}),
    ],
  ),
];

/// Default (neutral) values for the カスタム (custom) tab sliders.
/// When a slider sits on its default, the corresponding node is omitted so the
/// result is a true pass-through (SIMPLE_VOICE_SPEC.md §4.2).
class CustomVoiceSettings {
  final double pitchSemitones; // -12..12, default 0
  final double formantFactor; // 0.7..1.4, default 1.0
  final double reverbDryWet; // 0..0.6, default 0
  final double robotMix; // 0..1, default 0

  const CustomVoiceSettings({
    this.pitchSemitones = 0,
    this.formantFactor = 1.0,
    this.reverbDryWet = 0,
    this.robotMix = 0,
  });

  static const CustomVoiceSettings defaults = CustomVoiceSettings();

  CustomVoiceSettings copyWith({
    double? pitchSemitones,
    double? formantFactor,
    double? reverbDryWet,
    double? robotMix,
  }) {
    return CustomVoiceSettings(
      pitchSemitones: pitchSemitones ?? this.pitchSemitones,
      formantFactor: formantFactor ?? this.formantFactor,
      reverbDryWet: reverbDryWet ?? this.reverbDryWet,
      robotMix: robotMix ?? this.robotMix,
    );
  }

  /// Builds the chain, skipping any node whose slider is at its default.
  /// Uses small epsilons so floating-point drift near defaults still counts as
  /// "off". Returns nodes in a fixed, musically sensible order.
  EffectChain toChain() {
    final nodes = <EffectNode>[];

    if (pitchSemitones.abs() > 0.05) {
      nodes.add(EffectNode(
        type: 'pitch_shift',
        params: {'semitones': pitchSemitones},
      ));
    }
    if ((formantFactor - 1.0).abs() > 0.005) {
      nodes.add(EffectNode(
        type: 'formant_shift',
        params: {'shift_factor': formantFactor},
      ));
    }
    if (robotMix > 0.005) {
      nodes.add(EffectNode(
        type: 'ring_mod',
        params: {'mod_freq': 50.0, 'quantize_steps': 8.0, 'mix': robotMix},
      ));
    }
    if (reverbDryWet > 0.005) {
      nodes.add(EffectNode(
        type: 'convolution_reverb',
        params: {'dry_wet': reverbDryWet},
      ));
    }

    return EffectChain(name: 'custom', nodes: nodes);
  }

  /// True when every slider is at its default (would be a pass-through).
  bool get isNeutral => toChain().nodes.isEmpty;
}
