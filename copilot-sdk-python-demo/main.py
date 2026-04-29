import argparse
import asyncio
import json
import os
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"
DEFAULT_MODEL = "gpt-4.1"
DEFAULT_DAYS = 7
LONG_OPEN_DAYS = 7
SEARCH_PAGE_SIZE = 50


@dataclass(slots=True)
class ConfigFile:
    repositories: list[str]
    default_days: int | None = None


class ConfigError(ValueError):
    pass


@dataclass(slots=True)
class PullRequestRecord:
    repository: str
    number: int
    title: str
    url: str
    state: str
    is_draft: bool
    created_at: datetime
    updated_at: datetime
    merged_at: datetime | None
    closed_at: datetime | None
    author: str
    review_decision: str | None
    review_count: int
    commit_count: int
    additions: int
    deletions: int


@dataclass(slots=True)
class RepoSummary:
    repository: str
    total_prs: int
    created_count: int
    open_count: int
    merged_count: int
    closed_count: int
    draft_count: int
    review_waiting_count: int
    approved_count: int
    changes_requested_count: int
    long_open_count: int
    average_open_days: float
    notable_prs: list[PullRequestRecord]


def parse_iso_datetime(value: str | None) -> datetime | None:
    if value is None:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Analyze recent GitHub pull request activity and summarize it with Copilot SDK.",
    )
    parser.add_argument("--config", required=True, help="Path to a YAML config file.")
    parser.add_argument(
        "--days",
        type=int,
        default=None,
        help=f"Number of days to analyze. Defaults to config value or {DEFAULT_DAYS}.",
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help=f"Copilot model to use for summary generation. Default: {DEFAULT_MODEL}.",
    )
    return parser.parse_args(argv)


def load_config(path: str) -> ConfigFile:
    config_path = Path(path)
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")

    with config_path.open("r", encoding="utf-8") as handle:
        raw_text = handle.read()

    data = parse_config_text(raw_text)
    return validate_config(data)


def parse_config_text(raw_text: str) -> dict[str, Any]:
    try:
        import yaml  # type: ignore
    except ImportError:
        yaml = None

    if yaml is not None:
        data = yaml.safe_load(raw_text) or {}
        if not isinstance(data, dict):
            raise ConfigError("Config root must be a mapping.")
        return data

    lines = [line.rstrip() for line in raw_text.splitlines() if line.strip()]
    data: dict[str, Any] = {}
    repositories: list[str] = []
    in_repositories = False

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("#"):
            continue
        if stripped.startswith("repositories:"):
            in_repositories = True
            if "[" in stripped and "]" in stripped:
                list_text = stripped.split(":", 1)[1].strip()
                items = [item.strip().strip("\"'") for item in list_text.strip("[]").split(",") if item.strip()]
                repositories.extend(items)
                in_repositories = False
            continue
        if stripped.startswith("default_days:"):
            value = stripped.split(":", 1)[1].strip()
            data["default_days"] = int(value)
            in_repositories = False
            continue
        if in_repositories and stripped.startswith("- "):
            repositories.append(stripped[2:].strip().strip("\"'"))
            continue
        raise ConfigError("Unsupported config format. Install PyYAML or use the simple sample structure.")

    if repositories:
        data["repositories"] = repositories
    return data


def validate_config(data: dict[str, Any]) -> ConfigFile:
    repositories = data.get("repositories")
    if not isinstance(repositories, list) or not repositories:
        raise ConfigError("Config must include a non-empty 'repositories' list.")
    if not all(isinstance(repo, str) and "/" in repo for repo in repositories):
        raise ConfigError("Each repository must be a string in 'owner/repo' format.")

    default_days = data.get("default_days")
    if default_days is not None:
        if not isinstance(default_days, int) or default_days < 1:
            raise ConfigError("'default_days' must be an integer greater than 0.")

    return ConfigFile(repositories=repositories, default_days=default_days)


def resolve_days(cli_days: int | None, config: ConfigFile) -> int:
    if cli_days is not None:
        if cli_days < 1:
            raise ValueError("--days must be 1 or greater")
        return cli_days
    if config.default_days is not None:
        return config.default_days
    return DEFAULT_DAYS


def get_github_token() -> str:
    token = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")
    if token:
        return token
    raise RuntimeError(
        "GitHub token not found. Set GITHUB_TOKEN or GH_TOKEN before running this tool."
    )


