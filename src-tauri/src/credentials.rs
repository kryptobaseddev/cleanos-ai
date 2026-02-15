//! OS keyring credential storage using `libsecret` (GNOME Keyring) on Linux.
//!
//! API keys are stored under the service name `com.cleanos-ai` with the
//! provider identifier (e.g. "openai") as the username. The plaintext key
//! never leaves the backend; the frontend only checks existence via
//! [`has_credential`].

use keyring::Entry;

const SERVICE_NAME: &str = "com.cleanos-ai";

/// Store an API key in the OS keyring for the given provider.
pub fn store_credential(provider: &str, key: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, provider)
        .map_err(|e| format!("Failed to create keyring entry: {e}"))?;
    entry
        .set_password(key)
        .map_err(|e| format!("Failed to store credential: {e}"))?;
    Ok(())
}

/// Retrieve the plaintext API key for a provider from the OS keyring.
pub fn get_credential(provider: &str) -> Result<String, String> {
    let entry = Entry::new(SERVICE_NAME, provider)
        .map_err(|e| format!("Failed to create keyring entry: {e}"))?;
    entry
        .get_password()
        .map_err(|e| format!("Failed to get credential: {e}"))
}

/// Remove the stored API key for a provider from the OS keyring.
pub fn delete_credential(provider: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, provider)
        .map_err(|e| format!("Failed to create keyring entry: {e}"))?;
    entry
        .delete_credential()
        .map_err(|e| format!("Failed to delete credential: {e}"))?;
    Ok(())
}

/// Check whether a credential exists for the given provider without revealing the key.
pub fn has_credential(provider: &str) -> Result<bool, String> {
    let entry = Entry::new(SERVICE_NAME, provider)
        .map_err(|e| format!("Failed to create keyring entry: {e}"))?;
    match entry.get_password() {
        Ok(_) => Ok(true),
        Err(keyring::Error::NoEntry) => Ok(false),
        Err(e) => Err(format!("Failed to check credential: {e}")),
    }
}
