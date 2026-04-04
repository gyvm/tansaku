use crate::infrastructure::settings_store;
use crate::models::settings::AppSettings;

#[tauri::command]
pub async fn get_settings(app_handle: tauri::AppHandle) -> Result<AppSettings, String> {
    Ok(settings_store::load_settings(&app_handle))
}

#[tauri::command]
pub async fn update_settings(
    app_handle: tauri::AppHandle,
    settings: AppSettings,
) -> Result<(), String> {
    settings_store::save_settings(&app_handle, &settings).map_err(|e| e.to_string())
}
