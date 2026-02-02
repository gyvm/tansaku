---
name: tauri-react-non-tty-scaffold
description: Scaffold a Tauri + React app when create-tauri-app fails in non-TTY shells.
---

## What I do
- Create a React app with Vite
- Add the minimal Tauri layout and config files
- Wire package scripts and install Tauri JS tooling

## When to use me
Use this when `create-tauri-app` fails with a non-interactive/TTY error.

## Steps
1) `npm create vite@latest <app-name> -- --template react`
2) `mkdir -p <app-name>/src-tauri/src <app-name>/src-tauri/capabilities`
3) Add `src-tauri/Cargo.toml`, `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`, `src-tauri/tauri.conf.json`
4) Add `"tauri": "tauri"` to `package.json` scripts
5) `npm install -D @tauri-apps/cli` and `npm install @tauri-apps/api`

## Notes
- Set a fixed dev port in `vite.config.js` and `clearScreen: false`.
- Ensure `src-tauri/icons/icon.png` exists to satisfy `generate_context!()`.
