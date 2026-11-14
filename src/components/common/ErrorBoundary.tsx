import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertOctagon, RotateCcw, Copy, Check } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleCopy = () => {
    const details = `Mole Desktop Error Diagnostic:
Error: ${this.state.error?.message}
Stack:
${this.state.error?.stack}
Component Stack:
${this.state.errorInfo?.componentStack}`;

    navigator.clipboard.writeText(details);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[280px] p-6 m-4 rounded-xl bg-[#131927] border border-rose-500/30 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-rose-400">
              <AlertOctagon className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-rose-200">
                {this.props.fallbackTitle || "An unexpected view error occurred"}
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              The application recovered safely without crashing the main process. You can reload this view or inspect the error details below.
            </p>
            <div className="p-3 bg-[#0a0e17] rounded-lg border border-white/5 font-mono text-[11px] text-rose-300/90 overflow-x-auto max-h-48 whitespace-pre-wrap select-text">
              {this.state.error?.message || "Unknown error"}
              {this.state.error?.stack && (
                <div className="mt-2 text-slate-500 text-[10px]">
                  {this.state.error.stack}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2 border-t border-white/5">
            <button
              onClick={this.handleReset}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry / Recover View</span>
            </button>
            <button
              onClick={this.handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors"
            >
              {this.state.copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Diagnostic</span>
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
