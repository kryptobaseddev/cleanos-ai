//! Tauri v2 auto-updater commands.
//!
//! Uses `tauri-plugin-updater` to check for and install updates from
//! GitHub Releases. Requires a valid signing keypair for verification.

use serde::{Deserialize, Serialize};
use tauri_plugin_updater::UpdaterExt;

#[derive(Serialize, Deserialize, Clone)]
pub struct UpdateInfo {
    pub version: String,
    pub date: String,
    pub body: String,
}

#[tauri::command]
pub async fn check_for_updates(app: tauri::AppHandle) -> Result<Option<UpdateInfo>, String> {
    let updater = app
        .updater()
        .map_err(|e| format!("Updater not available: {e}"))?;

    match updater.check().await {
        Ok(Some(update)) => Ok(Some(UpdateInfo {
            version: update.version.clone(),
            date: update.date.map(|d| d.to_string()).unwrap_or_default(),
            body: update.body.clone().unwrap_or_default(),
        })),
        Ok(None) => Ok(None),
        Err(e) => Err(format!("Failed to check for updates: {e}")),
    }
}

#[tauri::command]
pub async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
    let updater = app
        .updater()
        .map_err(|e| format!("Updater not available: {e}"))?;

    let update = updater
        .check()
        .await
        .map_err(|e| format!("Failed to check for updates: {e}"))?
        .ok_or_else(|| "No update available".to_string())?;

    update
        .download_and_install(|_bytes_downloaded, _content_length| {}, || {})
        .await
        .map_err(|e| format!("Failed to install update: {e}"))?;

    Ok(())
}

#[tauri::command]
pub fn get_current_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
