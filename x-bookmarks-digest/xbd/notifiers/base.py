"""Notifier interface."""

from __future__ import annotations

from abc import ABC, abstractmethod


class Notifier(ABC):
    name: str = "base"

    @abstractmethod
    def send(self, subject: str, markdown: str, meta: dict | None = None) -> None:
        ...
