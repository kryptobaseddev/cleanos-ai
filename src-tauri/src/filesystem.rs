use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::fs;
use std::io::Read;
use std::path::Path;
use uuid::Uuid;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileInfo {
    pub id: String,
    pub path: String,
    pub name: String,
    pub size: i64,
    pub modified_at: i64,
    pub hash: Option<String>,
    pub is_directory: bool,
    pub extension: Option<String>,
}

pub fn scan_directory(path: &str) -> Result<Vec<FileInfo>, String> {
    let root = Path::new(path);
    if !root.exists() {
        return Err(format!("Path does not exist: {path}"));
    }
    if !root.is_dir() {
        return Err(format!("Not a directory: {path}"));
    }

    let entries: Vec<_> = WalkDir::new(root)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
        .collect();

    let files: Vec<FileInfo> = entries.par_iter().filter_map(entry_to_file_info).collect();

    Ok(files)
}

fn entry_to_file_info(entry: &walkdir::DirEntry) -> Option<FileInfo> {
    let path = entry.path();
    let metadata = entry.metadata().ok()?;
    let is_file = metadata.is_file();

    Some(FileInfo {
        id: Uuid::new_v4().to_string(),
        path: path.to_string_lossy().to_string(),
        name: path_name(path),
        size: if is_file { metadata.len() as i64 } else { 0 },
        modified_at: modified_timestamp(&metadata),
        hash: None,
        is_directory: metadata.is_dir(),
        extension: if is_file { path_ext(path) } else { None },
    })
}

pub fn calculate_hash(path: &str) -> Result<String, String> {
    let file_path = Path::new(path);
    if !file_path.is_file() {
        return Err(format!("Not a file: {path}"));
    }

    let mut file = fs::File::open(file_path).map_err(|e| format!("Failed to open file: {e}"))?;

    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 8192];

    loop {
        let n = file
            .read(&mut buffer)
            .map_err(|e| format!("Read error: {e}"))?;
        if n == 0 {
            break;
        }
        hasher.update(&buffer[..n]);
    }

    Ok(hex::encode(hasher.finalize()))
}

pub fn get_file_info(path: &str) -> Result<FileInfo, String> {
    let file_path = Path::new(path);
    if !file_path.exists() {
        return Err(format!("Path does not exist: {path}"));
    }

    let metadata = fs::metadata(file_path).map_err(|e| format!("Metadata error: {e}"))?;
    let is_file = metadata.is_file();

    Ok(FileInfo {
        id: Uuid::new_v4().to_string(),
        path: file_path.to_string_lossy().to_string(),
        name: path_name(file_path),
        size: if is_file { metadata.len() as i64 } else { 0 },
        modified_at: modified_timestamp(&metadata),
        hash: if is_file {
            calculate_hash(path).ok()
        } else {
            None
        },
        is_directory: metadata.is_dir(),
        extension: if is_file { path_ext(file_path) } else { None },
    })
}

fn path_name(p: &Path) -> String {
    p.file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default()
}

fn path_ext(p: &Path) -> Option<String> {
    p.extension().map(|e| e.to_string_lossy().to_string())
}

fn modified_timestamp(meta: &fs::Metadata) -> i64 {
    meta.modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

pub fn find_duplicates(files: &[FileInfo]) -> Result<Vec<Vec<FileInfo>>, String> {
    let candidates: Vec<&FileInfo> = files
        .iter()
        .filter(|f| !f.is_directory && f.size > 0)
        .collect();

    let paths_to_hash = collect_same_size_paths(&candidates);
    let hash_map = compute_hashes(&paths_to_hash);
    let duplicates = group_by_hash(&candidates, &hash_map);

    Ok(duplicates)
}

fn collect_same_size_paths<'a>(files: &[&'a FileInfo]) -> Vec<&'a str> {
    let mut size_groups: HashMap<i64, Vec<&FileInfo>> = HashMap::new();
    for file in files {
        size_groups.entry(file.size).or_default().push(file);
    }
    size_groups
        .values()
        .filter(|g| g.len() > 1)
        .flat_map(|g| g.iter().map(|f| f.path.as_str()))
        .collect()
}

fn compute_hashes(paths: &[&str]) -> HashMap<String, String> {
    paths
        .par_iter()
        .filter_map(|path| {
            calculate_hash(path)
                .ok()
                .map(|hash| (path.to_string(), hash))
        })
        .collect()
}

fn group_by_hash(files: &[&FileInfo], hash_map: &HashMap<String, String>) -> Vec<Vec<FileInfo>> {
    let mut groups: HashMap<String, Vec<FileInfo>> = HashMap::new();
    for file in files {
        if let Some(hash) = hash_map.get(&file.path) {
            let mut f = (*file).clone();
            f.hash = Some(hash.clone());
            groups.entry(hash.clone()).or_default().push(f);
        }
    }
    groups.into_values().filter(|g| g.len() > 1).collect()
}
