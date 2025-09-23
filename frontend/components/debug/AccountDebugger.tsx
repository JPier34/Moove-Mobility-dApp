"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function AccountDebugger() {
  const { address, isConnected, isConnecting, chainId, connector } =
    useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const gatherDebugInfo = async () => {
      const info: any = {
        wagmi: {
          address,
          isConnected,
          isConnecting,
          chainId,
          connector: connector?.name || "None",
        },
        localStorage: {
          wagmiStore: localStorage.getItem("wagmi.store"),
          wagmiWalletState: localStorage.getItem("wagmi.wallet.state"),
        },
        ethereum: {
          available: typeof window !== "undefined" && !!window.ethereum,
          selectedAddress: (window.ethereum as any)?.selectedAddress || "None",
          chainId: (window.ethereum as any)?.chainId || "None",
          isMetaMask: (window.ethereum as any)?.isMetaMask || false,
        },
        connectors: connectors.map((c) => ({
          name: c.name,
          id: c.id,
          ready: c.ready,
        })),
      };

      // Check if MetaMask is available and get accounts
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          info.ethereum.accounts = accounts;
          info.ethereum.accountCount = accounts.length;
        } catch (error) {
          info.ethereum.accountError = error;
        }
      }

      setDebugInfo(info);
    };

    gatherDebugInfo();
  }, [address, isConnected, isConnecting, chainId, connector, connectors]);

  const handleForceReconnect = async () => {
    try {
      // Disconnect first
      await disconnect();

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Find MetaMask connector
      const metaMaskConnector = connectors.find((c) => c.name === "MetaMask");
      if (metaMaskConnector) {
        await connect({ connector: metaMaskConnector });
      }
    } catch (error) {
      console.error("Force reconnect failed:", error);
    }
  };

  const handleClearStorage = () => {
    localStorage.removeItem("wagmi.store");
    localStorage.removeItem("wagmi.wallet.state");
    localStorage.removeItem("wagmi.connected");
    console.log("🧹 Cleared all wallet storage");
    window.location.reload();
  };

  const handleRequestAccounts = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        console.log("📋 Requested accounts:", accounts);
      } catch (error) {
        console.error("❌ Request accounts failed:", error);
      }
    }
  };

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-md max-h-96 overflow-y-auto">
      <div className="font-bold mb-3 text-green-400">🔍 Account Debugger</div>

      {/* Wagmi State */}
      <div className="mb-3">
        <div className="text-yellow-400 font-semibold">Wagmi State:</div>
        <div>Address: {address || "None"}</div>
        <div>Connected: {isConnected ? "✅" : "❌"}</div>
        <div>Connecting: {isConnecting ? "🔄" : "⏸️"}</div>
        <div>Chain ID: {chainId || "None"}</div>
        <div>Connector: {connector?.name || "None"}</div>
      </div>

      {/* Ethereum Provider */}
      <div className="mb-3">
        <div className="text-yellow-400 font-semibold">Ethereum Provider:</div>
        <div>Available: {debugInfo.ethereum?.available ? "✅" : "❌"}</div>
        <div>
          Selected Address: {debugInfo.ethereum?.selectedAddress || "None"}
        </div>
        <div>Chain ID: {debugInfo.ethereum?.chainId || "None"}</div>
        <div>Is MetaMask: {debugInfo.ethereum?.isMetaMask ? "✅" : "❌"}</div>
        <div>Accounts: {debugInfo.ethereum?.accountCount || 0}</div>
        {debugInfo.ethereum?.accounts && (
          <div className="text-xs opacity-75">
            {debugInfo.ethereum.accounts.map((acc: string, i: number) => (
              <div key={i}>
                {acc.slice(0, 6)}...{acc.slice(-4)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connectors */}
      <div className="mb-3">
        <div className="text-yellow-400 font-semibold">
          Available Connectors:
        </div>
        {debugInfo.connectors?.map((conn: any, i: number) => (
          <div key={i} className="text-xs">
            {conn.name} ({conn.ready ? "✅" : "❌"})
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button
              onClick={openConnectModal}
              className="w-full px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              Connect Wallet
            </button>
          )}
        </ConnectButton.Custom>

        <button
          onClick={handleForceReconnect}
          className="w-full px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
        >
          Force Reconnect
        </button>

        <button
          onClick={handleRequestAccounts}
          className="w-full px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
        >
          Request Accounts
        </button>

        <button
          onClick={handleClearStorage}
          className="w-full px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
        >
          Clear Storage
        </button>
      </div>

      {/* Raw Debug Info */}
      <details className="mt-3">
        <summary className="text-yellow-400 cursor-pointer">
          Raw Debug Info
        </summary>
        <pre className="text-xs opacity-75 mt-2 overflow-x-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </details>
    </div>
  );
}
