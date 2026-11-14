import React, { useState } from "react";
import {
  Sparkles,
  Eye,
  Trash2,
  HardDrive,
  Shield,
  Layers,
  Globe,
  FolderSync,
  Code2,
  AlertTriangle,
} from "lucide-react";
import { api } from "../../lib/api";
import { useOperationManager } from "../../context/OperationManagerContext";
import { usePersistentState } from "../../hooks/usePersistentState";

export const CleanView: React.FC = () => {
  const { startOperation } = useOperationManager();
  const [dryRun, setDryRun] = usePersistentState<boolean>("clean_dry_run", true);
  const [externalPath, setExternalPath] = usePersistentState<string>("clean_external_path", "");
  const [isLaunching, setIsLaunching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cleanupCategories = [
    {
      name: "User Essentials",
      desc: "App caches, system logs, crash reports, and Trash",
      icon: Layers,
      items: ["~/Library/Caches", "~/Library/Logs", "CrashReporter", "Trash"],
    },
    {
      name: "Browser Caches",
      desc: "Web page caches, storage data, and service workers",
      icon: Globe,
      items: ["Safari", "Google Chrome", "Brave", "Arc", "Firefox", "Edge"],
    },
    {
      name: "Developer Tools",
      desc: "Build artifacts, simulators, and package registries",
      icon: Code2,
      items: ["Xcode DerivedData", "npm / pnpm / yarn", "Cargo / Go", "Docker logs"],
    },
    {
      name: "Cloud & Productivity",
      desc: "Office caches, chat tools, and sync staging",
      icon: FolderSync,
      items: ["Slack", "Discord", "Teams", "OneDrive / Dropbox"],
    },
    {
      name: "System Caches & Logs",
      desc: "Diagnostic reports and macOS temporary files",
      icon: Shield,
      items: ["/Library/Caches", "/Library/Logs", "DiagnosticReports"],
    },
  ];

  const handleRunClean = async () => {
    setIsLaunching(true);
    setErrorMsg(null);
    try {
      const ext = externalPath.trim() ? externalPath.trim() : undefined;
      const opName = dryRun ? "Clean (Preview)" : "Clean (Live)";
      await startOperation(opName, () => api.runClean(dryRun, ext));
    } catch (err: any) {
      setErrorMsg(err.toString());
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header controls card */}
      <div className="bg-[#121826] border border-white/5 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">System Cleanup</h2>
            <p className="text-xs text-slate-400">
              {dryRun
                ? "Preview mode scans storage and estimates reclaimable space without modifying files."
                : "Live mode safely frees storage and moves eligible residue to Trash."}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-white/5 border border-white/5 rounded-lg">
            <button
              onClick={() => setDryRun(true)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                dryRun
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setDryRun(false)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                !dryRun
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Live Clean</span>
            </button>
          </div>
        </div>

        {/* Optional External Drive Input */}
        <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-300">
            <HardDrive className="w-4 h-4 text-slate-400" />
            <span>Target Volume (Optional):</span>
          </div>
          <input
            type="text"
            value={externalPath}
            onChange={(e) => setExternalPath(e.target.value)}
            placeholder="/Volumes/BackupDrive"
            className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 font-mono sm:w-80 outline-none focus:border-blue-500/50"
          />
        </div>

        {errorMsg && (
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-1 flex justify-end">
          <button
            onClick={handleRunClean}
            disabled={isLaunching}
            className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-medium text-white shadow-lg transition-all disabled:opacity-50 ${
              dryRun
                ? "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
                : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLaunching ? "Starting..." : dryRun ? "Run Cleanup Preview" : "Start Live Clean"}</span>
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Cleanup Categories
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {cleanupCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.name}
                className="bg-[#121826] border border-white/5 rounded-xl p-4 shadow-sm space-y-2.5"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">{cat.name}</h4>
                    <p className="text-[10px] text-slate-400">{cat.desc}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1">
                  {cat.items.map((item) => (
                    <span
                      key={item}
                      className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-300 font-mono"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default CleanView;
