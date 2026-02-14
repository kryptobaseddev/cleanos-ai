use keyring::Entry;

const SERVICE_NAME: &str = "com.cleanos-ai";

pub fn store_credential(provider: &str, key: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, provider)
        .map_err(|e| format!("Failed to create keyring entry: {e}"))?;
    entry
        .set_password(key)
        .map_err(|e| format!("Failed to store credential: {e}"))?;
    Ok(())
}

pub fn get_credential(provider: &str) -> Result<String, String> {
    let entry = Entry::new(SERVICE_NAME, provider)
        .map_err(|e| format!("Failed to create keyring entry: {e}"))?;
    entry
        .get_password()
        .map_err(|e| format!("Failed to get credential: {e}"))
}

pub fn delete_credential(provider: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, provider)
        .map_err(|e| format!("Failed to create keyring entry: {e}"))?;
    entry
        .delete_credential()
        .map_err(|e| format!("Failed to delete credential: {e}"))?;
    Ok(())
}

pub fn has_credential(provider: &str) -> Result<bool, String> {
    let entry = Entry::new(SERVICE_NAME, provider)
        .map_err(|e| format!("Failed to create keyring entry: {e}"))?;
    match entry.get_password() {
        Ok(_) => Ok(true),
        Err(keyring::Error::NoEntry) => Ok(false),
        Err(e) => Err(format!("Failed to check credential: {e}")),
    }
}
