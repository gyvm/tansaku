use regex::Regex;
use std::sync::LazyLock;

static MEETING_URL_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(
        r"https?://(?:meet\.google\.com/[a-z\-]+|(?:[\w\-]+\.)?zoom\.us/j/\d+[^\s]*|teams\.microsoft\.com/l/meetup-join/[^\s]+)"
    ).unwrap()
});

static GENERAL_MEETING_DOMAINS: &[&str] = &[
    "meet.google.com",
    "zoom.us",
    "teams.microsoft.com",
];

pub fn extract_meeting_url(text: &str) -> Option<String> {
    MEETING_URL_RE
        .find(text)
        .map(|m| m.as_str().to_string())
}

pub fn is_meeting_url(url: &str) -> bool {
    GENERAL_MEETING_DOMAINS
        .iter()
        .any(|domain| url.contains(domain))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_google_meet() {
        let text = "Join at https://meet.google.com/abc-defg-hij";
        assert_eq!(
            extract_meeting_url(text),
            Some("https://meet.google.com/abc-defg-hij".to_string())
        );
    }

    #[test]
    fn test_extract_zoom() {
        let text = "Zoom: https://us04web.zoom.us/j/1234567890?pwd=abc";
        let url = extract_meeting_url(text).unwrap();
        assert!(url.contains("zoom.us/j/1234567890"));
    }

    #[test]
    fn test_extract_teams() {
        let text = "https://teams.microsoft.com/l/meetup-join/abc123";
        assert!(extract_meeting_url(text).is_some());
    }

    #[test]
    fn test_no_meeting_url() {
        assert_eq!(extract_meeting_url("No meeting here"), None);
    }

    #[test]
    fn test_is_meeting_url() {
        assert!(is_meeting_url("https://meet.google.com/abc-def"));
        assert!(is_meeting_url("https://zoom.us/j/123"));
        assert!(!is_meeting_url("https://example.com"));
    }
}
