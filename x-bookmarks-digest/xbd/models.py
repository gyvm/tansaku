"""Domain models and normalization of raw X API bookmark objects."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
from urllib.parse import urlparse


@dataclass(slots=True)
class Bookmark:
    id: str
    text: str
    author_handle: str
    author_name: str
    created_at: datetime | None
    urls: list[str] = field(default_factory=list)
    hashtags: list[str] = field(default_factory=list)
    lang: str | None = None

    @property
    def url(self) -> str:
        """Canonical link to the post itself."""
        handle = self.author_handle or "i"
        return f"https://x.com/{handle}/status/{self.id}"

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "text": self.text,
            "author_handle": self.author_handle,
            "author_name": self.author_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "urls": self.urls,
            "hashtags": self.hashtags,
            "lang": self.lang,
            "url": self.url,
        }


def parse_iso_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def normalize_bookmark(node: dict[str, Any], users_by_id: dict[str, dict[str, Any]]) -> Bookmark:
    """Build a Bookmark from a raw tweet node plus the includes.users map."""
    author = users_by_id.get(str(node.get("author_id", "")), {})

    # Full text: note_tweet holds the untruncated body for long posts.
    note = node.get("note_tweet") or {}
    text = note.get("text") or node.get("text") or ""

    entities = node.get("entities") or {}
    # Expanded URLs, de-duplicated, excluding self-permalink t.co noise where possible.
    urls: list[str] = []
    for item in entities.get("urls", []) or []:
        expanded = item.get("expanded_url") or item.get("url")
        if expanded and expanded not in urls:
            urls.append(expanded)

    hashtags: list[str] = []
    for item in entities.get("hashtags", []) or []:
        tag = item.get("tag")
        if tag and tag not in hashtags:
            hashtags.append(tag)

    return Bookmark(
        id=str(node.get("id", "")),
        text=text,
        author_handle=str(author.get("username", "")),
        author_name=str(author.get("name", "")),
        created_at=parse_iso_datetime(node.get("created_at")),
        urls=urls,
        hashtags=hashtags,
        lang=node.get("lang"),
    )


def domain_of(url: str) -> str | None:
    """Return the registrable-ish host of a URL (without leading www.)."""
    try:
        host = urlparse(url).netloc.lower()
    except ValueError:
        return None
    if not host:
        return None
    if host.startswith("www."):
        host = host[4:]
    return host or None
