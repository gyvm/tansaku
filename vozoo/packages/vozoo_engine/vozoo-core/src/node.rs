use crate::buffer::AudioBuffer;

/// Trait for all audio processing nodes in the effect chain.
/// Each node processes an AudioBuffer in-place (or replaces its samples).
pub trait AudioNode: Send {
    /// Process audio buffer in-place.
    fn process(&mut self, buffer: &mut AudioBuffer);

    /// Reset internal state (e.g., filter memory, delay lines).
    fn reset(&mut self);

    /// Human-readable name for this node.
    fn name(&self) -> &str;
}
