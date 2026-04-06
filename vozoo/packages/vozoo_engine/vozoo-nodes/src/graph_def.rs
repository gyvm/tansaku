use serde::{Deserialize, Serialize};

use crate::chain_def::build_node_public;
use crate::graph::{AudioGraph, MixNode, PassThrough};

/// JSON-serializable graph definition.
///
/// ```json
/// {
///   "name": "Parallel Compression",
///   "nodes": [
///     { "id": 0, "type": "input" },
///     { "id": 1, "type": "compressor", "params": { "threshold_db": -20, "ratio": 4 } },
///     { "id": 2, "type": "mix" },
///     { "id": 3, "type": "output" }
///   ],
///   "edges": [
///     { "from": 0, "to": 1, "gain": 1.0 },
///     { "from": 0, "to": 2, "gain": 0.5 },
///     { "from": 1, "to": 2, "gain": 0.5 },
///     { "from": 2, "to": 3, "gain": 1.0 }
///   ]
/// }
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphDef {
    pub name: String,
    pub nodes: Vec<GraphNodeDef>,
    pub edges: Vec<GraphEdgeDef>,
}

/// A node in the graph definition.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphNodeDef {
    pub id: u32,
    #[serde(rename = "type")]
    pub node_type: String,
    #[serde(default)]
    pub params: serde_json::Value,
    /// Optional position for UI layout (not used by engine).
    #[serde(default)]
    pub x: f64,
    #[serde(default)]
    pub y: f64,
}

/// An edge connecting two nodes.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphEdgeDef {
    pub from: u32,
    pub to: u32,
    #[serde(default = "default_gain")]
    pub gain: f32,
}

fn default_gain() -> f32 {
    1.0
}

impl GraphDef {
    /// Build an executable AudioGraph from this definition.
    pub fn build(&self) -> Result<AudioGraph, String> {
        let mut slots: Vec<(u32, Box<dyn vozoo_core::AudioNode>)> = Vec::new();

        for node_def in &self.nodes {
            let node: Box<dyn vozoo_core::AudioNode> = match node_def.node_type.as_str() {
                "input" | "output" | "passthrough" => Box::new(PassThrough),
                "mix" => Box::new(MixNode),
                _ => {
                    // Delegate to existing node factory.
                    let chain_node_def = crate::chain_def::NodeDef {
                        node_type: node_def.node_type.clone(),
                        params: node_def.params.clone(),
                    };
                    build_node_public(&chain_node_def)
                        .ok_or_else(|| format!("Unknown node type: '{}'", node_def.node_type))?
                }
            };
            slots.push((node_def.id, node));
        }

        let edges: Vec<(u32, u32, f32)> = self
            .edges
            .iter()
            .map(|e| (e.from, e.to, e.gain))
            .collect();

        // Find input and output nodes.
        let input_id = self
            .nodes
            .iter()
            .find(|n| n.node_type == "input")
            .map(|n| n.id)
            .ok_or("Graph must have an 'input' node")?;

        let output_id = self
            .nodes
            .iter()
            .find(|n| n.node_type == "output")
            .map(|n| n.id)
            .ok_or("Graph must have an 'output' node")?;

        AudioGraph::new(slots, edges, input_id, output_id)
    }

    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap_or_default()
    }

    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }
}

