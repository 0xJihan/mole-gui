import React from "react";
import {
  Globe,
  MessageCircle,
  Heart,
  ExternalLink,
  Cpu,
  Terminal,
  CheckCircle2,
} from "lucide-react";
import moleIcon from "../../assets/mole.webp";
import type { MoleInstallationInfo } from "../../types/mole";
import { openUrl } from "@tauri-apps/plugin-opener";

interface AboutViewProps {
  installation: MoleInstallationInfo | null;
}

const GithubIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

export const AboutView: React.FC<AboutViewProps> = ({ installation }) => {
  const handleOpenLink = async (url: string) => {
    try {
      await openUrl(url);
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Hero Card */}
      <div className="bg-[#121826] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
        <img
          src={moleIcon}
          alt="Mole GUI"
          className="w-24 h-24 rounded-2xl object-contain shadow-2xl shadow-blue-500/10 border border-white/10 p-1 bg-white/5 flex-shrink-0"
        />

        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Mole GUI</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Native macOS Graphical Interface for the original Mole CLI
              </p>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                v1.70.0
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Production Ready</span>
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Mole GUI is a high-performance desktop wrapper built with Tauri 2, Rust, and React.
            It interacts directly with the real Mole maintenance engine to provide deep cleaning,
            disk analysis, batch uninstallation, system optimization, project purging, and real-time
            hardware telemetry—with zero simulated operations.
          </p>

          {/* Primary Action / Support Button */}
          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <button
              onClick={() => handleOpenLink("https://supportkori.com/0xjihan")}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Support Developer</span>
            </button>

            <button
              onClick={() => handleOpenLink("https://github.com/0xJihan/Mole-GUI")}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-medium text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              <GithubIcon className="w-4 h-4" />
              <span>GitHub Repository</span>
            </button>
          </div>
        </div>
      </div>

      {/* Developer Card */}
      <div className="bg-[#121826] border border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Developer</h3>
            <p className="text-xs text-slate-400">Created with care by Jihan Khan</p>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Dhaka, Bangladesh</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* GitHub */}
          <button
            onClick={() => handleOpenLink("https://github.com/0xJihan")}
            className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-white/5 text-slate-300 group-hover:text-white">
                <GithubIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-white">GitHub</div>
                <div className="text-[11px] text-slate-400 font-mono">@0xJihan</div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
          </button>

          {/* Portfolio Website */}
          <button
            onClick={() => handleOpenLink("https://jihankhan.netlify.app")}
            className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:text-blue-300">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-white">Portfolio</div>
                <div className="text-[11px] text-slate-400 font-mono">jihankhan.netlify.app</div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
          </button>

          {/* WhatsApp */}
          <button
            onClick={() => handleOpenLink("https://wa.me/8801977023287")}
            className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:text-emerald-300">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-white">WhatsApp</div>
                <div className="text-[11px] text-slate-400 font-mono">+880 1977 023287</div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
          </button>
        </div>
      </div>

      {/* System & Architecture Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Architecture Spec */}
        <div className="bg-[#121826] border border-white/5 rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-white text-xs font-semibold">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>Application Architecture</span>
          </div>
          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-500 font-sans">Framework:</span>
              <span>Tauri 2 + Rust 2024</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-500 font-sans">Frontend:</span>
              <span>React 19 + TypeScript + Tailwind</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-500 font-sans">Package Identifier:</span>
              <span>com.jihan.mole</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-500 font-sans">Architecture:</span>
              <span>{installation?.architecture || "Apple Silicon (arm64)"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-sans">macOS Version:</span>
              <span>{installation?.macos_version || "macOS Sequoia"}</span>
            </div>
          </div>
        </div>

        {/* Engine Attribution */}
        <div className="bg-[#121826] border border-white/5 rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-white text-xs font-semibold">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Upstream Maintenance Engine</span>
          </div>
          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-500 font-sans">Original CLI:</span>
              <button
                onClick={() => handleOpenLink("https://github.com/tw93/Mole")}
                className="text-blue-400 hover:underline flex items-center space-x-1"
              >
                <span>tw93/Mole</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-500 font-sans">CLI Version:</span>
              <span>{installation?.version ? `v${installation.version}` : "v1.70.0"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-500 font-sans">CLI Binary:</span>
              <span className="truncate max-w-[180px]" title={installation?.binary_path || ""}>
                {installation?.binary_path || "/opt/homebrew/bin/mole"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-sans">Operation Policy:</span>
              <span className="text-emerald-400 font-sans">100% Real CLI Execution</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutView;
