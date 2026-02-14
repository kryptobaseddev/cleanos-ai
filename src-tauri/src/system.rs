use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::process::Command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemInfo {
    pub hostname: String,
    pub os: String,
    pub kernel: String,
    pub memory_total: u64,
    pub memory_used: u64,
    pub memory_available: u64,
    pub disk_total: u64,
    pub disk_used: u64,
    pub disk_available: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StorageCategory {
    pub name: String,
    pub size: u64,
    pub path: String,
    pub file_count: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StorageBreakdown {
    pub categories: Vec<StorageCategory>,
    pub total_used: u64,
    pub total_available: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PackageCacheInfo {
    pub manager: String,
    pub path: String,
    pub size: u64,
    pub exists: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CleanupResult {
    pub success: bool,
    pub space_freed: u64,
    pub message: String,
}

pub fn get_system_info() -> Result<SystemInfo, String> {
    let hostname = fs::read_to_string("/etc/hostname")
        .unwrap_or_else(|_| "unknown".to_string())
        .trim()
        .to_string();

    let os = read_os_release();
    let kernel = read_kernel_version();
    let (memory_total, memory_used, memory_available) = read_memory_info();
    let (disk_total, disk_used, disk_available) = read_disk_info("/");

    Ok(SystemInfo {
        hostname,
        os,
        kernel,
        memory_total,
        memory_used,
        memory_available,
        disk_total,
        disk_used,
        disk_available,
    })
}

fn read_os_release() -> String {
    let content = match fs::read_to_string("/etc/os-release") {
        Ok(c) => c,
        Err(_) => return "Linux".to_string(),
    };
    for line in content.lines() {
        if let Some(name) = line.strip_prefix("PRETTY_NAME=") {
            return name.trim_matches('"').to_string();
        }
    }
    "Linux".to_string()
}

fn read_kernel_version() -> String {
    fs::read_to_string("/proc/version")
        .unwrap_or_else(|_| "unknown".to_string())
        .split_whitespace()
        .nth(2)
        .unwrap_or("unknown")
        .to_string()
}

fn read_memory_info() -> (u64, u64, u64) {
    let content = match fs::read_to_string("/proc/meminfo") {
        Ok(c) => c,
        Err(_) => return (0, 0, 0),
    };

    let mut total: u64 = 0;
    let mut available: u64 = 0;

    for line in content.lines() {
        if let Some(val) = line.strip_prefix("MemTotal:") {
            total = parse_meminfo_kb(val);
        } else if let Some(val) = line.strip_prefix("MemAvailable:") {
            available = parse_meminfo_kb(val);
        }
    }

    (total, total.saturating_sub(available), available)
}

fn parse_meminfo_kb(val: &str) -> u64 {
    val.split_whitespace()
        .next()
        .and_then(|v| v.parse::<u64>().ok())
        .map(|kb| kb * 1024)
        .unwrap_or(0)
}

fn read_disk_info(mount_point: &str) -> (u64, u64, u64) {
    let output = Command::new("df")
        .args(["--block-size=1", mount_point])
        .output();

    match output {
        Ok(out) => parse_df_output(&out.stdout),
        Err(_) => (0, 0, 0),
    }
}

fn parse_df_output(stdout: &[u8]) -> (u64, u64, u64) {
    let text = String::from_utf8_lossy(stdout);
    if let Some(line) = text.lines().nth(1) {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 4 {
            let total = parts[1].parse::<u64>().unwrap_or(0);
            let used = parts[2].parse::<u64>().unwrap_or(0);
            let avail = parts[3].parse::<u64>().unwrap_or(0);
            return (total, used, avail);
        }
    }
    (0, 0, 0)
}

pub fn get_storage_breakdown() -> Result<StorageBreakdown, String> {
    let home = dirs::home_dir().unwrap_or_default();
    let (_total, disk_used, disk_available) = read_disk_info("/");

    let check_dirs = vec![
        ("Documents", home.join("Documents")),
        ("Downloads", home.join("Downloads")),
        ("Pictures", home.join("Pictures")),
        ("Videos", home.join("Videos")),
        ("Music", home.join("Music")),
        (".cache", home.join(".cache")),
        (".local/share", home.join(".local/share")),
        ("/var/log", "/var/log".into()),
        ("/tmp", "/tmp".into()),
    ];

    let mut categories: Vec<StorageCategory> = check_dirs
        .into_iter()
        .filter(|(_, p)| p.exists())
        .map(|(name, path)| {
            let (size, count) = dir_size_and_count(&path);
            StorageCategory {
                name: name.to_string(),
                size,
                path: path.to_string_lossy().to_string(),
                file_count: count,
            }
        })
        .collect();

    categories.sort_by(|a, b| b.size.cmp(&a.size));

    Ok(StorageBreakdown {
        categories,
        total_used: disk_used,
        total_available: disk_available,
    })
}

pub fn dir_size_and_count(path: &Path) -> (u64, u64) {
    let mut total_size: u64 = 0;
    let mut count: u64 = 0;

    for entry in walkdir::WalkDir::new(path)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if let Ok(meta) = entry.metadata() {
            if meta.is_file() {
                total_size += meta.len();
                count += 1;
            }
        }
    }

    (total_size, count)
}

pub fn get_log_info() -> Result<StorageCategory, String> {
    let log_path = Path::new("/var/log");
    if !log_path.exists() {
        return Ok(StorageCategory {
            name: "System Logs".to_string(),
            size: 0,
            path: "/var/log".to_string(),
            file_count: 0,
        });
    }

    let (size, count) = dir_size_and_count(log_path);
    Ok(StorageCategory {
        name: "System Logs".to_string(),
        size,
        path: "/var/log".to_string(),
        file_count: count,
    })
}

pub fn get_old_kernels() -> Result<Vec<String>, String> {
    if let Ok(out) = Command::new("rpm").args(["-qa", "kernel-core"]).output() {
        let stdout = String::from_utf8_lossy(&out.stdout);
        return Ok(stdout
            .lines()
            .filter(|l| !l.is_empty())
            .map(|l| l.to_string())
            .collect());
    }

    let output = Command::new("dpkg")
        .args(["--list", "linux-image-*"])
        .output()
        .map_err(|e| format!("Failed to list kernels: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout
        .lines()
        .filter(|l| l.starts_with("ii"))
        .filter_map(|l| l.split_whitespace().nth(1).map(|s| s.to_string()))
        .collect())
}
