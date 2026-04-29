import tempfile
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path
from types import ModuleType, SimpleNamespace
from unittest.mock import patch

from main import (
    ConfigFile,
    PullRequestRecord,
    compute_repo_summary,
    extract_pr_nodes,
    generate_markdown_report_with_copilot,
    get_copilot_github_token,
    load_config,
    normalize_pull_request,
    resolve_days,
    summarize_pull_requests_by_repo,
)


def build_pr(
    repository: str,
    number: int,
    *,
    state: str = "OPEN",
    is_draft: bool = False,
    created_days_ago: int = 1,
    updated_days_ago: int = 0,
    merged_days_ago: int | None = None,
    closed_days_ago: int | None = None,
    review_decision: str | None = None,
) -> PullRequestRecord:
    now = datetime.now(UTC)
    return PullRequestRecord(
        repository=repository,
        number=number,
        title=f"PR {number}",
        url=f"https://example.com/{repository}/pull/{number}",
        state=state,
        is_draft=is_draft,
        created_at=now - timedelta(days=created_days_ago),
        updated_at=now - timedelta(days=updated_days_ago),
        merged_at=(now - timedelta(days=merged_days_ago)) if merged_days_ago is not None else None,
        closed_at=(now - timedelta(days=closed_days_ago)) if closed_days_ago is not None else None,
        author="alice",
        review_decision=review_decision,
        review_count=1,
        commit_count=2,
        additions=10,
        deletions=5,
    )


class PullRequestAnalysisTests(unittest.TestCase):
    def test_normalize_pull_request(self) -> None:
        node = {
            "number": 42,
            "title": "Improve report output",
            "url": "https://github.com/acme/project/pull/42",
            "state": "OPEN",
            "isDraft": False,
            "createdAt": "2026-04-20T00:00:00Z",
            "updatedAt": "2026-04-22T00:00:00Z",
            "mergedAt": None,
            "closedAt": None,
            "author": {"login": "bob"},
            "reviewDecision": "REVIEW_REQUIRED",
            "reviews": {"totalCount": 2},
            "commits": {"totalCount": 3},
            "additions": 120,
            "deletions": 15,
        }

        pr = normalize_pull_request(node, "acme/project")

        self.assertEqual(pr.repository, "acme/project")
        self.assertEqual(pr.number, 42)
        self.assertEqual(pr.author, "bob")
        self.assertEqual(pr.review_count, 2)
        self.assertEqual(pr.commit_count, 3)
        self.assertEqual(pr.additions, 120)

    def test_extract_pr_nodes_filters_non_pr_nodes(self) -> None:
        payload = {
            "data": {
                "search": {
                    "edges": [
                        {
                            "node": {
                                "__typename": "Issue",
                            }
                        },
                        {
                            "node": {
                                "__typename": "PullRequest",
                                "number": 1,
                                "title": "Test",
                                "url": "https://example.com/1",
                                "state": "OPEN",
                                "isDraft": False,
                                "createdAt": "2026-04-20T00:00:00Z",
                                "updatedAt": "2026-04-20T00:00:00Z",
                                "mergedAt": None,
                                "closedAt": None,
                                "author": {"login": "alice"},
                                "reviewDecision": None,
                                "reviews": {"totalCount": 0},
                                "commits": {"totalCount": 1},
                                "additions": 1,
                                "deletions": 0,
                            }
                        },
                    ],
                    "pageInfo": {"hasNextPage": False, "endCursor": None},
                }
            }
        }

        items, has_next_page, cursor = extract_pr_nodes(payload, "acme/project")

        self.assertEqual(len(items), 1)
        self.assertFalse(has_next_page)
        self.assertIsNone(cursor)

    def test_compute_repo_summary_counts_and_review_waiting(self) -> None:
        cutoff = datetime.now(UTC) - timedelta(days=7)
        prs = [
            build_pr("acme/project", 1, state="OPEN", created_days_ago=2, review_decision="REVIEW_REQUIRED"),
            build_pr("acme/project", 2, state="OPEN", created_days_ago=10, review_decision="APPROVED"),
            build_pr(
                "acme/project",
                3,
                state="MERGED",
                created_days_ago=3,
                merged_days_ago=1,
                review_decision="APPROVED",
            ),
            build_pr(
                "acme/project",
                4,
                state="CLOSED",
                created_days_ago=4,
                closed_days_ago=1,
                review_decision="CHANGES_REQUESTED",
            ),
            build_pr("acme/project", 5, state="OPEN", is_draft=True, created_days_ago=1),
        ]

        summary = compute_repo_summary("acme/project", prs, cutoff)

        self.assertEqual(summary.total_prs, 5)
        self.assertEqual(summary.created_count, 4)
        self.assertEqual(summary.open_count, 3)
        self.assertEqual(summary.merged_count, 1)
        self.assertEqual(summary.closed_count, 1)
        self.assertEqual(summary.draft_count, 1)
        self.assertEqual(summary.review_waiting_count, 1)
        self.assertEqual(summary.approved_count, 2)
        self.assertEqual(summary.changes_requested_count, 1)
        self.assertEqual(summary.long_open_count, 1)

    def test_summarize_pull_requests_by_repo_handles_empty_repo(self) -> None:
        cutoff = datetime.now(UTC) - timedelta(days=7)
        prs_by_repo = {
            "acme/project": [build_pr("acme/project", 1, created_days_ago=1)],
            "acme/empty": [],
        }

        summaries, payload = summarize_pull_requests_by_repo(
            ["acme/project", "acme/empty"],
            prs_by_repo,
            cutoff,
        )

        self.assertEqual(summaries["acme/empty"].total_prs, 0)
        self.assertEqual(payload["overall"]["repositories"], 2)
        self.assertEqual(len(payload["repositories"]), 2)


