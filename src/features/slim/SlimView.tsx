import React, { useState } from "react";
import {
  Minimize2,
  Cpu,
  Eye,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { api } from "../../lib/api";
import { useOperationManager } from "../../context/OperationManagerContext";
import { usePersistentState } from "../../hooks/usePersistentState";

interface SlimViewProps {
  isAppleSilicon: boolean;
}

export const SlimView: React.FC<SlimViewProps> = ({ isAppleSilicon }) => {
  const { startOperation } = useOperationManager();
  const [dryRun, setDryRun] = usePersistentState<boolean>("slim_dry_run", true);
  const [isLaunching, setIsLaunching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRunSlim = async () => {
    setIsLaunching(true);
    setErrorMsg(null);
    try {
      const opName = dryRun ? "Slim (Preview)" : "Slim (Live)";
      await startOperation(opName, () => api.runSlim(dryRun));
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
            <h2 className="text-sm font-semibold text-white">Universal Binary Thinning</h2>
            <p className="text-xs text-slate-400">
              Strip unused Intel (x86_64) slices from Universal 2 binaries on Apple Silicon to save storage.
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
                !dryRun ? "bg-cyan-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Live Slim</span>
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
            onClick={handleRunSlim}
            disabled={isLaunching}
            className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-medium text-white shadow-lg transition-all disabled:opacity-50 ${
              dryRun
                ? "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
                : "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>{isLaunching ? "Starting..." : dryRun ? "Run Slim Preview" : "Start Binary Thinning"}</span>
          </button>
        </div>
      </div>

      {/* Safety & Architecture info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#121826] border border-white/5 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center space-x-2.5 text-xs font-semibold text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Safety Invariants</span>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-white/5 text-xs text-slate-300">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>Skips SIP-protected and Apple-signed system applications</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>Skips App Store DRM-sealed receipts</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>Original binaries backed up to Trash</span>
            </div>
          </div>
        </div>

        <div className="bg-[#121826] border border-white/5 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center space-x-2.5 text-xs font-semibold text-white">
            <Info className="w-4 h-4 text-blue-400" />
            <span>Platform Support ({isAppleSilicon ? "Apple Silicon" : "Intel Host"})</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-white/5">
            Universal binary thinning is optimized for Apple Silicon (M-series) Macs running macOS Sonoma 14+.
          </p>
        </div>
      </div>
    </div>
  );
};
export default SlimView;
