"use client";

import React, { useState } from "react";

interface DebugInfo {
  clientSide: {
    NEXT_PUBLIC_PINATA_API_KEY?: string;
    NEXT_PUBLIC_PINATA_SECRET_KEY?: string;
    PINATA_API_KEY?: string;
    PINATA_SECRET_KEY?: string;
    NODE_ENV?: string;
  };
  serverSide: {
    response?: any;
    hasMock?: boolean;
    error?: string;
    timestamp: string;
  } | null;
}

export default function EnvironmentDebugger() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  const runDebug = () => {
    const info = {
      // Client-side environment variables
      clientSide: {
        NEXT_PUBLIC_PINATA_API_KEY: process.env.NEXT_PUBLIC_PINATA_API_KEY,
        NEXT_PUBLIC_PINATA_SECRET_KEY:
          process.env.NEXT_PUBLIC_PINATA_SECRET_KEY,
        PINATA_API_KEY: process.env.PINATA_API_KEY,
        PINATA_SECRET_KEY: process.env.PINATA_SECRET_KEY,
        NODE_ENV: process.env.NODE_ENV,
      },
      // Test API call to server-side
      serverSide: null,
    };

    console.log("🔍 Environment Debug Info:", info);
    setDebugInfo(info);

    // Test server-side environment variables
    fetch("/api/test-env")
      .then((response) => response.json())
      .then((data) => {
        console.log("🔍 Server-side environment response:", data);
        setDebugInfo((prev: DebugInfo | null) => ({
          clientSide: prev?.clientSide || {
            NEXT_PUBLIC_PINATA_API_KEY: undefined,
            NEXT_PUBLIC_PINATA_SECRET_KEY: undefined,
            PINATA_API_KEY: undefined,
            PINATA_SECRET_KEY: undefined,
            NODE_ENV: undefined,
          },
          serverSide: {
            response: data,
            hasMock: data.mock || false,
            timestamp: new Date().toISOString(),
          },
        }));
      })
      .catch((error) => {
        console.error("🔍 Server-side error:", error);
        setDebugInfo((prev: DebugInfo | null) => ({
          clientSide: prev?.clientSide || {
            NEXT_PUBLIC_PINATA_API_KEY: undefined,
            NEXT_PUBLIC_PINATA_SECRET_KEY: undefined,
            PINATA_API_KEY: undefined,
            PINATA_SECRET_KEY: undefined,
            NODE_ENV: undefined,
          },
          serverSide: {
            error: error.message,
            timestamp: new Date().toISOString(),
          },
        }));
      });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        🔍 Environment Debugger
      </h2>

      <button
        onClick={runDebug}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-6"
      >
        Run Environment Debug
      </button>

      {debugInfo && (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Client-Side Environment Variables
            </h3>
            <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded overflow-auto max-h-64">
              {JSON.stringify(debugInfo.clientSide, null, 2)}
            </pre>
          </div>

          {debugInfo.serverSide && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Server-Side Environment Variables (via API)
              </h3>
              <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded overflow-auto max-h-64">
                {JSON.stringify(debugInfo.serverSide, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
          💡 Next.js Environment Variables Rules:
        </h3>
        <ul className="text-blue-700 dark:text-blue-400 text-sm space-y-1">
          <li>
            •{" "}
            <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">
              NEXT_PUBLIC_
            </code>{" "}
            variables are available on client-side
          </li>
          <li>
            • Variables without{" "}
            <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">
              NEXT_PUBLIC_
            </code>{" "}
            are only available on server-side
          </li>
          <li>
            • Server-side variables are accessible in API routes and server
            components
          </li>
          <li>• Client-side variables are accessible in browser components</li>
        </ul>
      </div>
    </div>
  );
}
