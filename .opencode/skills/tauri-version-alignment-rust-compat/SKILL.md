---
name: tauri-version-alignment-rust-compat
description: Align Tauri JS/Rust versions and pin dependencies for older Rust toolchains.
---

## What I do
- Align Tauri JS packages with Rust crates by exact version
- Pin Rust dependencies that require newer toolchains
- Regenerate lockfiles

## When to use me
Use this when `tauri dev` reports version mismatches or Rust version errors.

## Steps
1) Check JS versions
   - `npm view @tauri-apps/api version`
   - `npm view @tauri-apps/cli version`
2) Check Rust versions
   - `cargo search tauri --limit 5`
   - `cargo search tauri-build --limit 5`
3) Pin versions
   - Set exact versions in `package.json` and `src-tauri/Cargo.toml`
4) Pin `time` for older Rust
   - Add `time = "=0.3.36"`
   - `cargo update -p time --precise 0.3.36`
5) Refresh locks
   - `npm install`
   - `cargo update`

## Notes
- Keep JS and Rust Tauri versions aligned by major/minor.
- Verify crate availability before pinning.
