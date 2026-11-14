import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  RefreshCw,
  AppWindow,
  ShieldAlert,
  AlertTriangle,
  CheckSquare,
  Square,
  Check,
  Trash2,
  Eye,
  X,
} from "lucide-react";
import type { MoleInstalledApp } from "../../types/mole";
import { api } from "../../lib/api";
import { useOperationManager } from "../../context/OperationManagerContext";
import { usePersistentState } from "../../hooks/usePersistentState";

function parseSizeToBytes(sizeStr: string): number {
  if (!sizeStr) return 0;
  const match = sizeStr.trim().match(/^([\d.]+)\s*([KkMmGgTt]?[Bb]?)$/);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit.startsWith("T")) return val * 1024 * 1024 * 1024 * 1024;
  if (unit.startsWith("G")) return val * 1024 * 1024 * 1024;
  if (unit.startsWith("M")) return val * 1024 * 1024;
  if (unit.startsWith("K")) return val * 1024;
  return val;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export const UninstallView: React.FC = () => {
  const { startOperation } = useOperationManager();
  const [apps, setApps] = useState<MoleInstalledApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Persistent user preferences across sessions
  const [dryRun, setDryRun] = usePersistentState<boolean>("uninstall_dry_run", true);
  const [permanent, setPermanent] = usePersistentState<boolean>("uninstall_permanent", false);
  const [withData, setWithData] = usePersistentState<boolean>("uninstall_with_data", false);

  // Multi-selection state: set of unique app keys (bundle_id || path)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Modal target apps: either a single app or multiple selected apps
  const [modalApps, setModalApps] = useState<MoleInstalledApp[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchApps = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const list = await api.listInstalledApps();
      setApps(list);
    } catch (err: any) {
      setErrorMsg(err.toString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const filteredApps = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return apps;
    return apps.filter(
      (app) =>
        app.name.toLowerCase().includes(q) ||
        app.bundle_id.toLowerCase().includes(q) ||
        app.uninstall_name.toLowerCase().includes(q)
    );
  }, [apps, searchQuery]);

  // Selected apps list
  const selectedApps = useMemo(() => {
    return apps.filter((app) => selectedKeys.has(app.bundle_id || app.path));
  }, [apps, selectedKeys]);

  const totalSelectedBytes = useMemo(() => {
    return selectedApps.reduce((acc, app) => acc + parseSizeToBytes(app.size), 0);
  }, [selectedApps]);

  const toggleSelectApp = (app: MoleInstalledApp) => {
    const key = app.bundle_id || app.path;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedKeys.size >= filteredApps.length && filteredApps.length > 0) {
      // Clear selection
      setSelectedKeys(new Set());
    } else {
      // Select all visible filtered apps
      const next = new Set<string>();
      filteredApps.forEach((app) => next.add(app.bundle_id || app.path));
      setSelectedKeys(next);
    }
  };

  const openSingleAppModal = (app: MoleInstalledApp) => {
    setModalApps([app]);
    setIsModalOpen(true);
  };

  const openBatchModal = () => {
    if (selectedApps.length === 0) return;
    setModalApps(selectedApps);
    setIsModalOpen(true);
  };

  const handleConfirmUninstall = async () => {
    if (modalApps.length === 0) return;
    setIsModalOpen(false);
    try {
      const opName = dryRun
        ? modalApps.length === 1
          ? `Uninstall Preview: ${modalApps[0].name}`
          : `Uninstall Preview (${modalApps.length} apps)`
        : modalApps.length === 1
          ? `Uninstall: ${modalApps[0].name}`
          : `Uninstall (${modalApps.length} apps)`;

      const targets = modalApps.map((a) => a.uninstall_name);
      // Clear multi-selection after launching
      setSelectedKeys(new Set());

      await startOperation(opName, () =>
        api.runUninstall(targets, dryRun, permanent, withData)
      );
    } catch (err: any) {
      setErrorMsg(err.toString());
    }
  };

  const isAllFilteredSelected =
    filteredApps.length > 0 && selectedKeys.size >= filteredApps.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Search & Global Options Header */}
      <div className="bg-[#121826] border border-white/5 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="flex-1 flex items-center space-x-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search applications by name or bundle ID..."
              className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-500 font-sans outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAll}
              disabled={filteredApps.length === 0}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs border border-white/10 transition-colors disabled:opacity-40"
            >
              {isAllFilteredSelected ? (
                <>
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                  <span>Select All</span>
                </>
              )}
            </button>

            <button
              onClick={fetchApps}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs border border-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Option toggles (persisted across sessions) */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-white/5 text-xs text-slate-300">
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="rounded bg-white/10 border-white/20 text-blue-600 focus:ring-0"
            />
            <span>Preview Only</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={withData}
              onChange={(e) => setWithData(e.target.checked)}
              className="rounded bg-white/10 border-white/20 text-blue-600 focus:ring-0"
            />
            <span>Include Application Data & Cache</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer select-none text-rose-300">
            <input
              type="checkbox"
              checked={permanent}
              onChange={(e) => setPermanent(e.target.checked)}
              className="rounded bg-white/10 border-white/20 text-rose-600 focus:ring-0"
            />
            <span>Permanent Deletion</span>
          </label>
        </div>

        {errorMsg && (
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Grid Subheader */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          {filteredApps.length} {filteredApps.length === 1 ? "Application" : "Applications"}
          {selectedKeys.size > 0 && (
            <span className="ml-2 text-blue-400 font-medium">
              ({selectedKeys.size} selected)
            </span>
          )}
        </span>
        <span className="text-[10px] uppercase font-mono text-slate-500">
          {dryRun ? "Preview Mode" : "Live Uninstall Mode"}
        </span>
      </div>

      {/* Applications Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 font-mono bg-[#121826] border border-white/5 rounded-xl">
          <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-blue-500" />
          <span>Scanning installed applications...</span>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="py-12 text-center text-slate-500 italic bg-[#121826] border border-white/5 rounded-xl">
          No applications match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredApps.map((app) => {
            const isSelected = selectedKeys.has(app.bundle_id || app.path);
            return (
              <div
                key={app.bundle_id || app.path}
                className={`border rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all ${
                  isSelected
                    ? "bg-blue-600/10 border-blue-500/40 ring-1 ring-blue-500/30"
                    : "bg-[#121826] border-white/5 hover:border-white/15"
                }`}
              >
                {/* Top Section: Checkbox, Icon, App Name & Bundle ID */}
                <div className="flex items-start space-x-3">
                  {/* Select Checkbox */}
                  <button
                    onClick={() => toggleSelectApp(app)}
                    className={`mt-1 w-4 h-4 rounded flex items-center justify-center transition-colors flex-shrink-0 ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "border border-white/20 bg-white/5 hover:border-white/40"
                    }`}
                    title={isSelected ? "Deselect" : "Select for batch"}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  {/* App Icon */}
                  <div
                    onClick={() => toggleSelectApp(app)}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1 flex-shrink-0 shadow-sm cursor-pointer"
                  >
                    {app.icon_base64 ? (
                      <img
                        src={`data:image/png;base64,${app.icon_base64}`}
                        alt={app.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <AppWindow className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  {/* App Details */}
                  <div
                    onClick={() => toggleSelectApp(app)}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="font-semibold text-xs text-white truncate" title={app.name}>
                      {app.name}
                    </div>
                    <div
                      className="text-[10px] text-slate-400 font-mono truncate"
                      title={app.bundle_id}
                    >
                      {app.bundle_id}
                    </div>
                    <div className="flex items-center space-x-2 mt-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono border bg-white/5 border-white/10 text-slate-300">
                        {app.source}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-cyan-300">
                        {app.size}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Path display */}
                <div
                  className="text-[10px] text-slate-500 font-mono truncate px-0.5"
                  title={app.path}
                >
                  {app.path}
                </div>

                {/* Responsive Card Action Footer */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-end">
                  <button
                    onClick={() => openSingleAppModal(app)}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium transition-colors text-center ${
                      dryRun
                        ? "bg-white/5 hover:bg-white/10 text-blue-300 border border-blue-500/20"
                        : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25"
                    }`}
                  >
                    {dryRun ? "Preview Cleanup" : "Uninstall"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Batch Action Bar */}
      {selectedApps.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#121826]/95 backdrop-blur-md border border-blue-500/30 shadow-2xl rounded-2xl px-5 py-3 flex items-center space-x-4 max-w-xl w-[90%] justify-between transition-all">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
            <div className="text-xs text-white truncate">
              <span className="font-semibold">{selectedApps.length}</span>{" "}
              {selectedApps.length === 1 ? "app" : "apps"} selected
              {totalSelectedBytes > 0 && (
                <span className="text-slate-400 font-mono ml-1.5">
                  • {formatBytes(totalSelectedBytes)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => setSelectedKeys(new Set())}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              Clear
            </button>
            <button
              onClick={openBatchModal}
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-medium text-white shadow-md transition-all ${
                dryRun
                  ? "bg-blue-600 hover:bg-blue-500 shadow-blue-600/30"
                  : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
              }`}
            >
              {dryRun ? <Eye className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>
                {dryRun
                  ? `Preview (${selectedApps.length})`
                  : `Uninstall (${selectedApps.length})`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isModalOpen && modalApps.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121826] border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-white">
                <div
                  className={`p-2 rounded-xl ${
                    dryRun ? "bg-blue-500/10 text-blue-400" : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {dryRun ? <Eye className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-semibold">
                    Confirm {dryRun ? "Preview Scan" : "Uninstallation"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {modalApps.length} {modalApps.length === 1 ? "application" : "applications"}{" "}
                    targeted
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / App List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-52">
              {modalApps.map((app) => (
                <div
                  key={app.bundle_id || app.path}
                  className="flex items-center space-x-3 p-2.5 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center p-1 flex-shrink-0">
                    {app.icon_base64 ? (
                      <img
                        src={`data:image/png;base64,${app.icon_base64}`}
                        alt={app.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <AppWindow className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-white truncate">{app.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {app.bundle_id}
                    </div>
                  </div>
                  <div className="text-xs font-mono text-cyan-300 font-medium flex-shrink-0">
                    {app.size}
                  </div>
                </div>
              ))}
            </div>

            {/* Options review inside modal (persisted) */}
            <div className="pt-2 border-t border-white/5 space-y-2 text-xs text-slate-300">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="rounded bg-white/10 border-white/20 text-blue-600 focus:ring-0"
                />
                <span>Preview mode (inspect residue without deleting files)</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={withData}
                  onChange={(e) => setWithData(e.target.checked)}
                  className="rounded bg-white/10 border-white/20 text-blue-600 focus:ring-0"
                />
                <span>Include application cache and data residue</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer select-none text-rose-300">
                <input
                  type="checkbox"
                  checked={permanent}
                  onChange={(e) => setPermanent(e.target.checked)}
                  className="rounded bg-white/10 border-white/20 text-rose-600 focus:ring-0"
                />
                <span>Permanent deletion without moving to Trash</span>
              </label>
            </div>

            {/* Summary Note */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-400 leading-relaxed">
              {dryRun ? (
                <>
                  Mole CLI will execute a non-destructive preview analysis to show all installed files,
                  associated caches, and application support directories.
                </>
              ) : permanent ? (
                <span className="text-rose-300 font-medium">
                  Warning: Targeted applications and all associated data will be permanently deleted
                  immediately.
                </span>
              ) : (
                <>
                  Targeted applications and their residue will be safely moved to the macOS Trash.
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUninstall}
                className={`px-5 py-2 text-xs font-medium rounded-xl text-white shadow-md transition-all ${
                  dryRun
                    ? "bg-blue-600 hover:bg-blue-500 shadow-blue-600/30"
                    : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                }`}
              >
                {dryRun
                  ? `Start Preview (${modalApps.length})`
                  : `Confirm Uninstall (${modalApps.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UninstallView;
