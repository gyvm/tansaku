use std::ffi::CStr;
use std::os::raw::{c_char, c_int};

/// Process a WAV file with the given preset ID.
/// Returns 0 on success, -1 on read error, -2 on write error.
#[no_mangle]
pub extern "C" fn process_file(
    input_path: *const c_char,
    output_path: *const c_char,
    preset_id: c_int,
) -> c_int {
    let input_str = match unsafe { CStr::from_ptr(input_path) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };
    let output_str = match unsafe { CStr::from_ptr(output_path) }.to_str() {
        Ok(s) => s,
        Err(_) => return -2,
    };

    vozoo_nodes::process_file(input_str, output_str, preset_id)
}

/// Process a WAV file with a JSON chain definition.
/// Returns 0 on success, -1 on read error, -2 on write error, -3 on invalid JSON.
#[no_mangle]
pub extern "C" fn process_file_with_chain(
    input_path: *const c_char,
    output_path: *const c_char,
    chain_json: *const c_char,
) -> c_int {
    let input_str = match unsafe { CStr::from_ptr(input_path) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };
    let output_str = match unsafe { CStr::from_ptr(output_path) }.to_str() {
        Ok(s) => s,
        Err(_) => return -2,
    };
    let chain_str = match unsafe { CStr::from_ptr(chain_json) }.to_str() {
        Ok(s) => s,
        Err(_) => return -3,
    };

    vozoo_nodes::process_file_with_chain(input_str, output_str, chain_str)
}

/// Get JSON array of all available node types.
/// Returns a heap-allocated C string that the caller must free with `free_string`.
#[no_mangle]
pub extern "C" fn get_available_nodes() -> *mut c_char {
    let nodes = vozoo_nodes::available_nodes();
    let json = serde_json::to_string(&nodes).unwrap_or_else(|_| "[]".into());
    string_to_c(json)
}

/// Get JSON array of all built-in preset chain definitions.
/// Returns a heap-allocated C string that the caller must free with `free_string`.
#[no_mangle]
pub extern "C" fn get_presets() -> *mut c_char {
    let presets = vozoo_nodes::preset_chain_defs();
    let json = serde_json::to_string(&presets).unwrap_or_else(|_| "[]".into());
    string_to_c(json)
}

/// Free a string allocated by this library.
#[no_mangle]
pub extern "C" fn free_string(ptr: *mut c_char) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        drop(std::ffi::CString::from_raw(ptr));
    }
}

fn string_to_c(s: String) -> *mut c_char {
    std::ffi::CString::new(s)
        .unwrap_or_else(|_| std::ffi::CString::new("").unwrap())
        .into_raw()
}
