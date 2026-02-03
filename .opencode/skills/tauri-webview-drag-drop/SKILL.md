---
name: tauri-webview-drag-drop
description: Capture file drops in Tauri via Webview drag-drop events.
---

## What I do
- Listen to Webview drag-drop events instead of DOM drop
- Translate dropped paths into app state
- Toggle drag-over UI state and clean up listeners

## When to use me
Use this when desktop drag and drop shows a plus cursor but no file is added.

## Steps
1) Add Webview API import
   - `import { getCurrentWebview } from '@tauri-apps/api/webview'`
2) Register drag-drop listener
   - `getCurrentWebview().onDragDropEvent((event) => { ... })`
3) Handle event payload types
   - `enter` / `over`: set drag state true
   - `drop`: read `event.payload.paths[0]` and update file selection
   - `leave`: set drag state false
4) Clean up the listener on unmount
   - call `unlisten()` inside the effect cleanup
5) Keep DOM `onDrop` as fallback if desired

## Notes
- Tauri v2 exposes drag-drop via Webview events, not `tauri://file-drop`.
- DOM `dataTransfer.files` may not fire in the desktop shell.
