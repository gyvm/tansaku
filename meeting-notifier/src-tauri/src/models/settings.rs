use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub notify_minutes_before: u32,
    pub notification_style: NotificationStyle,
    pub sound_enabled: bool,
    pub autostart_enabled: bool,
    pub monitored_calendar_ids: Vec<String>,
    pub polling_interval_seconds: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum NotificationStyle {
    Fullscreen,
    Window,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            notify_minutes_before: 5,
            notification_style: NotificationStyle::Window,
            sound_enabled: true,
            autostart_enabled: false,
            monitored_calendar_ids: vec![],
            polling_interval_seconds: 300,
        }
    }
}
