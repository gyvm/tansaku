# Skill: Permissions and OS Guards

## When to use
- Features depend on OS-level privacy permissions.
- Behavior differs by OS version or capabilities.
- You need to define supported vs unsupported environments.

## Goal
Make support boundaries explicit and prevent broken UX on unsupported systems.

## Steps
1) Define minimum OS version for the feature.
2) Add a runtime OS version check and surface a clear UI state for unsupported systems.
3) Separate permission checks from support checks in UI logic.
4) Provide an action to request permissions when supported.
5) Keep UX honest: disable controls when unsupported.

## Tips
- Prefer explicit version guards over heuristic feature detection.
- Keep permission request and settings navigation separate.
- Document the minimum OS in the UI and README if needed.

## Success criteria
- Users on unsupported systems see a clear, consistent message.
- Supported users get a direct path to grant permissions.
