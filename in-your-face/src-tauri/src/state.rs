use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Theme {
    Dark,
    Light,
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserSettings {
    pub alert_minutes_before: Vec<u32>,
    pub selected_calendars: Vec<String>,
    pub theme: Theme,
    pub auto_start: bool,
    pub snooze_minutes: u32,
    pub poll_interval_seconds: u64,
}

impl Default for UserSettings {
    fn default() -> Self {
        Self {
            alert_minutes_before: vec![1],
            selected_calendars: vec![],
            theme: Theme::System,
            auto_start: false,
            snooze_minutes: 5,
            poll_interval_seconds: 300,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthTokens {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarInfo {
    pub id: String,
    pub name: String,
    pub color: String,
    pub primary: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConferenceType {
    Zoom,
    GoogleMeet,
    Teams,
    Webex,
    GoToMeeting,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarEvent {
    pub id: String,
    pub summary: String,
    pub description: Option<String>,
    pub start_time: i64,
    pub end_time: i64,
    pub calendar_id: String,
    pub calendar_name: String,
    pub location: Option<String>,
    pub conference_url: Option<String>,
    pub conference_type: Option<ConferenceType>,
    pub organizer: Option<String>,
    pub is_all_day: bool,
}

pub struct AppState {
    pub settings: UserSettings,
    pub auth_tokens: Option<AuthTokens>,
    pub events: Vec<CalendarEvent>,
    pub sync_token: Option<String>,
    pub pending_alerts: HashMap<String, CalendarEvent>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            settings: UserSettings::default(),
            auth_tokens: None,
            events: vec![],
            sync_token: None,
            pending_alerts: HashMap::new(),
        }
    }
}

pub type SharedState = Mutex<AppState>;
