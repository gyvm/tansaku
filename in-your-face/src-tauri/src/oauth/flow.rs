use crate::oauth::tokens;
use crate::state::AuthTokens;
use serde::Deserialize;
use tauri::{AppHandle, Emitter};
use tauri_plugin_oauth::start;
use tauri_plugin_opener::OpenerExt;

const GOOGLE_AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPE: &str = "https://www.googleapis.com/auth/calendar.readonly";

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    expires_in: i64,
}

pub async fn start_oauth(app: &AppHandle) -> Result<(), String> {
    let client_id = env!("GOOGLE_CLIENT_ID");
    let client_secret = env!("GOOGLE_CLIENT_SECRET");

    let app_handle = app.clone();
    let cid = client_id.to_string();
    let csecret = client_secret.to_string();

    let port = start(move |url| {
        let app = app_handle.clone();
        let cid = cid.clone();
        let csecret = csecret.clone();

        tauri::async_runtime::spawn(async move {
            if let Err(e) = handle_callback(&app, &url, &cid, &csecret).await {
                eprintln!("OAuth callback error: {}", e);
                let _ = app.emit("auth-changed", serde_json::json!({"isAuthenticated": false, "error": e}));
            }
        });
    })
    .map_err(|e| e.to_string())?;

    let redirect_uri = format!("http://localhost:{}", port);
    let auth_url = format!(
        "{}?client_id={}&redirect_uri={}&response_type=code&scope={}&access_type=offline&prompt=consent",
        GOOGLE_AUTH_URL,
        urlencoding::encode(client_id),
        urlencoding::encode(&redirect_uri),
        urlencoding::encode(SCOPE),
    );

    app.opener()
        .open_url(&auth_url, None::<&str>)
        .map_err(|e| e.to_string())?;

    Ok(())
}

async fn handle_callback(
    app: &AppHandle,
    url: &str,
    client_id: &str,
    client_secret: &str,
) -> Result<(), String> {
    let parsed = url::Url::parse(url).map_err(|e| e.to_string())?;
    let code = parsed
        .query_pairs()
        .find(|(k, _)| k == "code")
        .map(|(_, v)| v.to_string())
        .ok_or("No authorization code in callback URL")?;

    let redirect_uri = format!(
        "{}://{}:{}",
        parsed.scheme(),
        parsed.host_str().unwrap_or("localhost"),
        parsed.port().unwrap_or(80)
    );

    let client = reqwest::Client::new();
    let resp = client
        .post("https://oauth2.googleapis.com/token")
        .form(&[
            ("grant_type", "authorization_code"),
            ("code", &code),
            ("client_id", client_id),
            ("client_secret", client_secret),
            ("redirect_uri", &redirect_uri),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Token exchange failed: {}", body));
    }

    let token_resp: TokenResponse = resp.json().await.map_err(|e| e.to_string())?;
    let expires_at = chrono::Utc::now().timestamp() + token_resp.expires_in;

    let auth_tokens = AuthTokens {
        access_token: token_resp.access_token,
        refresh_token: token_resp
            .refresh_token
            .ok_or("No refresh_token in response (ensure prompt=consent)")?,
        expires_at,
    };

    tokens::save_tokens(app, &auth_tokens)?;
    let _ = app.emit(
        "auth-changed",
        serde_json::json!({"isAuthenticated": true}),
    );

    Ok(())
}
