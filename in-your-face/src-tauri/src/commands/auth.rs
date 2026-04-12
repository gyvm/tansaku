use crate::oauth;
use crate::state::SharedState;
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub async fn start_oauth_login(app: AppHandle) -> Result<(), String> {
    oauth::flow::start_oauth(&app).await
}

#[tauri::command]
pub fn logout(app: AppHandle, state: State<SharedState>) -> Result<(), String> {
    oauth::tokens::clear_tokens(&app)?;
    {
        let mut s = state.lock().map_err(|e| e.to_string())?;
        s.auth_tokens = None;
    }
    let _ = app.emit(
        "auth-changed",
        serde_json::json!({"isAuthenticated": false}),
    );
    Ok(())
}

#[tauri::command]
pub async fn get_auth_status(app: AppHandle) -> Result<bool, String> {
    match oauth::tokens::load_tokens(&app)? {
        Some(tokens) => {
            let now = chrono::Utc::now().timestamp();
            if now < tokens.expires_at - 60 {
                Ok(true)
            } else {
                // Try to refresh
                match oauth::tokens::refresh_access_token(&tokens.refresh_token).await {
                    Ok(new_tokens) => {
                        oauth::tokens::save_tokens(&app, &new_tokens)?;
                        Ok(true)
                    }
                    Err(_) => Ok(false),
                }
            }
        }
        None => Ok(false),
    }
}
