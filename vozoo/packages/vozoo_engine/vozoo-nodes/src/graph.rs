use std::collections::VecDeque;

use vozoo_core::{AudioBuffer, AudioNode};

/// A node slot in the audio graph, identified by a unique ID.
struct GraphSlot {
    id: u32,
    node: Box<dyn AudioNode>,
}

/// Edge connecting two node slots: source output → destination input.
#[derive(Debug, Clone, Copy)]
struct GraphEdge {
    from_id: u32,
    to_id: u32,
    /// Gain applied to the signal on this edge (for dry/wet mixing).
    gain: f32,
}

/// DAG-based audio graph with topological execution order.
///
/// Supports parallel routing (dry/wet splits, parallel compression)
/// while maintaining the same `AudioBuffer`-based processing model.
///
/// Each node receives the sum of all incoming edge buffers.
/// The final output is taken from the designated output node.
pub struct AudioGraph {
    slots: Vec<GraphSlot>,
    edges: Vec<GraphEdge>,
    /// Topologically sorted execution order (node IDs).
    exec_order: Vec<u32>,
    /// The node whose output is the graph output.
    output_node_id: u32,
    /// The node that receives the graph input.
    input_node_id: u32,
}

impl AudioGraph {
    /// Build a graph from slots, edges, input/output node IDs.
    /// Performs topological sort at construction time.
    pub fn new(
        slots: Vec<(u32, Box<dyn AudioNode>)>,
        edges: Vec<(u32, u32, f32)>,
        input_node_id: u32,
        output_node_id: u32,
    ) -> Result<Self, String> {
        let graph_slots: Vec<GraphSlot> = slots
            .into_iter()
            .map(|(id, node)| GraphSlot { id, node })
            .collect();

        let graph_edges: Vec<GraphEdge> = edges
            .into_iter()
            .map(|(from_id, to_id, gain)| GraphEdge { from_id, to_id, gain })
            .collect();

        let exec_order = topological_sort(&graph_slots, &graph_edges)?;

        Ok(Self {
            slots: graph_slots,
            edges: graph_edges,
            exec_order,
            output_node_id,
            input_node_id,
        })
    }

    /// Process audio through the graph.
    ///
    /// The input buffer is fed into the input node.
    /// After execution, the buffer is replaced with the output node's result.
    pub fn process(&mut self, buffer: &mut AudioBuffer) {
        let sample_rate = buffer.sample_rate();
        let num_samples = buffer.samples.len();

        // Buffer storage for each node's output, keyed by node ID.
        let mut node_buffers: Vec<(u32, Vec<f32>)> = self
            .slots
            .iter()
            .map(|s| (s.id, vec![0.0; num_samples]))
            .collect();

        // Set input node's buffer to the input audio.
        if let Some((_, buf)) = node_buffers.iter_mut().find(|(id, _)| *id == self.input_node_id) {
            buf.copy_from_slice(&buffer.samples);
        }

        // Execute nodes in topological order.
        for &node_id in &self.exec_order {
            // Sum all incoming edge buffers for this node.
            let mut input_samples = vec![0.0f32; num_samples];
            let mut has_input = false;

            for edge in &self.edges {
                if edge.to_id == node_id {
                    if let Some((_, src_buf)) = node_buffers.iter().find(|(id, _)| *id == edge.from_id) {
                        for (i, s) in src_buf.iter().enumerate() {
                            if i < num_samples {
                                input_samples[i] += s * edge.gain;
                            }
                        }
                        has_input = true;
                    }
                }
            }

            // For input node, use the existing buffer (already set above).
            if node_id == self.input_node_id && !has_input {
                if let Some((_, buf)) = node_buffers.iter().find(|(id, _)| *id == self.input_node_id) {
                    input_samples.copy_from_slice(buf);
                }
            }

            // Process through the node.
            let mut node_buffer = AudioBuffer::new(input_samples, sample_rate);
            if let Some(slot) = self.slots.iter_mut().find(|s| s.id == node_id) {
                slot.node.process(&mut node_buffer);
            }

            // Store this node's output.
            if let Some((_, buf)) = node_buffers.iter_mut().find(|(id, _)| *id == node_id) {
                let copy_len = node_buffer.samples.len().min(num_samples);
                buf[..copy_len].copy_from_slice(&node_buffer.samples[..copy_len]);
            }
        }

        // Copy output node's buffer to the result.
        if let Some((_, buf)) = node_buffers.iter().find(|(id, _)| *id == self.output_node_id) {
            let copy_len = buf.len().min(buffer.samples.len());
            buffer.samples[..copy_len].copy_from_slice(&buf[..copy_len]);
        }
    }

    pub fn reset(&mut self) {
        for slot in &mut self.slots {
            slot.node.reset();
        }
    }
}

