use vozoo_core::{AudioBuffer, AudioNode};

/// Linear effect chain: processes nodes sequentially.
pub struct LinearChain {
    nodes: Vec<Box<dyn AudioNode>>,
}

impl LinearChain {
    pub fn new() -> Self {
        Self { nodes: Vec::new() }
    }

    pub fn add(&mut self, node: Box<dyn AudioNode>) {
        self.nodes.push(node);
    }

    pub fn process(&mut self, buffer: &mut AudioBuffer) {
        for node in &mut self.nodes {
            node.process(buffer);
        }
    }

    pub fn reset(&mut self) {
        for node in &mut self.nodes {
            node.reset();
        }
    }
}
