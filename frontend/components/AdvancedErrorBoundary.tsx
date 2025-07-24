"use client";

import React, { Component, ReactNode } from "react";
import { useChainValidation } from "@/hooks/useChainValidation";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

export class AdvancedErrorBoundary extends Component<Props, State> {
  private retryTimeoutId?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log to monitoring service
    this.logError(error, errorInfo);

    // Auto-retry for certain errors
    if (this.shouldAutoRetry(error) && this.state.retryCount < 3) {
      this.scheduleRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private logError = (error: Error, errorInfo: React.ErrorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount,
    };

    // In production, send to error tracking service
    console.error("Error Boundary caught error:", errorData);

    // Example: Send to analytics
    // analytics.track('Error Boundary Triggered', errorData);
  };

  private shouldAutoRetry = (error: Error): boolean => {
    const retryableErrors = [
      "Network request failed",
      "Failed to fetch",
      "ChunkLoadError",
      "Loading chunk",
    ];

    return retryableErrors.some((retryableError) =>
      error.message.includes(retryableError)
    );
  };

  private scheduleRetry = () => {
    const delay = Math.pow(2, this.state.retryCount) * 1000; // Exponential backoff

    this.retryTimeoutId = setTimeout(() => {
      this.retry();
    }, delay);
  };

  private retry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.retry);
      }

      return (
        <ErrorFallbackComponent
          error={this.state.error}
          retry={this.retry}
          retryCount={this.state.retryCount}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
interface ErrorFallbackProps {
  error: Error;
  retry: () => void;
  retryCount: number;
}

function ErrorFallbackComponent({
  error,
  retry,
  retryCount,
}: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>

        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Something went wrong
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
          {error.message}
        </p>

        {retryCount > 0 && (
          <p className="text-yellow-600 dark:text-yellow-400 text-xs mb-4">
            Retry attempts: {retryCount}/3
          </p>
        )}

        <div className="space-y-3">
          <button
            onClick={retry}
            disabled={retryCount >= 3}
            className="w-full bg-moove-primary text-white py-2 px-4 rounded-lg hover:bg-moove-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {retryCount >= 3 ? "Max retries reached" : "Try Again"}
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Reload Page
          </button>
        </div>

        {/* Debug info (only in development) */}
        {process.env.NODE_ENV === "development" && (
          <details className="mt-4 text-left">
            <summary className="text-xs text-gray-500 cursor-pointer">
              Debug Info
            </summary>
            <pre className="text-xs text-gray-400 mt-2 bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