def get_copilot_github_token() -> str | None:
    return os.getenv("COPILOT_GITHUB_TOKEN") or os.getenv("GH_TOKEN") or os.getenv("GITHUB_TOKEN")


def build_search_query(repository: str, cutoff: datetime) -> str:
    cutoff_text = cutoff.date().isoformat()
    return f"repo:{repository} is:pr updated:>={cutoff_text} sort:updated-desc"


def github_graphql_request(token: str, query: str, variables: dict[str, Any]) -> dict[str, Any]:
    payload = json.dumps({"query": query, "variables": variables}).encode("utf-8")
    request = urllib.request.Request(
        GITHUB_GRAPHQL_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "copilot-sdk-python-demo",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request) as response:
            body = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"GitHub API request failed: HTTP {exc.code} {details}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"GitHub API request failed: {exc.reason}") from exc

    data = json.loads(body)
    if data.get("errors"):
        raise RuntimeError(f"GitHub GraphQL returned errors: {data['errors']}")
    return data


def normalize_pull_request(node: dict[str, Any], repository: str) -> PullRequestRecord:
    merged_at = parse_iso_datetime(node.get("mergedAt"))
    closed_at = parse_iso_datetime(node.get("closedAt"))
    return PullRequestRecord(
        repository=repository,
        number=node["number"],
        title=node["title"],
        url=node["url"],
        state=node["state"],
        is_draft=node["isDraft"],
        created_at=parse_iso_datetime(node["createdAt"]) or datetime.now(UTC),
        updated_at=parse_iso_datetime(node["updatedAt"]) or datetime.now(UTC),
        merged_at=merged_at,
        closed_at=closed_at,
        author=(node.get("author") or {}).get("login") or "ghost",
        review_decision=node.get("reviewDecision"),
        review_count=((node.get("reviews") or {}).get("totalCount")) or 0,
        commit_count=((node.get("commits") or {}).get("totalCount")) or 0,
        additions=node.get("additions") or 0,
        deletions=node.get("deletions") or 0,
    )


def extract_pr_nodes(search_response: dict[str, Any], repository: str) -> tuple[list[PullRequestRecord], bool, str | None]:
    search = search_response["data"]["search"]
    items: list[PullRequestRecord] = []
    for edge in search["edges"]:
        node = edge["node"]
        if node.get("__typename") != "PullRequest":
            continue
        items.append(normalize_pull_request(node, repository))

    page_info = search["pageInfo"]
    return items, page_info["hasNextPage"], page_info["endCursor"]


def fetch_recent_pull_requests(repository: str, cutoff: datetime, token: str) -> list[PullRequestRecord]:
    query = """
    query RecentPullRequests($searchQuery: String!, $first: Int!, $after: String) {
      search(query: $searchQuery, type: ISSUE, first: $first, after: $after) {
        edges {
          node {
            __typename
            ... on PullRequest {
              number
              title
              url
              state
              isDraft
              createdAt
              updatedAt
              mergedAt
              closedAt
              additions
              deletions
              reviewDecision
              author {
                login
              }
              reviews {
                totalCount
              }
              commits {
                totalCount
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
    """

    results: list[PullRequestRecord] = []
    seen: set[tuple[str, int]] = set()
    cursor: str | None = None

    while True:
        variables = {
            "searchQuery": build_search_query(repository, cutoff),
            "first": SEARCH_PAGE_SIZE,
            "after": cursor,
        }
        response = github_graphql_request(token, query, variables)
        items, has_next_page, cursor = extract_pr_nodes(response, repository)

        for item in items:
            key = (item.repository, item.number)
            if key in seen:
                continue
            seen.add(key)
            results.append(item)

        if not has_next_page:
            break

    return results


def is_review_waiting(pr: PullRequestRecord) -> bool:
    if pr.state != "OPEN" or pr.is_draft:
        return False
    return pr.review_decision in {None, "REVIEW_REQUIRED"}


