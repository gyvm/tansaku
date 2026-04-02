use anyhow::Result;

use crate::infrastructure::google_api;
use crate::models::event::{CalendarEvent, CalendarInfo};
use crate::services::auth_service;

pub async fn get_calendar_list() -> Result<Vec<CalendarInfo>> {
    let tokens = auth_service::get_valid_tokens().await?;
    google_api::fetch_calendar_list(&tokens).await
}

pub async fn get_upcoming_events(calendar_ids: &[String]) -> Result<Vec<CalendarEvent>> {
    let tokens = auth_service::get_valid_tokens().await?;
    let mut all_events = Vec::new();

    // If no calendars selected, use primary
    let ids: Vec<String> = if calendar_ids.is_empty() {
        vec!["primary".to_string()]
    } else {
        calendar_ids.to_vec()
    };

    for cal_id in &ids {
        match google_api::fetch_events(&tokens, cal_id).await {
            Ok(events) => all_events.extend(events),
            Err(e) => log::warn!("Failed to fetch events for {}: {}", cal_id, e),
        }
    }

    all_events.sort_by_key(|e| e.start_time);
    Ok(all_events)
}
