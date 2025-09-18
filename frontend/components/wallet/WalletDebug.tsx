"use client";

import { useAccount } from "wagmi";

export default function WalletDebug() {
  const walletState = useAccount();

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
      <div>Initialized: {walletState.isConnected ? "✅" : "❌"}</div>
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
        <div>
          Wallet State:{" "}
          {typeof window !== "undefined" &&
          localStorage.getItem("wagmi.wallet.state")
            ? "✅"
            : "❌"}
        </div>
      </div>

      {/* Debug controls */}
      <div className="mt-2 space-y-1">
        <button
          onClick={() => {
            const saved = localStorage.getItem("wagmi.wallet.state");
            console.log(
              "💾 Saved wallet state:",
              saved ? JSON.parse(saved) : "None"
            );
          }}
          className="w-full px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          Check State
        </button>
        <button
          onClick={() => {
            localStorage.removeItem("wagmi.wallet.state");
            console.log("🧹 Cleared saved state");
          }}
          className="w-full px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
        >
          Clear State
        </button>
      </div>
    </div>
  );
}
