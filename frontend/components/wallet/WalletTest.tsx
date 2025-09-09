"use client";

import { useWalletPersistence } from "@/hooks/useWalletPersistence";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function WalletTest() {
  const { forceReconnect, isConnected, address } = useWalletPersistence();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded text-xs z-50">
      <div className="font-bold mb-2">Wallet Test</div>
      <div className="space-y-2">
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button
              onClick={openConnectModal}
              className="block w-full bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
            >
              Connect
            </button>
          )}
        </ConnectButton.Custom>

        <button
          onClick={forceReconnect}
          className="block w-full bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-xs"
        >
          Force Reconnect
        </button>

        <div className="text-xs opacity-75">
          Status: {isConnected ? "Connected" : "Disconnected"}
        </div>
      </div>
    </div>
  );
}
