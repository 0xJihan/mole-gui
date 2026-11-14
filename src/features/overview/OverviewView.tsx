import React, { useEffect, useState } from "react";
import {
  Cpu,
  HardDrive,
  Layers,
  Network,
  BatteryCharging,
  ShieldCheck,
  Server,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import type { MoleStatusSnapshot } from "../../types/mole";
import { Sparkline } from "../../components/ui/Sparkline";
import { formatBytes, formatRate } from "../../lib/format";

interface OverviewViewProps {
  snapshot: MoleStatusSnapshot | null;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ snapshot }) => {
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [memHistory, setMemHistory] = useState<number[]>([]);

  // Collect rolling 60-second historical metrics
  useEffect(() => {
    if (!snapshot) return;

    setCpuHistory((prev) => {
      const next = [...prev, snapshot.cpu.usage];
      return next.slice(-60);
    });

    setMemHistory((prev) => {
      const next = [...prev, snapshot.memory.used_percent];
      return next.slice(-60);
    });
  }, [snapshot?.collected_at]);

  if (!snapshot) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-3 text-slate-500">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
        <span className="text-xs font-mono">Connecting to Mole status stream...</span>
      </div>
    );
  }

  const primaryDisk = snapshot.disks[0] || {
    mount: "/",
    device: "disk0",
    used: 0,
    total: 1,
    used_percent: 0,
    smart_status: "unknown",
    purgeable: 0,
  };

  const primaryNet = snapshot.network?.find((n) => n.ip) || snapshot.network?.[0];
  const battery = snapshot.batteries?.[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top System Health Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Health Score */}
        <div className="bg-[#121826] border border-white/5 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              System Health
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                {snapshot.health_score ?? 99}
              </span>
              <span className="text-xs font-medium text-emerald-400">
                {snapshot.health_score_msg ?? "Excellent"}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Weighted hardware, disk & memory score
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Load Averages */}
        <div className="bg-[#121826] border border-white/5 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Load Averages
            </span>
            <div className="text-base font-bold text-white font-mono">
              {snapshot.cpu.load1.toFixed(2)} · {snapshot.cpu.load5.toFixed(2)} · {snapshot.cpu.load15.toFixed(2)}
            </div>
            <p className="text-[10px] text-slate-500">1m · 5m · 15m load</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total RAM & Active */}
        <div className="bg-[#121826] border border-white/5 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Memory Pressure
            </span>
            <div className="text-base font-bold text-cyan-300 font-mono">
              {formatBytes(snapshot.memory.used)} / {formatBytes(snapshot.memory.total)}
            </div>
            <p className="text-[10px] text-slate-500">
              {snapshot.memory.used_percent.toFixed(1)}% in active use
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Storage Available */}
        <div className="bg-[#121826] border border-white/5 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Volume Free Space
            </span>
            <div className="text-base font-bold text-emerald-400 font-mono">
              {formatBytes(primaryDisk.total - primaryDisk.used)} Free
            </div>
            <p className="text-[10px] text-slate-500">
              {formatBytes(primaryDisk.total)} APFS Capacity
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Primary Graphs Row: CPU & Memory Line Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Card */}
        <div className="bg-[#121826] border border-white/5 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">CPU Utilization</h3>
                <p className="text-[11px] text-slate-400">
                  {snapshot.hardware.cpu_model} · {snapshot.cpu.core_count ?? 10} Cores
                  {snapshot.cpu.p_core_count ? ` (${snapshot.cpu.p_core_count}P / ${snapshot.cpu.e_core_count}E)` : ""}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold font-mono text-blue-400">
                {snapshot.cpu.usage.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* 60s Historical Area Chart */}
          <div className="pt-2">
            <Sparkline data={cpuHistory} color="rgb(59, 130, 246)" height={80} maxVal={100} />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>60s ago</span>
              <span>Real-time</span>
            </div>
          </div>

          {/* Per-Core Distribution (if available) */}
          {snapshot.cpu.per_core && snapshot.cpu.per_core.length > 0 && (
            <div className="pt-3 border-t border-white/5 space-y-2">
              <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                Logical Cores Load
              </span>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                {snapshot.cpu.per_core.map((coreVal, i) => (
                  <div key={i} className="flex flex-col items-center space-y-1">
                    <div className="w-full h-12 bg-white/5 rounded overflow-hidden flex flex-col justify-end p-0.5">
                      <div
                        className="w-full bg-blue-500 rounded-sm transition-all duration-300"
                        style={{ height: `${Math.min(100, coreVal)}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-slate-500">#{i}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Memory Card */}
        <div className="bg-[#121826] border border-white/5 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Memory Distribution</h3>
                <p className="text-[11px] text-slate-400">
                  Total: {snapshot.hardware.total_ram} · Swap Used: {formatBytes(snapshot.memory.swap_used)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold font-mono text-cyan-400">
                {snapshot.memory.used_percent.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* 60s Historical Area Chart */}
          <div className="pt-2">
            <Sparkline data={memHistory} color="rgb(6, 182, 212)" height={80} maxVal={100} />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>60s ago</span>
              <span>Real-time</span>
            </div>
          </div>

          {/* Memory Details Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/5 font-mono text-xs">
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-400 block font-sans">Used</span>
              <span className="font-semibold text-slate-200">{formatBytes(snapshot.memory.used)}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-400 block font-sans">Available</span>
              <span className="font-semibold text-slate-200">{formatBytes(snapshot.memory.available)}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-400 block font-sans">Cached</span>
              <span className="font-semibold text-slate-200">
                {snapshot.memory.cached ? formatBytes(snapshot.memory.cached) : "N/A"}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-400 block font-sans">Swap Total</span>
              <span className="font-semibold text-slate-200">{formatBytes(snapshot.memory.swap_total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Row: Storage, Network, Hardware & Battery */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Storage Details Card */}
        <div className="bg-[#121826] border border-white/5 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">System Storage</h3>
              <p className="text-[11px] text-slate-400">{primaryDisk.mount} ({primaryDisk.device})</p>
            </div>
          </div>

          {/* Storage Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Used: {formatBytes(primaryDisk.used)}</span>
              <span className="text-purple-300">{primaryDisk.used_percent.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${Math.min(100, primaryDisk.used_percent)}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">APFS Purgeable:</span>
              <span className="text-slate-200">
                {primaryDisk.purgeable ? formatBytes(primaryDisk.purgeable) : "0 B"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">SMART Status:</span>
              <span className="text-emerald-400 capitalize">
                {primaryDisk.smart_status ?? "Verified"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Trash Size:</span>
              <span className="text-slate-200">
                {snapshot.trash_size ? formatBytes(snapshot.trash_size) : "0 B"}
              </span>
            </div>
          </div>
        </div>

        {/* Network & Proxy Card */}
        <div className="bg-[#121826] border border-white/5 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Network & Proxy</h3>
              <p className="text-[11px] text-slate-400">
                {primaryNet?.name || "en0"} · {primaryNet?.ip || "Disconnected"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-400 block font-sans">Download (Rx)</span>
              <span className="font-semibold text-emerald-400">
                {formatRate(primaryNet?.rx_rate_mbs ?? 0)}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-400 block font-sans">Upload (Tx)</span>
              <span className="font-semibold text-blue-400">
                {formatRate(primaryNet?.tx_rate_mbs ?? 0)}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Proxy / TUN:</span>
              <span className={snapshot.proxy?.enabled ? "text-amber-400" : "text-slate-400"}>
                {snapshot.proxy?.enabled ? `${snapshot.proxy.type} (${snapshot.proxy.host})` : "Disabled"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Active Procs:</span>
              <span className="text-slate-200">{snapshot.procs}</span>
            </div>
          </div>
        </div>

        {/* Battery & Thermal Card */}
        <div className="bg-[#121826] border border-white/5 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <BatteryCharging className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Power & Thermals</h3>
              <p className="text-[11px] text-slate-400">
                {battery ? `${battery.percent}% · ${battery.status}` : "Desktop AC Power"}
              </p>
            </div>
          </div>

          {battery && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Charge: {battery.percent}%</span>
                <span className="text-amber-400">{battery.health ?? "Normal"}</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${Math.min(100, battery.percent ?? 0)}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-white/5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Battery Temp:</span>
              <span className="text-slate-200">
                {snapshot.thermal?.battery_temp ? `${snapshot.thermal.battery_temp.toFixed(1)}°C` : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Battery Cycles:</span>
              <span className="text-slate-200">{battery?.cycle_count ?? "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Uptime:</span>
              <span className="text-slate-200">{snapshot.uptime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Active Processes & Zombie Alert */}
      <div className="bg-[#121826] border border-white/5 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Top Active Processes</h3>
              <p className="text-[11px] text-slate-400">
                Highest resource consumption snapshot
              </p>
            </div>
          </div>

          {snapshot.zombie_count && snapshot.zombie_count > 0 ? (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{snapshot.zombie_count} Zombie Processes Detected</span>
            </div>
          ) : (
            <span className="text-xs font-medium text-slate-500 font-mono">0 Zombies</span>
          )}
        </div>

        {/* Table of Processes */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-white/5">
              <tr>
                <th className="py-2 px-3">PID</th>
                <th className="py-2 px-3">Process Name</th>
                <th className="py-2 px-3 text-right">CPU %</th>
                <th className="py-2 px-3 text-right">Memory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {snapshot.top_processes?.slice(0, 5).map((proc) => (
                <tr key={proc.pid} className="hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-3 text-slate-400">{proc.pid}</td>
                  <td className="py-2.5 px-3 text-slate-200 font-sans font-medium">{proc.name}</td>
                  <td className="py-2.5 px-3 text-right text-blue-400 font-bold">{proc.cpu.toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-right text-cyan-400">
                    {proc.memory_bytes ? formatBytes(proc.memory_bytes) : `${proc.memory.toFixed(1)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
