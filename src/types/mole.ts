export interface MoleInstallationInfo {
  is_installed: boolean;
  version: string | null;
  binary_path: string | null;
  candidate_paths: string[];
  macos_version: string | null;
  architecture: string | null;
  error_message: string | null;
}

export interface HardwareInfo {
  model: string;
  cpu_model: string;
  total_ram: string;
  disk_size: string;
  os_version: string;
  refresh_rate?: string | null;
}

export interface CpuInfo {
  usage: number;
  per_core?: number[] | null;
  per_core_estimated?: boolean | null;
  load1: number;
  load5: number;
  load15: number;
  core_count?: number | null;
  logical_cpu?: number | null;
  p_core_count?: number | null;
  e_core_count?: number | null;
}

export interface GpuInfo {
  name: string;
  usage?: number | null;
  memory_used?: number | null;
  memory_total?: number | null;
  core_count?: number | null;
  note?: string | null;
}

export interface MemoryInfo {
  used: number;
  total: number;
  available: number;
  used_percent: number;
  swap_used: number;
  swap_total: number;
  cached?: number | null;
  pressure?: string | null;
}

export interface DiskInfo {
  mount: string;
  device: string;
  used: number;
  total: number;
  used_percent: number;
  fstype?: string | null;
  external?: boolean | null;
  smart_status?: string | null;
  purgeable?: number | null;
}

export interface DiskIoInfo {
  read_rate?: number | null;
  write_rate?: number | null;
}

export interface NetworkInterfaceInfo {
  name: string;
  rx_rate_mbs?: number | null;
  tx_rate_mbs?: number | null;
  ip?: string | null;
}

export interface ProxyInfo {
  enabled?: boolean | null;
  type?: string | null;
  host?: string | null;
}

export interface BatteryInfo {
  percent?: number | null;
  status?: string | null;
  time_left?: string | null;
  health?: string | null;
  cycle_count?: number | null;
  capacity?: number | null;
}

export interface ThermalInfo {
  cpu_temp?: number | null;
  gpu_temp?: number | null;
  battery_temp?: number | null;
  fan_speed?: number | null;
  fan_count?: number | null;
  system_power?: number | null;
  adapter_power?: number | null;
  battery_power?: number | null;
}

export interface ProcessInfo {
  pid: number;
  ppid?: number | null;
  name: string;
  command?: string | null;
  cpu: number;
  memory: number;
  memory_bytes?: number | null;
}

export interface ZombieParentInfo {
  pid: number;
  name: string;
  count: number;
}

export interface MoleStatusSnapshot {
  collected_at: string;
  host: string;
  platform: string;
  uptime: string;
  uptime_seconds?: number | null;
  procs: number;
  hardware: HardwareInfo;
  health_score?: number | null;
  health_score_msg?: string | null;
  cpu: CpuInfo;
  gpu?: GpuInfo[] | null;
  memory: MemoryInfo;
  disks: DiskInfo[];
  trash_size?: number | null;
  trash_approx?: boolean | null;
  disk_io?: DiskIoInfo | null;
  network?: NetworkInterfaceInfo[] | null;
  proxy?: ProxyInfo | null;
  batteries?: BatteryInfo[] | null;
  thermal?: ThermalInfo | null;
  top_processes?: ProcessInfo[] | null;
  zombie_count?: number | null;
  zombie_parents?: ZombieParentInfo[] | null;
}

export interface MoleInstalledApp {
  name: string;
  bundle_id: string;
  source: string;
  uninstall_name: string;
  path: string;
  size: string;
  icon_base64?: string;
}

export interface MoleAnalyzeEntry {
  scan_status?: string | null;
  name: string;
  path: string;
  size: number;
  is_dir: boolean;
}

export interface MoleAnalyzeResult {
  scan_status: string;
  path: string;
  overview?: boolean | null;
  entries: MoleAnalyzeEntry[];
  total_size: number;
  total_files: number;
}

export interface MoleHistoryLogs {
  operations?: string | null;
  deletions?: string | null;
}

export interface MoleHistoryActions {
  removed?: number | null;
  trashed?: number | null;
  skipped?: number | null;
  failed?: number | null;
  rebuilt?: number | null;
  other?: number | null;
}

export interface MoleHistorySession {
  command: string;
  run_id?: string | null;
  attribution?: string | null;
  started_at: string;
  ended_at?: string | null;
  items?: number | null;
  size?: string | null;
  operation_count?: number | null;
  failed_tasks?: number | null;
  actions?: MoleHistoryActions | null;
}

export interface MoleHistoryDeletion {
  timestamp: string;
  mode?: string | null;
  status?: string | null;
  size_kb?: number | null;
  path: string;
}

export interface MoleHistoryResponse {
  logs?: MoleHistoryLogs | null;
  limit?: number | null;
  sessions?: MoleHistorySession[] | null;
  deletions?: MoleHistoryDeletion[] | null;
}

export interface AppSettings {
  custom_mole_path?: string | null;
  polling_interval_ms: number;
  polling_enabled: boolean;
  theme: string;
}

export interface OperationEventPayload {
  operation_id: string;
  command_name: string;
  event_type: "started" | "stdout" | "stderr" | "exit" | "error" | "cancelled";
  data?: string | null;
  exit_code?: number | null;
  timestamp: number;
}

export type NavItem =
  | "overview"
  | "clean"
  | "analyze"
  | "uninstall"
  | "optimize"
  | "purge"
  | "slim"
  | "history"
  | "settings"
  | "about";
