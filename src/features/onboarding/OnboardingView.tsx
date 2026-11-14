import React, { useState } from "react";
import {
  Terminal,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  ExternalLink,
  FolderSearch,
} from "lucide-react";
import type { MoleInstallationInfo } from "../../types/mole";
import { api } from "../../lib/api";
import moleIcon from "../../assets/mole.webp";
import { openPath } from "@tauri-apps/plugin-opener";

interface OnboardingViewProps {
  installation: MoleInstallationInfo | null;
  onRefreshDetection: () => Promise<void> | void;
  onSuccess: (info: MoleInstallationInfo) => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  installation,
  onRefreshDetection,
  onSuccess,
}) => {
  const [checking, setChecking] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customPath, setCustomPath] = useState("");
  const [testingPath, setTestingPath] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const homebrewCmd = "brew install mole";
  const curlCmd = "curl -fsSL https://raw.githubusercontent.com/tw93/mole/main/install.sh | bash";

  const handleCopy = async (cmd: string, key: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(cmd);
      } else {
        const el = document.createElement("textarea");
        el.value = cmd;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2200);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleOpenTerminal = async () => {
    try {
      await openPath("/System/Applications/Utilities/Terminal.app");
    } catch (err) {
      console.warn("Could not open Terminal.app directly:", err);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMessage(null);
    try {
      const info = await api.detectMole();
      if (info.is_installed) {
        onSuccess(info);
      } else {
        await onRefreshDetection();
        setStatusMessage(
          "Mole executable was not detected yet. After completing the terminal installation, click this button again."
        );
      }
    } catch (err: any) {
      setStatusMessage(err.toString());
    } finally {
      setChecking(false);
    }
  };

  const handleVerifyCustomPath = async () => {
    if (!customPath.trim()) return;
    setTestingPath(true);
    setStatusMessage(null);
    try {
      const info = await api.detectMole(customPath.trim());
      if (info.is_installed) {
        const settings = await api.getSettings();
        await api.saveSettings({ ...settings, custom_mole_path: customPath.trim() });
        onSuccess(info);
      } else {
        setStatusMessage("No valid Mole CLI executable was found at the specified path.");
      }
    } catch (err: any) {
      setStatusMessage(err.toString());
    } finally {
      setTestingPath(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#0a0d14] text-slate-100 flex flex-col items-center justify-center p-6 select-none font-sans">
      <div className="max-w-2xl w-full space-y-7">
        {/* Brand header */}
        <div className="text-center space-y-3">
          <img
            src={moleIcon}
            alt="Mole GUI"
            className="w-16 h-16 mx-auto rounded-2xl object-contain shadow-2xl shadow-blue-500/10 border border-white/10 p-1 bg-white/5"
          />
          <h1 className="text-2xl font-bold tracking-tight text-white">Mole CLI Required</h1>
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
            Mole GUI is a desktop interface for the original{" "}
            <span className="text-slate-200 font-semibold">tw93/Mole</span> maintenance engine.
            Please install the Mole CLI via your macOS Terminal using either method below.
          </p>
        </div>

        {/* Installation Options */}
        <div className="bg-[#101522] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5">
          {/* Option 1: Homebrew */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  RECOMMENDED
                </span>
                <h3 className="text-xs font-semibold text-white">Option 1: Homebrew Package</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-sans">No root privileges required</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Installs the official release directly into Homebrew’s standard binary prefix.
            </p>

            <div className="flex items-center space-x-2 bg-black/40 border border-white/10 rounded-lg p-2.5">
              <code className="flex-1 text-xs font-mono text-emerald-300 select-all overflow-x-auto">
                {homebrewCmd}
              </code>
              <button
                onClick={() => handleCopy(homebrewCmd, "brew")}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors flex-shrink-0"
              >
                {copiedKey === "brew" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Option 2: Curl script */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-500/15 text-blue-400 border border-blue-500/25">
                  OFFICIAL SCRIPT
                </span>
                <h3 className="text-xs font-semibold text-white">Option 2: Direct Install Script</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-sans">Terminal interactive</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Standard official upstream installation script with interactive terminal authentication.
            </p>

            <div className="flex items-center space-x-2 bg-black/40 border border-white/10 rounded-lg p-2.5">
              <code className="flex-1 text-xs font-mono text-blue-300 select-all overflow-x-auto">
                {curlCmd}
              </code>
              <button
                onClick={() => handleCopy(curlCmd, "curl")}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors flex-shrink-0"
              >
                {copiedKey === "curl" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Status Alert if checked and not found */}
          {statusMessage && (
            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{statusMessage}</span>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleOpenTerminal}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 font-medium transition-colors"
            >
              <Terminal className="w-4 h-4 text-slate-400" />
              <span>Launch Terminal.app</span>
              <ExternalLink className="w-3 h-3 text-slate-500 ml-0.5" />
            </button>

            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
              <span>{checking ? "Checking..." : "Check Installation Status"}</span>
            </button>
          </div>

          {/* Custom path connector */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <label className="text-xs font-medium text-slate-400">
              Already installed elsewhere? Specify executable location:
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 flex items-center space-x-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
                <FolderSearch className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  placeholder="/opt/homebrew/bin/mole or custom path"
                  className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-500 font-mono outline-none"
                />
              </div>
              <button
                onClick={handleVerifyCustomPath}
                disabled={testingPath || !customPath.trim()}
                className="px-4 py-2 text-xs font-medium bg-white/10 hover:bg-white/15 text-slate-200 rounded-lg border border-white/10 transition-colors disabled:opacity-40"
              >
                {testingPath ? "Testing..." : "Connect"}
              </button>
            </div>
          </div>
        </div>

        {/* Candidate paths hint */}
        {installation && (
          <div className="text-center text-[11px] text-slate-500 font-mono">
            Searches: /opt/homebrew/bin/mole, /usr/local/bin/mole, ~/.local/bin/mole, $PATH
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingView;
