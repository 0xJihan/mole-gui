import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import type { MoleInstallationInfo } from "../../types/mole";
import { api } from "../../lib/api";
import moleIcon from "../../assets/mole.webp";

interface OnboardingViewProps {
  installation: MoleInstallationInfo | null;
  onRefreshDetection: () => void;
  onSuccess: (info: MoleInstallationInfo) => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  onSuccess,
}) => {
  const [installing, setInstalling] = useState(false);
  const [installLogs, setInstallLogs] = useState<string[]>([]);
  const [customPath, setCustomPath] = useState("");
  const [testingPath, setTestingPath] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [installLogs]);

  const handleInstallMole = async () => {
    setInstalling(true);
    setInstallLogs(["Starting official Mole installer...\n"]);
    setErrorMsg(null);

    const unlistenLog = await api.onInstallLog((chunk) => {
      setInstallLogs((prev) => [...prev, chunk]);
    });

    try {
      const info = await api.installMole();
      unlistenLog();
      setInstalling(false);
      onSuccess(info);
    } catch (err: any) {
      unlistenLog();
      setInstalling(false);
      setErrorMsg(err.toString());
    }
  };

  const handleVerifyCustomPath = async () => {
    if (!customPath.trim()) return;
    setTestingPath(true);
    setErrorMsg(null);
    try {
      const info = await api.detectMole(customPath.trim());
      if (info.is_installed) {
        // Save to settings
        const settings = await api.getSettings();
        await api.saveSettings({ ...settings, custom_mole_path: customPath.trim() });
        onSuccess(info);
      } else {
        setErrorMsg("Executable at provided path failed verification check.");
      }
    } catch (err: any) {
      setErrorMsg(err.toString());
    } finally {
      setTestingPath(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#0a0d14] text-slate-100 flex flex-col items-center justify-center p-8 select-none font-sans">
      <div className="max-w-2xl w-full space-y-8">
        {/* Brand header */}
        <div className="text-center space-y-3">
          <img
            src={moleIcon}
            alt="Mole GUI"
            className="w-16 h-16 mx-auto rounded-2xl object-contain shadow-xl shadow-blue-500/10 border border-white/10 p-1 bg-white/5"
          />
          <h1 className="text-2xl font-bold tracking-tight text-white">Mole CLI Required</h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Mole GUI is a native graphical wrapper for the original{" "}
            <span className="text-slate-200 font-medium">tw93/Mole</span> CLI. All system maintenance,
            deep cleaning, and uninstallation are executed directly by the official Mole engine.
          </p>
        </div>

        {/* Installation Actions Card */}
        <div className="bg-[#101522] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-blue-200">Automatic One-Click Install</h3>
              <p className="text-xs text-blue-300/80">
                Installs the latest official Mole release directly into your user environment without root or Touch ID prompts.
              </p>
            </div>
            <button
              onClick={handleInstallMole}
              disabled={installing}
              className="flex-shrink-0 flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              {installing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Installing...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Install Mole</span>
                </>
              )}
            </button>
          </div>

          {/* Real-time installation output log */}
          {installLogs.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Installation Output</span>
                {installing ? (
                  <span className="text-blue-400 animate-pulse font-normal">Working...</span>
                ) : (
                  <span className="text-emerald-400 font-normal flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed</span>
                  </span>
                )}
              </div>
              <div
                ref={logContainerRef}
                className="h-44 overflow-y-auto p-3.5 rounded-xl bg-[#080b12] border border-white/5 font-mono text-[11px] text-slate-300 select-text leading-relaxed whitespace-pre-wrap"
              >
                {installLogs.join("")}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Manual Path Input */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <label className="text-xs font-medium text-slate-300">
              Already have Mole installed elsewhere? Specify executable path:
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder="/opt/homebrew/bin/mole or custom path"
                className="flex-1 px-3 py-2 text-xs bg-white/5 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50 font-mono"
              />
              <button
                onClick={handleVerifyCustomPath}
                disabled={testingPath || !customPath.trim()}
                className="px-4 py-2 text-xs font-medium bg-white/10 hover:bg-white/15 text-slate-200 rounded-lg border border-white/10 transition-colors disabled:opacity-50"
              >
                {testingPath ? "Testing..." : "Connect"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingView;
