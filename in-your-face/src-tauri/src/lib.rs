mod calendar;
mod commands;
mod oauth;
mod scheduler;
mod state;
mod tray;
mod windows;

use state::SharedState;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

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
            commands::alert::get_alert_event,
            commands::alert::dismiss_alert,
            commands::alert::snooze_alert,
            commands::alert::join_meeting,
        ])
        .setup(|app| {
            // Restore tokens and settings from store on startup
            {
                let state = app.state::<SharedState>();
                let mut s = state.lock().expect("Failed to lock state");
                if let Ok(Some(tokens)) = oauth::tokens::load_tokens(&app.handle()) {
                    s.auth_tokens = Some(tokens);
                }
                if let Ok(Some(settings)) = commands::settings::load_settings(&app.handle()) {
                    s.settings = settings;
                }
            }

            tray::builder::setup_tray(&app.handle())?;

            calendar::poller::start_polling(app.handle().clone());

            scheduler::start_scheduler(app.handle().clone());

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app, event| {
            if let tauri::RunEvent::ExitRequested { api, .. } = event {
                api.prevent_exit();
            }
        });
}
