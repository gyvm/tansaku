use crate::state::AuthTokens;
use serde::Deserialize;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE_FILE: &str = "auth.json";
const TOKENS_KEY: &str = "oauth_tokens";

pub fn save_tokens(app: &AppHandle, tokens: &AuthTokens) -> Result<(), String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    store.set(
        TOKENS_KEY,
        serde_json::to_value(tokens).map_err(|e| e.to_string())?,
    );
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

pub fn load_tokens(app: &AppHandle) -> Result<Option<AuthTokens>, String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    match store.get(TOKENS_KEY) {
        Some(value) => {
            let tokens: AuthTokens =
                serde_json::from_value(value.clone()).map_err(|e| e.to_string())?;
            Ok(Some(tokens))
        }
        None => Ok(None),
    }
}

pub fn clear_tokens(app: &AppHandle) -> Result<(), String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    store.delete(TOKENS_KEY);
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    expires_in: i64,
}

pub async fn refresh_access_token(
    existing_refresh_token: &str,
) -> Result<AuthTokens, String> {
    let client_id = env!("GOOGLE_CLIENT_ID");
    let client_secret = env!("GOOGLE_CLIENT_SECRET");

    let client = reqwest::Client::new();
    let resp = client
        .post("https://oauth2.googleapis.com/token")
        .form(&[
            ("grant_type", "refresh_token"),
            ("refresh_token", existing_refresh_token),
            ("client_id", client_id),
            ("client_secret", client_secret),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Token refresh failed: {}", body));
    }

    let token_resp: TokenResponse = resp.json().await.map_err(|e| e.to_string())?;
    let expires_at = chrono::Utc::now().timestamp() + token_resp.expires_in;

    Ok(AuthTokens {
        access_token: token_resp.access_token,
        refresh_token: token_resp
            .refresh_token
            .unwrap_or_else(|| existing_refresh_token.to_string()),
        expires_at,
    })
}

/// Returns a valid access token, refreshing if expired.
pub async fn get_valid_access_token(app: &AppHandle) -> Result<String, String> {
    let tokens = load_tokens(app)?.ok_or("Not authenticated")?;

    let now = chrono::Utc::now().timestamp();
    if now < tokens.expires_at - 60 {
        return Ok(tokens.access_token);
    }

    let new_tokens = refresh_access_token(&tokens.refresh_token).await?;
    save_tokens(app, &new_tokens)?;
    Ok(new_tokens.access_token)
}
