use std::ffi::CStr;
use std::os::raw::{c_char, c_int};

use vozoo_io::RealtimeEngine;

type EngineHandle = *mut RealtimeEngine;

/// Safely convert a C string pointer to a Rust &str.
/// Returns None if the pointer is null or not valid UTF-8.
unsafe fn cstr_to_str<'a>(ptr: *const c_char) -> Option<&'a str> {
    if ptr.is_null() {
        return None;
    }
    CStr::from_ptr(ptr).to_str().ok()
}

// ── Batch processing ──────────────────────────────────────────────

#[no_mangle]
pub extern "C" fn process_file(
    input_path: *const c_char,
    output_path: *const c_char,
    preset_id: c_int,
) -> c_int {
    let input_str = match unsafe { cstr_to_str(input_path) } {
        Some(s) => s,
        None => return -1,
    };
    let output_str = match unsafe { cstr_to_str(output_path) } {
        Some(s) => s,
        None => return -2,
    };
    vozoo_nodes::process_file(input_str, output_str, preset_id)
}

#[no_mangle]
pub extern "C" fn process_file_with_chain(
    input_path: *const c_char,
    output_path: *const c_char,
    chain_json: *const c_char,
) -> c_int {
    let input_str = match unsafe { cstr_to_str(input_path) } {
        Some(s) => s,
        None => return -1,
    };
    let output_str = match unsafe { cstr_to_str(output_path) } {
        Some(s) => s,
        None => return -2,
    };
    let chain_str = match unsafe { cstr_to_str(chain_json) } {
        Some(s) => s,
        None => return -3,
    };
    vozoo_nodes::process_file_with_chain(input_str, output_str, chain_str)
}

/// Process a WAV file using a DAG graph definition (JSON).
/// Returns 0 on success, -1 on read error, -2 on write error, -3 on parse error.
#[no_mangle]
pub extern "C" fn process_file_with_graph(
    input_path: *const c_char,
    output_path: *const c_char,
    graph_json: *const c_char,
) -> c_int {
    let input_str = match unsafe { cstr_to_str(input_path) } {
        Some(s) => s,
        None => return -1,
    };
    let output_str = match unsafe { cstr_to_str(output_path) } {
        Some(s) => s,
        None => return -2,
    };
    let graph_str = match unsafe { cstr_to_str(graph_json) } {
        Some(s) => s,
        None => return -3,
    };
    vozoo_nodes::process_file_with_graph(input_str, output_str, graph_str)
}

/// Get built-in graph preset definitions as JSON.
/// Caller must free the returned string with `free_string()`.
#[no_mangle]
pub extern "C" fn get_graph_presets() -> *mut c_char {
    let presets = vozoo_nodes::preset_graph_defs();
    let json = serde_json::to_string(&presets).unwrap_or_else(|_| "[]".into());
    string_to_c(json)
}

/// Set the engine's effect graph from a DAG graph definition (JSON).
/// Returns 0 on success, -1 null handle, -2 invalid UTF-8, -3 parse error.
#[no_mangle]
pub extern "C" fn engine_set_graph(handle: EngineHandle, graph_json: *const c_char) -> c_int {
    if handle.is_null() { return -1; }
    let graph_str = match unsafe { cstr_to_str(graph_json) } {
        Some(s) => s,
        None => return -2,
    };
    let engine = unsafe { &*handle };
    match engine.set_graph(graph_str) {
        Ok(()) => 0,
        Err(_) => -3,
    }
}

#[no_mangle]
pub extern "C" fn get_available_nodes() -> *mut c_char {
    let nodes = vozoo_nodes::available_nodes();
    let json = serde_json::to_string(&nodes).unwrap_or_else(|_| "[]".into());
    string_to_c(json)
}

#[no_mangle]
pub extern "C" fn get_presets() -> *mut c_char {
    let presets = vozoo_nodes::preset_chain_defs();
    let json = serde_json::to_string(&presets).unwrap_or_else(|_| "[]".into());
    string_to_c(json)
}

#[no_mangle]
pub extern "C" fn free_string(ptr: *mut c_char) {
    if !ptr.is_null() {
        unsafe { drop(std::ffi::CString::from_raw(ptr)); }
    }
}

// ── Real-time engine (handle-based API) ───────────────────────────

#[no_mangle]
pub extern "C" fn engine_create() -> EngineHandle {
    Box::into_raw(Box::new(RealtimeEngine::new()))
}

#[no_mangle]
pub extern "C" fn engine_destroy(handle: EngineHandle) {
    if !handle.is_null() {
        unsafe { drop(Box::from_raw(handle)); }
    }
}

/// Returns 0 on success, -1 null handle, -2 invalid UTF-8, -3 parse error.
#[no_mangle]
pub extern "C" fn engine_set_chain(handle: EngineHandle, chain_json: *const c_char) -> c_int {
    if handle.is_null() { return -1; }
    let chain_str = match unsafe { cstr_to_str(chain_json) } {
        Some(s) => s,
        None => return -2,
    };
    let engine = unsafe { &*handle };
    match engine.set_chain(chain_str) {
        Ok(()) => 0,
        Err(_) => -3,
    }
}

#[no_mangle]
pub extern "C" fn engine_start_realtime(handle: EngineHandle) -> c_int {
    if handle.is_null() { return -1; }
    let engine = unsafe { &mut *handle };
    match engine.start() {
        Ok(()) => 0,
        Err(_) => -1,
    }
}

#[no_mangle]
pub extern "C" fn engine_stop_realtime(handle: EngineHandle) {
    if handle.is_null() { return; }
    let engine = unsafe { &mut *handle };
    engine.stop();
}

#[no_mangle]
pub extern "C" fn engine_start_recording(handle: EngineHandle, output_path: *const c_char) -> c_int {
    if handle.is_null() { return -1; }
    let path_str = match unsafe { cstr_to_str(output_path) } {
        Some(s) => s,
        None => return -2,
    };
    let engine = unsafe { &mut *handle };
    match engine.start_recording(path_str) {
        Ok(()) => 0,
        Err(_) => -1,
    }
}

#[no_mangle]
pub extern "C" fn engine_stop_recording(handle: EngineHandle) -> u64 {
    if handle.is_null() { return 0; }
    let engine = unsafe { &mut *handle };
    engine.stop_recording()
}

#[no_mangle]
pub extern "C" fn engine_get_duration_ms(handle: EngineHandle) -> u64 {
    if handle.is_null() { return 0; }
    let engine = unsafe { &*handle };
    engine.recording_duration_ms()
}

#[no_mangle]
pub extern "C" fn engine_is_running(handle: EngineHandle) -> c_int {
    if handle.is_null() { return 0; }
    let engine = unsafe { &*handle };
    engine.is_running() as c_int
}

#[no_mangle]
pub extern "C" fn engine_is_recording(handle: EngineHandle) -> c_int {
    if handle.is_null() { return 0; }
    let engine = unsafe { &*handle };
    engine.is_recording() as c_int
}

fn string_to_c(s: String) -> *mut c_char {
    std::ffi::CString::new(s)
        .unwrap_or_else(|_| std::ffi::CString::new("").unwrap())
        .into_raw()
}
