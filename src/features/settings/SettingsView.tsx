import React, { useEffect, useState } from "react";
import {
  FolderSearch,
  Activity,
  Fingerprint,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Download,
} from "lucide-react";
import type { AppSettings, MoleInstallationInfo } from "../../types/mole";
import { api } from "../../lib/api";
import { useOperationManager } from "../../context/OperationManagerContext";

interface SettingsViewProps {
  installation: MoleInstallationInfo | null;
  onRefreshInstallation: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  installation,
  onRefreshInstallation,
}) => {
  const { startOperation } = useOperationManager();
  const [settings, setSettings] = useState<AppSettings>({
    custom_mole_path: "",
    polling_interval_ms: 1000,
    polling_enabled: true,
    theme: "dark",
  });
  const [customPathInput, setCustomPathInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getSettings().then((s) => {
      setSettings(s);
      setCustomPathInput(s.custom_mole_path || "");
    });
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg(null);
    try {
      const updated: AppSettings = {
        ...settings,
        custom_mole_path: customPathInput.trim() ? customPathInput.trim() : null,
      };
      await api.saveSettings(updated);
      setSettings(updated);
      setSaveSuccess(true);
      onRefreshInstallation();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setErrorMsg(err.toString());
    } finally {
      setSaving(false);
    }
  };

  const handleIntervalChange = async (newVal: number) => {
    setSettings((prev) => ({ ...prev, polling_interval_ms: newVal }));
    try {
      await api.setPollingInterval(newVal);
    } catch (err) {
      console.error("Failed to update polling interval:", err);
    }
  };

  const handleTogglePolling = async () => {
    const nextState = !settings.polling_enabled;
    setSettings((prev) => ({ ...prev, polling_enabled: nextState }));
    if (nextState) {
      await api.startStatusPolling();
    } else {
      await api.stopStatusPolling();
    }
  };

  const handleConfigureTouchId = async () => {
    try {
      await startOperation("Configure Touch ID", () => api.runTouchId());
    } catch (err: any) {
      setErrorMsg(err.toString());
    }
  };

  const handleCheckUpdate = async () => {
    try {
      await startOperation("Mole CLI Self-Update", () => api.runUpdate(false, false));
    } catch (err: any) {
      setErrorMsg(err.toString());
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Installation & Executable Config Card */}
      <div className="bg-[#121826] border border-white/5 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <FolderSearch className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Mole Executable Discovery</h3>
            <p className="text-xs text-slate-400">
              Configure or verify the target Mole binary used for all system operations
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-sans">Active Executable:</span>
            <span className="text-slate-200 truncate max-w-md bg-white/5 px-2 py-1 rounded">
              {installation?.binary_path || "Not found"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-sans">Detected Version:</span>
            <span className="text-emerald-400 font-bold">
              v{installation?.version || "Unknown"}
            </span>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-medium text-slate-300">
              Custom Binary Path (Overrides automatic detection):
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={customPathInput}
                onChange={(e) => setCustomPathInput(e.target.value)}
                placeholder="/opt/homebrew/bin/mole"
                className="flex-1 px-3 py-2 text-xs bg-white/5 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 font-mono outline-none focus:border-blue-500/50"
              />
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Path"}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={onRefreshInstallation}
              className="flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-run Discovery</span>
            </button>

            <button
              onClick={handleCheckUpdate}
              className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Check for Mole CLI Updates</span>
            </button>
          </div>

          {saveSuccess && (
            <div className="flex items-center space-x-2 text-xs text-emerald-400 pt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings saved successfully!</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center space-x-2 text-xs text-rose-400 pt-1">
              <AlertTriangle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Polling Preferences */}
      <div className="bg-[#121826] border border-white/5 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Status Polling Engine</h3>
            <p className="text-xs text-slate-400">
              Control the background cadence of `mole status --json`
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-200">Background Telemetry Polling</div>
              <p className="text-[11px] text-slate-400">
                Collects system health, CPU, memory, and top processes
              </p>
            </div>
            <button
              onClick={handleTogglePolling}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                settings.polling_enabled
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : "bg-white/5 text-slate-400 border-white/10"
              }`}
            >
              {settings.polling_enabled ? "Active (Running)" : "Paused"}
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Polling Interval:</span>
              <span className="font-mono text-cyan-400 font-bold">
                {(settings.polling_interval_ms / 1000).toFixed(1)}s
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="5000"
              step="250"
              value={settings.polling_interval_ms}
              onChange={(e) => handleIntervalChange(Number(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.5s (High density)</span>
              <span>1.0s (Recommended)</span>
              <span>5.0s (Battery saver)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Touch ID & Security */}
      <div className="bg-[#121826] border border-white/5 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Touch ID for Sudo</h3>
              <p className="text-xs text-slate-400">
                Configure `/etc/pam.d/sudo_local` to enable biometric Touch ID authorization for sudo
              </p>
            </div>
          </div>

          <button
            onClick={handleConfigureTouchId}
            className="px-4 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 text-xs font-medium transition-colors"
          >
            Configure Touch ID
          </button>
        </div>
      </div>

      {/* About App */}
      <div className="p-5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div>
          <span className="font-bold text-slate-200">Mole Desktop v1.70.0</span>
          <span className="block text-[11px] text-slate-500 font-sans mt-0.5">
            Engineered with Tauri 2, Rust & React · MIT License
          </span>
        </div>
        <div className="text-right text-[11px] text-slate-500 font-sans">
          tw93/Mole System Maintenance
        </div>
      </div>
    </div>
  );
};
export default SettingsView;
