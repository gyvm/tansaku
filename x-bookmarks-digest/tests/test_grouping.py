import unittest
from datetime import datetime

from xbd.grouping import build_digest_markdown, group_bookmarks, group_key
from xbd.models import Bookmark


def bm(bid, handle, text="hi", hashtags=None, urls=None):
    return Bookmark(
        id=bid,
        text=text,
        author_handle=handle,
        author_name=handle.title(),
        created_at=datetime(2026, 8, 1),
        urls=urls or [],
        hashtags=hashtags or [],
    )


class GroupingTest(unittest.TestCase):
    def test_group_key_priority(self):
        strategy = ["hashtag", "domain", "author"]
        self.assertEqual(group_key(bm("1", "a", hashtags=["ai"]), strategy), "#ai")
        self.assertEqual(
            group_key(bm("2", "a", urls=["https://blog.example.com/p"]), strategy),
            "blog.example.com",
        )
        self.assertEqual(group_key(bm("3", "carol"), strategy), "@carol")

    def test_ignores_self_links_for_domain(self):
        strategy = ["domain", "author"]
        # only x.com/t.co links -> falls through to author
        b = bm("4", "dave", urls=["https://t.co/abc", "https://x.com/dave/status/4"])
        self.assertEqual(group_key(b, strategy), "@dave")

    def test_group_bookmarks_orders_other_last(self):
        strategy = ["hashtag"]
        items = [bm("1", "a", hashtags=["x"]), bm("2", "b"), bm("3", "c", hashtags=["x"])]
        groups = group_bookmarks(items, strategy)
        keys = list(groups.keys())
        self.assertEqual(keys[0], "#x")
        self.assertEqual(keys[-1], "Other")

    def test_digest_contains_sections_and_links(self):
        md = build_digest_markdown(
            [bm("100", "alice", hashtags=["ai"], text="cool tool")],
            strategy=["hashtag", "domain", "author"],
            title="My Digest",
        )
        self.assertIn("# My Digest", md)
        self.assertIn("## Overview", md)
        self.assertIn("## Groups", md)
        self.assertIn("#ai", md)
        self.assertIn("https://x.com/alice/status/100", md)

    def test_empty_digest(self):
        md = build_digest_markdown([], strategy=["author"], title="Empty")
        self.assertIn("No new bookmarks", md)


if __name__ == "__main__":
    unittest.main()
