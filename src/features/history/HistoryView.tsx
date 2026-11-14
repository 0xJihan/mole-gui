import React, { useEffect, useState } from "react";
import {
  Search,
  Download,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import type { MoleHistoryResponse } from "../../types/mole";
import { api } from "../../lib/api";

export const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<MoleHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"sessions" | "deletions">("sessions");
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getHistory(100);
      setHistory(data);
    } catch (err: any) {
      setErrorMsg(err.toString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleExportJson = () => {
    if (!history) return;
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mole-audit-history-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSessions = history?.sessions?.filter((s) =>
    s.command.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredDeletions = history?.deletions?.filter((d) =>
    d.path.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header card with tab selection & export */}
      <div className="bg-[#121826] border border-white/5 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center p-1 bg-white/5 border border-white/5 rounded-lg">
            <button
              onClick={() => setActiveTab("sessions")}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "sessions"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Operation Sessions ({history?.sessions?.length ?? 0})
            </button>
            <button
              onClick={() => setActiveTab("deletions")}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "deletions"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Deletion Audit Log ({history?.deletions?.length ?? 0})
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={handleExportJson}
              disabled={!history}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "sessions"
                ? "Filter sessions by command name..."
                : "Search deletions by file path..."
            }
            className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-500 font-mono outline-none"
          />
        </div>

        {errorMsg && (
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Content Tables */}
      <div className="bg-[#121826] border border-white/5 rounded-xl p-5 shadow-sm">
        {activeTab === "sessions" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-white/5">
                <tr>
                  <th className="py-2.5 px-3">Command</th>
                  <th className="py-2.5 px-3">Started At</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3">Size Reclaimed</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Loading session history...
                    </td>
                  </tr>
                ) : filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                      No matching operation sessions found.
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono border ${
                            session.command.includes("dry-run")
                              ? "bg-blue-500/10 text-blue-300 border-blue-500/20"
                              : session.command.includes("clean")
                              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                              : "bg-purple-500/10 text-purple-300 border-purple-500/20"
                          }`}
                        >
                          {session.command}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{session.started_at}</td>
                      <td className="py-3 px-3 text-slate-400">{session.items ?? 0} items</td>
                      <td className="py-3 px-3 font-bold text-cyan-300">{session.size ?? "0B"}</td>
                      <td className="py-3 px-3 text-right text-[11px] text-slate-400">
                        {session.actions?.removed ? `${session.actions.removed} removed ` : ""}
                        {session.actions?.trashed ? `${session.actions.trashed} trashed ` : ""}
                        {session.actions?.skipped ? `${session.actions.skipped} skipped ` : ""}
                        {session.actions?.failed ? `${session.actions.failed} failed ` : ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-white/5">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3">Path</th>
                  <th className="py-2.5 px-3 text-right">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      Loading deletion log...
                    </td>
                  </tr>
                ) : filteredDeletions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                      No deletion audit records found.
                    </td>
                  </tr>
                ) : (
                  filteredDeletions.map((del, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400">{del.timestamp}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-mono border ${
                            del.mode === "trash"
                              ? "bg-blue-500/10 text-blue-300 border-blue-500/20"
                              : "bg-rose-500/10 text-rose-300 border-rose-500/20"
                          }`}
                        >
                          {del.mode ?? "trash"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-200 truncate max-w-md" title={del.path}>
                        {del.path}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-cyan-300">
                        {del.size_kb ? `${(del.size_kb / 1024).toFixed(1)} MB` : "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
