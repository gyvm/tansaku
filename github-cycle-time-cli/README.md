# GitHub Cycle Time CLI

A prototype CLI tool to measure the "Cycle Time" of Pull Requests in a GitHub repository.
Cycle Time is calculated as `mergedAt - firstCommittedAt`.

## Prerequisites

- Node.js (v18+ recommended)
- A GitHub Personal Access Token (PAT) with `repo` scope (or public repo access).

## Setup

1.  Navigate to the directory:
    ```bash
    cd github-cycle-time-cli
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment Variables:
    - Copy `.env.example` to `.env`:
      ```bash
      cp .env.example .env
      ```
    - Open `.env` and set your `GITHUB_TOKEN`.

4.  Configure Target Repository:
    - Open `index.ts` and modify the `OWNER` and `REPO` constants at the top of the file.
    - You can also add users to the `EXCLUDED_USERS` list.

## Usage

Run the script using `ts-node`:

```bash
# Basic usage (excludes bots by default based on API type and list)
npx ts-node --esm index.ts

# Include bots in the calculation
npx ts-node --esm index.ts --include-bots
```

## Logic

- **Cycle Time**: Time difference between the *first commit date* of the PR and the *merge date*.
- **Bot Filtering**:
    - Automatic detection using GitHub API (`__typename: "Bot"`).
    - Manual exclusion list in `index.ts`.
    - Can be overridden with `--include-bots`.
- **Scope**: Fetches the last 50 merged PRs (sorted by update date).

## Troubleshooting

- **Error: GITHUB_TOKEN is not defined**: Make sure you have a `.env` file and it is loaded.
- **GraphQL Request Failed**: Check if your token has correct permissions and the repository exists.
- **Import/Module Errors**: Ensure you are using a Node.js version that supports ESM or use the provided `ts-node --esm` command.
