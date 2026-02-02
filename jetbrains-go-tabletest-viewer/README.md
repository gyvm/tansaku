# JetBrains Go Table Test Viewer

A JetBrains IDE plugin (IntelliJ Platform) to view and navigate Go table-driven tests.

## Features

- **Table Tests Tool Window**: Displays a tree view of test packages, files, functions, and cases.
- **Navigation**: Double-click a test case to jump to the corresponding line in the source code.
- **Filtering**: Search bar to filter test cases by name or description.
- **Refresh**: Re-run the analysis to update the view.

## Requirements

This plugin requires an external CLI tool `testlist` to be installed and available on your system.
The `testlist` tool must output JSON in the expected schema.

## Installation

1. Build the plugin using Gradle:
   ```bash
   ./gradlew buildPlugin
   ```
2. Install the generated ZIP file (located in `build/distributions/`) via **Settings > Plugins > Gear Icon > Install Plugin from Disk...**.

## Configuration

1. Go to **Settings/Preferences > Tools > Test Table Viewer**.
2. Set the **Testlist executable path**.
   - Default: `testlist` (assumes it is in your system PATH).
   - If `testlist` is not in PATH, provide the absolute path.

## Usage

1. Open a Go project.
2. Open the **Table Tests** tool window (usually on the right side).
3. Click **Refresh** to load the test cases.
4. Expand the tree to see cases.
5. Use the search bar to filter cases.
6. Double-click a case to jump to the code.
