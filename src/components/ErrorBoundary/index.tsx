"use client";
// src/components/ErrorBoundary/index.tsx
//
// Error boundary to catch React errors and show a friendly fallback UI
// instead of a blank page. This prevents the entire app from crashing
// when a component has an error.

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log to console in development
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // if (process.env.NODE_ENV === 'production') {
    //   logErrorToService(error, errorInfo);
    // }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] p-6 text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
          <p className="mt-2 max-w-md text-white/60">
            We encountered an unexpected error. Please refresh the page to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-teal-500 px-6 py-3 font-semibold text-black transition hover:bg-teal-400"
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <div className="mt-8 max-w-2xl rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-left">
              <p className="text-sm font-semibold text-red-400">
                Development Error Details:
              </p>
              <pre className="mt-2 overflow-auto text-xs text-red-300">
                {this.state.error.message}
                {"\n\n"}
                {this.state.error.stack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
