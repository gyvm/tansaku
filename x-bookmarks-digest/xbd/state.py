"""Run state: which bookmarks we have already seen (for cross-run dedup)."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path


@dataclass(slots=True)
class RunState:
    seen_ids: list[str] = field(default_factory=list)
    last_run_at: str | None = None
    newest_seen_id: str | None = None

    @property
    def seen_set(self) -> set[str]:
        return set(self.seen_ids)

    def record(self, new_ids: list[str], now_iso: str, cache_size: int) -> None:
        """Prepend newest ids and trim to a bounded LRU window."""
        merged = list(dict.fromkeys([*new_ids, *self.seen_ids]))
        self.seen_ids = merged[:cache_size]
        self.last_run_at = now_iso
        if new_ids:
            self.newest_seen_id = new_ids[0]
        elif self.seen_ids:
            self.newest_seen_id = self.seen_ids[0]


def load_state(path: str) -> RunState:
    p = Path(path)
    if not p.exists():
        return RunState()
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return RunState()
    return RunState(
        seen_ids=list(data.get("seen_ids", [])),
        last_run_at=data.get("last_run_at"),
        newest_seen_id=data.get("newest_seen_id"),
    )


def save_state(path: str, state: RunState) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    tmp = p.with_suffix(p.suffix + ".tmp")
    tmp.write_text(
        json.dumps(
            {
                "seen_ids": state.seen_ids,
                "last_run_at": state.last_run_at,
                "newest_seen_id": state.newest_seen_id,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    os.replace(tmp, p)
