use crate::models::auth::TokenPair;
use anyhow::{Context, Result};

const SERVICE_NAME: &str = "meeting-notifier";
const TOKEN_KEY: &str = "oauth-tokens";

pub fn save_tokens(tokens: &TokenPair) -> Result<()> {
    let entry = keyring::Entry::new(SERVICE_NAME, TOKEN_KEY)?;
    let json = serde_json::to_string(tokens)?;
    entry
        .set_password(&json)
        .context("Failed to save tokens to keyring")?;
    Ok(())
}

pub fn load_tokens() -> Result<Option<TokenPair>> {
    let entry = keyring::Entry::new(SERVICE_NAME, TOKEN_KEY)?;
    match entry.get_password() {
        Ok(json) => {
            let tokens: TokenPair = serde_json::from_str(&json)?;
            Ok(Some(tokens))
        }
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

pub fn delete_tokens() -> Result<()> {
    let entry = keyring::Entry::new(SERVICE_NAME, TOKEN_KEY)?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.into()),
    }
}
