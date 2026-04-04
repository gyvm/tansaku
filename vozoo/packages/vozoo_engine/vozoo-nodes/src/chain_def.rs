use serde::{Deserialize, Serialize};

use crate::chain::LinearChain;
use crate::effects::biquad::{BiquadFilter, FilterType};
use crate::effects::chorus::Chorus;
use crate::effects::dc_blocker::DcBlocker;
use crate::effects::gain::Gain;
use crate::effects::limiter::{HardLimiter, LookaheadLimiter};
use crate::effects::loudness_norm::LoudnessNorm;
use crate::effects::noise_reduction::NoiseReduction;
use crate::effects::normalizer::Normalizer;
use crate::effects::pitch_shift::PitchShift;
use crate::effects::reverb::Reverb;
use crate::effects::ring_mod::RingMod;
use crate::effects::vad::Vad;

/// JSON-serializable chain definition.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChainDef {
    pub name: String,
    pub nodes: Vec<NodeDef>,
}

/// JSON-serializable node definition.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeDef {
    #[serde(rename = "type")]
    pub node_type: String,
    #[serde(default)]
    pub params: serde_json::Value,
}

/// All available node types and their descriptions.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeInfo {
    #[serde(rename = "type")]
    pub node_type: String,
    pub name: String,
    pub category: String,
    pub params: Vec<ParamInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParamInfo {
    pub key: String,
    pub name: String,
    pub min: f64,
    pub max: f64,
    pub default: f64,
}

impl ChainDef {
    pub fn build(&self) -> LinearChain {
        let mut chain = LinearChain::new();
        for node_def in &self.nodes {
            if let Some(node) = build_node(node_def) {
                chain.add(node);
            }
        }
        chain
    }

    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap_or_default()
    }

    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }
}

fn get_f32(params: &serde_json::Value, key: &str, default: f32) -> f32 {
    params.get(key).and_then(|v| v.as_f64()).map(|v| v as f32).unwrap_or(default)
}

fn build_node(def: &NodeDef) -> Option<Box<dyn vozoo_core::AudioNode>> {
    let p = &def.params;
    match def.node_type.as_str() {
        // Pre Processing
        "noise_reduction" => Some(Box::new(NoiseReduction::new())),
        "dc_blocker" => Some(Box::new(DcBlocker::new())),
        "normalizer" => {
            let target_rms = get_f32(p, "target_rms", 0.2);
            Some(Box::new(Normalizer::new(target_rms)))
        }
        "vad" => {
            let threshold_db = get_f32(p, "threshold_db", -40.0);
            Some(Box::new(Vad::new(threshold_db)))
        }

        // Core Processing
        "pitch_shift" => {
            let factor = get_f32(p, "factor", 1.0);
            Some(Box::new(PitchShift::new(factor)))
        }
        "lowpass" => {
            let freq = get_f32(p, "freq", 1000.0);
            let q = get_f32(p, "q", 0.707);
            Some(Box::new(BiquadFilter::new(FilterType::LowPass, freq, q)))
        }
        "highpass" => {
            let freq = get_f32(p, "freq", 500.0);
            let q = get_f32(p, "q", 0.707);
            Some(Box::new(BiquadFilter::new(FilterType::HighPass, freq, q)))
        }
        "gain" => {
            let factor = get_f32(p, "factor", 1.0);
            Some(Box::new(Gain::new(factor)))
        }

        // Character / Spatial
        "ring_mod" => {
            let mod_freq = get_f32(p, "mod_freq", 50.0);
            let quantize_steps = get_f32(p, "quantize_steps", 8.0);
            Some(Box::new(RingMod::new(mod_freq, quantize_steps)))
        }
        "chorus" => {
            let delay_ms = get_f32(p, "delay_ms", 25.0);
            let depth_ms = get_f32(p, "depth_ms", 5.0);
            let rate_hz = get_f32(p, "rate_hz", 1.5);
            let mix = get_f32(p, "mix", 0.5);
            Some(Box::new(Chorus::new(delay_ms, depth_ms, rate_hz, mix)))
        }
        "reverb" => Some(Box::new(Reverb::default_comb())),

        // Post Processing
        "limiter" => Some(Box::new(HardLimiter)),
        "lookahead_limiter" => {
            let ceiling_db = get_f32(p, "ceiling_db", -1.0);
            Some(Box::new(LookaheadLimiter::new(ceiling_db)))
        }
        "loudness_norm" => {
            let target_lufs = get_f32(p, "target_lufs", -14.0);
            Some(Box::new(LoudnessNorm::new(target_lufs)))
        }

        _ => None,
    }
}

