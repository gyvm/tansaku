"""Config loading and validation.

Mirrors the load_config / parse_config_text / validate_config shape used in the
copilot-sdk-python-demo template, but for this tool's nested schema.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

VALID_STRATEGIES = {"hashtag", "domain", "author"}
VALID_CHANNELS = {"stdout", "slack", "discord"}
VALID_TOKEN_STORES = {"file", "repo_encrypted"}


class ConfigError(ValueError):
    pass


@dataclass(slots=True)
class XConfig:
    user_id_env: str = "X_USER_ID"
    max_results: int = 100
    max_pages: int = 5


@dataclass(slots=True)
class FetchConfig:
    dedup: bool = True
    seen_cache_size: int = 2000


@dataclass(slots=True)
class GroupConfig:
    strategy: list[str] = field(default_factory=lambda: ["hashtag", "domain", "author"])


@dataclass(slots=True)
class DigestConfig:
    title: str = "X Bookmarks Digest"


@dataclass(slots=True)
class NotifyConfig:
    channels: list[str] = field(default_factory=lambda: ["stdout"])
    skip_when_empty: bool = True


@dataclass(slots=True)
class RepoEncryptedConfig:
    token_path: str = "state/token.enc"
    state_path: str = "state/run_state.json"
    git_branch: str = ""


@dataclass(slots=True)
class ConfigFile:
    x: XConfig = field(default_factory=XConfig)
    fetch: FetchConfig = field(default_factory=FetchConfig)
    group: GroupConfig = field(default_factory=GroupConfig)
    digest: DigestConfig = field(default_factory=DigestConfig)
    notify: NotifyConfig = field(default_factory=NotifyConfig)
    token_store: str = "file"
    repo_encrypted: RepoEncryptedConfig = field(default_factory=RepoEncryptedConfig)


def load_config(path: str) -> ConfigFile:
    config_path = Path(path)
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")
    with config_path.open("r", encoding="utf-8") as handle:
        raw_text = handle.read()
    return validate_config(parse_config_text(raw_text))


def parse_config_text(raw_text: str) -> dict[str, Any]:
    try:
        import yaml  # type: ignore
    except ImportError as exc:  # pragma: no cover - depends on environment
        raise ConfigError("PyYAML is required to parse the config file.") from exc
    data = yaml.safe_load(raw_text) or {}
    if not isinstance(data, dict):
        raise ConfigError("Config root must be a mapping.")
    return data


def _as_mapping(data: dict[str, Any], key: str) -> dict[str, Any]:
    value = data.get(key)
    if value is None:
        return {}
    if not isinstance(value, dict):
        raise ConfigError(f"'{key}' must be a mapping.")
    return value


def validate_config(data: dict[str, Any]) -> ConfigFile:
    x_raw = _as_mapping(data, "x")
    x = XConfig(
        user_id_env=str(x_raw.get("user_id_env", "X_USER_ID")),
        max_results=_positive_int(x_raw.get("max_results", 100), "x.max_results", max_value=100),
        max_pages=_positive_int(x_raw.get("max_pages", 5), "x.max_pages"),
    )

    fetch_raw = _as_mapping(data, "fetch")
    fetch = FetchConfig(
        dedup=bool(fetch_raw.get("dedup", True)),
        seen_cache_size=_positive_int(fetch_raw.get("seen_cache_size", 2000), "fetch.seen_cache_size"),
    )

    group_raw = _as_mapping(data, "group")
    strategy = group_raw.get("strategy", ["hashtag", "domain", "author"])
    if not isinstance(strategy, list) or not strategy:
        raise ConfigError("'group.strategy' must be a non-empty list.")
    for item in strategy:
        if item not in VALID_STRATEGIES:
            raise ConfigError(
                f"Unknown group strategy '{item}'. Valid: {sorted(VALID_STRATEGIES)}."
            )
    group = GroupConfig(strategy=list(strategy))

    digest_raw = _as_mapping(data, "digest")
    digest = DigestConfig(title=str(digest_raw.get("title", "X Bookmarks Digest")))

    notify_raw = _as_mapping(data, "notify")
    channels = notify_raw.get("channels", ["stdout"])
    if not isinstance(channels, list) or not channels:
        raise ConfigError("'notify.channels' must be a non-empty list.")
    for ch in channels:
        if ch not in VALID_CHANNELS:
            raise ConfigError(f"Unknown notify channel '{ch}'. Valid: {sorted(VALID_CHANNELS)}.")
    notify = NotifyConfig(
        channels=list(channels),
        skip_when_empty=bool(notify_raw.get("skip_when_empty", True)),
    )

    token_store = str(data.get("token_store", "file"))
    if token_store not in VALID_TOKEN_STORES:
        raise ConfigError(
            f"Unknown token_store '{token_store}'. Valid: {sorted(VALID_TOKEN_STORES)}."
        )

    repo_raw = _as_mapping(data, "repo_encrypted")
    repo_encrypted = RepoEncryptedConfig(
        token_path=str(repo_raw.get("token_path", "state/token.enc")),
        state_path=str(repo_raw.get("state_path", "state/run_state.json")),
        git_branch=str(repo_raw.get("git_branch", "")),
    )

    return ConfigFile(
        x=x,
        fetch=fetch,
        group=group,
        digest=digest,
        notify=notify,
        token_store=token_store,
        repo_encrypted=repo_encrypted,
    )


def _positive_int(value: Any, name: str, max_value: int | None = None) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise ConfigError(f"'{name}' must be an integer greater than 0.")
    if max_value is not None and value > max_value:
        raise ConfigError(f"'{name}' must be <= {max_value}.")
    return value
