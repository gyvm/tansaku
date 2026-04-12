use chrono::Utc;
use tauri::{
    menu::{MenuBuilder, MenuEvent, MenuItemBuilder},
    tray::TrayIconBuilder,
    AppHandle, Manager, Wry,
};

use tauri_plugin_opener::OpenerExt;

use crate::state::SharedState;

pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let settings_item = MenuItemBuilder::with_id("settings", "Settings").build(app)?;
    let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    let menu = MenuBuilder::new(app)
        .item(&settings_item)
        .separator()
        .item(&quit_item)
        .build()?;

    TrayIconBuilder::with_id("main-tray")
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("In Your Face")
        .on_menu_event(handle_menu_event)
        .build(app)?;

    Ok(())
}

fn handle_menu_event(app: &AppHandle<Wry>, event: MenuEvent) {
    let id = event.id().as_ref().to_string();
    match id.as_str() {
        "settings" => open_settings_window(app),
        "quit" => app.exit(0),
        "sync-now" => {
            let app = app.clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = crate::calendar::poller::force_poll(&app).await {
                    eprintln!("Manual sync failed: {}", e);
                }
            });
        }
        _ if id.starts_with("join:") => {
            let url = &id["join:".len()..];
            let _ = app.opener().open_url(url, None::<&str>);
        }
        _ => {}
    }
}

fn open_settings_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("settings") {
        let _ = window.set_focus();
    } else {
        let _ = tauri::WebviewWindowBuilder::new(
            app,
            "settings",
            tauri::WebviewUrl::App("index.html#/settings".into()),
        )
        .title("In Your Face - Settings")
        .inner_size(600.0, 700.0)
        .resizable(false)
        .build();
    }
}

pub fn rebuild_tray_menu(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let tray = match app.tray_by_id("main-tray") {
        Some(t) => t,
        None => return Ok(()),
    };

    let events = {
        let state = app.state::<SharedState>();
        let s = state.lock().map_err(|e| e.to_string())?;
        s.events.clone()
    };

    let now = Utc::now().timestamp();

    let mut menu_builder = MenuBuilder::new(app);

    let upcoming: Vec<_> = events
        .iter()
        .filter(|e| e.start_time > now && !e.is_all_day)
        .take(5)
        .collect();

    if upcoming.is_empty() {
        let no_events = MenuItemBuilder::with_id("no-events", "No upcoming events")
            .enabled(false)
            .build(app)?;
        menu_builder = menu_builder.item(&no_events);
    } else {
        for event in &upcoming {
            let minutes_until = (event.start_time - now) / 60;
            let time_str = if minutes_until < 60 {
                format!("in {} min", minutes_until)
            } else {
                let hours = minutes_until / 60;
                let mins = minutes_until % 60;
                if mins > 0 {
                    format!("in {}h {}m", hours, mins)
                } else {
                    format!("in {}h", hours)
                }
            };

            let prefix = if event.conference_url.is_some() {
                "\u{1f4f9} "
            } else {
                ""
            };
            let label = format!("{}{} ({})", prefix, event.summary, time_str);

            let item_id = if let Some(url) = &event.conference_url {
                format!("join:{}", url)
            } else {
                format!("event-{}", event.id)
            };

            let item = MenuItemBuilder::with_id(&item_id, &label).build(app)?;
            menu_builder = menu_builder.item(&item);
        }
    }

    let sync_item = MenuItemBuilder::with_id("sync-now", "Sync Now").build(app)?;
    let settings_item = MenuItemBuilder::with_id("settings", "Settings").build(app)?;
    let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    let menu = menu_builder
        .separator()
        .item(&sync_item)
        .item(&settings_item)
        .separator()
        .item(&quit_item)
        .build()?;

    tray.set_menu(Some(menu))?;

    Ok(())
}
