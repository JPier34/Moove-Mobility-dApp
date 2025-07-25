"use client";

import React from "react";
import { useAccount, useSwitchChain } from "wagmi";
import Button from "./Button";

interface NetworkGuardProps {
  children: React.ReactNode;
  requiredChainId?: number;
}

export default function NetworkGuard({
  children,
  requiredChainId = 11155111, // Sepolia
}: NetworkGuardProps) {
  const { isConnected, chainId } = useAccount();
  const { switchChainAsync, isPending } = useSwitchChain();

  const handleSwitch = async () => {
    try {
      await switchChainAsync({ chainId: requiredChainId });
    } catch (error) {
      console.error("Errore nel cambio di rete:", error);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Connect Your Wallet
        </h3>
        <p className="text-gray-600 mb-6">
          Please connect your wallet to interact with the Moove NFT platform.
        </p>
      </div>
    );
  }

  if (chainId !== requiredChainId) {
    const networkName = requiredChainId === 11155111 ? "Sepolia" : "Unknown";

    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Wrong Network?
        </h3>
        <p className="text-gray-600 mb-6">
          Please switch to the {networkName} network to continue.
        </p>
        <Button onClick={handleSwitch} disabled={isPending}>
          {isPending ? "Switching..." : `Switch to ${networkName}`}
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
