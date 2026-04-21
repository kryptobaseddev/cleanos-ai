use serde::{Deserialize, Serialize};
use std::process::Command;

use crate::system::CleanupResult;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DockerImage {
    pub repository: String,
    pub tag: String,
    pub id: String,
    pub size: u64,
    pub created: String,
    pub in_use: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DockerContainer {
    pub id: String,
    pub image: String,
    pub status: String,
    pub size: u64,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DockerVolume {
    pub name: String,
    pub driver: String,
    pub size: u64,
    pub in_use: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DockerInfo {
    pub images: Vec<DockerImage>,
    pub containers: Vec<DockerContainer>,
    pub volumes: Vec<DockerVolume>,
    pub build_cache_size: u64,
    pub total_reclaimable: u64,
}

pub fn get_docker_info() -> Result<DockerInfo, String> {
    let docker_check = Command::new("docker")
        .arg("info")
        .output()
        .map_err(|_| "Docker is not installed".to_string())?;

    if !docker_check.status.success() {
        return Err("Docker is not running".to_string());
    }

    let images = get_docker_images()?;
    let containers = get_docker_containers()?;
    let volumes = get_docker_volumes()?;
    let (build_cache_size, total_reclaimable) = get_docker_disk_usage()?;

    Ok(DockerInfo {
        images,
        containers,
        volumes,
        build_cache_size,
        total_reclaimable,
    })
}

fn tab_field(parts: &[&str], index: usize) -> String {
    parts.get(index).unwrap_or(&"").to_string()
}

fn get_docker_images() -> Result<Vec<DockerImage>, String> {
    let fmt = "{{.Repository}}\t{{.Tag}}\t{{.ID}}\t\
               {{.Size}}\t{{.CreatedSince}}";
    let output = Command::new("docker")
        .args(["images", "--format", fmt])
        .output()
        .map_err(|e| format!("docker images: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let images = stdout
        .lines()
        .filter(|l| !l.is_empty())
        .map(|line| {
            let p: Vec<&str> = line.split('\t').collect();
            DockerImage {
                repository: tab_field(&p, 0),
                tag: tab_field(&p, 1),
                id: tab_field(&p, 2),
                size: parse_size_string(&tab_field(&p, 3)),
                created: tab_field(&p, 4),
                in_use: false,
            }
        })
        .collect();

    Ok(images)
}

fn get_docker_containers() -> Result<Vec<DockerContainer>, String> {
    let fmt = "{{.ID}}\t{{.Image}}\t{{.Status}}\t\
               {{.Size}}\t{{.Names}}";
    let output = Command::new("docker")
        .args(["ps", "-a", "--format", fmt])
        .output()
        .map_err(|e| format!("docker ps: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let containers = stdout
        .lines()
        .filter(|l| !l.is_empty())
        .map(|line| {
            let p: Vec<&str> = line.split('\t').collect();
            DockerContainer {
                id: tab_field(&p, 0),
                image: tab_field(&p, 1),
                status: tab_field(&p, 2),
                size: parse_size_string(&tab_field(&p, 3)),
                name: tab_field(&p, 4),
            }
        })
        .collect();

    Ok(containers)
}

fn get_docker_volumes() -> Result<Vec<DockerVolume>, String> {
    let output = Command::new("docker")
        .args(["volume", "ls", "--format", "{{.Name}}\t{{.Driver}}"])
        .output()
        .map_err(|e| format!("docker volume ls: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let volumes = stdout
        .lines()
        .filter(|l| !l.is_empty())
        .map(|line| {
            let p: Vec<&str> = line.split('\t').collect();
            DockerVolume {
                name: tab_field(&p, 0),
                driver: tab_field(&p, 1),
                size: 0,
                in_use: false,
            }
        })
        .collect();

    Ok(volumes)
}

fn get_docker_disk_usage() -> Result<(u64, u64), String> {
    let output = Command::new("docker")
        .args(["system", "df"])
        .output()
        .map_err(|e| format!("docker system df: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut build_cache = 0u64;
    let mut total_reclaimable = 0u64;

    for line in stdout.lines() {
        if line.starts_with("Build Cache") {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 4 {
                build_cache = parse_size_string(parts[2]);
                if let Some(r) = parts.last() {
                    total_reclaimable = parse_size_string(r);
                }
            }
        }
    }

    Ok((build_cache, total_reclaimable))
}

pub fn clean_docker(target: &str, ids: Option<&[String]>) -> Result<CleanupResult, String> {
    // If specific IDs are provided, remove those individually
    if let Some(ids) = ids {
        if ids.is_empty() {
            return Ok(CleanupResult {
                success: true,
                space_freed: 0,
                message: "No items selected".to_string(),
            });
        }
        return clean_docker_selected(target, ids);
    }

    // Bulk prune based on target
    let args: Vec<&str> = match target {
        "images" | "unused_images" => vec!["image", "prune", "-a", "-f"],
        "containers" | "unused_containers" => vec!["container", "prune", "-f"],
        "volumes" | "unused_volumes" => vec!["volume", "prune", "-f"],
        "build-cache" => vec!["builder", "prune", "-a", "-f"],
        "all" => vec!["system", "prune", "-a", "-f", "--volumes"],
        _ => return Err(format!("Unknown docker cleanup target: {target}")),
    };

    let output = Command::new("docker")
        .args(&args)
        .output()
        .map_err(|e| format!("docker cleanup: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    if output.status.success() {
        let space_freed = parse_reclaimed_space(&stdout);
        Ok(CleanupResult {
            success: true,
            space_freed,
            message: stdout.to_string(),
        })
    } else {
        // Some docker prune commands return exit code 1 when there's nothing to prune
        if stderr.contains("nothing") || stdout.contains("nothing") {
            return Ok(CleanupResult {
                success: true,
                space_freed: 0,
                message: "Nothing to clean".to_string(),
            });
        }
        Err(format!("Docker cleanup failed: {stderr}"))
    }
}

fn clean_docker_selected(target: &str, ids: &[String]) -> Result<CleanupResult, String> {
    let mut total_freed: u64 = 0;
    let mut messages: Vec<String> = Vec::new();

    for id in ids {
        let result = match target {
            "images" => {
                let out = Command::new("docker")
                    .args(["rmi", "-f", id])
                    .output()
                    .map_err(|e| format!("docker rmi: {e}"))?;
                if out.status.success() {
                    Ok(parse_reclaimed_space(&String::from_utf8_lossy(&out.stdout)))
                } else {
                    Err(String::from_utf8_lossy(&out.stderr).to_string())
                }
            }
            "containers" => {
                let out = Command::new("docker")
                    .args(["rm", "-f", id])
                    .output()
                    .map_err(|e| format!("docker rm: {e}"))?;
                if out.status.success() {
                    Ok(0u64)
                } else {
                    Err(String::from_utf8_lossy(&out.stderr).to_string())
                }
            }
            "volumes" => {
                let out = Command::new("docker")
                    .args(["volume", "rm", "-f", id])
                    .output()
                    .map_err(|e| format!("docker volume rm: {e}"))?;
                if out.status.success() {
                    Ok(0u64)
                } else {
                    Err(String::from_utf8_lossy(&out.stderr).to_string())
                }
            }
            _ => Err(format!("Selective cleanup not supported for: {target}")),
        };

        match result {
            Ok(freed) => {
                total_freed += freed;
                messages.push(format!("Removed {id}"));
            }
            Err(err) => {
                messages.push(format!("Failed to remove {id}: {err}"));
            }
        }
    }

    Ok(CleanupResult {
        success: messages.iter().any(|m| m.starts_with("Removed")),
        space_freed: total_freed,
        message: messages.join("; "),
    })
}

fn parse_reclaimed_space(output: &str) -> u64 {
    for line in output.lines() {
        if line.contains("reclaimed space") {
            if let Some(size_str) = line.split(':').nth(1) {
                return parse_size_string(size_str.trim());
            }
        }
    }
    0
}

fn parse_size_string(s: &str) -> u64 {
    let s = s.trim();
    // Handle sizes like "1.05GB", "24.3MB", "0B", etc.
    let (num_str, mult) = if let Some((n, _)) = s.split_once("GB") {
        (n, 1_000_000_000u64)
    } else if let Some((n, _)) = s.split_once("MB") {
        (n, 1_000_000u64)
    } else if let Some((n, _)) = s.split_once("kB") {
        (n, 1_000u64)
    } else if let Some((n, _)) = s.split_once("B") {
        (n, 1u64)
    } else {
        (s, 1u64)
    };

    num_str
        .trim()
        .parse::<f64>()
        .map(|n| (n * mult as f64) as u64)
        .unwrap_or(0)
}
