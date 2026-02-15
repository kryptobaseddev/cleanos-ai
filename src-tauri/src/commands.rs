//! Tauri IPC command handlers.
//!
//! Each public function annotated with `#[tauri::command]` is callable from
//! the frontend via `invoke()`. Commands are grouped by domain: file ops,
//! system info, AI operations, credentials, and settings.

use std::sync::Arc;

use crate::ai_client::{AIAnalysis, AIClient, CleanupRecommendation};
use crate::caches;
use crate::credentials;
use crate::database::Database;
use crate::docker;
use crate::filesystem::{self, FileInfo};
use crate::models;
use crate::system::{self, CleanupResult, PackageCacheInfo, StorageBreakdown, SystemInfo};

/// Shared application state managed by Tauri.
pub struct AppState {
    /// Thread-safe handle to the SQLite database.
    pub db: Arc<Database>,
}

// --- File operations ---

#[tauri::command]
pub async fn scan_directory(
    path: String,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<FileInfo>, String> {
    let files = tokio::task::spawn_blocking(move || filesystem::scan_directory(&path))
        .await
        .map_err(|e| format!("Task join error: {e}"))??;

    let db = state.db.clone();
    for file in &files {
        let record = crate::database::FileRecord {
            id: file.id.clone(),
            path: file.path.clone(),
            name: file.name.clone(),
            size: file.size,
            modified_at: file.modified_at,
            hash: file.hash.clone(),
            category: None,
            importance_score: None,
            ai_analysis: None,
            is_directory: file.is_directory,
            extension: file.extension.clone(),
            created_at: None,
        };
        let _ = db.insert_file(&record);
    }

    Ok(files)
}

#[tauri::command]
pub async fn get_file_info(path: String) -> Result<FileInfo, String> {
    tokio::task::spawn_blocking(move || filesystem::get_file_info(&path))
        .await
        .map_err(|e| format!("Task join error: {e}"))?
}

#[tauri::command]
pub async fn find_duplicates(path: String) -> Result<Vec<Vec<FileInfo>>, String> {
    tokio::task::spawn_blocking(move || {
        let files = filesystem::scan_directory(&path)?;
        filesystem::find_duplicates(&files)
    })
    .await
    .map_err(|e| format!("Task join error: {e}"))?
}

// --- System operations ---

#[tauri::command]
pub async fn get_system_info() -> Result<SystemInfo, String> {
    tokio::task::spawn_blocking(system::get_system_info)
        .await
        .map_err(|e| format!("Task join error: {e}"))?
}

#[tauri::command]
pub async fn get_storage_breakdown() -> Result<StorageBreakdown, String> {
    tokio::task::spawn_blocking(system::get_storage_breakdown)
        .await
        .map_err(|e| format!("Task join error: {e}"))?
}

#[tauri::command]
pub async fn get_docker_info() -> Result<docker::DockerInfo, String> {
    tokio::task::spawn_blocking(docker::get_docker_info)
        .await
        .map_err(|e| format!("Task join error: {e}"))?
}

#[tauri::command]
pub async fn clean_docker(target: String) -> Result<CleanupResult, String> {
    tokio::task::spawn_blocking(move || docker::clean_docker(&target))
        .await
        .map_err(|e| format!("Task join error: {e}"))?
}

#[tauri::command]
pub async fn get_package_caches() -> Result<Vec<PackageCacheInfo>, String> {
    tokio::task::spawn_blocking(caches::get_package_caches)
        .await
        .map_err(|e| format!("Task join error: {e}"))?
}

#[tauri::command]
pub async fn clean_package_cache(manager: String) -> Result<CleanupResult, String> {
    tokio::task::spawn_blocking(move || caches::clean_package_cache(&manager))
        .await
        .map_err(|e| format!("Task join error: {e}"))?
}

// --- Model discovery ---

#[tauri::command]
pub async fn fetch_available_models() -> Result<String, String> {
    models::fetch_openrouter_models().await
}

// --- AI operations ---

#[tauri::command]
pub async fn chat_with_ai(
    provider: String,
    message: String,
    model: Option<String>,
) -> Result<String, String> {
    let api_key = credentials::get_credential(&provider)
        .map_err(|_| format!("No API key saved for {provider}. Configure it in Settings."))?;
    let m = model.unwrap_or_else(|| get_default_model(&provider));
    let client = AIClient::new(&provider, &api_key, &m);
    client.chat(&message).await
}

#[tauri::command]
pub async fn test_ai_connection(
    provider: String,
    api_key: Option<String>,
    model: String,
) -> Result<bool, String> {
    // Use provided key if given, otherwise read from keyring
    let key = match api_key {
        Some(k) if !k.is_empty() => k,
        _ => credentials::get_credential(&provider)
            .map_err(|_| format!("No API key provided or saved for {provider}"))?,
    };
    let client = AIClient::new(&provider, &key, &model);
    client.test_connection().await
}

/// Maximum number of files to analyze concurrently per batch.
const AI_ANALYSIS_CHUNK_SIZE: usize = 5;

#[tauri::command]
pub async fn analyze_files_with_ai(
    provider: String,
    file_paths: Vec<String>,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<AIAnalysis>, String> {
    let api_key = credentials::get_credential(&provider)?;
    let model = get_default_model(&provider);
    let client = AIClient::new(&provider, &api_key, &model);

    let mut analyses = Vec::new();
    // Process files in chunks to avoid overwhelming the API while still
    // getting some parallelism. Each chunk runs concurrently.
    for chunk in file_paths.chunks(AI_ANALYSIS_CHUNK_SIZE) {
        let futures: Vec<_> = chunk
            .iter()
            .map(|path| analyze_single_file(&client, &state, path))
            .collect();
        let results = futures::future::join_all(futures).await;
        analyses.extend(results);
    }
    Ok(analyses)
}

async fn analyze_single_file(
    client: &AIClient,
    state: &tauri::State<'_, AppState>,
    path: &str,
) -> AIAnalysis {
    let file_info = match filesystem::get_file_info(path) {
        Ok(fi) => fi,
        Err(e) => return fallback_analysis(path, &e),
    };
    match client.analyze_file(&file_info).await {
        Ok(a) => {
            let _ = state.db.update_file_analysis(
                &file_info.id,
                Some(&a.category),
                Some(a.importance_score),
                Some(&a.reason),
            );
            a
        }
        Err(e) => fallback_analysis(path, &e),
    }
}

fn fallback_analysis(path: &str, error: &str) -> AIAnalysis {
    log::warn!("Failed to analyze {path}: {error}");
    AIAnalysis {
        file_path: path.to_string(),
        category: "unknown".to_string(),
        importance_score: 0.5,
        recommendation: "review".to_string(),
        safe_to_delete: false,
        reason: format!("Analysis failed: {error}"),
    }
}

#[tauri::command]
pub async fn get_cleanup_recommendations(
    provider: String,
) -> Result<Vec<CleanupRecommendation>, String> {
    let api_key = credentials::get_credential(&provider)?;
    let model = get_default_model(&provider);
    let client = AIClient::new(&provider, &api_key, &model);

    let sys_info = system::get_system_info()?;
    let storage = system::get_storage_breakdown()?;
    let pkg_caches = caches::get_package_caches()?;

    let stats = serde_json::to_string_pretty(&serde_json::json!({
        "system": sys_info,
        "storage": storage,
        "package_caches": pkg_caches,
    }))
    .map_err(|e| format!("Serialize error: {e}"))?;

    client.get_recommendations(&stats).await
}

fn get_default_model(provider: &str) -> String {
    match provider {
        "openai" => "gpt-4o-mini".to_string(),
        "gemini" => "gemini-2.0-flash".to_string(),
        "claude" => "claude-sonnet-4-20250514".to_string(),
        "kimi" => "moonshot-v1-8k".to_string(),
        _ => "gpt-4o-mini".to_string(),
    }
}

// --- Credential operations ---

#[tauri::command]
pub async fn store_api_key(provider: String, key: String) -> Result<(), String> {
    credentials::store_credential(&provider, &key)
}

#[tauri::command]
pub async fn get_api_key(provider: String) -> Result<String, String> {
    credentials::get_credential(&provider)
}

#[tauri::command]
pub async fn delete_api_key(provider: String) -> Result<(), String> {
    credentials::delete_credential(&provider)
}

#[tauri::command]
pub async fn has_api_key(provider: String) -> Result<bool, String> {
    credentials::has_credential(&provider)
}

// --- Settings operations ---

#[tauri::command]
pub async fn get_setting(key: String, state: tauri::State<'_, AppState>) -> Result<String, String> {
    state
        .db
        .get_setting(&key)?
        .ok_or_else(|| format!("Setting not found: {key}"))
}

#[tauri::command]
pub async fn set_setting(
    key: String,
    value: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    state.db.set_setting(&key, &value)
}
