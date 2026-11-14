use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoleInstallationInfo {
    pub is_installed: bool,
    pub version: Option<String>,
    pub binary_path: Option<String>,
    pub candidate_paths: Vec<String>,
    pub macos_version: Option<String>,
    pub architecture: Option<String>,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareInfo {
    pub model: String,
    pub cpu_model: String,
    pub total_ram: String,
    pub disk_size: String,
    pub os_version: String,
    #[serde(default)]
    pub refresh_rate: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuInfo {
    pub usage: f64,
    #[serde(default)]
    pub per_core: Option<Vec<f64>>,
    #[serde(default)]
    pub per_core_estimated: Option<bool>,
    pub load1: f64,
    pub load5: f64,
    pub load15: f64,
    #[serde(default)]
    pub core_count: Option<u32>,
    #[serde(default)]
    pub logical_cpu: Option<u32>,
    #[serde(default)]
    pub p_core_count: Option<u32>,
    #[serde(default)]
    pub e_core_count: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuInfo {
    pub name: String,
    #[serde(default)]
    pub usage: Option<f64>,
    #[serde(default)]
    pub memory_used: Option<u64>,
    #[serde(default)]
    pub memory_total: Option<u64>,
    #[serde(default)]
    pub core_count: Option<u32>,
    #[serde(default)]
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryInfo {
    pub used: u64,
    pub total: u64,
    pub available: u64,
    pub used_percent: f64,
    pub swap_used: u64,
    pub swap_total: u64,
    #[serde(default)]
    pub cached: Option<u64>,
    #[serde(default)]
    pub pressure: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskInfo {
    pub mount: String,
    pub device: String,
    pub used: u64,
    pub total: u64,
    pub used_percent: f64,
    #[serde(default)]
    pub fstype: Option<String>,
    #[serde(default)]
    pub external: Option<bool>,
    #[serde(default)]
    pub smart_status: Option<String>,
    #[serde(default)]
    pub purgeable: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskIoInfo {
    #[serde(default)]
    pub read_rate: Option<f64>,
    #[serde(default)]
    pub write_rate: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInterfaceInfo {
    pub name: String,
    #[serde(default)]
    pub rx_rate_mbs: Option<f64>,
    #[serde(default)]
    pub tx_rate_mbs: Option<f64>,
    #[serde(default)]
    pub ip: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkHistoryInfo {
    #[serde(default)]
    pub rx_history: Option<Vec<f64>>,
    #[serde(default)]
    pub tx_history: Option<Vec<f64>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyInfo {
    #[serde(default)]
    pub enabled: Option<bool>,
    #[serde(default, rename = "type")]
    pub proxy_type: Option<String>,
    #[serde(default)]
    pub host: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatteryInfo {
    #[serde(default)]
    pub percent: Option<u32>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub time_left: Option<String>,
    #[serde(default)]
    pub health: Option<String>,
    #[serde(default)]
    pub cycle_count: Option<u32>,
    #[serde(default)]
    pub capacity: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThermalInfo {
    #[serde(default)]
    pub cpu_temp: Option<f64>,
    #[serde(default)]
    pub gpu_temp: Option<f64>,
    #[serde(default)]
    pub battery_temp: Option<f64>,
    #[serde(default)]
    pub fan_speed: Option<f64>,
    #[serde(default)]
    pub fan_count: Option<u32>,
    #[serde(default)]
    pub system_power: Option<f64>,
    #[serde(default)]
    pub adapter_power: Option<f64>,
    #[serde(default)]
    pub battery_power: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessInfo {
    pub pid: u32,
    #[serde(default)]
    pub ppid: Option<u32>,
    pub name: String,
    #[serde(default)]
    pub command: Option<String>,
    pub cpu: f64,
    pub memory: f64,
    #[serde(default)]
    pub memory_bytes: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ZombieParentInfo {
    pub pid: u32,
    pub name: String,
    pub count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoleStatusSnapshot {
    pub collected_at: String,
    pub host: String,
    pub platform: String,
    pub uptime: String,
    #[serde(default)]
    pub uptime_seconds: Option<u64>,
    pub procs: u64,
    pub hardware: HardwareInfo,
    #[serde(default)]
    pub health_score: Option<u32>,
    #[serde(default)]
    pub health_score_msg: Option<String>,
    pub cpu: CpuInfo,
    #[serde(default)]
    pub gpu: Option<Vec<GpuInfo>>,
    pub memory: MemoryInfo,
    pub disks: Vec<DiskInfo>,
    #[serde(default)]
    pub trash_size: Option<u64>,
    #[serde(default)]
    pub trash_approx: Option<bool>,
    #[serde(default)]
    pub disk_io: Option<DiskIoInfo>,
    #[serde(default)]
    pub network: Option<Vec<NetworkInterfaceInfo>>,
    #[serde(default)]
    pub network_history: Option<NetworkHistoryInfo>,
    #[serde(default)]
    pub proxy: Option<ProxyInfo>,
    #[serde(default)]
    pub batteries: Option<Vec<BatteryInfo>>,
    #[serde(default)]
    pub thermal: Option<ThermalInfo>,
    #[serde(default)]
    pub top_processes: Option<Vec<ProcessInfo>>,
    #[serde(default)]
    pub zombie_count: Option<u32>,
    #[serde(default)]
    pub zombie_parents: Option<Vec<ZombieParentInfo>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoleInstalledApp {
    pub name: String,
    pub bundle_id: String,
    pub source: String,
    pub uninstall_name: String,
    pub path: String,
    pub size: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub icon_base64: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoleAnalyzeEntry {
    #[serde(default)]
    pub scan_status: Option<String>,
    pub name: String,
    pub path: String,
    pub size: u64,
    pub is_dir: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoleAnalyzeResult {
    pub scan_status: String,
    pub path: String,
    #[serde(default)]
    pub overview: Option<bool>,
    #[serde(default)]
    pub entries: Vec<MoleAnalyzeEntry>,
    #[serde(default)]
    pub total_size: u64,
    #[serde(default)]
    pub total_files: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoleHistoryLogs {
    #[serde(default)]
    pub operations: Option<String>,
    #[serde(default)]
    pub deletions: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoleHistoryActions {
    #[serde(default)]
    pub removed: Option<u32>,
    #[serde(default)]
    pub trashed: Option<u32>,
    #[serde(default)]
    pub skipped: Option<u32>,
    #[serde(default)]
    pub failed: Option<u32>,
    #[serde(default)]
    pub rebuilt: Option<u32>,
    #[serde(default)]
    pub other: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoleHistorySession {
    pub command: String,
    #[serde(default)]
    pub run_id: Option<String>,
    #[serde(default)]
    pub attribution: Option<String>,
    pub started_at: String,
    #[serde(default)]
    pub ended_at: Option<String>,
    #[serde(default)]
    pub items: Option<u32>,
    #[serde(default)]
    pub size: Option<String>,
    #[serde(default)]
    pub operation_count: Option<u32>,
    #[serde(default)]
    pub failed_tasks: Option<u32>,
    #[serde(default)]
    pub actions: Option<MoleHistoryActions>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoleHistoryDeletion {
    pub timestamp: String,
    #[serde(default)]
    pub mode: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub size_kb: Option<u64>,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoleHistoryResponse {
    #[serde(default)]
    pub logs: Option<MoleHistoryLogs>,
    #[serde(default)]
    pub limit: Option<u32>,
    #[serde(default)]
    pub sessions: Option<Vec<MoleHistorySession>>,
    #[serde(default)]
    pub deletions: Option<Vec<MoleHistoryDeletion>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub custom_mole_path: Option<String>,
    pub polling_interval_ms: u64,
    pub polling_enabled: bool,
    pub theme: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            custom_mole_path: None,
            polling_interval_ms: 1000,
            polling_enabled: true,
            theme: "dark".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperationEventPayload {
    pub operation_id: String,
    pub command_name: String,
    pub event_type: String, // "started", "stdout", "stderr", "exit", "error", "cancelled"
    pub data: Option<String>,
    pub exit_code: Option<i32>,
    pub timestamp: i64,
}
