use anyhow::{Context, Result};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use chrono::{Duration, Utc};
use rand::Rng;
use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::io::{BufRead, BufReader, Write};
use std::net::TcpListener;

use crate::infrastructure::{google_api, token_store};
use crate::models::auth::{AuthState, TokenPair};

const GOOGLE_AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const SCOPES: &str = "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email";

fn client_id() -> String {
    std::env::var("GOOGLE_CLIENT_ID").unwrap_or_default()
}

fn client_secret() -> String {
    std::env::var("GOOGLE_CLIENT_SECRET").unwrap_or_default()
}

fn generate_pkce() -> (String, String) {
    let mut rng = rand::thread_rng();
    let verifier_bytes: Vec<u8> = (0..32).map(|_| rng.gen()).collect();
    let code_verifier = URL_SAFE_NO_PAD.encode(&verifier_bytes);

    let mut hasher = Sha256::new();
    hasher.update(code_verifier.as_bytes());
    let code_challenge = URL_SAFE_NO_PAD.encode(hasher.finalize());

    (code_verifier, code_challenge)
}

pub async fn start_oauth_flow() -> Result<()> {
    let (code_verifier, code_challenge) = generate_pkce();

    // Bind to a random available port
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let port = listener.local_addr()?.port();
    let redirect_uri = format!("http://127.0.0.1:{}", port);

    let auth_url = format!(
        "{}?client_id={}&redirect_uri={}&response_type=code&scope={}&code_challenge={}&code_challenge_method=S256&access_type=offline&prompt=consent",
        GOOGLE_AUTH_URL,
        urlencoding::encode(&client_id()),
        urlencoding::encode(&redirect_uri),
        urlencoding::encode(SCOPES),
        urlencoding::encode(&code_challenge),
    );

    // Open browser
    open::that(&auth_url)?;

    // Wait for callback
    let code = tokio::task::spawn_blocking(move || -> Result<String> {
        let (mut stream, _) = listener.accept()?;
        let reader = BufReader::new(&stream);
        let request_line = reader.lines().next().context("No request")??;

        // Extract code from GET /?code=XXX&...
        let code = request_line
            .split_whitespace()
            .nth(1)
            .and_then(|path| {
                url::Url::parse(&format!("http://localhost{}", path)).ok()
            })
            .and_then(|url| {
                url.query_pairs()
                    .find(|(k, _)| k == "code")
                    .map(|(_, v)| v.to_string())
            })
            .context("No authorization code in callback")?;

        // Send response to browser
        let response = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n<html><body><h2>Login successful!</h2><p>You can close this window.</p></body></html>";
        stream.write_all(response.as_bytes())?;

        Ok(code)
    })
    .await??;

    // Exchange code for tokens
    let tokens = exchange_code(&code, &code_verifier, &format!("http://127.0.0.1:{}", port)).await?;
    token_store::save_tokens(&tokens)?;

    Ok(())
}

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    expires_in: i64,
}

async fn exchange_code(code: &str, code_verifier: &str, redirect_uri: &str) -> Result<TokenPair> {
    let client = reqwest::Client::new();
    let resp: TokenResponse = client
        .post(GOOGLE_TOKEN_URL)
        .form(&[
            ("code", code),
            ("client_id", &client_id()),
            ("client_secret", &client_secret()),
            ("redirect_uri", redirect_uri),
            ("grant_type", "authorization_code"),
            ("code_verifier", code_verifier),
        ])
        .send()
        .await?
        .json()
        .await?;

    Ok(TokenPair {
        access_token: resp.access_token,
        refresh_token: resp.refresh_token.unwrap_or_default(),
        expires_at: Utc::now() + Duration::seconds(resp.expires_in),
    })
}

pub async fn refresh_access_token(tokens: &TokenPair) -> Result<TokenPair> {
    let client = reqwest::Client::new();
    let resp: TokenResponse = client
        .post(GOOGLE_TOKEN_URL)
        .form(&[
            ("client_id", client_id().as_str()),
            ("client_secret", client_secret().as_str()),
            ("refresh_token", &tokens.refresh_token),
            ("grant_type", "refresh_token"),
        ])
        .send()
        .await?
        .json()
        .await?;

    Ok(TokenPair {
        access_token: resp.access_token,
        refresh_token: tokens.refresh_token.clone(),
        expires_at: Utc::now() + Duration::seconds(resp.expires_in),
    })
}

pub async fn get_valid_tokens() -> Result<TokenPair> {
    let tokens = token_store::load_tokens()?.context("Not authenticated")?;

    if tokens.is_expired() {
        let new_tokens = refresh_access_token(&tokens).await?;
        token_store::save_tokens(&new_tokens)?;
        Ok(new_tokens)
    } else {
        Ok(tokens)
    }
}

pub async fn get_auth_state() -> AuthState {
    match get_valid_tokens().await {
        Ok(tokens) => {
            let email = google_api::get_user_email(&tokens.access_token).await.ok();
            AuthState {
                is_authenticated: true,
                user_email: email,
            }
        }
        Err(_) => AuthState {
            is_authenticated: false,
            user_email: None,
        },
    }
}

pub fn logout() -> Result<()> {
    token_store::delete_tokens()
}