/// Preset graph definitions demonstrating parallel routing.
pub fn preset_graph_defs() -> Vec<GraphDef> {
    vec![
        // Parallel Compression: dry + compressed mixed together
        GraphDef {
            name: "Parallel Compression".into(),
            nodes: vec![
                GraphNodeDef { id: 0, node_type: "input".into(), params: serde_json::json!({}), x: 0.0, y: 150.0 },
                GraphNodeDef { id: 1, node_type: "dc_blocker".into(), params: serde_json::json!({}), x: 150.0, y: 150.0 },
                GraphNodeDef { id: 2, node_type: "compressor".into(), params: serde_json::json!({"threshold_db": -25.0, "ratio": 8.0, "attack_ms": 5.0, "release_ms": 50.0}), x: 350.0, y: 50.0 },
                GraphNodeDef { id: 3, node_type: "mix".into(), params: serde_json::json!({}), x: 550.0, y: 150.0 },
                GraphNodeDef { id: 4, node_type: "loudness_norm".into(), params: serde_json::json!({"target_lufs": -14.0}), x: 700.0, y: 150.0 },
                GraphNodeDef { id: 5, node_type: "lookahead_limiter".into(), params: serde_json::json!({"ceiling_db": -1.0}), x: 850.0, y: 150.0 },
                GraphNodeDef { id: 6, node_type: "output".into(), params: serde_json::json!({}), x: 1000.0, y: 150.0 },
            ],
            edges: vec![
                GraphEdgeDef { from: 0, to: 1, gain: 1.0 },
                GraphEdgeDef { from: 1, to: 2, gain: 1.0 },    // dry → compressor
                GraphEdgeDef { from: 2, to: 3, gain: 0.6 },    // compressed (wet)
                GraphEdgeDef { from: 1, to: 3, gain: 0.4 },    // dry bypass
                GraphEdgeDef { from: 3, to: 4, gain: 1.0 },
                GraphEdgeDef { from: 4, to: 5, gain: 1.0 },
                GraphEdgeDef { from: 5, to: 6, gain: 1.0 },
            ],
        },
        // Dual Character: pitch shift + chorus blended
        GraphDef {
            name: "Dual Character".into(),
            nodes: vec![
                GraphNodeDef { id: 0, node_type: "input".into(), params: serde_json::json!({}), x: 0.0, y: 150.0 },
                GraphNodeDef { id: 1, node_type: "dc_blocker".into(), params: serde_json::json!({}), x: 150.0, y: 150.0 },
                GraphNodeDef { id: 2, node_type: "noise_reduction".into(), params: serde_json::json!({}), x: 300.0, y: 150.0 },
                GraphNodeDef { id: 3, node_type: "pitch_shift".into(), params: serde_json::json!({"semitones": -5.0}), x: 500.0, y: 50.0 },
                GraphNodeDef { id: 4, node_type: "chorus".into(), params: serde_json::json!({"delay_ms": 30.0, "depth_ms": 8.0, "rate_hz": 1.0, "mix": 0.6}), x: 500.0, y: 250.0 },
                GraphNodeDef { id: 5, node_type: "mix".into(), params: serde_json::json!({}), x: 700.0, y: 150.0 },
                GraphNodeDef { id: 6, node_type: "loudness_norm".into(), params: serde_json::json!({"target_lufs": -14.0}), x: 850.0, y: 150.0 },
                GraphNodeDef { id: 7, node_type: "lookahead_limiter".into(), params: serde_json::json!({"ceiling_db": -1.0}), x: 1000.0, y: 150.0 },
                GraphNodeDef { id: 8, node_type: "output".into(), params: serde_json::json!({}), x: 1150.0, y: 150.0 },
            ],
            edges: vec![
                GraphEdgeDef { from: 0, to: 1, gain: 1.0 },
                GraphEdgeDef { from: 1, to: 2, gain: 1.0 },
                GraphEdgeDef { from: 2, to: 3, gain: 1.0 },    // → pitch shift
                GraphEdgeDef { from: 2, to: 4, gain: 1.0 },    // → chorus
                GraphEdgeDef { from: 3, to: 5, gain: 0.6 },    // pitch shift → mix
                GraphEdgeDef { from: 4, to: 5, gain: 0.4 },    // chorus → mix
                GraphEdgeDef { from: 5, to: 6, gain: 1.0 },
                GraphEdgeDef { from: 6, to: 7, gain: 1.0 },
                GraphEdgeDef { from: 7, to: 8, gain: 1.0 },
            ],
        },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_graph_def_roundtrip() {
        let defs = preset_graph_defs();
        for def in &defs {
            let json = def.to_json();
            let parsed = GraphDef::from_json(&json).unwrap();
            assert_eq!(parsed.name, def.name);
            assert_eq!(parsed.nodes.len(), def.nodes.len());
            assert_eq!(parsed.edges.len(), def.edges.len());
        }
    }

    #[test]
    fn test_graph_def_build_and_process() {
        use vozoo_core::AudioBuffer;
        use std::f32::consts::TAU;

        let samples: Vec<f32> = (0..48000)
            .map(|i| (i as f32 / 48000.0 * 440.0 * TAU).sin() * 0.5)
            .collect();

        for def in preset_graph_defs() {
            let mut graph = def.build().unwrap();
            let mut buffer = AudioBuffer::new(samples.clone(), 48000);
            graph.process(&mut buffer);

            assert!(
                buffer.samples.iter().all(|s| s.is_finite()),
                "Graph '{}' produced non-finite samples",
                def.name
            );
            assert!(
                !buffer.samples.is_empty(),
                "Graph '{}' produced empty output",
                def.name
            );
        }
    }

    #[test]
    fn test_parallel_compression_graph() {
        use vozoo_core::AudioBuffer;

        let json = r#"{
            "name": "Test Parallel",
            "nodes": [
                { "id": 0, "type": "input" },
                { "id": 1, "type": "gain", "params": { "factor": 2.0 } },
                { "id": 2, "type": "mix" },
                { "id": 3, "type": "output" }
            ],
            "edges": [
                { "from": 0, "to": 1, "gain": 1.0 },
                { "from": 1, "to": 2, "gain": 0.5 },
                { "from": 0, "to": 2, "gain": 0.5 },
                { "from": 2, "to": 3, "gain": 1.0 }
            ]
        }"#;

        let def = GraphDef::from_json(json).unwrap();
        let mut graph = def.build().unwrap();

        // input=1.0 → gain(2x)=2.0 → mix: 2.0*0.5 + 1.0*0.5 = 1.5
        let mut buffer = AudioBuffer::new(vec![1.0], 48000);
        graph.process(&mut buffer);
        assert!((buffer.samples[0] - 1.5).abs() < 1e-6);
    }
}
