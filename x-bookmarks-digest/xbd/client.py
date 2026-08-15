"""X API v2 bookmarks client."""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Callable

from .models import Bookmark, normalize_bookmark

BOOKMARKS_URL = "https://api.twitter.com/2/users/{user_id}/bookmarks"

TWEET_FIELDS = "created_at,note_tweet,entities,public_metrics,lang,referenced_tweets"
USER_FIELDS = "username,name,verified"
EXPANSIONS = "author_id,attachments.media_keys"


class BookmarkFetchError(RuntimeError):
    pass


class XBookmarksClient:
    def __init__(
        self,
        access_token: str,
        user_id: str,
        opener: Callable[[urllib.request.Request], Any] | None = None,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        self.access_token = access_token
        self.user_id = user_id
        self._opener = opener or (lambda req: urllib.request.urlopen(req))
        self._sleep = sleep

    def _get(self, params: dict[str, str], max_retries: int = 3) -> dict[str, Any]:
        url = BOOKMARKS_URL.format(user_id=self.user_id) + "?" + urllib.parse.urlencode(params)
        request = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {self.access_token}",
                "User-Agent": "x-bookmarks-digest",
            },
        )
        for attempt in range(max_retries):
            try:
                with self._opener(request) as response:
                    return json.loads(response.read().decode("utf-8"))
            except urllib.error.HTTPError as exc:
                if exc.code == 429 and attempt < max_retries - 1:
                    self._sleep(self._retry_after(exc))
                    continue
                details = exc.read().decode("utf-8", errors="replace")
                raise BookmarkFetchError(f"Bookmarks request failed: HTTP {exc.code} {details}") from exc
            except urllib.error.URLError as exc:
                raise BookmarkFetchError(f"Bookmarks request failed: {exc.reason}") from exc
        raise BookmarkFetchError("Bookmarks request failed after retries.")

    @staticmethod
    def _retry_after(exc: urllib.error.HTTPError) -> float:
        reset = exc.headers.get("x-rate-limit-reset") if exc.headers else None
        if reset:
            try:
                return max(1.0, float(reset) - time.time())
            except ValueError:
                pass
        return 15.0

    def fetch_bookmarks(
        self,
        seen_ids: set[str] | None = None,
        max_results: int = 100,
        max_pages: int = 5,
        dedup: bool = True,
    ) -> list[Bookmark]:
        """Fetch newest-first, stopping early once a previously seen id appears."""
        seen_ids = seen_ids or set()
        collected: list[Bookmark] = []
        pagination_token: str | None = None

        for _ in range(max_pages):
            params: dict[str, str] = {
                "max_results": str(max_results),
                "expansions": EXPANSIONS,
                "tweet.fields": TWEET_FIELDS,
                "user.fields": USER_FIELDS,
            }
            if pagination_token:
                params["pagination_token"] = pagination_token

            payload = self._get(params)
            data = payload.get("data") or []
            users_by_id = {
                str(u["id"]): u for u in (payload.get("includes", {}).get("users") or [])
            }

            hit_seen = False
            for node in data:
                bid = str(node.get("id", ""))
                if dedup and bid in seen_ids:
                    hit_seen = True
                    continue
                collected.append(normalize_bookmark(node, users_by_id))

            pagination_token = (payload.get("meta") or {}).get("next_token")
            if hit_seen or not pagination_token:
                break

        return collected
