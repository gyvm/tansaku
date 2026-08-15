"""OAuth 2.0 Authorization Code + PKCE for the X API v2 (user context)."""

from __future__ import annotations

import base64
import hashlib
import http.server
import json
import secrets
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from dataclasses import dataclass

from .tokenstore import TokenBundle, TokenStore

AUTHORIZE_URL = "https://twitter.com/i/oauth2/authorize"
TOKEN_URL = "https://api.twitter.com/2/oauth2/token"
USERS_ME_URL = "https://api.twitter.com/2/users/me"
SCOPES = "bookmark.read tweet.read users.read offline.access"
DEFAULT_REDIRECT_URI = "http://127.0.0.1:8723/callback"
# Refresh this many seconds before the access token actually expires.
EXPIRY_SKEW = 120


class OAuthError(RuntimeError):
    pass


def _b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def generate_pkce() -> tuple[str, str]:
    """Return (code_verifier, code_challenge) for the S256 method."""
    verifier = _b64url(secrets.token_bytes(32))
    challenge = _b64url(hashlib.sha256(verifier.encode("ascii")).digest())
    return verifier, challenge


def build_authorize_url(client_id: str, redirect_uri: str, state: str, challenge: str) -> str:
    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": SCOPES,
        "state": state,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
    }
    return f"{AUTHORIZE_URL}?{urllib.parse.urlencode(params)}"


def _token_request(env: dict[str, str], form: dict[str, str]) -> dict:
    client_id = env.get("X_CLIENT_ID", "")
    client_secret = env.get("X_CLIENT_SECRET", "")
    if not client_id:
        raise OAuthError("X_CLIENT_ID is not set.")

    body = urllib.parse.urlencode(form).encode("utf-8")
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "x-bookmarks-digest",
    }
    # Confidential clients authenticate with HTTP Basic; public (PKCE) clients
    # send client_id in the body instead.
    if client_secret:
        basic = base64.b64encode(f"{client_id}:{client_secret}".encode("utf-8")).decode("ascii")
        headers["Authorization"] = f"Basic {basic}"
    else:
        form.setdefault("client_id", client_id)
        body = urllib.parse.urlencode(form).encode("utf-8")

    request = urllib.request.Request(TOKEN_URL, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise OAuthError(f"Token request failed: HTTP {exc.code} {details}") from exc
    except urllib.error.URLError as exc:
        raise OAuthError(f"Token request failed: {exc.reason}") from exc


def exchange_code(env: dict[str, str], code: str, code_verifier: str, redirect_uri: str) -> dict:
    return _token_request(
        env,
        {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "code_verifier": code_verifier,
        },
    )


def refresh_tokens(env: dict[str, str], refresh_token: str) -> dict:
    return _token_request(
        env,
        {"grant_type": "refresh_token", "refresh_token": refresh_token},
    )


def resolve_user_id(access_token: str) -> str:
    request = urllib.request.Request(
        USERS_ME_URL,
        headers={
            "Authorization": f"Bearer {access_token}",
            "User-Agent": "x-bookmarks-digest",
        },
    )
    try:
        with urllib.request.urlopen(request) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise OAuthError(f"/users/me failed: HTTP {exc.code} {details}") from exc
    except urllib.error.URLError as exc:
        raise OAuthError(f"/users/me failed: {exc.reason}") from exc
    user_id = (data.get("data") or {}).get("id")
    if not user_id:
        raise OAuthError(f"Unexpected /users/me response: {data}")
    return str(user_id)


def _bundle_from_token_response(data: dict, fallback: TokenBundle | None = None) -> TokenBundle:
    refresh = data.get("refresh_token") or (fallback.refresh_token if fallback else None)
    if not refresh:
        raise OAuthError(
            "Token response did not include a refresh_token. Ensure the 'offline.access' "
            "scope is granted."
        )
    expires_in = data.get("expires_in")
    expires_at = time.time() + float(expires_in) if expires_in else None
    return TokenBundle(
        refresh_token=refresh,
        access_token=data.get("access_token"),
        expires_at=expires_at,
        user_id=fallback.user_id if fallback else None,
        scope=data.get("scope") or (fallback.scope if fallback else None),
    )


@dataclass(slots=True)
class _CallbackResult:
    code: str | None = None
    state: str | None = None
    error: str | None = None


def _run_callback_server(redirect_uri: str, expected_state: str) -> _CallbackResult:
    parsed = urllib.parse.urlparse(redirect_uri)
    host = parsed.hostname or "127.0.0.1"
    port = parsed.port or 8723
    result = _CallbackResult()

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self) -> None:  # noqa: N802
            query = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(query)
            result.error = params.get("error", [None])[0]
            result.code = params.get("code", [None])[0]
            result.state = params.get("state", [None])[0]
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(
                b"<html><body><h3>x-bookmarks-digest</h3>"
                b"<p>Authorization received. You can close this tab.</p></body></html>"
            )

        def log_message(self, *_args) -> None:  # silence server logging
            return

    server = http.server.HTTPServer((host, port), Handler)
    try:
        server.handle_request()  # serve exactly one request
    finally:
        server.server_close()

    if result.error:
        raise OAuthError(f"Authorization failed: {result.error}")
    if result.state != expected_state:
        raise OAuthError("State mismatch on OAuth callback (possible CSRF).")
    if not result.code:
        raise OAuthError("No authorization code received on callback.")
    return result


def run_auth_bootstrap(env: dict[str, str], store: TokenStore, open_browser: bool = True) -> TokenBundle:
    """Interactive one-time PKCE flow; persists the resulting token bundle."""
    client_id = env.get("X_CLIENT_ID", "")
    if not client_id:
        raise OAuthError("X_CLIENT_ID is not set. Copy .env.example to .env and fill it in.")
    redirect_uri = env.get("X_REDIRECT_URI") or DEFAULT_REDIRECT_URI

    verifier, challenge = generate_pkce()
    state = secrets.token_urlsafe(24)
    url = build_authorize_url(client_id, redirect_uri, state, challenge)

    print("Open this URL to authorize (also opening your browser):\n")
    print(url + "\n")
    if open_browser:
        try:
            webbrowser.open(url)
        except Exception:  # headless environments
            pass

    callback = _run_callback_server(redirect_uri, state)
    token_response = exchange_code(env, callback.code, verifier, redirect_uri)
    bundle = _bundle_from_token_response(token_response)

    # Cache the numeric user id so scheduled runs don't need /users/me.
    if bundle.access_token:
        try:
            bundle.user_id = resolve_user_id(bundle.access_token)
        except OAuthError as exc:
            print(f"[warning] could not resolve user id now: {exc}")

    store.save(bundle)
    return bundle


def ensure_access_token(
    env: dict[str, str], store: TokenStore, now: float | None = None
) -> TokenBundle:
    """Return a bundle with a valid access token, refreshing + persisting if needed.

    The rotated refresh token is saved BEFORE the caller does any fetching.
    """
    now = time.time() if now is None else now
    bundle = store.load()

    if bundle.access_token and bundle.expires_at and now < (bundle.expires_at - EXPIRY_SKEW):
        return bundle

    refreshed = refresh_tokens(env, bundle.refresh_token)
    new_bundle = _bundle_from_token_response(refreshed, fallback=bundle)
    store.save(new_bundle)  # persist rotation immediately
    return new_bundle
