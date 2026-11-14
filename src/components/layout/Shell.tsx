import React from "react";
import {
  LayoutDashboard,
  Sparkles,
  PieChart,
  Layers,
  Zap,
  FolderGit2,
  Minimize2,
  History,
  Settings,
  Terminal,
  Activity,
  Info,
} from "lucide-react";
import moleIcon from "../../assets/mole.webp";
import type { NavItem, MoleInstallationInfo, MoleStatusSnapshot } from "../../types/mole";
import { TerminalDrawer } from "../terminal/TerminalDrawer";
import { ErrorBoundary } from "../common/ErrorBoundary";
import { useOperationManager } from "../../context/OperationManagerContext";

interface ShellProps {
  currentNav: NavItem;
  onNavigate: (nav: NavItem) => void;
  installation: MoleInstallationInfo | null;
  statusSnapshot: MoleStatusSnapshot | null;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({
  currentNav,
  onNavigate,
  installation,
  statusSnapshot,
  children,
}) => {
  const { activeOperation, isTerminalOpen, toggleTerminal } = useOperationManager();

  const navSections = [
    {
      title: "System",
      items: [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "clean", label: "Clean", icon: Sparkles },
        { id: "analyze", label: "Analyze", icon: PieChart },
        { id: "uninstall", label: "Uninstall", icon: Layers },
      ],
    },
    {
      title: "Maintenance",
      items: [
        { id: "optimize", label: "Optimize", icon: Zap },
        { id: "purge", label: "Purge", icon: FolderGit2 },
        { id: "slim", label: "Slim", icon: Minimize2 },
      ],
    },
    {
      title: "Utilities",
      items: [
        { id: "history", label: "History", icon: History },
        { id: "settings", label: "Settings", icon: Settings },
        { id: "about", label: "About", icon: Info },
      ],
    },
  ];

  const getPageTitle = (nav: NavItem) => {
    switch (nav) {
      case "overview":
        return { title: "System Overview", subtitle: "Real-time hardware telemetry and system health" };
      case "clean":
        return { title: "Clean System", subtitle: "Free up disk space from caches, logs, and leftovers" };
      case "analyze":
        return { title: "Disk Analyzer", subtitle: "Explore storage distribution and directory sizes" };
      case "uninstall":
        return { title: "Application Uninstaller", subtitle: "Completely remove apps and associated residue" };
      case "optimize":
        return { title: "System Optimizer", subtitle: "Refresh macOS caches, services, and system maintenance" };
      case "purge":
        return { title: "Project Purge", subtitle: "Safely clean build artifacts across development projects" };
      case "slim":
        return { title: "Universal Slim", subtitle: "Thin universal apps on Apple Silicon by removing x86 slices" };
      case "history":
        return { title: "Audit History", subtitle: "Chronological log of past Mole cleaning and deletions" };
      case "settings":
        return { title: "Settings", subtitle: "Preferences, binary path, and Touch ID authorization" };
      case "about":
        return { title: "About Mole GUI", subtitle: "Developer profile, application architecture, and system specifications" };
    }
  };

  const pageInfo = getPageTitle(currentNav);

  return (
    <div className="flex h-screen w-screen bg-[#0a0d14] text-slate-100 overflow-hidden font-sans select-none">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-[#0f1420] border-r border-white/5 z-20">
        {/* Window controls offset for overlay titlebar */}
        <div className="h-10 drag-region flex items-center px-4" />

        {/* Brand header */}
        <div className="px-5 py-2 flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center space-x-2.5">
            <img
              src={moleIcon}
              alt="Mole GUI"
              className="w-8 h-8 rounded-lg object-contain shadow-md shadow-blue-500/10 border border-white/10 p-0.5 bg-white/5"
            />
            <div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center space-x-1.5">
                <span>Mole GUI</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-blue-500/20 text-blue-300">
                  v{installation?.version || "1.70.0"}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">macOS Desktop Interface</div>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {sec.title}
              </div>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentNav === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id as NavItem)}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* CLI Binary path footer */}
        <div className="p-3 border-t border-white/5 bg-[#0d121c]">
          <div className="text-[10px] font-mono text-slate-400 truncate" title={installation?.binary_path || "Scanning..."}>
            CLI: {installation?.binary_path || "Scanning..."}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
            <span>Arch: {installation?.architecture || "arm64"}</span>
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-400">Ready</span>
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="h-14 flex items-center justify-between px-6 bg-[#0a0d14]/80 backdrop-blur border-b border-white/5 z-10 drag-region">
          <div className="no-drag">
            <h1 className="text-sm font-semibold text-slate-100">{pageInfo.title}</h1>
            <p className="text-[11px] text-slate-400">{pageInfo.subtitle}</p>
          </div>

          <div className="flex items-center space-x-3 no-drag">
            {/* Health badge in top bar */}
            {statusSnapshot && (
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-300 font-mono text-[11px]">
                  CPU {statusSnapshot.cpu.usage.toFixed(0)}% · RAM {statusSnapshot.memory.used_percent.toFixed(0)}%
                </span>
              </div>
            )}

            {/* Operation Center Toggle Pill */}
            <button
              onClick={toggleTerminal}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                activeOperation?.isRunning
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse"
                  : isTerminalOpen
                  ? "bg-blue-600/20 text-blue-300 border-blue-500/30"
                  : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>
                {activeOperation?.isRunning
                  ? `Running: ${activeOperation.commandName}`
                  : "Operation Center"}
              </span>
            </button>
          </div>
        </header>

        {/* View Content guarded with ErrorBoundary */}
        <main className="flex-1 overflow-y-auto p-6 pb-24 bg-[#0a0d14]">
          <ErrorBoundary fallbackTitle="View Display Error">
            {children}
          </ErrorBoundary>
        </main>

        {/* Bottom Floating Embedded Terminal Drawer */}
        <TerminalDrawer />
      </div>
    </div>
  );
};
export default Shell;
