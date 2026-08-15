"""Slack incoming-webhook notifier."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any, Callable

from .base import Notifier

# Slack renders a healthy amount of text; keep a generous but safe cap.
MAX_LEN = 3800


class SlackWebhookNotifier(Notifier):
    name = "slack"

    def __init__(
        self,
        webhook_url: str,
        opener: Callable[[urllib.request.Request], Any] | None = None,
    ) -> None:
        if not webhook_url:
            raise ValueError("SLACK_WEBHOOK_URL is not set.")
        self.webhook_url = webhook_url
        self._opener = opener or (lambda req: urllib.request.urlopen(req))

    def send(self, subject: str, markdown: str, meta: dict | None = None) -> None:
        text = markdown if len(markdown) <= MAX_LEN else markdown[: MAX_LEN - 1] + "…"
        payload = json.dumps({"text": f"*{subject}*\n{text}"}).encode("utf-8")
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
            raise RuntimeError(f"Slack webhook failed: HTTP {exc.code} {details}") from exc
        except urllib.error.URLError as exc:
            raise RuntimeError(f"Slack webhook failed: {exc.reason}") from exc
