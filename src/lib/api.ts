import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  AppSettings,
  MoleAnalyzeResult,
  MoleHistoryResponse,
  MoleInstalledApp,
  MoleInstallationInfo,
  MoleStatusSnapshot,
  OperationEventPayload,
} from "../types/mole";

export const api = {
  detectMole: (customPath?: string): Promise<MoleInstallationInfo> =>
    invoke("detect_mole", { customPath }),

  installMole: (): Promise<MoleInstallationInfo> =>
    invoke("install_mole"),

  startStatusPolling: (): Promise<void> =>
    invoke("start_status_polling"),

  stopStatusPolling: (): Promise<void> =>
    invoke("stop_status_polling"),

  setPollingInterval: (intervalMs: number): Promise<void> =>
    invoke("set_polling_interval", { intervalMs }),

  getLastStatus: (): Promise<MoleStatusSnapshot | null> =>
    invoke("get_last_status"),

  pollStatusNow: (): Promise<MoleStatusSnapshot> =>
    invoke("poll_status_now"),

  listInstalledApps: (): Promise<MoleInstalledApp[]> =>
    invoke("list_installed_apps"),

  getAppIcon: (path: string): Promise<string | null> =>
    invoke("get_app_icon", { path }),

  analyzeDisk: (path?: string): Promise<MoleAnalyzeResult> =>
    invoke("analyze_disk", { path }),

  getHistory: (limit?: number): Promise<MoleHistoryResponse> =>
    invoke("get_history", { limit }),

  runClean: (dryRun: boolean, external?: string): Promise<string> =>
    invoke("run_clean", { dryRun, external }),

  runUninstall: (
    appNames: string[],
    dryRun: boolean,
    permanent: boolean,
    withData: boolean
  ): Promise<string> =>
    invoke("run_uninstall", { appNames, dryRun, permanent, withData }),

  runOptimize: (dryRun: boolean): Promise<string> =>
    invoke("run_optimize", { dryRun }),

  runPurge: (dryRun: boolean, yes: boolean): Promise<string> =>
    invoke("run_purge", { dryRun, yes }),

  runSlim: (dryRun: boolean): Promise<string> =>
    invoke("run_slim", { dryRun }),

  runInstaller: (dryRun: boolean): Promise<string> =>
    invoke("run_installer", { dryRun }),

  runTouchId: (): Promise<string> =>
    invoke("run_touchid"),

  runUpdate: (force: boolean, nightly: boolean): Promise<string> =>
    invoke("run_update", { force, nightly }),

  cancelOperation: (operationId: string): Promise<void> =>
    invoke("cancel_operation", { operationId }),

  sendOperationInput: (operationId: string, input: string): Promise<void> =>
    invoke("send_operation_input", { operationId, input }),

  resizePty: (operationId: string, cols: number, rows: number): Promise<void> =>
    invoke("resize_pty", { operationId, cols, rows }),

  getSettings: (): Promise<AppSettings> =>
    invoke("get_settings"),

  saveSettings: (settings: AppSettings): Promise<void> =>
    invoke("save_settings", { newSettings: settings }),

  // Event Listeners
  onStatusUpdate: (callback: (snapshot: MoleStatusSnapshot) => void): Promise<UnlistenFn> =>
    listen<MoleStatusSnapshot>("mole://status", (event) => callback(event.payload)),

  onStatusError: (callback: (error: string) => void): Promise<UnlistenFn> =>
    listen<string>("mole://status-error", (event) => callback(event.payload)),

  onOperationStarted: (callback: (payload: OperationEventPayload) => void): Promise<UnlistenFn> =>
    listen<OperationEventPayload>("mole://op-started", (event) => callback(event.payload)),

  onOperationOutput: (callback: (payload: OperationEventPayload) => void): Promise<UnlistenFn> =>
    listen<OperationEventPayload>("mole://op-output", (event) => callback(event.payload)),

  onOperationExit: (callback: (payload: OperationEventPayload) => void): Promise<UnlistenFn> =>
    listen<OperationEventPayload>("mole://op-exit", (event) => callback(event.payload)),

  onInstallLog: (callback: (chunk: string) => void): Promise<UnlistenFn> =>
    listen<string>("mole://install-log", (event) => callback(event.payload)),

  onInstallSuccess: (callback: (info: MoleInstallationInfo) => void): Promise<UnlistenFn> =>
    listen<MoleInstallationInfo>("mole://install-success", (event) => callback(event.payload)),
};
