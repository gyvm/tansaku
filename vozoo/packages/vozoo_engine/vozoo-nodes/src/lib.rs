pub mod chain;
pub mod chain_def;
pub mod effects;
mod presets;

#[cfg(test)]
mod tests;

use std::os::raw::c_int;
use vozoo_core::{read_wav, write_wav};

pub use chain_def::{available_nodes, preset_chain_defs, ChainDef, NodeDef};
pub use presets::build_preset_chain;

/// Process a WAV file with the given preset ID.
/// Returns 0 on success, -1 on read error, -2 on write error.
pub fn process_file(input_path: &str, output_path: &str, preset_id: c_int) -> c_int {
    let mut buffer = match read_wav(input_path) {
        Ok(b) => b,
        Err(_) => return -1,
    };

    let mut chain = build_preset_chain(preset_id);
    chain.process(&mut buffer);

    match write_wav(output_path, &buffer) {
        Ok(()) => 0,
        Err(_) => -2,
    }
}

/// Process a WAV file with a JSON chain definition.
/// Returns 0 on success, -1 on read error, -2 on write error, -3 on invalid JSON.
pub fn process_file_with_chain(input_path: &str, output_path: &str, chain_json: &str) -> c_int {
    let chain_def = match ChainDef::from_json(chain_json) {
        Ok(d) => d,
        Err(_) => return -3,
    };

    let mut buffer = match read_wav(input_path) {
        Ok(b) => b,
        Err(_) => return -1,
    };

    let mut chain = chain_def.build();
    chain.process(&mut buffer);

    match write_wav(output_path, &buffer) {
        Ok(()) => 0,
        Err(_) => -2,
    }
}
