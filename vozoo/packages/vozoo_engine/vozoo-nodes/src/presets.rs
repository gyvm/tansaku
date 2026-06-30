use crate::chain::LinearChain;
use crate::chain_def::preset_chain_defs;
use crate::effects::limiter::HardLimiter;

/// Build an effect chain for the given preset ID.
pub fn build_preset_chain(preset_id: i32) -> LinearChain {
    let defs = preset_chain_defs();

    if preset_id >= 0 {
        if let Some(def) = defs.get(preset_id as usize) {
            if let Ok(chain) = def.build() {
                return chain;
            }
        }
    }

    // Safe fallback for unknown preset IDs.
    let mut chain = LinearChain::new();
    chain.add(Box::new(HardLimiter));
    chain
}