def compute_repo_summary(repository: str, prs: list[PullRequestRecord], cutoff: datetime) -> RepoSummary:
    created_count = sum(pr.created_at >= cutoff for pr in prs)
    open_count = sum(pr.state == "OPEN" for pr in prs)
    merged_count = sum(pr.merged_at is not None and pr.merged_at >= cutoff for pr in prs)
    closed_count = sum(
        pr.closed_at is not None and pr.closed_at >= cutoff and pr.merged_at is None for pr in prs
    )
    draft_count = sum(pr.is_draft for pr in prs)
    review_waiting_count = sum(is_review_waiting(pr) for pr in prs)
    approved_count = sum(pr.review_decision == "APPROVED" for pr in prs)
    changes_requested_count = sum(pr.review_decision == "CHANGES_REQUESTED" for pr in prs)

    open_prs = [pr for pr in prs if pr.state == "OPEN"]
    open_days = [(datetime.now(UTC) - pr.created_at).total_seconds() / 86400 for pr in open_prs]
    average_open_days = round(sum(open_days) / len(open_days), 1) if open_days else 0.0
    long_open_count = sum(days >= LONG_OPEN_DAYS for days in open_days)

    notable_prs = sorted(
        prs,
        key=lambda pr: (
            pr.state != "OPEN",
            pr.review_decision == "APPROVED",
            pr.updated_at,
        ),
        reverse=True,
    )[:3]

    return RepoSummary(
        repository=repository,
        total_prs=len(prs),
        created_count=created_count,
        open_count=open_count,
        merged_count=merged_count,
        closed_count=closed_count,
        draft_count=draft_count,
        review_waiting_count=review_waiting_count,
        approved_count=approved_count,
        changes_requested_count=changes_requested_count,
        long_open_count=long_open_count,
        average_open_days=average_open_days,
        notable_prs=notable_prs,
    )


def summarize_pull_requests_by_repo(
    repositories: list[str],
    prs_by_repo: dict[str, list[PullRequestRecord]],
    cutoff: datetime,
) -> tuple[dict[str, RepoSummary], dict[str, Any]]:
    repo_summaries: dict[str, RepoSummary] = {}
    for repository in repositories:
        repo_summaries[repository] = compute_repo_summary(
            repository,
            prs_by_repo.get(repository, []),
            cutoff,
        )

    overall = {
        "repositories": len(repositories),
        "total_prs": sum(summary.total_prs for summary in repo_summaries.values()),
        "created_count": sum(summary.created_count for summary in repo_summaries.values()),
        "open_count": sum(summary.open_count for summary in repo_summaries.values()),
        "merged_count": sum(summary.merged_count for summary in repo_summaries.values()),
        "closed_count": sum(summary.closed_count for summary in repo_summaries.values()),
        "draft_count": sum(summary.draft_count for summary in repo_summaries.values()),
        "review_waiting_count": sum(summary.review_waiting_count for summary in repo_summaries.values()),
        "approved_count": sum(summary.approved_count for summary in repo_summaries.values()),
        "changes_requested_count": sum(
            summary.changes_requested_count for summary in repo_summaries.values()
        ),
        "long_open_count": sum(summary.long_open_count for summary in repo_summaries.values()),
        "average_open_days": round(
            (
                sum(summary.average_open_days * summary.open_count for summary in repo_summaries.values())
                / max(1, sum(summary.open_count for summary in repo_summaries.values()))
            ),
            1,
        ),
    }

    report_payload = {
        "cutoff": cutoff.date().isoformat(),
        "overall": overall,
        "repositories": [
            {
                "name": summary.repository,
                "total_prs": summary.total_prs,
                "created_count": summary.created_count,
                "open_count": summary.open_count,
                "merged_count": summary.merged_count,
                "closed_count": summary.closed_count,
                "draft_count": summary.draft_count,
                "review_waiting_count": summary.review_waiting_count,
                "approved_count": summary.approved_count,
                "changes_requested_count": summary.changes_requested_count,
                "long_open_count": summary.long_open_count,
                "average_open_days": summary.average_open_days,
                "notable_prs": [
                    {
                        "repository": pr.repository,
                        "number": pr.number,
                        "title": pr.title,
                        "url": pr.url,
                        "state": pr.state,
                        "author": pr.author,
                        "review_decision": pr.review_decision,
                        "age_days": round(
                            (datetime.now(UTC) - pr.created_at).total_seconds() / 86400,
                            1,
                        ),
                    }
                    for pr in summary.notable_prs
                ],
            }
            for summary in repo_summaries.values()
        ],
    }
    return repo_summaries, report_payload


