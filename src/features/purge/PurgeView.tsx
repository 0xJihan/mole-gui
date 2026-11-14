import React, { useState } from "react";
import {
  FolderGit2,
  Eye,
  Trash2,
  AlertTriangle,
  FolderTree,
  Package,
} from "lucide-react";
import { api } from "../../lib/api";
import { useOperationManager } from "../../context/OperationManagerContext";
import { usePersistentState } from "../../hooks/usePersistentState";

export const PurgeView: React.FC = () => {
  const { startOperation } = useOperationManager();
  const [dryRun, setDryRun] = usePersistentState<boolean>("purge_dry_run", true);
  const [isLaunching, setIsLaunching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const targetArtifacts = [
    "node_modules",
    "target (Rust)",
    ".venv / venv / .pytest_cache",
    ".next / .nuxt / .svelte-kit",
    "build / dist / out",
    "DerivedData / Pods (Xcode)",
    ".gradle / .turbo / .parcel-cache",
  ];

  const scanRoots = [
    "~/Projects",
    "~/Developer",
    "~/Development",
    "~/GitHub",
    "~/Code",
    "~/Workspace",
  ];

  const handleRunPurge = async () => {
    setIsLaunching(true);
    setErrorMsg(null);
    try {
      const opName = dryRun ? "Purge (Preview)" : "Purge (Live)";
      await startOperation(opName, () => api.runPurge(dryRun, !dryRun));
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
            <h2 className="text-sm font-semibold text-white">Project Build Artifacts Purge</h2>
            <p className="text-xs text-slate-400">
              Clean stale node_modules, target directories, and build caches across local repositories.
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
                !dryRun ? "bg-rose-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Live Purge</span>
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
            onClick={handleRunPurge}
            disabled={isLaunching}
            className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-medium text-white shadow-lg transition-all disabled:opacity-50 ${
              dryRun
                ? "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
                : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>{isLaunching ? "Starting..." : dryRun ? "Run Purge Preview" : "Start Project Purge"}</span>
          </button>
        </div>
      </div>

      {/* Target details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#121826] border border-white/5 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center space-x-2.5 text-xs font-semibold text-white">
            <Package className="w-4 h-4 text-cyan-400" />
            <span>Target Build Artifacts</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
            {targetArtifacts.map((art) => (
              <span
                key={art}
                className="px-2.5 py-1 rounded bg-white/5 text-[11px] text-slate-300 font-mono"
              >
                {art}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-[#121826] border border-white/5 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center space-x-2.5 text-xs font-semibold text-white">
            <FolderTree className="w-4 h-4 text-blue-400" />
            <span>Project Scan Roots</span>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-white/5 font-mono text-xs text-slate-300">
            {scanRoots.map((root) => (
              <div key={root} className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>{root}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default PurgeView;
