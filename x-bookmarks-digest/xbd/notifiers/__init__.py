"""Notifier factory."""

from __future__ import annotations

import os
import sys

from ..config import ConfigFile
from .base import Notifier
from .discord import DiscordWebhookNotifier
from .slack import SlackWebhookNotifier
from .stdout import StdoutNotifier


def build_notifier(channel: str, env: dict[str, str]) -> Notifier:
    if channel == "stdout":
        return StdoutNotifier()
    if channel == "slack":
        return SlackWebhookNotifier(env.get("SLACK_WEBHOOK_URL", ""))
    if channel == "discord":
        return DiscordWebhookNotifier(env.get("DISCORD_WEBHOOK_URL", ""))
    raise ValueError(f"Unknown notify channel: {channel}")


def build_notifiers(config: ConfigFile, env: dict[str, str] | None = None) -> list[Notifier]:
    env = env if env is not None else dict(os.environ)
    return [build_notifier(ch, env) for ch in config.notify.channels]


def dispatch(notifiers: list[Notifier], subject: str, markdown: str) -> None:
    """Send to every notifier; one failing channel does not stop the others."""
    for notifier in notifiers:
        try:
            notifier.send(subject, markdown)
        except Exception as exc:  # noqa: BLE001 - isolate per-channel failures
            print(f"[warning] notifier '{notifier.name}' failed: {exc}", file=sys.stderr)


__all__ = [
    "Notifier",
    "StdoutNotifier",
    "SlackWebhookNotifier",
    "DiscordWebhookNotifier",
    "build_notifier",
    "build_notifiers",
    "dispatch",
]
