"""Minimal git helpers for committing durable state on ephemeral runners."""

from __future__ import annotations

import subprocess
import sys


def _run(args: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(args, capture_output=True, text=True)


def commit_and_push(paths: list[str], message: str, branch: str) -> None:
    """Stage `paths`, commit, and push to `branch`.

    Best-effort and idempotent: a no-op when there is nothing to commit. Raises
    only if the push itself fails (so token rotation loss surfaces loudly).
    """
    if not paths:
        return

    add = _run(["git", "add", "--", *paths])
    if add.returncode != 0:
        print(f"[warning] git add failed: {add.stderr.strip()}", file=sys.stderr)
        return

    # Nothing staged -> nothing to do.
    diff = _run(["git", "diff", "--cached", "--quiet", "--", *paths])
    if diff.returncode == 0:
        return

    commit = _run(["git", "commit", "-m", message, "--", *paths])
    if commit.returncode != 0:
        print(f"[warning] git commit failed: {commit.stderr.strip()}", file=sys.stderr)
        return

    push_args = ["git", "push"]
    if branch:
        push_args += ["-u", "origin", branch]
    push = _run(push_args)
    if push.returncode != 0:
        raise RuntimeError(f"git push failed: {push.stderr.strip()}")
