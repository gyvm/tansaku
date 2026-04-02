use anyhow::{Context, Result};
use chrono::{DateTime, Duration, Utc};
use serde::Deserialize;

use crate::models::auth::TokenPair;
use crate::models::event::{CalendarEvent, CalendarInfo};
use crate::services::url_extractor;

const CALENDAR_API_BASE: &str = "https://www.googleapis.com/calendar/v3";
const USERINFO_URL: &str = "https://www.googleapis.com/oauth2/v2/userinfo";

#[derive(Deserialize)]
struct CalendarListResponse {
    items: Vec<CalendarListEntry>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CalendarListEntry {
    id: String,
    summary: Option<String>,
    primary: Option<bool>,
}

#[derive(Deserialize)]
struct EventsListResponse {
    items: Option<Vec<GoogleEvent>>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct GoogleEvent {
    id: Option<String>,
    summary: Option<String>,
    description: Option<String>,
    location: Option<String>,
    start: Option<EventDateTime>,
    end: Option<EventDateTime>,
    conference_data: Option<ConferenceData>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct EventDateTime {
    date_time: Option<String>,
    date: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ConferenceData {
    entry_points: Option<Vec<EntryPoint>>,
}

#[derive(Deserialize)]
struct EntryPoint {
    uri: Option<String>,
}

#[derive(Deserialize)]
struct UserInfo {
    email: Option<String>,
}

pub async fn get_user_email(access_token: &str) -> Result<String> {
    let client = reqwest::Client::new();
    let resp: UserInfo = client
        .get(USERINFO_URL)
        .bearer_auth(access_token)
        .send()
        .await?
        .json()
        .await?;
    resp.email.context("No email in user info")
}

pub async fn fetch_calendar_list(tokens: &TokenPair) -> Result<Vec<CalendarInfo>> {
    let client = reqwest::Client::new();
    let resp: CalendarListResponse = client
        .get(format!("{}/users/me/calendarList", CALENDAR_API_BASE))
        .bearer_auth(&tokens.access_token)
        .send()
        .await?
        .json()
        .await?;

    Ok(resp
        .items
        .into_iter()
        .map(|c| CalendarInfo {
            id: c.id,
            summary: c.summary.unwrap_or_default(),
            primary: c.primary.unwrap_or(false),
        })
        .collect())
}

pub async fn fetch_events(
    tokens: &TokenPair,
    calendar_id: &str,
) -> Result<Vec<CalendarEvent>> {
    let client = reqwest::Client::new();
    let now = Utc::now();
    let time_max = now + Duration::hours(24);

    let resp: EventsListResponse = client
        .get(format!(
            "{}/calendars/{}/events",
            CALENDAR_API_BASE,
            urlencoding_encode(calendar_id)
        ))
        .bearer_auth(&tokens.access_token)
        .query(&[
            ("timeMin", now.to_rfc3339()),
            ("timeMax", time_max.to_rfc3339()),
            ("singleEvents", "true".to_string()),
            ("orderBy", "startTime".to_string()),
            ("maxResults", "50".to_string()),
        ])
        .send()
        .await?
        .json()
        .await?;

    let events = resp.items.unwrap_or_default();
    let mut result = Vec::new();

    for event in events {
        let start = match event.start.as_ref().and_then(|s| s.date_time.as_ref()) {
            Some(dt) => DateTime::parse_from_rfc3339(dt)?.with_timezone(&Utc),
            None => continue, // Skip all-day events
        };
        let end = match event.end.as_ref().and_then(|e| e.date_time.as_ref()) {
            Some(dt) => DateTime::parse_from_rfc3339(dt)?.with_timezone(&Utc),
            None => start + Duration::hours(1),
        };

        let meeting_url = extract_meeting_url(&event);

        result.push(CalendarEvent {
            id: event.id.unwrap_or_default(),
            title: event.summary.unwrap_or_else(|| "(No title)".to_string()),
            start_time: start,
            end_time: end,
            description: event.description,
            location: event.location,
            meeting_url,
            calendar_id: calendar_id.to_string(),
        });
    }

    Ok(result)
}

fn extract_meeting_url(event: &GoogleEvent) -> Option<String> {
    // Check conferenceData entry points first
    if let Some(conf) = &event.conference_data {
        if let Some(entry_points) = &conf.entry_points {
            for ep in entry_points {
                if let Some(uri) = &ep.uri {
                    if url_extractor::is_meeting_url(uri) {
                        return Some(uri.clone());
                    }
                }
            }
        }
    }

    // Then check location
    if let Some(loc) = &event.location {
        if let Some(url) = url_extractor::extract_meeting_url(loc) {
            return Some(url);
        }
    }

    // Then check description
    if let Some(desc) = &event.description {
        if let Some(url) = url_extractor::extract_meeting_url(desc) {
            return Some(url);
        }
    }

    None
}

fn urlencoding_encode(s: &str) -> String {
    url::form_urlencoded::byte_serialize(s.as_bytes()).collect()
}
