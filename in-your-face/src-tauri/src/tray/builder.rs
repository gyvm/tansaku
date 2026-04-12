use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, MenuEvent},
    tray::TrayIconBuilder,
    AppHandle, Manager, Wry,
};

pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let settings_item = MenuItemBuilder::with_id("settings", "Settings").build(app)?;
    let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    let menu = MenuBuilder::new(app)
        .item(&settings_item)
        .separator()
        .item(&quit_item)
        .build()?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("In Your Face")
        .on_menu_event(move |app: &AppHandle<Wry>, event: MenuEvent| {
            match event.id().as_ref() {
                "settings" => {
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
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}
