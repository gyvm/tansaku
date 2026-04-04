use crate::infrastructure::settings_store;
use crate::models::event::{CalendarEvent, CalendarInfo};
use crate::services::calendar_service;

#[tauri::command]
pub async fn get_events(app_handle: tauri::AppHandle) -> Result<Vec<CalendarEvent>, String> {
    let settings = settings_store::load_settings(&app_handle);
    calendar_service::get_upcoming_events(&settings.monitored_calendar_ids)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_calendar_list() -> Result<Vec<CalendarInfo>, String> {
    calendar_service::get_calendar_list()
        .await
        .map_err(|e| e.to_string())
}