class ConfigTests(unittest.TestCase):
    def test_load_config_and_default_days(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = Path(temp_dir) / "repos.yaml"
            config_path.write_text(
                "default_days: 5\nrepositories:\n  - acme/project\n  - acme/other\n",
                encoding="utf-8",
            )

            config = load_config(str(config_path))

        self.assertIsInstance(config, ConfigFile)
        self.assertEqual(config.default_days, 5)
        self.assertEqual(config.repositories, ["acme/project", "acme/other"])

    def test_cli_days_overrides_config(self) -> None:
        config = ConfigFile(repositories=["acme/project"], default_days=5)
        self.assertEqual(resolve_days(3, config), 3)
        self.assertEqual(resolve_days(None, config), 5)


class CopilotIntegrationTests(unittest.IsolatedAsyncioTestCase):
    def test_get_copilot_github_token_prefers_copilot_token(self) -> None:
        with patch.dict(
            "os.environ",
            {
                "COPILOT_GITHUB_TOKEN": "copilot-token",
                "GH_TOKEN": "gh-token",
                "GITHUB_TOKEN": "github-token",
            },
            clear=True,
        ):
            self.assertEqual(get_copilot_github_token(), "copilot-token")

    async def test_generate_markdown_report_with_copilot_sends_string_prompt(self) -> None:
        captured: dict[str, object] = {}

        class FakeSession:
            async def send_and_wait(self, prompt: str) -> object:
                captured["prompt"] = prompt
                return SimpleNamespace(data=SimpleNamespace(content="copilot summary"))

        class FakeClient:
            async def start(self) -> None:
                captured["started"] = True

            async def stop(self) -> None:
                captured["stopped"] = True

            async def create_session(self, **kwargs: object) -> FakeSession:
                captured["session_kwargs"] = kwargs
                return FakeSession()

        copilot_module = ModuleType("copilot")
        copilot_module.CopilotClient = FakeClient
        session_module = ModuleType("copilot.session")
        session_module.PermissionHandler = SimpleNamespace(approve_all=object())

        payload = {
            "overall": {
                "repositories": 1,
                "total_prs": 1,
                "created_count": 1,
                "open_count": 1,
                "merged_count": 0,
                "closed_count": 0,
                "draft_count": 0,
                "review_waiting_count": 0,
                "approved_count": 0,
                "changes_requested_count": 0,
                "long_open_count": 0,
                "average_open_days": 1.0,
            },
            "repositories": [],
        }

        with (
            patch.dict(
                "os.environ",
                {
                    "COPILOT_GITHUB_TOKEN": "copilot-token",
                    "GITHUB_TOKEN": "github-token",
                },
                clear=True,
            ),
            patch.dict(
                "sys.modules",
                {
                    "copilot": copilot_module,
                    "copilot.session": session_module,
                },
            ),
        ):
            report = await generate_markdown_report_with_copilot("gpt-4.1", 7, payload)

        self.assertEqual(report, "copilot summary")
        self.assertIsInstance(captured["prompt"], str)
        self.assertIn("Metrics JSON", captured["prompt"])
        self.assertEqual(captured["session_kwargs"]["github_token"], "copilot-token")


if __name__ == "__main__":
    unittest.main()
