import unittest

from xbd.config import ConfigError, validate_config


class ValidateConfigTest(unittest.TestCase):
    def test_defaults_when_empty(self):
        cfg = validate_config({})
        self.assertEqual(cfg.token_store, "file")
        self.assertEqual(cfg.group.strategy, ["hashtag", "domain", "author"])
        self.assertEqual(cfg.notify.channels, ["stdout"])
        self.assertTrue(cfg.notify.skip_when_empty)
        self.assertEqual(cfg.x.max_results, 100)

    def test_full_config(self):
        cfg = validate_config(
            {
                "x": {"user_id_env": "X_USER_ID", "max_results": 50, "max_pages": 2},
                "group": {"strategy": ["author"]},
                "notify": {"channels": ["slack", "discord"], "skip_when_empty": False},
                "token_store": "repo_encrypted",
                "repo_encrypted": {"git_branch": "main", "token_path": "state/t.enc"},
            }
        )
        self.assertEqual(cfg.x.max_results, 50)
        self.assertEqual(cfg.group.strategy, ["author"])
        self.assertEqual(cfg.notify.channels, ["slack", "discord"])
        self.assertFalse(cfg.notify.skip_when_empty)
        self.assertEqual(cfg.token_store, "repo_encrypted")
        self.assertEqual(cfg.repo_encrypted.git_branch, "main")

    def test_rejects_bad_channel(self):
        with self.assertRaises(ConfigError):
            validate_config({"notify": {"channels": ["email"]}})

    def test_rejects_bad_strategy(self):
        with self.assertRaises(ConfigError):
            validate_config({"group": {"strategy": ["nonsense"]}})

    def test_rejects_max_results_over_100(self):
        with self.assertRaises(ConfigError):
            validate_config({"x": {"max_results": 500}})

    def test_rejects_bad_token_store(self):
        with self.assertRaises(ConfigError):
            validate_config({"token_store": "s3"})


if __name__ == "__main__":
    unittest.main()
