import React, { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { api } from "../../lib/api";
import { useOperationManager } from "../../context/OperationManagerContext";

interface XTermTerminalProps {
  operationId?: string | null;
  onData?: (data: string) => void;
  termRef?: React.MutableRefObject<Terminal | null>;
}

export const XTermTerminal: React.FC<XTermTerminalProps> = ({
  operationId,
  onData,
  termRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { getAllLogs } = useOperationManager();

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize xterm
    const term = new Terminal({
      fontFamily: '"SF Mono", "Menlo", "Monaco", "Consolas", "Courier New", monospace',
      fontSize: 12,
      lineHeight: 1.25,
      cursorBlink: true,
      scrollback: 10000,
      convertEol: true,
      theme: {
        background: "#0a0e17",
        foreground: "#e2e8f0",
        cursor: "#38bdf8",
        selectionBackground: "rgba(56, 189, 248, 0.35)",
        black: "#1e293b",
        red: "#f87171",
        green: "#4ade80",
        yellow: "#facc15",
        blue: "#60a5fa",
        magenta: "#c084fc",
        cyan: "#38bdf8",
        white: "#f8fafc",
        brightBlack: "#475569",
        brightRed: "#ef4444",
        brightGreen: "#22c55e",
        brightYellow: "#eab308",
        brightBlue: "#3b82f6",
        brightMagenta: "#a855f7",
        brightCyan: "#06b6d4",
        brightWhite: "#ffffff",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(containerRef.current);
    terminalInstanceRef.current = term;
    fitAddonRef.current = fitAddon;

    if (termRef) {
      termRef.current = term;
    }

    // Write any existing logs immediately on mount to prevent blank display
    const existingLogs = getAllLogs();
    if (existingLogs) {
      term.write(existingLogs);
    }

    // Initial fit
    requestAnimationFrame(() => {
      try {
        fitAddon.fit();
        if (operationId) {
          api.resizePty(operationId, term.cols, term.rows).catch(() => {});
        }
      } catch (err) {
        console.warn("xterm fit error on mount:", err);
      }
    });

    // Handle user keystrokes in xterm
    const disposable = term.onData((data) => {
      if (onData) {
        onData(data);
      } else if (operationId) {
        api.sendOperationInput(operationId, data).catch((err) => {
          console.warn("Failed to send key to PTY:", err);
        });
      }
    });

    // Resize observer to keep xterm fitted to parent container
    const resizeObserver = new ResizeObserver(() => {
      try {
        if (!containerRef.current) return;
        fitAddon.fit();
        if (operationId) {
          api.resizePty(operationId, term.cols, term.rows).catch(() => {});
        }
      } catch (err) {
        console.warn("xterm fit error on resize:", err);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      disposable.dispose();
      resizeObserver.disconnect();
      term.dispose();
      terminalInstanceRef.current = null;
      fitAddonRef.current = null;
      if (termRef) {
        termRef.current = null;
      }
    };
  }, []);

  // Update PTY size when operationId changes
  useEffect(() => {
    if (operationId && terminalInstanceRef.current && fitAddonRef.current) {
      try {
        fitAddonRef.current.fit();
        api.resizePty(
          operationId,
          terminalInstanceRef.current.cols,
          terminalInstanceRef.current.rows
        ).catch(() => {});
      } catch {}
    }
  }, [operationId]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full p-2 bg-[#0a0e17] overflow-hidden select-text"
      style={{ outline: "none" }}
    />
  );
};
export default XTermTerminal;
