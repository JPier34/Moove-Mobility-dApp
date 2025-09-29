"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

interface DebugInfo {
  address: string | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  path: string;
  timestamp: string;
  localStorage: {
    wagmiStore: string | null;
    walletStorage: string | null;
  };
}

export default function WalletDebugPanel() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        address,
        isConnected,
        isConnecting,
        isReconnecting,
        path: window.location.pathname,
        timestamp: new Date().toISOString(),
        localStorage: {
          wagmiStore: localStorage.getItem("wagmi.store"),
          walletStorage: localStorage.getItem("wagmi.wallet"),
        },
      });
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);

    return () => clearInterval(interval);
  }, [address, isConnected, isConnecting, isReconnecting]);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 left-4 bg-red-600 text-white p-2 rounded text-xs z-50"
      >
        🐛 Debug
      </button>

      {/* Debug Panel */}
      {isVisible && debugInfo && (
        <div className="fixed bottom-16 left-4 bg-black text-green-400 p-4 rounded text-xs z-50 max-w-md max-h-96 overflow-auto font-mono">
          <div className="font-bold mb-2 text-yellow-400">
            Wallet Debug Panel
          </div>

          <div className="space-y-1">
            <div>📍 Path: {debugInfo.path}</div>
            <div>⏰ Time: {debugInfo.timestamp}</div>
            <div>
              🔗 Address:{" "}
              {debugInfo.address
                ? `${debugInfo.address.slice(0, 6)}...${debugInfo.address.slice(
                    -4
                  )}`
                : "null"}
            </div>
            <div>✅ Connected: {debugInfo.isConnected ? "YES" : "NO"}</div>
            <div>🔄 Connecting: {debugInfo.isConnecting ? "YES" : "NO"}</div>
            <div>
              🔄 Reconnecting: {debugInfo.isReconnecting ? "YES" : "NO"}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-gray-600">
            <div className="font-bold text-yellow-400">LocalStorage:</div>
            <div>
              💾 wagmi.store:{" "}
              {debugInfo.localStorage.wagmiStore ? "EXISTS" : "MISSING"}
            </div>
            <div>
              💾 wagmi.wallet:{" "}
              {debugInfo.localStorage.walletStorage || "MISSING"}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-gray-600">
            <div className="font-bold text-yellow-400">Status:</div>
            <div
              className={`${
                debugInfo.isConnected ? "text-green-400" : "text-red-400"
              }`}
            >
              {debugInfo.isConnected
                ? "🟢 WALLET CONNECTED"
                : "🔴 WALLET DISCONNECTED"}
            </div>
          </div>
        </div>
      )}
    </>
  );
}









