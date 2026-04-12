use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

use crate::state::{CalendarEvent, SharedState};

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

    // イベントデータを pending_alerts に保存（フロントエンドがコマンドで取得する）
    {
        let state = app.state::<SharedState>();
        let mut s = state.lock().unwrap();
        s.pending_alerts.insert(label.clone(), event.clone());
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
