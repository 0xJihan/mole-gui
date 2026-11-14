use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::{command, AppHandle, State};

use crate::mole::discovery::MoleDiscovery;
use crate::mole::execution::CommandExecutor;
use crate::mole::installation::MoleInstaller;
use crate::mole::process::ProcessManager;
use crate::mole::status::StatusPoller;
use crate::mole::types::{
    AppSettings, MoleAnalyzeResult, MoleHistoryResponse, MoleInstalledApp,
    MoleInstallationInfo, MoleStatusSnapshot,
};

pub struct AppState {
    pub poller: StatusPoller,
    pub process_mgr: ProcessManager,
    pub settings: Arc<Mutex<AppSettings>>,
}

// Settings file persistence helper
fn get_settings_path() -> Option<std::path::PathBuf> {
    dirs::config_dir().map(|c| c.join("mole").join("desktop_settings.json"))
}

pub fn load_initial_settings() -> AppSettings {
    if let Some(path) = get_settings_path() {
        if path.exists() {
            if let Ok(content) = std::fs::read_to_string(path) {
                if let Ok(settings) = serde_json::from_str::<AppSettings>(&content) {
                    return settings;
                }
            }
        }
    }
    AppSettings::default()
}

pub fn persist_settings(settings: &AppSettings) {
    if let Some(path) = get_settings_path() {
        if let Some(parent) = path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        if let Ok(json) = serde_json::to_string_pretty(settings) {
            let _ = std::fs::write(path, json);
        }
    }
}

#[command]
pub async fn detect_mole(
    custom_path: Option<String>,
    state: State<'_, AppState>,
) -> Result<MoleInstallationInfo, String> {
    let settings = state.settings.lock().await;
    let path_to_use = custom_path.or_else(|| settings.custom_mole_path.clone());
    Ok(MoleDiscovery::detect(path_to_use.as_deref()))
}

