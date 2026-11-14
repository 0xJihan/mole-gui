import React, { useState } from "react";
import {
  Zap,
  Eye,
  Shield,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { api } from "../../lib/api";
import { useOperationManager } from "../../context/OperationManagerContext";
import { usePersistentState } from "../../hooks/usePersistentState";

export const OptimizeView: React.FC = () => {
  const { startOperation } = useOperationManager();
  const [dryRun, setDryRun] = usePersistentState<boolean>("optimize_dry_run", true);
  const [isLaunching, setIsLaunching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const userTasks = [
    "Rebuild LaunchServices database (fixes broken app bindings)",
    "Flush DNS user cache & resolver",
    "Refresh Finder & Dock icon caches",
    "Refresh QuickLook thumbnails & cache server",
    "Clear user font databases",
    "Vacuum Safari, Mail & Messages SQLite databases",
    "Clean stale macOS saved application states (> 7 days)",
    "Reset Spotlight user index cache",
    "Refresh Bluetooth & Audio user preferences cache",
    "Clean Xcode simulator unavailable runtimes & device logs",
    "Verify integrity of user login items & LaunchAgents",
  ];

  const privilegedTasks = [
    "Flush system mDNSResponder & multicast cache",
    "Rebuild system font databases",
    "Purge inactive system memory",
    "Rebuild root volume Spotlight search index",
    "Renew DHCP lease & ARP cache",
    "Run macOS periodic daily, weekly & monthly maintenance",
    "Clear system DiagnosticReports & crash logs",
  ];

  const handleRunOptimize = async () => {
    setIsLaunching(true);
    setErrorMsg(null);
    try {
      const opName = dryRun ? "Optimize (Preview)" : "Optimize (Live)";
      await startOperation(opName, () => api.runOptimize(dryRun));
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
            <h2 className="text-sm font-semibold text-white">System Optimization</h2>
            <p className="text-xs text-slate-400">
              Refresh macOS service caches, vacuum internal databases, and resolve background service glitches.
            </p>
          </div>

          <div className="flex items-center p-1 bg-white/5 border border-white/5 rounded-lg">
            <button
              onClick={() => setDryRun(true)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                dryRun ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setDryRun(false)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                !dryRun ? "bg-amber-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Live Optimize</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="pt-1 flex justify-end">
          <button
            onClick={handleRunOptimize}
            disabled={isLaunching}
            className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-medium text-white shadow-lg transition-all disabled:opacity-50 ${
              dryRun
                ? "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
                : "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLaunching ? "Starting..." : dryRun ? "Run Optimization Preview" : "Start Live Optimization"}</span>
          </button>
        </div>
      </div>

      {/* Task Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User-Level Tasks */}
        <div className="bg-[#121826] border border-white/5 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">User-Level Tasks</h3>
              <p className="text-[10px] text-slate-400">No administrator authorization required</p>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-white/5">
            {userTasks.map((task, i) => (
              <div key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>{task}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Privileged Tasks */}
        <div className="bg-[#121826] border border-white/5 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">Privileged Tasks</h3>
              <p className="text-[10px] text-slate-400">Prompts for Touch ID / admin access</p>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-white/5">
            {privilegedTasks.map((task, i) => (
              <div key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span>{task}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default OptimizeView;
