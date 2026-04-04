use crate::models::auth::AuthState;
use crate::services::auth_service;

#[tauri::command]
pub async fn start_oauth() -> Result<(), String> {
    auth_service::start_oauth_flow()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_auth_status() -> Result<AuthState, String> {
    Ok(auth_service::get_auth_state().await)
}

#[tauri::command]
pub async fn logout() -> Result<(), String> {
    auth_service::logout().map_err(|e| e.to_string())
}