#[command]
pub async fn install_mole(app: AppHandle) -> Result<MoleInstallationInfo, String> {
    MoleInstaller::install(app)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn start_status_polling(state: State<'_, AppState>) -> Result<(), String> {
    state.poller.start();
    Ok(())
}

#[command]
pub async fn stop_status_polling(state: State<'_, AppState>) -> Result<(), String> {
    state.poller.stop();
    Ok(())
}

#[command]
pub async fn set_polling_interval(interval_ms: u64, state: State<'_, AppState>) -> Result<(), String> {
    state.poller.set_interval(interval_ms);
    let mut settings = state.settings.lock().await;
    settings.polling_interval_ms = interval_ms;
    persist_settings(&settings);
    Ok(())
}

#[command]
pub async fn get_last_status(state: State<'_, AppState>) -> Result<Option<MoleStatusSnapshot>, String> {
    Ok(state.poller.get_last_snapshot().await)
}

#[command]
pub async fn poll_status_now(state: State<'_, AppState>) -> Result<MoleStatusSnapshot, String> {
    state.poller.poll_once().await.map_err(|e| e.to_string())
}

#[command]
pub async fn list_installed_apps(state: State<'_, AppState>) -> Result<Vec<MoleInstalledApp>, String> {
    let settings = state.settings.lock().await;
    let detection = MoleDiscovery::detect(settings.custom_mole_path.as_deref());
    let bin_path = detection.binary_path.ok_or("Mole CLI not found")?;

    CommandExecutor::list_installed_apps(&bin_path)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn get_app_icon(path: String) -> Result<Option<String>, String> {
    Ok(crate::mole::icon::get_app_icon_base64(&path))
}

#[command]
pub async fn analyze_disk(
    path: Option<String>,
    state: State<'_, AppState>,
) -> Result<MoleAnalyzeResult, String> {
    let settings = state.settings.lock().await;
    let detection = MoleDiscovery::detect(settings.custom_mole_path.as_deref());
    let bin_path = detection.binary_path.ok_or("Mole CLI not found")?;

    CommandExecutor::analyze_disk(&bin_path, path.as_deref())
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn get_history(
    limit: Option<u32>,
    state: State<'_, AppState>,
) -> Result<MoleHistoryResponse, String> {
    let settings = state.settings.lock().await;
    let detection = MoleDiscovery::detect(settings.custom_mole_path.as_deref());
    let bin_path = detection.binary_path.ok_or("Mole CLI not found")?;

    CommandExecutor::get_history(&bin_path, limit)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn run_clean(
    dry_run: bool,
    external: Option<String>,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let settings = state.settings.lock().await;
    let detection = MoleDiscovery::detect(settings.custom_mole_path.as_deref());
    let bin_path = detection.binary_path.ok_or("Mole CLI not found")?;

    CommandExecutor::execute_clean(&state.process_mgr, &bin_path, dry_run, external)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn run_uninstall(
    app_names: Vec<String>,
    dry_run: bool,
    permanent: bool,
    with_data: bool,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let settings = state.settings.lock().await;
    let detection = MoleDiscovery::detect(settings.custom_mole_path.as_deref());
    let bin_path = detection.binary_path.ok_or("Mole CLI not found")?;

    CommandExecutor::execute_uninstall(
        &state.process_mgr,
        &bin_path,
        &app_names,
        dry_run,
        permanent,
        with_data,
    )
    .await
    .map_err(|e| e.to_string())
}

#[command]
pub async fn run_optimize(
    dry_run: bool,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let settings = state.settings.lock().await;
    let detection = MoleDiscovery::detect(settings.custom_mole_path.as_deref());
    let bin_path = detection.binary_path.ok_or("Mole CLI not found")?;

    CommandExecutor::execute_optimize(&state.process_mgr, &bin_path, dry_run)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn run_purge(
    dry_run: bool,
    yes: bool,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let settings = state.settings.lock().await;
    let detection = MoleDiscovery::detect(settings.custom_mole_path.as_deref());
    let bin_path = detection.binary_path.ok_or("Mole CLI not found")?;

    CommandExecutor::execute_purge(&state.process_mgr, &bin_path, dry_run, yes)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn run_slim(
    dry_run: bool,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let settings = state.settings.lock().await;
    let detection = MoleDiscovery::detect(settings.custom_mole_path.as_deref());
    let bin_path = detection.binary_path.ok_or("Mole CLI not found")?;

    CommandExecutor::execute_slim(&state.process_mgr, &bin_path, dry_run)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn run_installer(
    dry_run: bool,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let settings = state.settings.lock().await;
    let detection = MoleDiscovery::detect(settings.custom_mole_path.as_deref());
    let bin_path = detection.binary_path.ok_or("Mole CLI not found")?;

    CommandExecutor::execute_installer(&state.process_mgr, &bin_path, dry_run)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn run_touchid(state: State<'_, AppState>) -> Result<String, String> {
    let settings = state.settings.lock().await;
    let detection = MoleDiscovery::detect(settings.custom_mole_path.as_deref());
    let bin_path = detection.binary_path.ok_or("Mole CLI not found")?;

    CommandExecutor::execute_touchid(&state.process_mgr, &bin_path)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn run_update(
    force: bool,
    nightly: bool,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let settings = state.settings.lock().await;
    let detection = MoleDiscovery::detect(settings.custom_mole_path.as_deref());
    let bin_path = detection.binary_path.ok_or("Mole CLI not found")?;

    CommandExecutor::execute_update(&state.process_mgr, &bin_path, force, nightly)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn cancel_operation(
    operation_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state
        .process_mgr
        .cancel_operation(&operation_id)
        .map_err(|e| e.to_string())
}

#[command]
pub async fn send_operation_input(
    operation_id: String,
    input: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state
        .process_mgr
        .send_input(&operation_id, &input)
        .map_err(|e| e.to_string())
}

#[command]
pub async fn resize_pty(
    operation_id: String,
    cols: u16,
    rows: u16,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state
        .process_mgr
        .resize_pty(&operation_id, cols, rows)
        .map_err(|e| e.to_string())
}

#[command]
pub async fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    let settings = state.settings.lock().await;
    Ok(settings.clone())
}

#[command]
pub async fn save_settings(
    new_settings: AppSettings,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state.poller.set_interval(new_settings.polling_interval_ms);
    state.poller.set_custom_path(new_settings.custom_mole_path.clone()).await;

    persist_settings(&new_settings);
    let mut settings = state.settings.lock().await;
    *settings = new_settings;
    Ok(())
}