def build_copilot_prompt(days: int, payload: dict[str, Any]) -> str:
    return (
        "You are preparing a concise engineering report in Markdown.\n"
        f"Analyze the following GitHub pull request metrics for the last {days} days.\n"
        "Write Japanese output with exactly these sections:\n"
        "## 全体サマリ\n"
        "## リポジトリ別サマリ\n"
        "## 気になるPR\n"
        "Requirements:\n"
        "- Focus on operational summary, not product speculation.\n"
        "- Call out review backlog, long-open PRs, and notable trends.\n"
        "- Mention repositories with zero recent PRs if any exist.\n"
        "- Keep it readable and concise.\n\n"
        "Metrics JSON:\n"
        f"{json.dumps(payload, ensure_ascii=False, indent=2)}"
    )


def fallback_markdown_report(days: int, payload: dict[str, Any]) -> str:
    overall = payload["overall"]
    lines = [
        f"# GitHub PR Weekly Report ({days} days)",
        "",
        "## 全体サマリ",
        (
            f"- 対象リポジトリ数: {overall['repositories']}"
            f" / PR総数: {overall['total_prs']}"
            f" / 新規作成: {overall['created_count']}"
            f" / オープン継続中: {overall['open_count']}"
            f" / マージ: {overall['merged_count']}"
            f" / クローズのみ: {overall['closed_count']}"
        ),
        (
            f"- ドラフト: {overall['draft_count']}"
            f" / レビュー待ち: {overall['review_waiting_count']}"
            f" / 承認済み: {overall['approved_count']}"
            f" / 変更依頼あり: {overall['changes_requested_count']}"
        ),
        (
            f"- 長期オープンPR: {overall['long_open_count']}"
            f" / 平均オープン日数: {overall['average_open_days']}"
        ),
        "",
        "## リポジトリ別サマリ",
    ]

    for repo in payload["repositories"]:
        lines.append(
            (
                f"- `{repo['name']}`: PR {repo['total_prs']}件,"
                f" 新規 {repo['created_count']}, オープン {repo['open_count']},"
                f" マージ {repo['merged_count']}, レビュー待ち {repo['review_waiting_count']},"
                f" 長期オープン {repo['long_open_count']}"
            )
        )

    lines.extend(["", "## 気になるPR"])
    notable_found = False
    for repo in payload["repositories"]:
        for pr in repo["notable_prs"]:
            notable_found = True
            lines.append(
                (
                    f"- `{pr['repository']}#{pr['number']}` [{pr['title']}]({pr['url']}):"
                    f" state={pr['state']}, review={pr['review_decision']}, age={pr['age_days']} days"
                )
            )

    if not notable_found:
        lines.append("- 特筆すべきPRはありませんでした。")

    return "\n".join(lines)


async def generate_markdown_report_with_copilot(model: str, days: int, payload: dict[str, Any]) -> str:
    try:
        from copilot import CopilotClient
        from copilot.session import PermissionHandler
    except ImportError as exc:
        raise RuntimeError(
            "github-copilot-sdk is not installed. Run 'pip install -r requirements.txt' first."
        ) from exc

    client = CopilotClient()
    await client.start()

    try:
        session_kwargs: dict[str, Any] = {
            "model": model,
            "streaming": False,
            "on_permission_request": PermissionHandler.approve_all,
        }
        copilot_token = get_copilot_github_token()
        if copilot_token:
            session_kwargs["github_token"] = copilot_token

        session = await client.create_session(
            **session_kwargs,
        )
        prompt = build_copilot_prompt(days, payload)
        response = await session.send_and_wait(prompt)

        content = getattr(getattr(response, "data", None), "content", None)
        if isinstance(content, str) and content.strip():
            return content.strip()
        return fallback_markdown_report(days, payload)
    finally:
        await client.stop()


async def run(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    config = load_config(args.config)
    days = resolve_days(args.days, config)
    token = get_github_token()
    cutoff = datetime.now(UTC) - timedelta(days=days)

    prs_by_repo: dict[str, list[PullRequestRecord]] = {}
    for repository in config.repositories:
        prs_by_repo[repository] = fetch_recent_pull_requests(repository, cutoff, token)

    _, payload = summarize_pull_requests_by_repo(config.repositories, prs_by_repo, cutoff)

    try:
        report = await generate_markdown_report_with_copilot(args.model, days, payload)
    except Exception as exc:
        print(f"[warning] Copilot summary generation failed, using fallback report: {exc}", file=sys.stderr)
        report = fallback_markdown_report(days, payload)

    print(report)
    return 0


def main() -> None:
    try:
        raise SystemExit(asyncio.run(run()))
    except (FileNotFoundError, RuntimeError, ValueError, ConfigError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
