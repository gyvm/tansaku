use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenPair {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthState {
    pub is_authenticated: bool,
    pub user_email: Option<String>,
}

impl TokenPair {
    pub fn is_expired(&self) -> bool {
        Utc::now() >= self.expires_at
    }
}
