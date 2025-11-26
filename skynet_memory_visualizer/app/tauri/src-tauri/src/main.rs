// Prevents additional console window on Windows in release
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;

use commands::*;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_app_config,
            check_backend_health,
            open_external_link
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
