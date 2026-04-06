use std::sync::atomic::{AtomicU32, Ordering};

/// Lock-free f32 parameter for real-time audio thread access.
/// UI thread writes, audio thread reads — no mutex needed.
pub struct AtomicF32 {
    bits: AtomicU32,
}

impl AtomicF32 {
    pub fn new(value: f32) -> Self {
        Self {
            bits: AtomicU32::new(value.to_bits()),
        }
    }

    pub fn load(&self) -> f32 {
        f32::from_bits(self.bits.load(Ordering::Relaxed))
    }

    pub fn store(&self, value: f32) {
        self.bits.store(value.to_bits(), Ordering::Relaxed);
    }
}

/// Descriptor for a node parameter (used for UI binding).
pub struct ParamDescriptor {
    pub id: u32,
    pub name: &'static str,
    pub min: f32,
    pub max: f32,
    pub default: f32,
}
