use tauri::{AppHandle, Manager, Emitter};
use std::sync::Mutex;
use std::time::Duration;

#[derive(Clone, Copy, Debug)]
struct Point {
    x: f64,
    y: f64,
}

#[cfg(target_os = "macos")]
fn get_mouse_position() -> Point {
    use core_graphics::event::{CGEvent, CGEventSource, CGEventSourceStateID};
    // Create a source (HID System State)
    if let Ok(src) = CGEventSource::new(CGEventSourceStateID::HIDSystemState) {
        if let Ok(event) = CGEvent::new(src) {
             let point = event.location();
             return Point { x: point.x, y: point.y };
        }
    }
    // Fallback
    Point { x: 0.0, y: 0.0 }
}

#[cfg(not(target_os = "macos"))]
fn get_mouse_position() -> Point {
    // Mock for Linux/Windows verification: Circular motion
    use std::time::{SystemTime, UNIX_EPOCH};
    let start = SystemTime::now();
    let since_the_epoch = start.duration_since(UNIX_EPOCH).unwrap_or(Duration::ZERO);
    let ms = since_the_epoch.as_millis() as f64;
    let t = ms / 1000.0;
    // Radius 100
    Point { x: 100.0 * t.sin(), y: 100.0 * t.cos() }
}

struct TrackingState {
    enabled: Mutex<bool>,
}

#[tauri::command]
fn set_tracking(state: tauri::State<TrackingState>, enabled: bool) {
    let mut s = state.enabled.lock().unwrap();
    *s = enabled;
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(TrackingState { enabled: Mutex::new(false) })
        .invoke_handler(tauri::generate_handler![set_tracking])
        .setup(|app| {
            let app_handle = app.handle().clone();

            // Spawn polling thread
            tauri::async_runtime::spawn(async move {
                let mut prev_pos = get_mouse_position();
                let mut interval = tokio::time::interval(Duration::from_millis(100));

                loop {
                    interval.tick().await;

                    // Check if tracking is enabled
                    let enabled = {
                        let state = app_handle.state::<TrackingState>();
                        *state.enabled.lock().unwrap()
                    };

                    if enabled {
                        let current_pos = get_mouse_position();
                        let dx = current_pos.x - prev_pos.x;
                        let dy = current_pos.y - prev_pos.y;
                        let distance = (dx * dx + dy * dy).sqrt();

                        if distance > 0.0 {
                            // Emit delta distance
                            let _ = app_handle.emit("mouse-moved", distance);
                            prev_pos = current_pos;
                        }
                    } else {
                        // If disabled, reset prev_pos to current so we don't jump when re-enabled
                        prev_pos = get_mouse_position();
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
