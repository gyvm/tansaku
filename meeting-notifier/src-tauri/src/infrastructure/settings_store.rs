use crate::models::settings::AppSettings;
use anyhow::Result;
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

fn settings_path(app_handle: &tauri::AppHandle) -> Result<PathBuf> {
    let dir = app_handle
        .path()
        .app_config_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    fs::create_dir_all(&dir)?;
    Ok(dir.join("settings.json"))
}

pub fn load_settings(app_handle: &tauri::AppHandle) -> AppSettings {
    match settings_path(app_handle) {
        Ok(path) => fs::read_to_string(&path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default(),
        Err(_) => AppSettings::default(),
    }
}

pub fn save_settings(app_handle: &tauri::AppHandle, settings: &AppSettings) -> Result<()> {
    let path = settings_path(app_handle)?;
    let json = serde_json::to_string_pretty(settings)?;
    fs::write(path, json)?;
    Ok(())
}
