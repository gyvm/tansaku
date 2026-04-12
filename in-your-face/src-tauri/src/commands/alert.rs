use tauri::{AppHandle, Emitter};

use crate::windows::alert as alert_window;

#[tauri::command]
pub fn dismiss_alert(app: AppHandle, event_id: String) -> Result<(), String> {
    alert_window::close_alert(&app, &event_id);
    Ok(())
}

#[tauri::command]
pub fn snooze_alert(app: AppHandle, event_id: String, minutes: u32) -> Result<(), String> {
    alert_window::close_alert(&app, &event_id);
    let _ = app.emit(
        "snooze-requested",
        serde_json::json!({
            "eventId": event_id,
            "minutes": minutes,
        }),
    );
    Ok(())
}

#[tauri::command]
pub fn join_meeting(app: AppHandle, event_id: String, url: String) -> Result<(), String> {
    alert_window::close_alert(&app, &event_id);
    tauri::async_runtime::spawn(async move {
        let _ = open::that(&url);
    });
    Ok(())
}
