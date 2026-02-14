#[allow(dead_code)]
mod ai_client;
#[allow(dead_code)]
mod ai_prompts;
#[allow(dead_code)]
mod caches;
mod commands;
#[allow(dead_code)]
mod credentials;
#[allow(dead_code)]
mod database;
#[allow(dead_code)]
mod docker;
#[allow(dead_code)]
mod filesystem;
#[allow(dead_code)]
mod system;

use commands::AppState;
use database::Database;
use std::sync::Arc;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    let db = match Database::new() {
        Ok(db) => db,
        Err(e) => {
            log::error!("Database init failed: {e}");
            eprintln!("Database init failed: {e}");
            std::process::exit(1);
        }
    };

    let app_state = AppState { db: Arc::new(db) };

    if let Err(e) = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::scan_directory,
            commands::get_file_info,
            commands::find_duplicates,
            commands::get_system_info,
            commands::get_storage_breakdown,
            commands::get_docker_info,
            commands::clean_docker,
            commands::get_package_caches,
            commands::clean_package_cache,
            commands::test_ai_connection,
            commands::analyze_files_with_ai,
            commands::get_cleanup_recommendations,
            commands::store_api_key,
            commands::get_api_key,
            commands::delete_api_key,
            commands::has_api_key,
            commands::get_setting,
            commands::set_setting,
        ])
        .run(tauri::generate_context!())
    {
        log::error!("Application error: {e}");
        eprintln!("Application error: {e}");
        std::process::exit(1);
    }
}
