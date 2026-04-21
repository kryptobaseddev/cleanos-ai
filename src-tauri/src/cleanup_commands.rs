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
        // Try sudo -n first (non-interactive, fails fast if no passwordless sudo)
        let output = std::process::Command::new("sudo")
            .args(["-n", "journalctl", "--vacuum-size=100M"])
            .output();

        match output {
            Ok(out) => {
                if out.status.success() {
                    Ok(CleanupResult {
                        success: true,
                        space_freed: 0,
                        message: String::from_utf8_lossy(&out.stdout).to_string(),
                    })
                } else {
                    let stderr = String::from_utf8_lossy(&out.stderr);
                    if stderr.contains("password") || stderr.contains("a password is required") {
                        Err("Log cleanup requires elevated privileges. \
                             Please configure passwordless sudo for journalctl, \
                             or run: sudo journalctl --vacuum-size=100M".to_string())
                    } else {
                        Err(format!("journalctl vacuum failed: {stderr}"))
                    }
                }
            }
            Err(e) => Err(format!(
                "Failed to run journalctl vacuum. \
                 Make sure sudo is installed and journalctl is available: {e}"
            )),
        }
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

        // Find actual cache directories for each browser
        let cache_dirs = match browser.as_str() {
            "Google Chrome" => find_chrome_caches(&home.join(".cache/google-chrome")),
            "Brave" => find_chrome_caches(&home.join(".cache/BraveSoftware")),
            "Chromium" => find_chrome_caches(&home.join(".cache/chromium")),
            "Firefox" => find_firefox_caches(&home.join(".cache/mozilla/firefox")),
            _ => return Err(format!("Unknown browser: {browser}")),
        };

        if cache_dirs.is_empty() {
            return Ok(CleanupResult {
                success: true,
                space_freed: 0,
                message: format!("No cache found for {browser}"),
            });
        }

        let mut total_freed: u64 = 0;
        let mut messages: Vec<String> = Vec::new();

        for dir in &cache_dirs {
            if dir.exists() {
                let size = system::dir_size_and_count(dir).0;
                match std::fs::remove_dir_all(dir) {
                    Ok(_) => {
                        total_freed += size;
                        messages.push(format!("Cleaned {}", dir.display()));
                    }
                    Err(e) => {
                        messages.push(format!("Failed to clean {}: {e}", dir.display()));
                    }
                }
            }
        }

        Ok(CleanupResult {
            success: total_freed > 0,
            space_freed: total_freed,
            message: messages.join("; "),
        })
    })
    .await
    .map_err(|e| format!("Task join error: {e}"))?
}

fn find_chrome_caches(profile_dir: &std::path::Path) -> Vec<std::path::PathBuf> {
    let mut caches = Vec::new();
    if let Ok(entries) = std::fs::read_dir(profile_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
                // Match Default, Profile 1, Profile 2, etc.
                if name == "Default" || name.starts_with("Profile ") {
                    caches.push(path.join("Cache"));
                    caches.push(path.join("Code Cache"));
                }
            }
        }
    }
    caches
}

fn find_firefox_caches(base_dir: &std::path::Path) -> Vec<std::path::PathBuf> {
    let mut caches = Vec::new();
    if let Ok(entries) = std::fs::read_dir(base_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
                // Firefox profiles end with .default or .default-release
                if name.ends_with(".default") || name.ends_with(".default-release") || name.contains(".default-") {
                    caches.push(path.join("cache2"));
                }
            }
        }
    }
    caches
}