/// Topological sort using Kahn's algorithm.
fn topological_sort(slots: &[GraphSlot], edges: &[GraphEdge]) -> Result<Vec<u32>, String> {
    let ids: Vec<u32> = slots.iter().map(|s| s.id).collect();

    // Build in-degree map.
    let mut in_degree: Vec<(u32, usize)> = ids.iter().map(|&id| (id, 0)).collect();
    for edge in edges {
        if let Some((_, deg)) = in_degree.iter_mut().find(|(id, _)| *id == edge.to_id) {
            *deg += 1;
        }
    }

    // Start with nodes that have zero in-degree.
    let mut queue: VecDeque<u32> = in_degree
        .iter()
        .filter(|(_, deg)| *deg == 0)
        .map(|(id, _)| *id)
        .collect();

    let mut result = Vec::with_capacity(ids.len());

    while let Some(node_id) = queue.pop_front() {
        result.push(node_id);

        for edge in edges {
            if edge.from_id == node_id {
                if let Some((_, deg)) = in_degree.iter_mut().find(|(id, _)| *id == edge.to_id) {
                    *deg -= 1;
                    if *deg == 0 {
                        queue.push_back(edge.to_id);
                    }
                }
            }
        }
    }

    if result.len() != ids.len() {
        return Err("Graph contains a cycle".into());
    }

    Ok(result)
}

// ── Utility nodes for graph routing ────────────────────────────────

/// Pass-through node (used as graph input/output anchor).
pub struct PassThrough;

impl AudioNode for PassThrough {
    fn process(&mut self, _buffer: &mut AudioBuffer) {}
    fn reset(&mut self) {}
    fn name(&self) -> &str { "PassThrough" }
}

/// Mix node: sums incoming signals (handled by graph routing).
/// This is effectively a pass-through since summation happens at edge level.
pub struct MixNode;

impl AudioNode for MixNode {
    fn process(&mut self, _buffer: &mut AudioBuffer) {}
    fn reset(&mut self) {}
    fn name(&self) -> &str { "Mix" }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::effects::gain::Gain;

    #[test]
    fn test_linear_graph() {
        // Simple linear: input → gain(2x) → output
        let slots: Vec<(u32, Box<dyn AudioNode>)> = vec![
            (0, Box::new(PassThrough)),         // input
            (1, Box::new(Gain::new(2.0))),       // gain
            (2, Box::new(PassThrough)),          // output
        ];
        let edges = vec![
            (0, 1, 1.0),
            (1, 2, 1.0),
        ];

        let mut graph = AudioGraph::new(slots, edges, 0, 2).unwrap();
        let mut buffer = AudioBuffer::new(vec![0.5, 0.25, -0.5], 48000);
        graph.process(&mut buffer);

        assert_eq!(buffer.samples.len(), 3);
        assert!((buffer.samples[0] - 1.0).abs() < 1e-6);
        assert!((buffer.samples[1] - 0.5).abs() < 1e-6);
        assert!((buffer.samples[2] - (-1.0)).abs() < 1e-6);
    }

    #[test]
    fn test_parallel_split_mix() {
        // Parallel routing:
        //   input(0) → gain_a(1, 0.5x) → mix(3) → output(4)
        //   input(0) → gain_b(2, 2.0x) → mix(3)
        //
        // Result: input * 0.5 + input * 2.0 = input * 2.5
        let slots: Vec<(u32, Box<dyn AudioNode>)> = vec![
            (0, Box::new(PassThrough)),
            (1, Box::new(Gain::new(0.5))),
            (2, Box::new(Gain::new(2.0))),
            (3, Box::new(MixNode)),
            (4, Box::new(PassThrough)),
        ];
        let edges = vec![
            (0, 1, 1.0),   // input → gain_a
            (0, 2, 1.0),   // input → gain_b
            (1, 3, 1.0),   // gain_a → mix
            (2, 3, 1.0),   // gain_b → mix
            (3, 4, 1.0),   // mix → output
        ];

        let mut graph = AudioGraph::new(slots, edges, 0, 4).unwrap();
        let mut buffer = AudioBuffer::new(vec![1.0, 0.4], 48000);
        graph.process(&mut buffer);

        assert!((buffer.samples[0] - 2.5).abs() < 1e-6);
        assert!((buffer.samples[1] - 1.0).abs() < 1e-6);
    }

    #[test]
    fn test_dry_wet_mix() {
        // Dry/Wet routing with edge gains:
        //   input(0) → gain(1, 3.0x) → output(2) (gain=0.5 wet)
        //   input(0) → output(2)                   (gain=0.5 dry)
        //
        // Result: input * 3.0 * 0.5 + input * 0.5 = input * 2.0
        let slots: Vec<(u32, Box<dyn AudioNode>)> = vec![
            (0, Box::new(PassThrough)),
            (1, Box::new(Gain::new(3.0))),
            (2, Box::new(PassThrough)),
        ];
        let edges = vec![
            (0, 1, 1.0),   // input → gain
            (1, 2, 0.5),   // gain → output (wet)
            (0, 2, 0.5),   // input → output (dry)
        ];

        let mut graph = AudioGraph::new(slots, edges, 0, 2).unwrap();
        let mut buffer = AudioBuffer::new(vec![1.0], 48000);
        graph.process(&mut buffer);

        assert!((buffer.samples[0] - 2.0).abs() < 1e-6);
    }

    #[test]
    fn test_cycle_detection() {
        let slots: Vec<(u32, Box<dyn AudioNode>)> = vec![
            (0, Box::new(PassThrough)),
            (1, Box::new(PassThrough)),
        ];
        let edges = vec![
            (0, 1, 1.0),
            (1, 0, 1.0),
        ];

        let result = AudioGraph::new(slots, edges, 0, 1);
        assert!(result.is_err());
    }
}
