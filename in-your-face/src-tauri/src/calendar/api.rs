use super::models::*;
use crate::state::{CalendarEvent, CalendarInfo, ConferenceType};

const CALENDAR_BASE: &str = "https://www.googleapis.com/calendar/v3";

pub async fn fetch_calendar_list(access_token: &str) -> Result<Vec<CalendarInfo>, String> {
    let client = reqwest::Client::new();
    let resp = client
        .get(format!("{}/users/me/calendarList", CALENDAR_BASE))
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Calendar list fetch failed: {}", body));
    }

    let body: CalendarListResponse = resp.json().await.map_err(|e| e.to_string())?;
    Ok(body
        .items
        .into_iter()
        .map(|c| CalendarInfo {
            id: c.id,
            name: c.summary,
            color: c.background_color.unwrap_or_default(),
            primary: c.primary.unwrap_or(false),
        })
        .collect())
}

pub async fn fetch_events(
    access_token: &str,
    calendar_id: &str,
    calendar_name: &str,
    time_min: &str,
    time_max: &str,
) -> Result<Vec<CalendarEvent>, String> {
    let client = reqwest::Client::new();
    let url = format!(
        "{}/calendars/{}/events?singleEvents=true&orderBy=startTime&timeMin={}&timeMax={}",
        CALENDAR_BASE,
        urlencoding::encode(calendar_id),
        urlencoding::encode(time_min),
        urlencoding::encode(time_max),
    );

    let resp = client
        .get(&url)
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Events fetch failed: {}", body));
    }

    let body: EventsListResponse = resp.json().await.map_err(|e| e.to_string())?;
    let cal_name = calendar_name.to_string();

    Ok(body
        .items
        .into_iter()
        .filter(|e| e.status.as_deref() != Some("cancelled"))
        .filter_map(|e| convert_event(e, calendar_id, &cal_name))
        .collect())
}

fn convert_event(
    event: GoogleEvent,
    calendar_id: &str,
    calendar_name: &str,
) -> Option<CalendarEvent> {
    let (start_time, end_time, is_all_day) = parse_times(&event)?;

    let (conference_url, conference_type) = detect_conference(&event);

    Some(CalendarEvent {
        id: event.id,
        summary: event.summary.unwrap_or_else(|| "(No title)".to_string()),
        description: event.description,
        start_time,
        end_time,
        calendar_id: calendar_id.to_string(),
        calendar_name: calendar_name.to_string(),
        location: event.location,
        conference_url,
        conference_type,
        organizer: event
            .organizer
            .and_then(|o| o.display_name.or(o.email)),
        is_all_day,
    })
}

fn parse_times(event: &GoogleEvent) -> Option<(i64, i64, bool)> {
    let start = event.start.as_ref()?;
    let end = event.end.as_ref()?;

    if let (Some(start_dt), Some(end_dt)) = (&start.date_time, &end.date_time) {
        let s = chrono::DateTime::parse_from_rfc3339(start_dt).ok()?.timestamp();
        let e = chrono::DateTime::parse_from_rfc3339(end_dt).ok()?.timestamp();
        Some((s, e, false))
    } else if let (Some(start_date), Some(end_date)) = (&start.date, &end.date) {
        let s = chrono::NaiveDate::parse_from_str(start_date, "%Y-%m-%d")
            .ok()?
            .and_hms_opt(0, 0, 0)?
            .and_utc()
            .timestamp();
        let e = chrono::NaiveDate::parse_from_str(end_date, "%Y-%m-%d")
            .ok()?
            .and_hms_opt(0, 0, 0)?
            .and_utc()
            .timestamp();
        Some((s, e, true))
    } else {
        None
    }
}

fn detect_conference(event: &GoogleEvent) -> (Option<String>, Option<ConferenceType>) {
    // 1. conferenceData.entryPoints (video type)
    if let Some(conf) = &event.conference_data {
        for ep in &conf.entry_points {
            if ep.entry_point_type == "video" {
                let ctype = classify_url(&ep.uri);
                return (Some(ep.uri.clone()), Some(ctype));
            }
        }
    }

    // 2. hangoutLink
    if let Some(link) = &event.hangout_link {
        return (Some(link.clone()), Some(ConferenceType::GoogleMeet));
    }

    // 3. location field
    if let Some(loc) = &event.location {
        if let Some((url, ctype)) = find_conference_url(loc) {
            return (Some(url), Some(ctype));
        }
    }

    // 4. description field
    if let Some(desc) = &event.description {
        if let Some((url, ctype)) = find_conference_url(desc) {
            return (Some(url), Some(ctype));
        }
    }

    (None, None)
}

fn classify_url(url: &str) -> ConferenceType {
    if url.contains("zoom.us") {
        ConferenceType::Zoom
    } else if url.contains("meet.google.com") {
        ConferenceType::GoogleMeet
    } else if url.contains("teams.microsoft.com") {
        ConferenceType::Teams
    } else if url.contains("webex.com") {
        ConferenceType::Webex
    } else if url.contains("gotomeet.me") || url.contains("goto.com") {
        ConferenceType::GoToMeeting
    } else {
        ConferenceType::Other
    }
}

fn find_conference_url(text: &str) -> Option<(String, ConferenceType)> {
    let patterns = [
        (r"https?://[\w.-]*zoom\.us/[jw]/\d+[^\s]*", ConferenceType::Zoom),
        (r"https?://meet\.google\.com/[a-z]{3}-[a-z]{4}-[a-z]{3}", ConferenceType::GoogleMeet),
        (r"https?://teams\.microsoft\.com/l/meetup-join/[^\s]+", ConferenceType::Teams),
        (r"https?://[\w.-]*\.webex\.com/(meet|join)/[^\s]+", ConferenceType::Webex),
        (r"https?://(gotomeet\.me|meet\.goto\.com|app\.goto\.com)/[^\s]+", ConferenceType::GoToMeeting),
    ];

    for (pattern, ctype) in &patterns {
        if let Ok(re) = regex::Regex::new(pattern) {
            if let Some(m) = re.find(text) {
                return Some((m.as_str().to_string(), ctype.clone()));
            }
        }
    }
    None
}
