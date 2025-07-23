"use client";

import React, { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect, useChainId } from "wagmi";
import { sepolia } from "wagmi/chains";
import { useChainValidation } from "@/hooks/useChainValidation";

// Disconnect confirmation modal
interface DisconnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DisconnectModal({ isOpen, onClose, onConfirm }: DisconnectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Disconnect Wallet
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Are you sure you want to disconnect your wallet? You'll need to
          reconnect to interact with the platform.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WalletButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { isValidChain, switchToSepolia, isSwitching } = useChainValidation();

  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const handleDisconnect = () => {
    disconnect();
    setShowDisconnectModal(false);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 1:
        return "Ethereum";
      case 5:
        return "Goerli";
      case 11155111:
        return "Sepolia";
      default:
        return `Chain ${chainId}`;
    }
  };

  // If not connected, show connect button
  if (!isConnected) {
    return (
      <ConnectButton.Custom>
        {({ openConnectModal, connectModalOpen }) => (
          <button
            onClick={openConnectModal}
            disabled={connectModalOpen}
            className="bg-moove-primary text-white px-6 py-2 rounded-lg hover:bg-moove-primary/90 transition-colors font-medium disabled:opacity-50"
          >
            Connect Wallet
          </button>
        )}
      </ConnectButton.Custom>
    );
  }

  // If connected but wrong network
  if (!isValidChain) {
    return (
      <div className="flex items-center space-x-2">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          <span className="text-red-800 dark:text-red-200 text-sm font-medium">
            Wrong Network: {getChainName(chainId)}
          </span>
        </div>
        <button
          onClick={switchToSepolia}
          disabled={isSwitching}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {isSwitching ? "Switching..." : "Switch to Sepolia"}
        </button>
      </div>
    );
  }

  // Connected and correct network
  return (
    <>
      <div className="flex items-center space-x-3">
        {/* Chain indicator */}
        <div className="flex items-center bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span className="text-green-800 dark:text-green-200 text-sm font-medium">
            Sepolia
          </span>
        </div>

        {/* Address display */}
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2">
          <span className="text-gray-900 dark:text-white font-mono text-sm">
            {formatAddress(address!)}
          </span>
        </div>

        {/* Account modal trigger */}
        <ConnectButton.Custom>
          {({ openAccountModal }) => (
            <button
              onClick={openAccountModal}
              className="bg-moove-primary text-white px-4 py-2 rounded-lg hover:bg-moove-primary/90 transition-colors"
            >
              Account
            </button>
          )}
        </ConnectButton.Custom>

        {/* Disconnect button */}
        <button
          onClick={() => setShowDisconnectModal(true)}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Disconnect Wallet"
        >
          🔌
        </button>
      </div>

      {/* Disconnect confirmation modal */}
      <DisconnectModal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        onConfirm={handleDisconnect}
      />
    </>
  );
}
