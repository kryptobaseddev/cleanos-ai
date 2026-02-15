#[allow(dead_code)]
mod ai_client;
#[allow(dead_code)]
mod ai_prompts;
#[allow(dead_code)]
mod caches;
mod cleanup_commands;
mod commands;
#[allow(dead_code)]
mod credentials;
#[allow(dead_code)]
mod database;
#[allow(dead_code)]
mod docker;
#[allow(dead_code)]
mod filesystem;
mod models;
#[allow(dead_code)]
mod system;
mod updater;

use commands::AppState;
use database::Database;
use std::sync::Arc;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Work around WebKitGTK DMA-BUF crash on Wayland (Fedora/GNOME)
    // See: https://github.com/nicbarker/clay/issues/292
    if std::env::var("WEBKIT_DISABLE_DMABUF_RENDERER").is_err() {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    }

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
        .plugin(tauri_plugin_updater::Builder::new().build())
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
            commands::fetch_available_models,
            commands::chat_with_ai,
            commands::test_ai_connection,
            cleanup_commands::get_log_info,
            cleanup_commands::clean_logs,
            cleanup_commands::get_browser_caches,
            cleanup_commands::clean_browser_cache,
            commands::analyze_files_with_ai,
            commands::get_cleanup_recommendations,
            commands::store_api_key,
            commands::get_api_key,
            commands::delete_api_key,
            commands::has_api_key,
            commands::get_setting,
            commands::set_setting,
            updater::check_for_updates,
            updater::install_update,
            updater::get_current_version,
        ])
        .run(tauri::generate_context!())
    {
        log::error!("Application error: {e}");
        eprintln!("Application error: {e}");
        std::process::exit(1);
    }
}
