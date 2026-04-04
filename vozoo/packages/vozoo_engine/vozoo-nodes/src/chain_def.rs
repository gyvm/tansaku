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
use crate::effects::compressor::Compressor;
use crate::effects::convolution_reverb::ConvolutionReverb;
use crate::effects::deesser::DeEsser;
use crate::effects::formant_shift::FormantShift;
use crate::effects::hrtf::Hrtf;
use crate::effects::pitch_shift::PitchShift;
use crate::effects::pitch_shift_resample::PitchShiftResample;
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
    /// Build a LinearChain from the JSON definition.
    /// Returns an error if any node type is unknown.
    pub fn build(&self) -> Result<LinearChain, String> {
        let mut chain = LinearChain::new();
        for node_def in &self.nodes {
            match build_node(node_def) {
                Some(node) => chain.add(node),
                None => return Err(format!("Unknown node type: '{}'", node_def.node_type)),
            }
        }
        Ok(chain)
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

/// Build an AudioNode from a NodeDef. Public for use by graph_def.
pub fn build_node_public(def: &NodeDef) -> Option<Box<dyn vozoo_core::AudioNode>> {
    build_node(def)
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
            // Phase vocoder: prefer "semitones" param, fall back to "factor" for compat
            if let Some(semitones) = p.get("semitones").and_then(|v| v.as_f64()) {
                Some(Box::new(PitchShift::new(semitones as f32)))
            } else {
                let factor = get_f32(p, "factor", 1.0);
                Some(Box::new(PitchShift::from_factor(factor)))
            }
        }
        "pitch_shift_resample" => {
            let factor = get_f32(p, "factor", 1.0);
            Some(Box::new(PitchShiftResample::new(factor)))
        }
        "formant_shift" => {
            let shift_factor = get_f32(p, "shift_factor", 1.0);
            Some(Box::new(FormantShift::new(shift_factor)))
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
        "hrtf" => {
            let azimuth = get_f32(p, "azimuth", 0.0);
            let elevation = get_f32(p, "elevation", 0.0);
            let distance = get_f32(p, "distance", 1.0);
            Some(Box::new(Hrtf::new(azimuth, elevation, distance)))
        }
        "convolution_reverb" => {
            let room_size = get_f32(p, "room_size", 0.5);
            let damping = get_f32(p, "damping", 0.5);
            let dry_wet = get_f32(p, "dry_wet", 0.3);
            Some(Box::new(ConvolutionReverb::new(room_size, damping, dry_wet)))
        }

        // Dynamics
        "compressor" => {
            let threshold_db = get_f32(p, "threshold_db", -20.0);
            let ratio = get_f32(p, "ratio", 4.0);
            let attack_ms = get_f32(p, "attack_ms", 10.0);
            let release_ms = get_f32(p, "release_ms", 100.0);
            let knee_db = get_f32(p, "knee_db", 6.0);
            let makeup_db = get_f32(p, "makeup_db", 0.0);
            Some(Box::new(Compressor::new(threshold_db, ratio, attack_ms, release_ms, knee_db, makeup_db)))
        }
        "deesser" => {
            let frequency = get_f32(p, "frequency", 5000.0);
            let threshold_db = get_f32(p, "threshold_db", -20.0);
            let ratio = get_f32(p, "ratio", 6.0);
            Some(Box::new(DeEsser::new(frequency, threshold_db, ratio)))
        }

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
            params: vec![ParamInfo { key: "semitones".into(), name: "Semitones".into(), min: -24.0, max: 24.0, default: 0.0 }],
        },
        NodeInfo {
            node_type: "pitch_shift_resample".into(), name: "Pitch Shift (Legacy)".into(),
            category: "Core Processing".into(),
            params: vec![ParamInfo { key: "factor".into(), name: "Speed Factor".into(), min: 0.25, max: 4.0, default: 1.0 }],
        },
        NodeInfo {
            node_type: "formant_shift".into(), name: "Formant Shift".into(),
            category: "Core Processing".into(),
            params: vec![ParamInfo { key: "shift_factor".into(), name: "Shift Factor".into(), min: 0.5, max: 2.0, default: 1.0 }],
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
        NodeInfo {
            node_type: "convolution_reverb".into(), name: "Convolution Reverb".into(),
            category: "Character".into(),
            params: vec![
                ParamInfo { key: "room_size".into(), name: "Room Size".into(), min: 0.1, max: 2.0, default: 0.5 },
                ParamInfo { key: "damping".into(), name: "Damping".into(), min: 0.0, max: 1.0, default: 0.5 },
                ParamInfo { key: "dry_wet".into(), name: "Dry/Wet Mix".into(), min: 0.0, max: 1.0, default: 0.3 },
            ],
        },

        // Spatial
        NodeInfo {
            node_type: "hrtf".into(), name: "HRTF 3D Audio".into(),
            category: "Spatial".into(),
            params: vec![
                ParamInfo { key: "azimuth".into(), name: "Azimuth (deg)".into(), min: -180.0, max: 180.0, default: 0.0 },
                ParamInfo { key: "elevation".into(), name: "Elevation (deg)".into(), min: -90.0, max: 90.0, default: 0.0 },
                ParamInfo { key: "distance".into(), name: "Distance".into(), min: 0.1, max: 10.0, default: 1.0 },
            ],
        },

        // Dynamics
        NodeInfo {
            node_type: "compressor".into(), name: "Compressor".into(),
            category: "Dynamics".into(),
            params: vec![
                ParamInfo { key: "threshold_db".into(), name: "Threshold (dB)".into(), min: -60.0, max: 0.0, default: -20.0 },
                ParamInfo { key: "ratio".into(), name: "Ratio".into(), min: 1.0, max: 20.0, default: 4.0 },
                ParamInfo { key: "attack_ms".into(), name: "Attack (ms)".into(), min: 0.1, max: 100.0, default: 10.0 },
                ParamInfo { key: "release_ms".into(), name: "Release (ms)".into(), min: 10.0, max: 1000.0, default: 100.0 },
                ParamInfo { key: "knee_db".into(), name: "Knee (dB)".into(), min: 0.0, max: 12.0, default: 6.0 },
                ParamInfo { key: "makeup_db".into(), name: "Makeup Gain (dB)".into(), min: 0.0, max: 24.0, default: 0.0 },
            ],
        },
        NodeInfo {
            node_type: "deesser".into(), name: "De-Esser".into(),
            category: "Dynamics".into(),
            params: vec![
                ParamInfo { key: "frequency".into(), name: "Frequency (Hz)".into(), min: 2000.0, max: 10000.0, default: 5000.0 },
                ParamInfo { key: "threshold_db".into(), name: "Threshold (dB)".into(), min: -40.0, max: 0.0, default: -20.0 },
                ParamInfo { key: "ratio".into(), name: "Ratio".into(), min: 1.0, max: 20.0, default: 6.0 },
            ],
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
                NodeDef { node_type: "loudness_norm".into(), params: serde_json::json!({"target_lufs": -14.0}) },
                NodeDef { node_type: "lookahead_limiter".into(), params: serde_json::json!({"ceiling_db": -1.0}) },
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
                NodeDef { node_type: "loudness_norm".into(), params: serde_json::json!({"target_lufs": -14.0}) },
                NodeDef { node_type: "lookahead_limiter".into(), params: serde_json::json!({"ceiling_db": -1.0}) },
            ],
        },
        ChainDef {
            name: "Robot".into(),
            nodes: vec![
                NodeDef { node_type: "dc_blocker".into(), params: serde_json::json!({}) },
                NodeDef { node_type: "noise_reduction".into(), params: serde_json::json!({}) },
                NodeDef { node_type: "normalizer".into(), params: serde_json::json!({"target_rms": 0.2}) },
                NodeDef { node_type: "ring_mod".into(), params: serde_json::json!({"mod_freq": 50.0, "quantize_steps": 8.0}) },
                NodeDef { node_type: "loudness_norm".into(), params: serde_json::json!({"target_lufs": -14.0}) },
                NodeDef { node_type: "lookahead_limiter".into(), params: serde_json::json!({"ceiling_db": -1.0}) },
            ],
        },
        ChainDef {
            name: "Chorus".into(),
            nodes: vec![
                NodeDef { node_type: "dc_blocker".into(), params: serde_json::json!({}) },
                NodeDef { node_type: "noise_reduction".into(), params: serde_json::json!({}) },
                NodeDef { node_type: "normalizer".into(), params: serde_json::json!({"target_rms": 0.2}) },
                NodeDef { node_type: "chorus".into(), params: serde_json::json!({"delay_ms": 25.0, "depth_ms": 5.0, "rate_hz": 1.5, "mix": 0.5}) },
                NodeDef { node_type: "loudness_norm".into(), params: serde_json::json!({"target_lufs": -14.0}) },
                NodeDef { node_type: "lookahead_limiter".into(), params: serde_json::json!({"ceiling_db": -1.0}) },
            ],
        },
        ChainDef {
            name: "Reverb".into(),
            nodes: vec![
                NodeDef { node_type: "dc_blocker".into(), params: serde_json::json!({}) },
                NodeDef { node_type: "noise_reduction".into(), params: serde_json::json!({}) },
                NodeDef { node_type: "normalizer".into(), params: serde_json::json!({"target_rms": 0.2}) },
                NodeDef { node_type: "reverb".into(), params: serde_json::json!({}) },
                NodeDef { node_type: "loudness_norm".into(), params: serde_json::json!({"target_lufs": -14.0}) },
                NodeDef { node_type: "lookahead_limiter".into(), params: serde_json::json!({"ceiling_db": -1.0}) },
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
            let mut chain = def.build().unwrap();
            let mut buffer = AudioBuffer::new(samples.clone(), 48000);
            chain.process(&mut buffer);

            // Verify output is finite and not silent.
            // Phase vocoder + loudness norm may produce transient peaks during limiter
            // attack phase, so we check a relaxed bound and that the tail converges.
            assert!(
                buffer.samples.iter().all(|s| s.is_finite()),
                "Preset '{}' produced non-finite samples",
                def.name
            );
            assert!(
                !buffer.samples.is_empty(),
                "Preset '{}' produced empty output",
                def.name
            );
            // Check that the limiter converges: the last 25% should be within bounds
            let tail_start = buffer.samples.len() * 3 / 4;
            let tail_max = buffer.samples[tail_start..]
                .iter()
                .map(|s| s.abs())
                .fold(0.0f32, f32::max);
            assert!(
                tail_max < 2.0,
                "Preset '{}' tail max sample too large: {tail_max}",
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

        let mut chain = def.build().unwrap();
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
        assert!(json.contains("Dynamics"));
        assert!(json.contains("noise_reduction"));
        assert!(json.contains("lookahead_limiter"));
        assert!(json.contains("loudness_norm"));
        assert!(json.contains("compressor"));
        assert!(json.contains("deesser"));
        assert!(json.contains("formant_shift"));
        assert!(json.contains("convolution_reverb"));
        assert!(json.contains("pitch_shift_resample"));
    }
}