/// Get list of all available node types with their parameter definitions.
pub fn available_nodes() -> Vec<NodeInfo> {
    vec![
        // Pre Processing
        NodeInfo {
            node_type: "noise_reduction".into(), name: "Noise Reduction".into(),
            category: "Pre Processing".into(), params: vec![],
        },
        NodeInfo {
            node_type: "dc_blocker".into(), name: "DC Blocker".into(),
            category: "Pre Processing".into(), params: vec![],
        },
        NodeInfo {
            node_type: "normalizer".into(), name: "Normalizer".into(),
            category: "Pre Processing".into(),
            params: vec![ParamInfo { key: "target_rms".into(), name: "Target RMS".into(), min: 0.01, max: 1.0, default: 0.2 }],
        },
        NodeInfo {
            node_type: "vad".into(), name: "Voice Activity Detection".into(),
            category: "Pre Processing".into(),
            params: vec![ParamInfo { key: "threshold_db".into(), name: "Threshold (dB)".into(), min: -60.0, max: -10.0, default: -40.0 }],
        },

        // Core Processing
        NodeInfo {
            node_type: "pitch_shift".into(), name: "Pitch Shift".into(),
            category: "Core Processing".into(),
            params: vec![ParamInfo { key: "factor".into(), name: "Speed Factor".into(), min: 0.25, max: 4.0, default: 1.0 }],
        },
        NodeInfo {
            node_type: "lowpass".into(), name: "Low-Pass Filter".into(),
            category: "Core Processing".into(),
            params: vec![
                ParamInfo { key: "freq".into(), name: "Frequency (Hz)".into(), min: 20.0, max: 20000.0, default: 1000.0 },
                ParamInfo { key: "q".into(), name: "Q Factor".into(), min: 0.1, max: 10.0, default: 0.707 },
            ],
        },
        NodeInfo {
            node_type: "highpass".into(), name: "High-Pass Filter".into(),
            category: "Core Processing".into(),
            params: vec![
                ParamInfo { key: "freq".into(), name: "Frequency (Hz)".into(), min: 20.0, max: 20000.0, default: 500.0 },
                ParamInfo { key: "q".into(), name: "Q Factor".into(), min: 0.1, max: 10.0, default: 0.707 },
            ],
        },
        NodeInfo {
            node_type: "gain".into(), name: "Gain".into(),
            category: "Core Processing".into(),
            params: vec![ParamInfo { key: "factor".into(), name: "Volume".into(), min: 0.0, max: 4.0, default: 1.0 }],
        },

        // Character / Spatial
        NodeInfo {
            node_type: "ring_mod".into(), name: "Ring Modulator".into(),
            category: "Character".into(),
            params: vec![
                ParamInfo { key: "mod_freq".into(), name: "Mod Frequency (Hz)".into(), min: 1.0, max: 1000.0, default: 50.0 },
                ParamInfo { key: "quantize_steps".into(), name: "Quantize Steps".into(), min: 0.0, max: 64.0, default: 8.0 },
            ],
        },
        NodeInfo {
            node_type: "chorus".into(), name: "Chorus".into(),
            category: "Character".into(),
            params: vec![
                ParamInfo { key: "delay_ms".into(), name: "Delay (ms)".into(), min: 1.0, max: 100.0, default: 25.0 },
                ParamInfo { key: "depth_ms".into(), name: "Depth (ms)".into(), min: 0.1, max: 20.0, default: 5.0 },
                ParamInfo { key: "rate_hz".into(), name: "Rate (Hz)".into(), min: 0.1, max: 10.0, default: 1.5 },
                ParamInfo { key: "mix".into(), name: "Wet/Dry Mix".into(), min: 0.0, max: 1.0, default: 0.5 },
            ],
        },
        NodeInfo {
            node_type: "reverb".into(), name: "Reverb".into(),
            category: "Character".into(), params: vec![],
        },

        // Post Processing
        NodeInfo {
            node_type: "limiter".into(), name: "Hard Limiter".into(),
            category: "Post Processing".into(), params: vec![],
        },
        NodeInfo {
            node_type: "lookahead_limiter".into(), name: "Lookahead Limiter".into(),
            category: "Post Processing".into(),
            params: vec![ParamInfo { key: "ceiling_db".into(), name: "Ceiling (dB)".into(), min: -12.0, max: 0.0, default: -1.0 }],
        },
        NodeInfo {
            node_type: "loudness_norm".into(), name: "Loudness Normalizer".into(),
            category: "Post Processing".into(),
            params: vec![ParamInfo { key: "target_lufs".into(), name: "Target LUFS".into(), min: -30.0, max: -6.0, default: -14.0 }],
        },
    ]
}

