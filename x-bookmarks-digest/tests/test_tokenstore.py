import tempfile
import unittest
from pathlib import Path

from xbd.tokenstore import FileTokenStore, TokenBundle, TokenError

try:
    from cryptography.fernet import Fernet

    from xbd.tokenstore import RepoEncryptedTokenStore

    Fernet.generate_key()  # some envs import fine but panic on first use
    HAS_CRYPTO = True
except BaseException:  # pragma: no cover - broken/absent cryptography build (pyo3 may panic)
    HAS_CRYPTO = False


class FileTokenStoreTest(unittest.TestCase):
    def test_round_trip(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "token.json"
            store = FileTokenStore(str(path))
            store.save(TokenBundle(refresh_token="r1", access_token="a1", user_id="42"))
            loaded = store.load()
            self.assertEqual(loaded.refresh_token, "r1")
            self.assertEqual(loaded.user_id, "42")

    def test_missing_raises(self):
        with tempfile.TemporaryDirectory() as d:
            store = FileTokenStore(str(Path(d) / "nope.json"))
            with self.assertRaises(TokenError):
                store.load()


@unittest.skipUnless(HAS_CRYPTO, "cryptography not installed")
class RepoEncryptedTokenStoreTest(unittest.TestCase):
    def test_encrypt_round_trip_and_persist_called(self):
        key = Fernet.generate_key().decode()
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "token.enc"
            calls = []

            def fake_persist(paths, message, branch):
                calls.append((paths, message, branch))

            store = RepoEncryptedTokenStore(
                str(path), enc_key=key, git_branch="br", git_persist=fake_persist
            )
            store.save(TokenBundle(refresh_token="secret-rt"))
            # ciphertext on disk must not contain the plaintext token
            self.assertNotIn(b"secret-rt", path.read_bytes())
            self.assertEqual(len(calls), 1)
            self.assertEqual(calls[0][2], "br")

            loaded = store.load()
            self.assertEqual(loaded.refresh_token, "secret-rt")

    def test_wrong_key_fails_to_decrypt(self):
        key1 = Fernet.generate_key().decode()
        key2 = Fernet.generate_key().decode()
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "token.enc"
            RepoEncryptedTokenStore(str(path), key1, "br", lambda *a: None).save(
                TokenBundle(refresh_token="rt")
            )
            other = RepoEncryptedTokenStore(str(path), key2, "br", lambda *a: None)
            with self.assertRaises(TokenError):
                other.load()

    def test_requires_enc_key(self):
        with self.assertRaises(TokenError):
            RepoEncryptedTokenStore("x.enc", enc_key="", git_branch="b", git_persist=lambda *a: None)


if __name__ == "__main__":
    unittest.main()
