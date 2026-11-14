pub mod commands;
pub mod mole;

use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::Manager;

use commands::*;
use mole::process::ProcessManager;
use mole::status::StatusPoller;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Ensure standard macOS and user toolchain paths are present in PATH for GUI launches
    let mut paths = vec![
        "/opt/homebrew/bin".to_string(),
        "/usr/local/bin".to_string(),
        "/usr/bin".to_string(),
        "/bin".to_string(),
        "/usr/sbin".to_string(),
        "/sbin".to_string(),
    ];
    if let Some(home) = dirs::home_dir() {
        paths.insert(0, home.join(".local/bin").to_string_lossy().to_string());
        paths.insert(1, home.join("bin").to_string_lossy().to_string());
    }
    if let Ok(current_path) = std::env::var("PATH") {
        for p in current_path.split(':') {
            if !paths.contains(&p.to_string()) && !p.is_empty() {
                paths.push(p.to_string());
            }
        }
    }
    unsafe {
        std::env::set_var("PATH", paths.join(":"));
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle().clone();
            let initial_settings = load_initial_settings();

            let poller = StatusPoller::new(app_handle.clone());
            poller.set_interval(initial_settings.polling_interval_ms);

            let custom_path = initial_settings.custom_mole_path.clone();
            let poller_clone = poller.clone();
            tauri::async_runtime::spawn(async move {
                poller_clone.set_custom_path(custom_path).await;
            });

            let process_mgr = ProcessManager::new(app_handle.clone());
            let settings = Arc::new(Mutex::new(initial_settings));

            app.manage(AppState {
                poller,
                process_mgr,
                settings,
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            detect_mole,
            install_mole,
            start_status_polling,
            stop_status_polling,
            set_polling_interval,
            get_last_status,
            poll_status_now,
            list_installed_apps,
            get_app_icon,
            analyze_disk,
            get_history,
            run_clean,
            run_uninstall,
            run_optimize,
            run_purge,
            run_slim,
            run_installer,
            run_touchid,
            run_update,
            cancel_operation,
            send_operation_input,
            resize_pty,
            get_settings,
            save_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running Mole desktop application");
}
