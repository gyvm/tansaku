use chrono::Local;
use std::ffi::CString;
use tauri::command;
use tauri::Manager;

#[cfg(target_os = "macos")]
extern "C" {
    #[link_name = "start_recording"]
    fn native_start_recording(path: *const i8, include_mic: bool, include_sys: bool) -> bool;

    #[link_name = "stop_recording"]
    fn native_stop_recording() -> bool;

    #[link_name = "check_permissions"]
    fn native_check_permissions() -> i32;

    #[link_name = "request_permissions"]
    fn native_request_permissions();

    #[link_name = "open_permissions_settings"]
    fn native_open_permissions_settings();
}

#[command(rename_all = "snake_case")]
fn start_recording(path: String, include_mic: bool, include_sys: bool) -> Result<(), String> {
    // Expand home directory if needed
    let expanded_path = if path.starts_with("~/") {
        if let Some(home) = dirs::home_dir() {
            path.replacen("~", home.to_str().unwrap(), 1)
        } else {
            path
        }
    } else {
        path
    };

    // Generate filename: AIniMVP_YYYYMMDD_HHMMSS.wav
    let now = Local::now();
    let filename = format!("AIniMVP_{}.wav", now.format("%Y%m%d_%H%M%S"));

    // Combine path and filename
    let path_buf = std::path::Path::new(&expanded_path).join(filename);
    let full_path = path_buf.to_string_lossy().to_string();

    #[cfg(target_os = "macos")]
    unsafe {
        let c_path = CString::new(full_path).unwrap();
        if native_start_recording(c_path.as_ptr(), include_mic, include_sys) {
            Ok(())
        } else {
            Err("Failed to start recording".into())
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        println!(
            "Mock: Start recording to {} (mic: {}, sys: {})",
            full_path, include_mic, include_sys
        );
        Ok(())
    }
}

#[command(rename_all = "snake_case")]
fn stop_recording() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    unsafe {
        if native_stop_recording() {
            Ok(())
        } else {
            Err("Failed to stop".into())
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        println!("Mock: Stop recording");
        Ok(())
    }
}

#[command(rename_all = "snake_case")]
fn get_permission_status() -> serde_json::Value {
    #[cfg(target_os = "macos")]
    unsafe {
        let mask = native_check_permissions();
        serde_json::json!({
            "mic": (mask & 1) != 0,
            "screen": (mask & 2) != 0
        })
    }
    #[cfg(not(target_os = "macos"))]
    {
        serde_json::json!({
            "mic": true,
            "screen": true
        })
    }
}

#[command(rename_all = "snake_case")]
fn open_permissions_settings() {
    #[cfg(target_os = "macos")]
    unsafe {
        native_open_permissions_settings();
    }
    #[cfg(not(target_os = "macos"))]
    println!("Mock: Open permissions settings");
}

#[command(rename_all = "snake_case")]
fn open_folder(path: String) -> Result<(), String> {
    let expanded_path = if path.starts_with("~/") {
        if let Some(home) = dirs::home_dir() {
            path.replacen("~", home.to_str().unwrap(), 1)
        } else {
            path
        }
    } else {
        path
    };

    #[cfg(target_os = "macos")]
    std::process::Command::new("open")
        .arg(&expanded_path)
        .spawn()
        .map_err(|e| e.to_string())?;

    #[cfg(not(target_os = "macos"))]
    println!("Mock: Open folder {}", expanded_path);

    Ok(())
}

#[command(rename_all = "snake_case")]
fn get_default_save_path() -> String {
    if let Some(movies) = dirs::video_dir() {
        movies.join("AIniMVP").to_string_lossy().to_string()
    } else {
        if let Some(home) = dirs::home_dir() {
            home.join("Movies/AIniMVP").to_string_lossy().to_string()
        } else {
            "~/Movies/AIniMVP".to_string()
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            if let Some(window) = app.get_webview_window("main") {
                // Hide native title text while keeping traffic-light controls.
                let _ = window.set_title("");
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            start_recording,
            stop_recording,
            get_permission_status,
            open_permissions_settings,
            open_folder,
            get_default_save_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
