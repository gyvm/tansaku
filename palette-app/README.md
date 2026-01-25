# Palette App (Tauri + React + TypeScript)

A simple mock board application for sticky notes and images.

## Project Structure

- `src/`: React frontend source code.
- `src-tauri/`: Tauri backend configuration (Rust).
- `src/hooks/useBoard.ts`: Data management (localStorage persistence).
- `src/components/`: UI components.

## How to Run

### Web Development (Fast Verification)
You can run the frontend in the browser without Tauri (features like file system access will fall back to browser standards):

```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

### Desktop Application (Tauri)
To run the actual desktop application, you need Rust and Tauri prerequisites installed.

```bash
npm install
npm run tauri dev
```

To build for production:

```bash
npm run tauri build
```

## Features
- **Add Sticky**: Create text notes.
- **Add Image**: Upload images (stored as DataURLs locally).
- **Drag & Drop**: Move items around the board.
- **Persistence**: Auto-saves to LocalStorage.
- **Export**: Export board content to Markdown.

## Data Model
See `src/types.ts` for the `BoardItem` structure.
