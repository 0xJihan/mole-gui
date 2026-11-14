import { useEffect, useState } from "react";
import { Shell } from "./components/layout/Shell";
import { OnboardingView } from "./features/onboarding/OnboardingView";
import { OverviewView } from "./features/overview/OverviewView";
import { CleanView } from "./features/clean/CleanView";
import { AnalyzeView } from "./features/analyze/AnalyzeView";
import { UninstallView } from "./features/uninstall/UninstallView";
import { OptimizeView } from "./features/optimize/OptimizeView";
import { PurgeView } from "./features/purge/PurgeView";
import { SlimView } from "./features/slim/SlimView";
import { HistoryView } from "./features/history/HistoryView";
import { SettingsView } from "./features/settings/SettingsView";
import { AboutView } from "./features/about/AboutView";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { OperationManagerProvider } from "./context/OperationManagerContext";
import type { NavItem, MoleInstallationInfo, MoleStatusSnapshot } from "./types/mole";
import { api } from "./lib/api";
import "./App.css";

function AppContent() {
  const [installation, setInstallation] = useState<MoleInstallationInfo | null>(null);
  const [statusSnapshot, setStatusSnapshot] = useState<MoleStatusSnapshot | null>(null);
  const [currentNav, setCurrentNav] = useState<NavItem>("overview");
  const [initializing, setInitializing] = useState(true);

  const checkInstallation = async (customPath?: string) => {
    try {
      const info = await api.detectMole(customPath);
      setInstallation(info);
      if (info.is_installed) {
        await api.startStatusPolling();
      }
    } catch (err) {
      console.error("Discovery error:", err);
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    checkInstallation();

    // Listen for real-time telemetry updates (decoupled from terminal output)
    const unlistenStatus = api.onStatusUpdate((snapshot) => {
      setStatusSnapshot(snapshot);
    });

    return () => {
      unlistenStatus.then((f) => f());
    };
  }, []);

  if (initializing) {
    return (
      <div className="h-screen w-screen bg-[#0a0d14] flex flex-col items-center justify-center space-y-3 text-slate-400 font-sans select-none">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
        <span className="text-xs font-mono text-slate-300">Initializing Mole Desktop...</span>
      </div>
    );
  }

  // Missing CLI: Show Onboarding
  if (installation && !installation.is_installed) {
    return (
      <OnboardingView
        installation={installation}
        onRefreshDetection={() => checkInstallation()}
        onSuccess={(info) => {
          setInstallation(info);
          api.startStatusPolling();
        }}
      />
    );
  }

  return (
    <Shell
      currentNav={currentNav}
      onNavigate={setCurrentNav}
      installation={installation}
      statusSnapshot={statusSnapshot}
    >
      {currentNav === "overview" && <OverviewView snapshot={statusSnapshot} />}
      {currentNav === "clean" && <CleanView />}
      {currentNav === "analyze" && <AnalyzeView />}
      {currentNav === "uninstall" && <UninstallView />}
      {currentNav === "optimize" && <OptimizeView />}
      {currentNav === "purge" && <PurgeView />}
      {currentNav === "slim" && (
        <SlimView isAppleSilicon={installation?.architecture === "arm64"} />
      )}
      {currentNav === "history" && <HistoryView />}
      {currentNav === "settings" && (
        <SettingsView
          installation={installation}
          onRefreshInstallation={() => checkInstallation()}
        />
      )}
      {currentNav === "about" && <AboutView installation={installation} />}
    </Shell>
  );
}

export function App() {
  return (
    <ErrorBoundary fallbackTitle="Application Error">
      <OperationManagerProvider>
        <AppContent />
      </OperationManagerProvider>
    </ErrorBoundary>
  );
}

export default App;
