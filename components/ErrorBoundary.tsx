import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { clearStorage } from "../services/storageService";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Fixed: Explicitly extend React.Component to resolve 'props' property missing error
export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = async () => {
    try {
      await clearStorage();
      localStorage.removeItem('pharma_brands');
      localStorage.removeItem('pharma_doctors');
      window.location.reload();
    } catch (e) {
      console.error("Failed to clear storage:", e);
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h1>
            <p className="text-slate-500 mb-6 text-sm">
              The application encountered an unexpected error. This might be due to a data issue or a temporary glitch.
            </p>
            
            {this.state.error && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-6 text-left overflow-auto max-h-32">
                <p className="text-xs text-red-500 font-mono break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                <RefreshCw className="w-5 h-5" />
                Reload Application
              </button>
              
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-white text-slate-500 font-medium rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
                Clear Data & Reset
              </button>
              <p className="text-[10px] text-slate-400 mt-2">
                Using "Clear Data" will remove stored brands and doctors.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}