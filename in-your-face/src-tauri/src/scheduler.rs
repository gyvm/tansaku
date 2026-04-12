use std::time::Duration;

use chrono::Utc;
use tauri::{AppHandle, Listener, Manager};

use crate::state::SharedState;
use crate::windows::alert as alert_window;

#[derive(Debug, Clone)]
struct SnoozedAlert {
    event_id: String,
    snooze_until: i64,
}

/// スケジューラループを開始する
pub fn start_scheduler(app: AppHandle) {
    // スヌーズリクエストを受信するチャネル
    let (snooze_tx, mut snooze_rx) =
        tokio::sync::mpsc::unbounded_channel::<(String, u32)>();

    // Tauri イベント "snooze-requested" をチャネルに転送
    let app_listener = app.clone();
    let tx = snooze_tx;
    app_listener.listen("snooze-requested", move |event: tauri::Event| {
        if let Ok(payload) = serde_json::from_str::<serde_json::Value>(event.payload()) {
            let event_id = payload["eventId"].as_str().unwrap_or_default().to_string();
            let minutes = payload["minutes"].as_u64().unwrap_or(5) as u32;
            let _ = tx.send((event_id, minutes));
        }
    });

    tauri::async_runtime::spawn(async move {
        let mut fired_alerts: Vec<String> = Vec::new();
        let mut snoozed_alerts: Vec<SnoozedAlert> = Vec::new();

        loop {
            let now = Utc::now().timestamp();

            // スヌーズリクエストを処理
            while let Ok((event_id, minutes)) = snooze_rx.try_recv() {
                let snooze_until = Utc::now().timestamp() + (minutes as i64 * 60);
                snoozed_alerts.retain(|s| s.event_id != event_id);
                snoozed_alerts.push(SnoozedAlert {
                    event_id,
                    snooze_until,
                });
            }

            let (events, alert_minutes) = {
                let state = app.state::<SharedState>();
                let s = state.lock().unwrap();
                (s.events.clone(), s.settings.alert_minutes_before.clone())
            };

            // 期限切れのイベントの fired 記録をクリア
            fired_alerts.retain(|id| events.iter().any(|e| id.starts_with(&e.id) && e.start_time > now));

            // スヌーズ期限切れを解除
            snoozed_alerts.retain(|s| s.snooze_until > now);

            for event in &events {
                if event.is_all_day {
                    continue;
                }

                for &minutes in &alert_minutes {
                    let alert_time = event.start_time - (minutes as i64 * 60);
                    let alert_key = format!("{}-{}", event.id, minutes);

                    if now >= alert_time
                        && now < event.start_time
                        && !fired_alerts.contains(&alert_key)
                        && !snoozed_alerts.iter().any(|s| s.event_id == event.id)
                    {
                        if let Err(e) = alert_window::show_alert(&app, event) {
                            eprintln!("Failed to show alert: {}", e);
                        }
                        fired_alerts.push(alert_key);
                    }
                }
            }

            tokio::time::sleep(Duration::from_secs(15)).await;
        }
    });
}
