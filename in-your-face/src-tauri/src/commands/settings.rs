use crate::state::{SharedState, UserSettings};
use tauri::{Emitter, State};

#[tauri::command]
pub fn get_settings(state: State<SharedState>) -> Result<UserSettings, String> {
    let app_state = state.lock().map_err(|e| e.to_string())?;
    Ok(app_state.settings.clone())
}

#[tauri::command]
pub fn update_settings(
    state: State<SharedState>,
    app: tauri::AppHandle,
    settings: UserSettings,
) -> Result<(), String> {
    {
        let mut app_state = state.lock().map_err(|e| e.to_string())?;
        app_state.settings = settings.clone();
    }
    let _ = app.emit("settings-changed", &settings);
    Ok(())
}
