"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function WalletTest() {
  const { isConnected, address } = useAccount();

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

        <div className="text-xs opacity-75">
          Status: {isConnected ? "Connected" : "Disconnected"}
        </div>
        {address && (
          <div className="text-xs opacity-75 break-all">
            Address: {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        )}
      </div>
    </div>
  );
}
