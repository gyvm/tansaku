import json
import unittest
import urllib.parse

from xbd.client import XBookmarksClient


class FakeResponse:
    def __init__(self, payload: dict):
        self._body = json.dumps(payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def read(self):
        return self._body


def _tweet(tid, author_id, text="hi", hashtags=None, urls=None):
    entities = {}
    if hashtags:
        entities["hashtags"] = [{"tag": t} for t in hashtags]
    if urls:
        entities["urls"] = [{"expanded_url": u} for u in urls]
    node = {"id": tid, "author_id": author_id, "text": text, "created_at": "2026-08-01T00:00:00Z"}
    if entities:
        node["entities"] = entities
    return node


class PagedOpener:
    """Returns page1 first, then page2 keyed by pagination_token=cursor1."""

    def __init__(self, page1, page2):
        self.page1 = page1
        self.page2 = page2
        self.calls = 0

    def __call__(self, request):
        self.calls += 1
        query = urllib.parse.urlparse(request.full_url).query
        params = urllib.parse.parse_qs(query)
        token = params.get("pagination_token", [None])[0]
        return FakeResponse(self.page2 if token == "cursor1" else self.page1)


class ClientTest(unittest.TestCase):
    def _pages(self):
        users = [{"id": "1", "username": "alice", "name": "Alice"},
                 {"id": "2", "username": "bob", "name": "Bob"}]
        page1 = {
            "data": [_tweet("100", "1", hashtags=["ai"]), _tweet("99", "2", urls=["https://example.com/x"])],
            "includes": {"users": users},
            "meta": {"next_token": "cursor1"},
        }
        page2 = {
            "data": [_tweet("98", "1")],
            "includes": {"users": users},
            "meta": {},
        }
        return page1, page2

    def test_paginates_all_when_no_dedup(self):
        page1, page2 = self._pages()
        opener = PagedOpener(page1, page2)
        client = XBookmarksClient("tok", "1", opener=opener)
        result = client.fetch_bookmarks(dedup=False, max_pages=5)
        self.assertEqual([b.id for b in result], ["100", "99", "98"])
        self.assertEqual(opener.calls, 2)
        # normalization details
        self.assertEqual(result[0].hashtags, ["ai"])
        self.assertEqual(result[1].urls, ["https://example.com/x"])
        self.assertEqual(result[0].author_handle, "alice")

    def test_dedup_early_stops_and_skips_seen(self):
        page1, page2 = self._pages()
        opener = PagedOpener(page1, page2)
        client = XBookmarksClient("tok", "1", opener=opener)
        # "99" already seen -> skip it and stop before page 2.
        result = client.fetch_bookmarks(seen_ids={"99"}, dedup=True, max_pages=5)
        self.assertEqual([b.id for b in result], ["100"])
        self.assertEqual(opener.calls, 1)  # did not fetch page 2

    def test_second_run_returns_nothing(self):
        page1, page2 = self._pages()
        opener = PagedOpener(page1, page2)
        client = XBookmarksClient("tok", "1", opener=opener)
        result = client.fetch_bookmarks(seen_ids={"100", "99", "98"}, dedup=True, max_pages=5)
        self.assertEqual(result, [])


if __name__ == "__main__":
    unittest.main()
