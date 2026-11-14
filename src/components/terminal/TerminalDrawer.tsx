import React, { useEffect, useRef, useState } from "react";
import type { Terminal } from "@xterm/xterm";
import {
  Terminal as TerminalIcon,
  X,
  ChevronDown,
  ChevronUp,
  Square,
  Copy,
  Trash2,
  Send,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Clock,
  CornerDownLeft,
} from "lucide-react";
import { useOperationManager } from "../../context/OperationManagerContext";
import { XTermTerminal } from "./XTermTerminal";
import { ErrorBoundary } from "../common/ErrorBoundary";

export const TerminalDrawer: React.FC = () => {
  const {
    activeOperation,
    isTerminalOpen,
    isMinimized,
    toggleTerminal,
    setIsMinimized,
    cancelCurrentOperation,
    sendInput,
    clearTerminal,
    getAllLogs,
    subscribeToOutput,
  } = useOperationManager();

  const [inputText, setInputText] = useState("");
  const [isMasked, setIsMasked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);

  const termRef = useRef<Terminal | null>(null);

  // Elapsed time tracker for running operations
  useEffect(() => {
    if (!activeOperation || !activeOperation.isRunning) {
      return;
    }
    const start = activeOperation.startTime;
    const interval = setInterval(() => {
      setElapsedSecs(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeOperation?.isRunning, activeOperation?.startTime]);

  // Hook xterm to output subscriber
  useEffect(() => {
    if (!isTerminalOpen) return;

    // Write any existing logs if terminal was re-opened
    if (termRef.current) {
      const existing = getAllLogs();
      if (existing) {
        termRef.current.clear();
        termRef.current.write(existing);
      }
    }

    const unsubscribe = subscribeToOutput((chunk) => {
      if (termRef.current) {
        termRef.current.write(chunk);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isTerminalOpen, activeOperation?.id]);

  // When expanding from minimized state, ensure terminal buffer is refreshed and fitted
  useEffect(() => {
    if (!isMinimized && isTerminalOpen && termRef.current) {
      const existing = getAllLogs();
      if (existing && termRef.current.buffer.active.length <= 1) {
        termRef.current.clear();
        termRef.current.write(existing);
      }
    }
  }, [isMinimized, isTerminalOpen]);

  if (!isTerminalOpen || !activeOperation) {
    return null;
  }

  const handleSendInput = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = inputText ? inputText + "\n" : "\r";
    await sendInput(payload);
    setInputText("");
  };

  const handleSendEnter = async () => {
    await sendInput("\r");
  };

  const handleCopyLogs = () => {
    const text = getAllLogs();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (termRef.current) {
      termRef.current.clear();
    }
    clearTerminal();
  };

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <ErrorBoundary fallbackTitle="Terminal Error">
      <div
        className={`fixed bottom-0 left-64 right-0 z-50 bg-[#0d121d] border-t border-white/10 shadow-2xl transition-all duration-200 flex flex-col ${
          isMinimized ? "h-11" : "h-80"
        }`}
      >
        {/* Terminal Header Bar */}
        <div className="h-11 px-4 flex items-center justify-between bg-[#111726] border-b border-white/5 select-none">
          <div className="flex items-center space-x-3">
            <TerminalIcon className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-slate-200">
              {activeOperation.commandName}
            </span>

            {activeOperation.isRunning ? (
              <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Running</span>
                <span className="text-amber-400/60 flex items-center space-x-0.5 ml-1">
                  <Clock className="w-2.5 h-2.5 inline" />
                  <span>{formatElapsed(elapsedSecs)}</span>
                </span>
              </span>
            ) : activeOperation.exitCode === 0 ? (
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                <span>Done</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-3 h-3" />
                <span>Exit {activeOperation.exitCode ?? -1}</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {activeOperation.isRunning && (
              <button
                onClick={cancelCurrentOperation}
                className="flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
                title="Stop process"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            )}

            <button
              onClick={handleCopyLogs}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded transition-colors relative"
              title="Copy output"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied && (
                <span className="absolute -top-7 right-0 px-2 py-0.5 text-[10px] rounded bg-blue-600 text-white whitespace-nowrap shadow-lg">
                  Copied!
                </span>
              )}
            </button>

            <button
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded transition-colors"
              title="Clear terminal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded transition-colors"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={toggleTerminal}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded transition-colors"
              title="Close panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Terminal Body - Always kept mounted in DOM to prevent losing xterm buffer */}
        <div
          className={`flex-1 flex flex-col min-h-0 bg-[#0a0e17] ${
            isMinimized ? "hidden" : ""
          }`}
        >
          {/* Embedded xterm container */}
          <div className="flex-1 min-h-0 relative">
            <XTermTerminal
              operationId={activeOperation.id}
              termRef={termRef}
            />
          </div>

          {/* Minimal interactive input bar */}
          {activeOperation.isRunning && (
            <form
              onSubmit={handleSendInput}
              className="h-10 px-3 bg-[#111726] border-t border-white/5 flex items-center space-x-2 flex-shrink-0"
            >
              <div className="flex items-center space-x-1 text-blue-400 text-xs font-mono select-none">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>❯</span>
              </div>

              <input
                type={isMasked ? "password" : "text"}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Send input / password..."
                className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-500 outline-none font-mono"
                autoComplete="off"
                spellCheck="false"
              />

              <button
                type="button"
                onClick={() => setIsMasked(!isMasked)}
                className={`p-1 rounded text-xs transition-colors ${
                  isMasked
                    ? "text-blue-400 hover:text-blue-300 bg-blue-500/10"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title={isMasked ? "Unhide password" : "Mask password"}
              >
                {isMasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={handleSendEnter}
                className="px-2 py-1 text-[11px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded transition-colors flex items-center space-x-1"
                title="Send Return key (⏎)"
              >
                <CornerDownLeft className="w-3 h-3" />
                <span>Enter</span>
              </button>

              <button
                type="submit"
                className="px-2.5 py-1 text-[11px] bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/30 rounded transition-colors flex items-center space-x-1"
              >
                <span>Send</span>
                <Send className="w-2.5 h-2.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};
export default TerminalDrawer;
