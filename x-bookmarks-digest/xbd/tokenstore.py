"""Token persistence.

X rotates the OAuth 2.0 refresh token on every refresh and invalidates the old
one, so the rotated token must be saved atomically and durably BEFORE any fetch
runs. TokenStore abstracts where the bundle lives:

  * FileTokenStore          - local disk (dev / local cron).
  * RepoEncryptedTokenStore - Fernet-encrypted blob committed to the repo, for
                              ephemeral runners (Claude Routine) where local
                              disk does not survive between runs.
"""

from __future__ import annotations

import json
import os
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

from .config import ConfigFile


class TokenError(RuntimeError):
    pass


@dataclass(slots=True)
class TokenBundle:
    refresh_token: str
    access_token: str | None = None
    expires_at: float | None = None  # epoch seconds
    user_id: str | None = None
    scope: str | None = None

    def to_json(self) -> str:
        return json.dumps(
            {
                "refresh_token": self.refresh_token,
                "access_token": self.access_token,
                "expires_at": self.expires_at,
                "user_id": self.user_id,
                "scope": self.scope,
            },
            indent=2,
        )

    @classmethod
    def from_json(cls, text: str) -> "TokenBundle":
        data: dict[str, Any] = json.loads(text)
        if not data.get("refresh_token"):
            raise TokenError("Token data is missing a refresh_token.")
        return cls(
            refresh_token=data["refresh_token"],
            access_token=data.get("access_token"),
            expires_at=data.get("expires_at"),
            user_id=data.get("user_id"),
            scope=data.get("scope"),
        )


class TokenStore(ABC):
    @abstractmethod
    def load(self) -> TokenBundle:
        ...

    @abstractmethod
    def save(self, bundle: TokenBundle) -> None:
        ...


def _atomic_write(path: Path, text: str, mode: int = 0o600) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as handle:
        handle.write(text)
    os.chmod(tmp, mode)
    os.replace(tmp, path)  # atomic on the same filesystem


class FileTokenStore(TokenStore):
    def __init__(self, path: str) -> None:
        self.path = Path(path)

    def load(self) -> TokenBundle:
        if not self.path.exists():
            raise TokenError(
                f"No token found at {self.path}. Run `python main.py auth` first."
            )
        return TokenBundle.from_json(self.path.read_text(encoding="utf-8"))

    def save(self, bundle: TokenBundle) -> None:
        _atomic_write(self.path, bundle.to_json())


class RepoEncryptedTokenStore(TokenStore):
    """Encrypts the bundle with Fernet and commits the ciphertext to the repo.

    The encryption key (TOKEN_ENC_KEY) is static and lives in the environment;
    only the rotating ciphertext is committed. `git_persist` is injected so tests
    can run the encryption round-trip without touching git.
    """

    def __init__(
        self,
        path: str,
        enc_key: str,
        git_branch: str,
        git_persist: Callable[[list[str], str, str], None] | None = None,
    ) -> None:
        if not enc_key:
            raise TokenError(
                "TOKEN_ENC_KEY is required for token_store=repo_encrypted. Generate one "
                'with: python -c "from cryptography.fernet import Fernet; '
                'print(Fernet.generate_key().decode())"'
            )
        self.path = Path(path)
        self.git_branch = git_branch
        self._fernet = self._build_fernet(enc_key)
        if git_persist is None:
            from .gitutil import commit_and_push

            git_persist = commit_and_push
        self._git_persist = git_persist

    @staticmethod
    def _build_fernet(enc_key: str):
        try:
            from cryptography.fernet import Fernet
        except ImportError as exc:  # pragma: no cover - depends on environment
            raise TokenError(
                "The 'cryptography' package is required for token_store=repo_encrypted."
            ) from exc
        try:
            return Fernet(enc_key.encode("utf-8"))
        except Exception as exc:  # invalid key
            raise TokenError(f"Invalid TOKEN_ENC_KEY: {exc}") from exc

    def load(self) -> TokenBundle:
        if not self.path.exists():
            raise TokenError(
                f"No encrypted token found at {self.path}. Run `auth` locally, then "
                "commit the resulting state/token.enc (or seed it) before scheduling."
            )
        ciphertext = self.path.read_bytes()
        try:
            plaintext = self._fernet.decrypt(ciphertext).decode("utf-8")
        except Exception as exc:
            raise TokenError(f"Failed to decrypt token (wrong TOKEN_ENC_KEY?): {exc}") from exc
        return TokenBundle.from_json(plaintext)

    def save(self, bundle: TokenBundle) -> None:
        ciphertext = self._fernet.encrypt(bundle.to_json().encode("utf-8"))
        self.path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.path.with_suffix(self.path.suffix + ".tmp")
        tmp.write_bytes(ciphertext)
        os.replace(tmp, self.path)
        # Persist immediately so a later fetch crash can never strand the rotated
        # refresh token in an uncommitted state.
        self._git_persist(
            [str(self.path)],
            "chore(x-bookmarks): rotate refresh token [skip ci]",
            self.git_branch,
        )


def build_token_store(config: ConfigFile, env: dict[str, str] | None = None) -> TokenStore:
    env = env if env is not None else dict(os.environ)
    store_kind = env.get("TOKEN_STORE") or config.token_store
    if store_kind == "repo_encrypted":
        return RepoEncryptedTokenStore(
            path=config.repo_encrypted.token_path,
            enc_key=env.get("TOKEN_ENC_KEY", ""),
            git_branch=config.repo_encrypted.git_branch or env.get("GIT_BRANCH", ""),
        )
    return FileTokenStore(path=env.get("TOKEN_PATH", "state/token.json"))
