use crate::state::{SharedState, UserSettings};
use tauri::{AppHandle, Emitter, State};
use tauri_plugin_store::StoreExt;

const STORE_FILE: &str = "settings.json";
const SETTINGS_KEY: &str = "user_settings";

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
    let _ = save_settings(&app, &settings);
    let _ = app.emit("settings-changed", &settings);
    Ok(())
}

pub fn save_settings(app: &AppHandle, settings: &UserSettings) -> Result<(), String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    store.set(
        SETTINGS_KEY,
        serde_json::to_value(settings).map_err(|e| e.to_string())?,
    );
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

pub fn load_settings(app: &AppHandle) -> Result<Option<UserSettings>, String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    match store.get(SETTINGS_KEY) {
        Some(value) => {
            let settings: UserSettings =
                serde_json::from_value(value.clone()).map_err(|e| e.to_string())?;
            Ok(Some(settings))
        }
        None => Ok(None),
    }
}
