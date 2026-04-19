use tauri::{AppHandle, Emitter, Manager, WebviewWindow};

use crate::state::{CalendarEvent, SharedState};
use crate::windows::alert as alert_window;

#[tauri::command]
pub fn get_alert_event(window: WebviewWindow) -> Result<Option<CalendarEvent>, String> {
    let label = window.label().to_string();
    let app = window.app_handle();
    let state = app.state::<SharedState>();
    let mut s = state.lock().map_err(|e| e.to_string())?;
    Ok(s.pending_alerts.remove(&label))
}

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
