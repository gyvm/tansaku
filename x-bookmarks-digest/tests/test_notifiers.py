import json
import unittest

from xbd.notifiers import build_notifier, dispatch
from xbd.notifiers.discord import DiscordWebhookNotifier, _chunk
from xbd.notifiers.slack import SlackWebhookNotifier


class CapturingOpener:
    def __init__(self):
        self.requests = []

    def __call__(self, request):
        body = request.data.decode("utf-8") if request.data else ""
        self.requests.append((request.full_url, json.loads(body) if body else None))
        return _NullResponse()


class _NullResponse:
    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def read(self):
        return b""


class SlackTest(unittest.TestCase):
    def test_posts_text(self):
        opener = CapturingOpener()
        SlackWebhookNotifier("https://hooks.slack.test/x", opener=opener).send("Sub", "hello")
        self.assertEqual(len(opener.requests), 1)
        url, payload = opener.requests[0]
        self.assertEqual(url, "https://hooks.slack.test/x")
        self.assertIn("Sub", payload["text"])
        self.assertIn("hello", payload["text"])

    def test_requires_url(self):
        with self.assertRaises(ValueError):
            SlackWebhookNotifier("")


class DiscordTest(unittest.TestCase):
    def test_chunks_long_content(self):
        long_md = "\n".join(f"line {i}" for i in range(2000))
        opener = CapturingOpener()
        DiscordWebhookNotifier("https://discord.test/x", opener=opener).send("S", long_md)
        self.assertGreater(len(opener.requests), 1)
        for _url, payload in opener.requests:
            self.assertLessEqual(len(payload["content"]), 2000)

    def test_chunk_helper_splits_oversized_line(self):
        parts = _chunk("a" * 5000, 1900)
        self.assertTrue(all(len(p) <= 1900 for p in parts))


class DispatchTest(unittest.TestCase):
    def test_one_failure_does_not_stop_others(self):
        sent = []

        class Good:
            name = "good"

            def send(self, subject, markdown, meta=None):
                sent.append("good")

        class Bad:
            name = "bad"

            def send(self, subject, markdown, meta=None):
                raise RuntimeError("boom")

        dispatch([Bad(), Good()], "s", "m")
        self.assertIn("good", sent)


class FactoryTest(unittest.TestCase):
    def test_build_stdout(self):
        n = build_notifier("stdout", {})
        self.assertEqual(n.name, "stdout")

    def test_unknown_channel(self):
        with self.assertRaises(ValueError):
            build_notifier("carrier-pigeon", {})


if __name__ == "__main__":
    unittest.main()
