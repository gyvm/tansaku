import { graphql } from "@octokit/graphql";
import * as dotenv from "dotenv";

dotenv.config();

// --- Configuration ---
// These can be modified or potentially moved to a config file/env vars
const OWNER = "facebook"; // Example: facebook
const REPO = "react";     // Example: react
const EXCLUDED_USERS: string[] = [
  "dependabot",
  "renovate",
  "github-actions",
  // Add other bot/user names here to exclude manually
];

// --- Types ---
interface Commit {
  committedDate: string;
}

interface PullRequest {
  number: number;
  title: string;
  mergedAt: string;
  author: {
    login: string;
    __typename: string;
  } | null; // Author can be null if the user was deleted
  commits: {
    nodes: Array<{
      commit: Commit;
    }>;
  };
}

interface GraphQLError {
    message: string;
    locations?: { line: number; column: number }[];
    path?: string[];
    extensions?: any;
}

interface GraphQLResponse {
  repository: {
    pullRequests: {
      nodes: PullRequest[];
    };
  };
  errors?: GraphQLError[];
}

// --- Logic ---

/**
 * Calculates the cycle time in hours.
 * Cycle Time = mergedAt - firstCommittedAt
 * Returns NaN if either date is invalid.
 */
function calculateCycleTime(mergedAt: string, firstCommittedAt: string): number {
  const mergedDate = new Date(mergedAt);
  const firstCommitDate = new Date(firstCommittedAt);

  // Validate dates
  if (isNaN(mergedDate.getTime()) || isNaN(firstCommitDate.getTime())) {
    return NaN;
  }

  const diffMs = mergedDate.getTime() - firstCommitDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours;
}

/**
 * Checks if a PR author is considered a bot.
 * Logic:
 * 1. API says it's a 'Bot'
 * 2. OR the username is in the manual EXCLUDED_USERS list
 */
function isBot(author: PullRequest['author']): boolean {
  if (!author) return false; // If author is null, treat as human (or handle as edge case, but keeping simple)

  const isApiBot = author.__typename === 'Bot';
  const isExcludedUser = EXCLUDED_USERS.includes(author.login);

  return isApiBot || isExcludedUser;
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("Error: GITHUB_TOKEN is not defined in environment variables.");
    process.exit(1);
  }

  // Parse CLI args
  const args = process.argv.slice(2);
  const includeBots = args.includes("--include-bots");

  console.log(`Target Repository: ${OWNER}/${REPO}`);
  console.log(`Include Bots: ${includeBots}`);
  console.log("Fetching recent merged PRs...\n");

  try {
    const response: GraphQLResponse = await graphql(
      `
        query ($owner: String!, $repo: String!) {
          repository(owner: $owner, name: $repo) {
            pullRequests(
              last: 50
              states: MERGED
              orderBy: { field: UPDATED_AT, direction: ASC }
            ) {
              nodes {
                number
                title
                mergedAt
                author {
                  login
                  __typename
                }
                commits(first: 1) {
                  nodes {
                    commit {
                      committedDate
                    }
                  }
                }
              }
            }
          }
        }
      `,
      {
        owner: OWNER,
        repo: REPO,
        headers: {
          authorization: `token ${token}`,
        },
      }
    );

    if (!response.repository || !response.repository.pullRequests || !response.repository.pullRequests.nodes) {
        throw new Error("Invalid response structure from GitHub API");
    }

    const prs = response.repository.pullRequests.nodes;
    let totalCycleTime = 0;
    let count = 0;

    for (const pr of prs) {
      // Data validation
      if (!pr.mergedAt || !pr.commits.nodes[0]?.commit.committedDate) {
        console.warn(`[#${pr.number}] Skipped: Missing date information.`);
        continue;
      }

      const authorName = pr.author?.login || "unknown";

      // Bot filtering
      if (!includeBots && isBot(pr.author)) {
        // Debug log for exclusion could go here if needed
        // console.log(`Skipping bot PR #${pr.number} by ${authorName}`);
        continue;
      }

      const firstCommittedAt = pr.commits.nodes[0].commit.committedDate;
      const hours = calculateCycleTime(pr.mergedAt, firstCommittedAt);

      // Skip if date calculation resulted in NaN
      if (isNaN(hours)) {
        console.warn(`[#${pr.number}] Skipped: Invalid date format resulted in NaN.`);
        continue;
      }

      // Print individual PR result
      // Format: [#123] PRタイトル: 24.5 hours
      console.log(`[#${pr.number}] ${pr.title}: ${hours.toFixed(1)} hours`);

      totalCycleTime += hours;
      count++;
    }

    if (count === 0) {
      console.log("\nNo matching PRs found (or all were filtered out).");
    } else {
      const average = totalCycleTime / count;
      console.log(`\nAverage Cycle Time (${count} PRs): ${average.toFixed(1)} hours`);
    }

  } catch (error: any) {
    if (error.response) {
        console.error("GraphQL Request Failed:", error.message);
        if (error.response.errors) {
            console.error("Details:", JSON.stringify(error.response.errors, null, 2));
        }
    } else {
        console.error("Error:", error.message || error);
    }
    process.exit(1);
  }
}

main();
