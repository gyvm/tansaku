use std::sync::Arc;
use tauri::{Manager, State};

use crate::models::event::CalendarEvent;
use crate::services::scheduler::SchedulerState;

#[tauri::command]
pub async fn get_notification_event(
    state: State<'_, Arc<SchedulerState>>,
) -> Result<CalendarEvent, String> {
    state
        .current_notification_event
        .lock()
        .await
        .clone()
        .ok_or_else(|| "No notification event".to_string())
}

#[tauri::command]
pub async fn open_meeting_url(url: String) -> Result<(), String> {
    open::that(&url).map_err(|e| e.to_string())
}