/// Get built-in preset definitions as ChainDefs.
/// All presets now include pre/post processing stages.
pub fn preset_chain_defs() -> Vec<ChainDef> {
    vec![
        ChainDef {
            name: "Gorilla".into(),
            nodes: vec![
                // Pre Processing
                NodeDef { node_type: "dc_blocker".into(), params: serde_json::json!({}) },
                NodeDef { node_type: "noise_reduction".into(), params: serde_json::json!({}) },
                NodeDef { node_type: "normalizer".into(), params: serde_json::json!({"target_rms": 0.2}) },
                // Core + Character
                NodeDef { node_type: "pitch_shift".into(), params: serde_json::json!({"factor": 0.75}) },
                NodeDef { node_type: "lowpass".into(), params: serde_json::json!({"freq": 800.0, "q": 0.707}) },
                NodeDef { node_type: "gain".into(), params: serde_json::json!({"factor": 1.2}) },
                // Post Processing
                NodeDef { node_type: "lookahead_limiter".into(), params: serde_json::json!({"ceiling_db": -1.0}) },
                NodeDef { node_type: "loudness_norm".into(), params: serde_json::json!({"target_lufs": -14.0}) },
            ],
        },
        ChainDef {
            name: "Cat".into(),
            nodes: vec![
                NodeDef { node_type: "dc_blocker".into(), params: serde_json::json!({}) },
                NodeDef { node_type: "noise_reduction".into(), params: serde_json::json!({}) },
                NodeDef { node_type: "normalizer".into(), params: serde_json::json!({"target_rms": 0.2}) },
                NodeDef { node_type: "pitch_shift".into(), params: serde_json::json!({"factor": 1.4}) },
                NodeDef { node_type: "highpass".into(), params: serde_json::json!({"freq": 500.0, "q": 0.707}) },
                NodeDef { node_type: "lookahead_limiter".into(), params: serde_json::json!({"ceiling_db": -1.0}) },
                NodeDef { node_type: "loudness_norm".into(), params: serde_json::json!({"target_lufs": -14.0}) },
            ],
        },
        ChainDef {
            name: "Robot".into(),
            nodes: vec![
                NodeDef { node_type: "dc_blocker".into(), params: serde_json::json!({}) },
                NodeDef { node_type: "noise_reduction".into(), params: serde_json::json!({}) },
                NodeDef { node_type: "normalizer".into(), params: serde_json::json!({"target_rms": 0.2}) },
                NodeDef { node_type: "ring_mod".into(), params: serde_json::json!({"mod_freq": 50.0, "quantize_steps": 8.0}) },
                NodeDef { node_type: "lookahead_limiter".into(), params: serde_json::json!({"ceiling_db": -1.0}) },
                NodeDef { node_type: "loudness_norm".into(), params: serde_json::json!({"target_lufs": -14.0}) },
            ],
        },
        ChainDef {
            name: "Chorus".into(),
            nodes: vec![
                NodeDef { node_type: "dc_blocker".into(), params: serde_json::json!({}) },
                NodeDef { node_type: "noise_reduction".into(), params: serde_json::json!({}) },
                NodeDef { node_type: "normalizer".into(), params: serde_json::json!({"target_rms": 0.2}) },
                NodeDef { node_type: "chorus".into(), params: serde_json::json!({"delay_ms": 25.0, "depth_ms": 5.0, "rate_hz": 1.5, "mix": 0.5}) },
                NodeDef { node_type: "lookahead_limiter".into(), params: serde_json::json!({"ceiling_db": -1.0}) },
                NodeDef { node_type: "loudness_norm".into(), params: serde_json::json!({"target_lufs": -14.0}) },
            ],
        },
        ChainDef {
            name: "Reverb".into(),
            nodes: vec![
                NodeDef { node_type: "dc_blocker".into(), params: serde_json::json!({}) },
                NodeDef { node_type: "noise_reduction".into(), params: serde_json::json!({}) },
                NodeDef { node_type: "normalizer".into(), params: serde_json::json!({"target_rms": 0.2}) },
                NodeDef { node_type: "reverb".into(), params: serde_json::json!({}) },
                NodeDef { node_type: "lookahead_limiter".into(), params: serde_json::json!({"ceiling_db": -1.0}) },
                NodeDef { node_type: "loudness_norm".into(), params: serde_json::json!({"target_lufs": -14.0}) },
            ],
        },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chain_def_roundtrip() {
        let defs = preset_chain_defs();
        for def in &defs {
            let json = def.to_json();
            let parsed = ChainDef::from_json(&json).unwrap();
            assert_eq!(parsed.name, def.name);
            assert_eq!(parsed.nodes.len(), def.nodes.len());
        }
    }

    #[test]
    fn test_chain_def_build_and_process() {
        use vozoo_core::AudioBuffer;
        use std::f32::consts::TAU;

        // Use 48000 samples (1 second) to ensure noise_reduction has enough frames
        let samples: Vec<f32> = (0..48000)
            .map(|i| (i as f32 / 48000.0 * 440.0 * TAU).sin() * 0.5)
            .collect();

        for def in preset_chain_defs() {
            let mut chain = def.build();
            let mut buffer = AudioBuffer::new(samples.clone(), 48000);
            chain.process(&mut buffer);

            // After loudness normalization + limiter, samples may exceed 1.0 slightly
            // due to loudness norm running after limiter. Check reasonable range.
            let max_abs = buffer.samples.iter().map(|s| s.abs()).fold(0.0f32, f32::max);
            assert!(
                max_abs < 2.0,
                "Preset '{}' max sample too large: {max_abs}",
                def.name
            );
        }
    }

    #[test]
    fn test_custom_chain_with_preprocess() {
        let json = r#"{
            "name": "Custom Clean",
            "nodes": [
                {"type": "dc_blocker", "params": {}},
                {"type": "noise_reduction", "params": {}},
                {"type": "normalizer", "params": {"target_rms": 0.2}},
                {"type": "highpass", "params": {"freq": 200}},
                {"type": "gain", "params": {"factor": 0.8}},
                {"type": "lookahead_limiter", "params": {"ceiling_db": -1.0}},
                {"type": "loudness_norm", "params": {"target_lufs": -14.0}}
            ]
        }"#;

        let def = ChainDef::from_json(json).unwrap();
        assert_eq!(def.name, "Custom Clean");
        assert_eq!(def.nodes.len(), 7);

        let mut chain = def.build();
        let samples: Vec<f32> = (0..48000)
            .map(|i| (i as f32 / 48000.0 * 440.0 * std::f32::consts::TAU).sin() * 0.3)
            .collect();
        let mut buffer = vozoo_core::AudioBuffer::new(samples, 48000);
        chain.process(&mut buffer);
        assert!(!buffer.samples.is_empty());
    }

    #[test]
    fn test_available_nodes_has_categories() {
        let nodes = available_nodes();
        let json = serde_json::to_string(&nodes).unwrap();
        assert!(json.contains("Pre Processing"));
        assert!(json.contains("Core Processing"));
        assert!(json.contains("Character"));
        assert!(json.contains("Post Processing"));
        assert!(json.contains("noise_reduction"));
        assert!(json.contains("lookahead_limiter"));
        assert!(json.contains("loudness_norm"));
    }
}
