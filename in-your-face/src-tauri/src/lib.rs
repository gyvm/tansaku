mod calendar;
mod commands;
mod oauth;
mod state;
mod tray;

use state::SharedState;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_oauth::init())
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(state::AppState::default()) as SharedState)
        .invoke_handler(tauri::generate_handler![
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::auth::start_oauth_login,
            commands::auth::logout,
            commands::auth::get_auth_status,
            commands::calendar::get_calendar_list,
            commands::calendar::get_events,
            commands::calendar::force_sync,
        ])
        .setup(|app| {
            // Restore tokens from store on startup
            if let Ok(Some(tokens)) = oauth::tokens::load_tokens(&app.handle()) {
                let state = app.state::<SharedState>();
                let mut s = state.lock().expect("Failed to lock state");
                s.auth_tokens = Some(tokens);
            }

            tray::builder::setup_tray(&app.handle())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
