use serde::{Deserialize, Serialize};
use std::process::Command;

use crate::system::CleanupResult;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DockerImage {
    pub repository: String,
    pub tag: String,
    pub image_id: String,
    pub size: String,
    pub created: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DockerContainer {
    pub container_id: String,
    pub image: String,
    pub status: String,
    pub size: String,
    pub names: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DockerVolume {
    pub name: String,
    pub driver: String,
    pub size: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DockerInfo {
    pub images: Vec<DockerImage>,
    pub containers: Vec<DockerContainer>,
    pub volumes: Vec<DockerVolume>,
    pub build_cache_size: String,
    pub total_reclaimable: String,
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
                image_id: tab_field(&p, 2),
                size: tab_field(&p, 3),
                created: tab_field(&p, 4),
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
                container_id: tab_field(&p, 0),
                image: tab_field(&p, 1),
                status: tab_field(&p, 2),
                size: tab_field(&p, 3),
                names: tab_field(&p, 4),
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
                size: "unknown".to_string(),
            }
        })
        .collect();

    Ok(volumes)
}

fn get_docker_disk_usage() -> Result<(String, String), String> {
    let output = Command::new("docker")
        .args(["system", "df"])
        .output()
        .map_err(|e| format!("docker system df: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut build_cache = "0B".to_string();
    let mut total_reclaimable = "0B".to_string();

    for line in stdout.lines() {
        if line.starts_with("Build Cache") {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 4 {
                build_cache = parts[2].to_string();
                if let Some(r) = parts.last() {
                    total_reclaimable = r.to_string();
                }
            }
        }
    }

    Ok((build_cache, total_reclaimable))
}

pub fn clean_docker(target: &str) -> Result<CleanupResult, String> {
    let args: Vec<&str> = match target {
        "images" => vec!["image", "prune", "-a", "-f"],
        "containers" => vec!["container", "prune", "-f"],
        "volumes" => vec!["volume", "prune", "-f"],
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
        Err(format!("Docker cleanup failed: {stderr}"))
    }
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
    let (num_str, mult) = if let Some(n) = s.strip_suffix("GB") {
        (n, 1_000_000_000u64)
    } else if let Some(n) = s.strip_suffix("MB") {
        (n, 1_000_000u64)
    } else if let Some(n) = s.strip_suffix("kB") {
        (n, 1_000u64)
    } else if let Some(n) = s.strip_suffix("B") {
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
