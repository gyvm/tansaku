"""Discord incoming-webhook notifier (splits into <=2000 char messages)."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any, Callable

from .base import Notifier

MAX_LEN = 1900  # Discord hard cap is 2000; leave room for the subject header.


def _chunk(text: str, size: int) -> list[str]:
    chunks: list[str] = []
    current: list[str] = []
    length = 0
    for line in text.splitlines(keepends=True):
        if length + len(line) > size and current:
            chunks.append("".join(current))
            current, length = [], 0
        # A single very long line still has to be split.
        while len(line) > size:
            chunks.append(line[:size])
            line = line[size:]
        current.append(line)
        length += len(line)
    if current:
        chunks.append("".join(current))
    return chunks or [""]


class DiscordWebhookNotifier(Notifier):
    name = "discord"

    def __init__(
        self,
        webhook_url: str,
        opener: Callable[[urllib.request.Request], Any] | None = None,
    ) -> None:
        if not webhook_url:
            raise ValueError("DISCORD_WEBHOOK_URL is not set.")
        self.webhook_url = webhook_url
        self._opener = opener or (lambda req: urllib.request.urlopen(req))

    def send(self, subject: str, markdown: str, meta: dict | None = None) -> None:
        full = f"**{subject}**\n{markdown}"
        for part in _chunk(full, MAX_LEN):
            self._post(part)

    def _post(self, content: str) -> None:
        payload = json.dumps({"content": content}).encode("utf-8")
        request = urllib.request.Request(
            self.webhook_url,
            data=payload,
            headers={"Content-Type": "application/json", "User-Agent": "x-bookmarks-digest"},
            method="POST",
        )
        try:
            with self._opener(request) as response:
                response.read()
        except urllib.error.HTTPError as exc:
            details = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Discord webhook failed: HTTP {exc.code} {details}") from exc
        except urllib.error.URLError as exc:
            raise RuntimeError(f"Discord webhook failed: {exc.reason}") from exc
