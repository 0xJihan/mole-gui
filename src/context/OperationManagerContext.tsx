import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "../lib/api";
import type { OperationEventPayload } from "../types/mole";

export interface ActiveOperation {
  id: string;
  commandName: string;
  isRunning: boolean;
  exitCode: number | null;
  startTime: number;
  endTime: number | null;
}

interface OperationManagerContextValue {
  activeOperation: ActiveOperation | null;
  isTerminalOpen: boolean;
  isMinimized: boolean;
  hasActiveProcess: boolean;
  startOperation: (
    commandName: string,
    runner: () => Promise<string>
  ) => Promise<string>;
  cancelCurrentOperation: () => Promise<void>;
  sendInput: (text: string) => Promise<void>;
  toggleTerminal: () => void;
  setTerminalOpen: (open: boolean) => void;
  setIsMinimized: (minimized: boolean) => void;
  clearTerminal: () => void;
  getAllLogs: () => string;
  subscribeToOutput: (callback: (chunk: string) => void) => () => void;
}

const OperationManagerContext = createContext<OperationManagerContextValue | null>(null);

export const OperationManagerProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeOperation, setActiveOperation] = useState<ActiveOperation | null>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Buffer of all logs for the current operation
  const logBufferRef = useRef<string[]>([]);
  // Sliding window to detect interactive CLI prompts
  const recentWindowRef = useRef<string>("");
  // Set of active listeners subscribed to live chunks
  const subscribersRef = useRef<Set<(chunk: string) => void>>(new Set());
  // Flag to ensure auto-enter runs only once per prompt
  const autoEnterTriggeredRef = useRef(false);

  const activeOpRef = useRef<ActiveOperation | null>(null);
  activeOpRef.current = activeOperation;

  const subscribeToOutput = (callback: (chunk: string) => void) => {
    subscribersRef.current.add(callback);
    return () => {
      subscribersRef.current.delete(callback);
    };
  };

  const notifySubscribers = (chunk: string) => {
    subscribersRef.current.forEach((cb) => {
      try {
        cb(chunk);
      } catch (err) {
        console.warn("Error delivering output chunk to subscriber:", err);
      }
    });
  };

  const sendInputDirect = async (text: string) => {
    if (activeOpRef.current && activeOpRef.current.isRunning) {
      try {
        await api.sendOperationInput(activeOpRef.current.id, text);
      } catch (err) {
        console.error("Failed to send input to operation:", err);
      }
    }
  };

  useEffect(() => {
    // 1. Listen for op-started
    const unlistenStarted = api.onOperationStarted((payload: OperationEventPayload) => {
      const banner = `\r\n\x1b[1;36m▶ ${payload.command_name}\x1b[0m\r\n`;
      logBufferRef.current.push(banner);
      notifySubscribers(banner);

      if (payload.data) {
        logBufferRef.current.push(payload.data);
        notifySubscribers(payload.data);
      }

      setActiveOperation({
        id: payload.operation_id,
        commandName: payload.command_name,
        isRunning: true,
        exitCode: null,
        startTime: payload.timestamp,
        endTime: null,
      });
      setIsTerminalOpen(true);
      setIsMinimized(false);
      autoEnterTriggeredRef.current = false;
    });

    // 2. Listen for op-output (raw PTY chunks)
    const unlistenOutput = api.onOperationOutput((payload: OperationEventPayload) => {
      if (payload.data) {
        const chunk = payload.data;
        logBufferRef.current.push(chunk);
        notifySubscribers(chunk);

        // Update sliding window
        recentWindowRef.current = (recentWindowRef.current + chunk).slice(-1000);

        // Automatic seamless confirmation when Mole clean prompts for Enter
        if (
          !autoEnterTriggeredRef.current &&
          /System caches need sudo.*Enter.*continue.*Space.*skip/i.test(recentWindowRef.current)
        ) {
          autoEnterTriggeredRef.current = true;
          sendInputDirect("\r");
        }
      }
    });

    // 3. Listen for op-exit
    const unlistenExit = api.onOperationExit((payload: OperationEventPayload) => {
      const exitBanner =
        payload.exit_code === 0
          ? `\r\n\x1b[1;32m✔ Completed successfully (exit code 0).\x1b[0m\r\n`
          : `\r\n\x1b[1;31m✖ Exited with code ${payload.exit_code ?? -1}.\x1b[0m\r\n`;

      logBufferRef.current.push(exitBanner);
      notifySubscribers(exitBanner);

      setActiveOperation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          isRunning: false,
          exitCode: payload.exit_code ?? -1,
          endTime: payload.timestamp,
        };
      });
    });

    return () => {
      unlistenStarted.then((f) => f());
      unlistenOutput.then((f) => f());
      unlistenExit.then((f) => f());
    };
  }, []);

  const startOperation = async (
    commandName: string,
    runner: () => Promise<string>
  ): Promise<string> => {
    // If a previous operation is still marked running, cancel it cleanly
    if (activeOpRef.current && activeOpRef.current.isRunning) {
      try {
        await api.cancelOperation(activeOpRef.current.id);
      } catch {}
    }

    // Reset buffer for new session
    logBufferRef.current = [];
    recentWindowRef.current = "";
    autoEnterTriggeredRef.current = false;
    setIsTerminalOpen(true);
    setIsMinimized(false);

    try {
      const opId = await runner();
      setActiveOperation({
        id: opId,
        commandName,
        isRunning: true,
        exitCode: null,
        startTime: Date.now(),
        endTime: null,
      });
      return opId;
    } catch (err: any) {
      const errMsg = `\r\n\x1b[1;31mError starting ${commandName}: ${err?.message || err}\x1b[0m\r\n`;
      logBufferRef.current.push(errMsg);
      notifySubscribers(errMsg);
      throw err;
    }
  };

  const cancelCurrentOperation = async () => {
    if (activeOperation && activeOperation.isRunning) {
      try {
        await api.cancelOperation(activeOperation.id);
      } catch (err) {
        console.error("Failed to cancel operation:", err);
      }
    }
  };

  const sendInput = async (text: string) => {
    await sendInputDirect(text);
  };

  const clearTerminal = () => {
    logBufferRef.current = [];
    recentWindowRef.current = "";
    notifySubscribers("\x1bc");
  };

  const getAllLogs = (): string => {
    return logBufferRef.current.join("");
  };

  const toggleTerminal = () => {
    setIsTerminalOpen((prev) => !prev);
  };

  const setTerminalOpen = (open: boolean) => {
    setIsTerminalOpen(open);
  };

  return (
    <OperationManagerContext.Provider
      value={{
        activeOperation,
        isTerminalOpen,
        isMinimized,
        hasActiveProcess: !!activeOperation?.isRunning,
        startOperation,
        cancelCurrentOperation,
        sendInput,
        toggleTerminal,
        setTerminalOpen,
        setIsMinimized,
        clearTerminal,
        getAllLogs,
        subscribeToOutput,
      }}
    >
      {children}
    </OperationManagerContext.Provider>
  );
};

export const useOperationManager = (): OperationManagerContextValue => {
  const context = useContext(OperationManagerContext);
  if (!context) {
    throw new Error(
      "useOperationManager must be used within an OperationManagerProvider"
    );
  }
  return context;
};
