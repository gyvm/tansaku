---
name: tauri-file-dialog-for-full-path
description: Use a native dialog plugin to get full file paths in a Tauri app.
---

## What I do
- Add the Tauri dialog plugin on JS and Rust sides
- Enable dialog permissions
- Use `open()` to return a full file path

## When to use me
Use this when `<input type="file">` does not provide a full path.

## Steps
1) Install plugin
   - JS: `@tauri-apps/plugin-dialog`
   - Rust: `tauri-plugin-dialog`
2) Initialize plugin
   - `.plugin(tauri_plugin_dialog::init())`
3) Add permission
   - `"dialog:default"` in `src-tauri/capabilities/default.json`
4) Use dialog in React
   - `open({ multiple: false, filters: [...] })`
   - Use the returned path in `invoke`

## Notes
- Drag and drop can still supply paths in the desktop shell.
