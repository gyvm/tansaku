# Skill: Apple Docs First

## When to use
- You are working with Apple frameworks (ScreenCaptureKit, AVFoundation, Tauri macOS APIs).
- Behavior looks inconsistent across OS versions or SDKs.
- API names or parameter labels feel uncertain.

## Goal
Ground implementation decisions in official Apple documentation before coding or debugging.

## Steps
1) Identify the framework and target OS version.
2) Read the official symbol docs for the exact API you plan to use.
3) Confirm availability, parameter labels, and platform availability (min macOS version).
4) Capture a short note of the doc findings in the task context (links, key properties).
5) Implement only after the API shape and availability are verified.

## Tips
- Prefer symbol pages (e.g., SCStreamConfiguration.capturesAudio) over blog posts.
- Verify renamed methods and Swift selector names from the docs.
- Use availability annotations to gate feature paths.

## Success criteria
- No guessing of API names or parameter labels.
- Implementation matches documented availability and behavior.
