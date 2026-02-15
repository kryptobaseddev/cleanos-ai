//! Tauri IPC commands for log and browser cache cleanup operations.

use crate::caches;
use crate::system::{self, CleanupResult, PackageCacheInfo};

#[tauri::command]
pub async fn get_log_info() -> Result<system::StorageCategory, String> {
    tokio::task::spawn_blocking(system::get_log_info)
        .await
        .map_err(|e| format!("Task join error: {e}"))?
}

#[tauri::command]
pub async fn clean_logs() -> Result<CleanupResult, String> {
    tokio::task::spawn_blocking(|| {
        let output = std::process::Command::new("sudo")
            .args(["journalctl", "--vacuum-size=100M"])
            .output()
            .map_err(|e| format!("journalctl vacuum failed: {e}"))?;
        Ok(CleanupResult {
            success: output.status.success(),
            space_freed: 0,
            message: String::from_utf8_lossy(&output.stdout).to_string(),
        })
    })
    .await
    .map_err(|e| format!("Task join error: {e}"))?
}

#[tauri::command]
pub async fn get_browser_caches() -> Result<Vec<PackageCacheInfo>, String> {
    tokio::task::spawn_blocking(caches::get_browser_caches)
        .await
        .map_err(|e| format!("Task join error: {e}"))?
}

#[tauri::command]
pub async fn clean_browser_cache(browser: String) -> Result<CleanupResult, String> {
    tokio::task::spawn_blocking(move || {
        let home = dirs::home_dir().unwrap_or_default();
        let cache_path = match browser.as_str() {
            "Google Chrome" => home.join(".cache/google-chrome"),
            "Brave" => home.join(".cache/BraveSoftware"),
            "Chromium" => home.join(".cache/chromium"),
            "Firefox" => home.join(".cache/mozilla/firefox"),
            _ => return Err(format!("Unknown browser: {browser}")),
        };

        if !cache_path.exists() {
            return Ok(CleanupResult {
                success: true,
                space_freed: 0,
                message: format!("No cache found for {browser}"),
            });
        }

        let size = system::dir_size_and_count(&cache_path).0;
        std::fs::remove_dir_all(&cache_path)
            .map_err(|e| format!("Failed to clean {browser} cache: {e}"))?;

        Ok(CleanupResult {
            success: true,
            space_freed: size,
            message: format!("{browser} cache cleaned"),
        })
    })
    .await
    .map_err(|e| format!("Task join error: {e}"))?
}
