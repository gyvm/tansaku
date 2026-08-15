"""Deterministic grouping of bookmarks and Markdown digest rendering (no LLM)."""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass

from .models import Bookmark, domain_of

OTHER_GROUP = "Other"


def _first_domain(bookmark: Bookmark) -> str | None:
    for url in bookmark.urls:
        host = domain_of(url)
        if host and host not in {"x.com", "twitter.com", "t.co"}:
            return host
    return None


def group_key(bookmark: Bookmark, strategy: list[str]) -> str:
    """First strategy in priority order that yields a value wins."""
    for strat in strategy:
        if strat == "hashtag" and bookmark.hashtags:
            return f"#{bookmark.hashtags[0]}"
        if strat == "domain":
            host = _first_domain(bookmark)
            if host:
                return host
        if strat == "author" and bookmark.author_handle:
            return f"@{bookmark.author_handle}"
    return OTHER_GROUP


def group_bookmarks(bookmarks: list[Bookmark], strategy: list[str]) -> dict[str, list[Bookmark]]:
    groups: dict[str, list[Bookmark]] = {}
    for bm in bookmarks:
        groups.setdefault(group_key(bm, strategy), []).append(bm)
    # Sort groups by size desc, then name; keep "Other" last.
    ordered = sorted(
        groups.items(),
        key=lambda kv: (kv[0] == OTHER_GROUP, -len(kv[1]), kv[0].lower()),
    )
    return dict(ordered)


@dataclass(slots=True)
class Aggregate:
    total: int
    by_author: list[tuple[str, int]]
    by_domain: list[tuple[str, int]]
    by_lang: list[tuple[str, int]]


def aggregate(bookmarks: list[Bookmark]) -> Aggregate:
    authors: Counter[str] = Counter()
    domains: Counter[str] = Counter()
    langs: Counter[str] = Counter()
    for bm in bookmarks:
        if bm.author_handle:
            authors[bm.author_handle] += 1
        host = _first_domain(bm)
        if host:
            domains[host] += 1
        if bm.lang:
            langs[bm.lang] += 1
    return Aggregate(
        total=len(bookmarks),
        by_author=authors.most_common(5),
        by_domain=domains.most_common(5),
        by_lang=langs.most_common(5),
    )


def _one_line(text: str, limit: int = 140) -> str:
    collapsed = " ".join(text.split())
    return collapsed if len(collapsed) <= limit else collapsed[: limit - 1] + "…"


def _bullet(bm: Bookmark) -> str:
    handle = f"@{bm.author_handle}" if bm.author_handle else "unknown"
    snippet = _one_line(bm.text) or "(no text)"
    return f"- **{handle}**: {snippet} — [link]({bm.url})"


def build_digest_markdown(
    bookmarks: list[Bookmark],
    strategy: list[str],
    title: str = "X Bookmarks Digest",
    generated_at: str | None = None,
) -> str:
    agg = aggregate(bookmarks)
    lines: list[str] = [f"# {title}", ""]

    lines.append("## Overview")
    if generated_at:
        lines.append(f"- Generated: {generated_at}")
    lines.append(f"- New bookmarks: {agg.total}")
    if agg.by_author:
        top = ", ".join(f"@{h} ({n})" for h, n in agg.by_author)
        lines.append(f"- Top authors: {top}")
    if agg.by_domain:
        top = ", ".join(f"{d} ({n})" for d, n in agg.by_domain)
        lines.append(f"- Top domains: {top}")
    lines.append("")

    groups = group_bookmarks(bookmarks, strategy)
    lines.append("## Groups")
    if not groups:
        lines.append("_No new bookmarks._")
    for name, items in groups.items():
        lines.append("")
        lines.append(f"### {name} ({len(items)})")
        for bm in items:
            lines.append(_bullet(bm))
    lines.append("")

    return "\n".join(lines).rstrip() + "\n"
