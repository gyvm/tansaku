"""Prints the digest to stdout. Default channel and dry-run target."""

from __future__ import annotations

from .base import Notifier


class StdoutNotifier(Notifier):
    name = "stdout"

    def send(self, subject: str, markdown: str, meta: dict | None = None) -> None:
        print(f"\n===== {subject} =====\n")
        print(markdown)
