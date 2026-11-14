import React, { useEffect, useState } from "react";
import {
  Folder,
  File,
  Search,
  RefreshCw,
  FolderOpen,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import type { MoleAnalyzeResult } from "../../types/mole";
import { api } from "../../lib/api";
import { formatBytes } from "../../lib/format";

export const AnalyzeView: React.FC = () => {
  const [currentPath, setCurrentPath] = useState("~");
  const [result, setResult] = useState<MoleAnalyzeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const presets = [
    { label: "Home (~)", path: "~" },
    { label: "Library (~/Library)", path: "~/Library" },
    { label: "Downloads", path: "~/Downloads" },
    { label: "Applications", path: "/Applications" },
  ];

  const handleScan = async (targetPath: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.analyzeDisk(targetPath === "~" ? undefined : targetPath);
      setResult(data);
      setCurrentPath(data.path);
    } catch (err: any) {
      setErrorMsg(err.toString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleScan("~");
  }, []);

  const sortedEntries = result?.entries
    ? [...result.entries].sort((a, b) => b.size - a.size)
    : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Path selector & Preset buttons card */}
      <div className="bg-[#121826] border border-white/5 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Path input */}
          <div className="flex-1 flex items-center space-x-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
            <FolderOpen className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={currentPath}
              onChange={(e) => setCurrentPath(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan(currentPath)}
              placeholder="Enter directory path (e.g. ~/Library or /Volumes/Data)"
              className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-500 font-mono outline-none"
            />
          </div>

          <button
            onClick={() => handleScan(currentPath)}
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>{loading ? "Scanning..." : "Scan Directory"}</span>
          </button>
        </div>

        {/* Preset shortcut buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mr-1">
            Presets:
          </span>
          {presets.map((p) => (
            <button
              key={p.path}
              onClick={() => {
                setCurrentPath(p.path);
                handleScan(p.path);
              }}
              className="px-2.5 py-1 text-[11px] font-mono rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Results Header Card */}
      {result && (
        <div className="bg-[#121826] border border-white/5 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Target Directory
              </span>
              <h3 className="text-sm font-semibold font-mono text-white truncate max-w-xl">
                {result.path}
              </h3>
            </div>
            <div className="flex items-center space-x-4 font-mono text-xs">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-sans">Total Size</span>
                <span className="text-sm font-bold text-cyan-400">{formatBytes(result.total_size)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-sans">Files Scanned</span>
                <span className="text-sm font-bold text-slate-200">{result.total_files}</span>
              </div>
            </div>
          </div>

          {/* Directory Entries Table */}
          <div className="overflow-x-auto pt-2 border-t border-white/5">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-white/5">
                <tr>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Size</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedEntries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                      No files or directories found in this path.
                    </td>
                  </tr>
                ) : (
                  sortedEntries.map((entry) => (
                    <tr
                      key={entry.path}
                      className="hover:bg-white/5 transition-colors group cursor-pointer"
                      onClick={() => {
                        if (entry.is_dir) {
                          setCurrentPath(entry.path);
                          handleScan(entry.path);
                        }
                      }}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-2">
                          {entry.is_dir ? (
                            <Folder className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          ) : (
                            <File className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          )}
                          <span className="text-slate-200 font-sans font-medium group-hover:text-blue-300 transition-colors">
                            {entry.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {entry.is_dir ? "Folder" : "File"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-cyan-300 font-bold">
                        {formatBytes(entry.size)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {entry.is_dir && (
                          <span className="text-[11px] text-blue-400 group-hover:translate-x-0.5 inline-flex items-center space-x-0.5 transition-transform">
                            <span>Open</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
