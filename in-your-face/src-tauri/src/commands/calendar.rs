use crate::calendar::api;
use crate::oauth::tokens;
use crate::state::{CalendarEvent, CalendarInfo, SharedState};
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn get_calendar_list(app: AppHandle) -> Result<Vec<CalendarInfo>, String> {
    let access_token = tokens::get_valid_access_token(&app).await?;
    api::fetch_calendar_list(&access_token).await
}

#[tauri::command]
pub async fn get_events(
    _app: AppHandle,
    state: State<'_, SharedState>,
) -> Result<Vec<CalendarEvent>, String> {
    let s = state.lock().map_err(|e| e.to_string())?;
    Ok(s.events.clone())
}

#[tauri::command]
pub async fn force_sync(
    app: AppHandle,
    state: State<'_, SharedState>,
) -> Result<(), String> {
    let access_token = tokens::get_valid_access_token(&app).await?;

    let selected_calendars: Vec<(String, String)> = {
        let s = state.lock().map_err(|e| e.to_string())?;
        // Get calendar names for selected IDs
        s.settings
            .selected_calendars
            .iter()
            .map(|id| (id.clone(), id.clone()))
            .collect()
    };

    if selected_calendars.is_empty() {
        return Ok(());
    }

    let now = chrono::Utc::now();
    let time_min = now.to_rfc3339();
    let time_max = (now + chrono::Duration::days(7)).to_rfc3339();

    let mut all_events = Vec::new();
    for (cal_id, cal_name) in &selected_calendars {
        match api::fetch_events(&access_token, cal_id, cal_name, &time_min, &time_max).await {
            Ok(events) => all_events.extend(events),
            Err(e) => eprintln!("Failed to fetch events for {}: {}", cal_id, e),
        }
    }

    all_events.sort_by_key(|e| e.start_time);

    {
        let mut s = state.lock().map_err(|e| e.to_string())?;
        s.events = all_events;
    }

    Ok(())
}
