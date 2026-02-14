# Skill: Toolchain Control with mise

## When to use
- Builds fail due to Rust or toolchain version drift.
- Multiple apps in a monorepo need different toolchain versions.
- CI and local environments must stay aligned.

## Goal
Pin per-app toolchain versions to avoid dependency mismatch failures.

## Steps
1) Add `.tool-versions` in the app directory.
2) Pin exact versions for Rust or other tools.
3) Use `mise exec -- <command>` for builds and dev runs.
4) Record the build command in PR/testing notes.
5) Keep toolchain pins small and app-scoped.

## Tips
- Use per-app toolchain pins, not repo-wide, when requirements differ.
- Prefer minimum compatible versions to avoid upgrade churn.
- Rebuild after pinning to validate.

## Success criteria
- Builds are reproducible across machines.
- Toolchain mismatch errors are eliminated.
