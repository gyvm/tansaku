#!/usr/bin/env python3
"""x-bookmarks-digest CLI: auth | run | test-notify.

Fetches your own X (Twitter) bookmarks via the X API v2, groups them
deterministically, and delivers a Markdown digest to the configured notifiers.
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import UTC, datetime
from pathlib import Path

from xbd import notifiers as notif
from xbd.client import XBookmarksClient
from xbd.config import ConfigFile, load_config
from xbd.grouping import build_digest_markdown
from xbd.oauth import ensure_access_token, resolve_user_id, run_auth_bootstrap
from xbd.state import load_state, save_state
from xbd.tokenstore import build_token_store

DEFAULT_CONFIG = "config.yaml"


def load_dotenv(path: str = ".env") -> None:
    """Minimal .env loader (keeps the dependency surface small)."""
    env_path = Path(path)
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def _resolve_user_id(config: ConfigFile, env: dict[str, str], bundle) -> str:
    configured = env.get(config.x.user_id_env, "") if config.x.user_id_env else ""
    if configured:
        return configured
    if bundle.user_id:
        return bundle.user_id
    if bundle.access_token:
        return resolve_user_id(bundle.access_token)
    raise RuntimeError("Could not resolve X user id. Re-run `auth`.")


def cmd_auth(args: argparse.Namespace) -> int:
    env = dict(os.environ)
    config = _maybe_load_config(args.config)
    store = build_token_store(config, env)
    bundle = run_auth_bootstrap(env, store, open_browser=not args.no_browser)
    print(f"\nAuthorized. user_id={bundle.user_id or '(unresolved)'}. Token saved.")
    return 0


def cmd_run(args: argparse.Namespace) -> int:
    env = dict(os.environ)
    config = load_config(args.config)
    store = build_token_store(config, env)

    bundle = ensure_access_token(env, store)
    user_id = _resolve_user_id(config, env, bundle)

    state_path = config.repo_encrypted.state_path
    state = load_state(state_path)
    seen = state.seen_set if config.fetch.dedup else set()

    max_pages = min(config.x.max_pages, args.limit) if args.limit else config.x.max_pages
    max_results = min(config.x.max_results, args.limit) if args.limit else config.x.max_results

    client = XBookmarksClient(bundle.access_token, user_id)
    bookmarks = client.fetch_bookmarks(
        seen_ids=seen,
        max_results=max_results,
        max_pages=max_pages,
        dedup=config.fetch.dedup,
    )

    now_iso = datetime.now(UTC).isoformat()
    markdown = build_digest_markdown(
        bookmarks,
        strategy=config.group.strategy,
        title=config.digest.title,
        generated_at=now_iso,
    )
    subject = f"{config.digest.title} — {len(bookmarks)} new"

    if args.dry_run:
        print(f"[dry-run] {len(bookmarks)} new bookmarks (no notify, no state write)")
        notif.StdoutNotifier().send(subject, markdown)
        return 0

    if bookmarks or not config.notify.skip_when_empty:
        dispatch_targets = notif.build_notifiers(config, env)
        notif.dispatch(dispatch_targets, subject, markdown)
    else:
        print("No new bookmarks; skipping notification (notify.skip_when_empty).")

    # Persist dedup state after a successful run.
    state.record([bm.id for bm in bookmarks], now_iso, config.fetch.seen_cache_size)
    save_state(state_path, state)
    if config.token_store == "repo_encrypted":
        from xbd.gitutil import commit_and_push

        commit_and_push(
            [state_path],
            "chore(x-bookmarks): update run state [skip ci]",
            config.repo_encrypted.git_branch or env.get("GIT_BRANCH", ""),
        )
    return 0


def cmd_test_notify(args: argparse.Namespace) -> int:
    env = dict(os.environ)
    notifier = notif.build_notifier(args.channel, env)
    notifier.send(
        "[TEST] x-bookmarks-digest",
        "This is a test message confirming your notifier is wired up correctly.",
    )
    print(f"Sent test message via '{args.channel}'.")
    return 0


def _maybe_load_config(path: str) -> ConfigFile:
    if Path(path).exists():
        return load_config(path)
    return ConfigFile()  # defaults are enough for `auth`


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    p_auth = sub.add_parser("auth", help="One-time interactive OAuth2 PKCE bootstrap.")
    p_auth.add_argument("--config", default=DEFAULT_CONFIG, help="Path to config.yaml.")
    p_auth.add_argument("--no-browser", action="store_true", help="Do not auto-open a browser.")
    p_auth.set_defaults(func=cmd_auth)

    p_run = sub.add_parser("run", help="Fetch new bookmarks, group, and notify.")
    p_run.add_argument("--config", default=DEFAULT_CONFIG, help="Path to config.yaml.")
    p_run.add_argument("--dry-run", action="store_true", help="Print to stdout; no notify/state write.")
    p_run.add_argument("--limit", type=int, default=None, help="Cap page size and pages (testing).")
    p_run.set_defaults(func=cmd_run)

    p_test = sub.add_parser("test-notify", help="Send one test message to a channel.")
    p_test.add_argument("--channel", required=True, choices=["stdout", "slack", "discord"])
    p_test.set_defaults(func=cmd_test_notify)

    return parser


def main(argv: list[str] | None = None) -> int:
    load_dotenv()
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except Exception as exc:  # noqa: BLE001 - top-level friendly error
        print(f"[error] {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
