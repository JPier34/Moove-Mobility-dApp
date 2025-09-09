"use client";

import { useWalletPersistence } from "@/hooks/useWalletPersistence";

export default function WalletDebug() {
  const walletState = useWalletPersistence();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-3 rounded text-xs font-mono z-50 max-w-xs">
      <div className="font-bold mb-2">Wallet Debug</div>
      <div>Connected: {walletState.isConnected ? "✅" : "❌"}</div>
      <div>
        Address:{" "}
        {walletState.address ? `${walletState.address.slice(0, 6)}...` : "None"}
      </div>
      <div>Initialized: {walletState.isInitialized ? "✅" : "❌"}</div>
      <div>Connecting: {walletState.isConnecting ? "🔄" : "⏸️"}</div>
      <div className="mt-2 text-xs opacity-75">
        <div>
          Storage:{" "}
          {typeof window !== "undefined" && localStorage.getItem("wagmi.store")
            ? "✅"
            : "❌"}
        </div>
        <div>
          Ethereum:{" "}
          {typeof window !== "undefined" && window.ethereum ? "✅" : "❌"}
        </div>
      </div>
    </div>
  );
}
