import React from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    const errorId = `err_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught technical component error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorId: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorId: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
            <AlertTriangle size={28} />
          </div>
          <h2 className="mt-5 text-lg font-bold text-slate-900">
            Something went wrong loading this page
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            An unexpected error occurred while rendering this interface. Your session and operational data remain safe.
          </p>
          {this.state.errorId && (
            <p className="mt-2 text-xs font-mono text-slate-400">
              Reference ID: {this.state.errorId}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
            >
              <RefreshCcw size={13} /> Try Again
            </button>
            <button
              onClick={this.handleGoHome}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Home size={13} /> Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
