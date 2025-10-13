"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * 🛡️ ERROR BOUNDARY: Protects notification system from crashes
 *
 * If an error occurs in the notification system, this boundary will:
 * 1. ✅ Catch the error and prevent the entire app from crashing
 * 2. ✅ Show a fallback UI instead of a blank screen
 * 3. ✅ Log the error for debugging
 * 4. ✅ Allow users to continue using the app
 */
export default class NotificationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    console.error("🚨 [NotificationErrorBoundary] Error caught:", error);
    console.error("🚨 [NotificationErrorBoundary] Error info:", errorInfo);

    // You could also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        this.props.fallback || (
          <div className="fixed bottom-4 right-4 z-[99999] bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Notification System Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    The notification system encountered an error. You can
                    continue using the app normally.
                  </p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => this.setState({ hasError: false })}
                    className="bg-red-100 px-3 py-1 rounded text-sm text-red-800 hover:bg-red-200 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
