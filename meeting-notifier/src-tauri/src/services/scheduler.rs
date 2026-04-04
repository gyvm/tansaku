use chrono::Utc;
use std::collections::HashSet;
use std::sync::Arc;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use tokio::sync::Mutex;
use tokio::time::{interval, Duration};

use crate::infrastructure::settings_store;
use crate::models::event::CalendarEvent;
use crate::models::settings::NotificationStyle;
use crate::services::calendar_service;

pub struct SchedulerState {
    pub notified_event_ids: Mutex<HashSet<String>>,
    pub current_notification_event: Mutex<Option<CalendarEvent>>,
    pub cached_events: Mutex<Vec<CalendarEvent>>,
}

impl SchedulerState {
    pub fn new() -> Self {
        Self {
            notified_event_ids: Mutex::new(HashSet::new()),
            current_notification_event: Mutex::new(None),
            cached_events: Mutex::new(Vec::new()),
        }
    }
}

pub fn start_scheduler(app_handle: AppHandle) {
    let state = app_handle.state::<Arc<SchedulerState>>().inner().clone();
    let handle = app_handle.clone();

    tokio::spawn(async move {
        let mut poll_interval = interval(Duration::from_secs(60));

        loop {
            poll_interval.tick().await;

            let settings = settings_store::load_settings(&handle);

            // Fetch events periodically
            match calendar_service::get_upcoming_events(&settings.monitored_calendar_ids).await {
                Ok(events) => {
                    let mut cached = state.cached_events.lock().await;
                    *cached = events;
                }
                Err(e) => {
                    log::error!("Failed to fetch events: {}", e);
                    continue;
                }
            }

            // Check for upcoming events that need notification
            let events = state.cached_events.lock().await.clone();
            let now = Utc::now();
            let notify_before = chrono::Duration::minutes(settings.notify_minutes_before as i64);

            for event in &events {
                let time_until = event.start_time - now;

                if time_until <= notify_before && time_until > chrono::Duration::zero() {
                    let mut notified = state.notified_event_ids.lock().await;
                    if notified.contains(&event.id) {
                        continue;
                    }
                    notified.insert(event.id.clone());
                    drop(notified);

                    // Store the event for the notification window
                    *state.current_notification_event.lock().await = Some(event.clone());

                    // Show notification window
                    if let Err(e) = show_notification_window(&handle, &settings.notification_style) {
                        log::error!("Failed to show notification: {}", e);
                    }
                }
            }

            // Clean up old notified IDs (events that have passed)
            let mut notified = state.notified_event_ids.lock().await;
            notified.retain(|id| {
                events.iter().any(|e| &e.id == id)
            });
        }
    });
}

fn show_notification_window(
    app_handle: &AppHandle,
    style: &NotificationStyle,
) -> Result<(), Box<dyn std::error::Error>> {
    // Close existing notification window if any
    if let Some(existing) = app_handle.get_webview_window("notification") {
        let _ = existing.close();
    }

    let (width, height, fullscreen) = match style {
        NotificationStyle::Fullscreen => (1200.0, 800.0, true),
        NotificationStyle::Window => (500.0, 400.0, false),
    };

    let window = WebviewWindowBuilder::new(
        app_handle,
        "notification",
        WebviewUrl::App("notification.html".into()),
    )
    .title("Meeting Starting Soon")
    .inner_size(width, height)
    .always_on_top(true)
    .decorations(false)
    .center()
    .fullscreen(fullscreen)
    .focused(true)
    .build()?;

    let _ = window.set_focus();

    Ok(())
}
