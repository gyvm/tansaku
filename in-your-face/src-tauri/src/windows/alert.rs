use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

use crate::state::CalendarEvent;

/// フルスクリーンのアラートウィンドウを生成する
pub fn show_alert(app: &AppHandle, event: &CalendarEvent) -> Result<(), String> {
    let label = format!(
        "alert-{}",
        event
            .id
            .chars()
            .map(|c| if c.is_alphanumeric() { c } else { '-' })
            .collect::<String>()
    );

    // 同じイベントのアラートが既に表示されている場合はスキップ
    if app.get_webview_window(&label).is_some() {
        return Ok(());
    }

    let _window = WebviewWindowBuilder::new(app, &label, WebviewUrl::App("index.html#/alert".into()))
        .title("Meeting Alert")
        .fullscreen(true)
        .always_on_top(true)
        .decorations(false)
        .focused(true)
        .skip_taskbar(true)
        .build()
        .map_err(|e| e.to_string())?;

    // イベントデータをウィンドウに送信（WebView ロード完了を待つ）
    let event_clone = event.clone();
    let window_clone = _window.clone();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
        let _ = window_clone.emit("alert-show", &event_clone);
    });

    Ok(())
}

/// アラートウィンドウを閉じる
pub fn close_alert(app: &AppHandle, event_id: &str) {
    let label = format!(
        "alert-{}",
        event_id
            .chars()
            .map(|c| if c.is_alphanumeric() { c } else { '-' })
            .collect::<String>()
    );
    if let Some(window) = app.get_webview_window(&label) {
        let _ = window.close();
    }
}
