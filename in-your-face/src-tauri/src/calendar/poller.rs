use std::time::Duration;

use chrono::Utc;
use tauri::{AppHandle, Emitter, Manager};

use crate::calendar::api;
use crate::oauth::tokens;
use crate::state::SharedState;

pub fn start_polling(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        loop {
            let interval = {
                let state = app.state::<SharedState>();
                let s = state.lock().unwrap();
                s.settings.poll_interval_seconds
            };

            if let Err(e) = force_poll(&app).await {
                eprintln!("Poll cycle failed: {}", e);
            }

            tokio::time::sleep(Duration::from_secs(interval)).await;
        }
    });
}

pub async fn force_poll(app: &AppHandle) -> Result<(), String> {
    let access_token = tokens::get_valid_access_token(app).await?;

    let selected_calendars: Vec<(String, String)> = {
        let state = app.state::<SharedState>();
        let s = state.lock().map_err(|e| e.to_string())?;
        s.settings
            .selected_calendars
            .iter()
            .map(|id| (id.clone(), id.clone()))
            .collect()
    };

    if selected_calendars.is_empty() {
        return Ok(());
    }

    let now = Utc::now();
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
        let state = app.state::<SharedState>();
        let mut s = state.lock().map_err(|e| e.to_string())?;
        s.events = all_events.clone();
    }

    let _ = app.emit("events-changed", &all_events);
    let _ = crate::tray::builder::rebuild_tray_menu(app);

    Ok(())
}
