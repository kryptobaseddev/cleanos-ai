//! Package manager and browser cache detection and cleanup.
//!
//! Scans common cache directories for npm, pip, cargo, dnf, and popular
//! browsers (Chrome, Brave, Firefox, Chromium).

use std::fs;
use std::process::Command;

use crate::system::{dir_size_and_count, CleanupResult, PackageCacheInfo};

pub fn get_package_caches() -> Result<Vec<PackageCacheInfo>, String> {
    let home = dirs::home_dir().unwrap_or_default();
    let caches = vec![
        ("npm", home.join(".npm")),
        ("pip", home.join(".cache/pip")),
        ("cargo", home.join(".cargo/registry")),
        ("dnf", "/var/cache/dnf".into()),
    ];

    let results = caches
        .into_iter()
        .map(|(mgr, path)| {
            let exists = path.exists();
            let size = if exists {
                dir_size_and_count(&path).0
            } else {
                0
            };
            PackageCacheInfo {
                manager: mgr.to_string(),
                path: path.to_string_lossy().to_string(),
                size,
                exists,
            }
        })
        .collect();

    Ok(results)
}

pub fn clean_package_cache(manager: &str) -> Result<CleanupResult, String> {
    match manager {
        "npm" => clean_npm_cache(),
        "pip" => clean_pip_cache(),
        "cargo" => clean_cargo_cache(),
        "dnf" => clean_dnf_cache(),
        _ => Err(format!("Unknown package manager: {manager}")),
    }
}

fn clean_npm_cache() -> Result<CleanupResult, String> {
    let output = Command::new("npm")
        .args(["cache", "clean", "--force"])
        .output()
        .map_err(|e| format!("npm cache clean: {e}"))?;
    Ok(CleanupResult {
        success: output.status.success(),
        space_freed: 0,
        message: String::from_utf8_lossy(&output.stdout).to_string(),
    })
}

fn clean_pip_cache() -> Result<CleanupResult, String> {
    let home = dirs::home_dir().unwrap_or_default();
    let cache_path = home.join(".cache/pip");
    let size = if cache_path.exists() {
        dir_size_and_count(&cache_path).0
    } else {
        0
    };
    let output = Command::new("pip")
        .args(["cache", "purge"])
        .output()
        .map_err(|e| format!("pip cache purge: {e}"))?;
    Ok(CleanupResult {
        success: output.status.success(),
        space_freed: size,
        message: String::from_utf8_lossy(&output.stdout).to_string(),
    })
}

fn clean_cargo_cache() -> Result<CleanupResult, String> {
    let home = dirs::home_dir().unwrap_or_default();
    let registry = home.join(".cargo/registry/cache");
    let size = if registry.exists() {
        dir_size_and_count(&registry).0
    } else {
        0
    };
    if registry.exists() {
        fs::remove_dir_all(&registry).map_err(|e| format!("cargo cache clean: {e}"))?;
    }
    Ok(CleanupResult {
        success: true,
        space_freed: size,
        message: "Cargo registry cache cleaned".to_string(),
    })
}

fn clean_dnf_cache() -> Result<CleanupResult, String> {
    let output = Command::new("sudo")
        .args(["dnf", "clean", "all"])
        .output()
        .map_err(|e| format!("dnf clean: {e}"))?;
    Ok(CleanupResult {
        success: output.status.success(),
        space_freed: 0,
        message: String::from_utf8_lossy(&output.stdout).to_string(),
    })
}

pub fn get_browser_caches() -> Result<Vec<PackageCacheInfo>, String> {
    let home = dirs::home_dir().unwrap_or_default();
    let caches = vec![
        ("Google Chrome", home.join(".cache/google-chrome")),
        ("Brave", home.join(".cache/BraveSoftware")),
        ("Firefox", home.join(".mozilla/firefox")),
        ("Chromium", home.join(".cache/chromium")),
    ];

    let results = caches
        .into_iter()
        .map(|(name, path)| {
            let exists = path.exists();
            let size = if exists {
                dir_size_and_count(&path).0
            } else {
                0
            };
            PackageCacheInfo {
                manager: name.to_string(),
                path: path.to_string_lossy().to_string(),
                size,
                exists,
            }
        })
        .collect();

    Ok(results)
}
