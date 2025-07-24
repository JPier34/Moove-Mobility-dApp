"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { useEffect, useState } from "react";
import { useNotifications } from "@/hooks/useNotification";

interface ChainValidationResult {
  isValidChain: boolean;
  currentChain: { id: number; name?: string } | undefined;
  isConnected: boolean;
  isSwitching: boolean;
  error: string | null;
  switchToSepolia: () => Promise<void>;
}

export const useChainValidation = (): ChainValidationResult => {
  const chainId = useChainId();
  const {
    switchChain,
    isPending: isSwitching,
    error: switchError,
  } = useSwitchChain();
  const { isConnected, chain } = useAccount();
  const { sendNotification } = useNotifications();

  const [error, setError] = useState<string | null>(null);
  const [hasNotifiedWrongChain, setHasNotifiedWrongChain] = useState(false);

  const isValidChain = chainId === sepolia.id;

  const switchToSepolia = async () => {
    if (!switchChain) {
      setError("Switching networks is not supported by your wallet");
      return;
    }

    try {
      setError(null);
      await switchChain({ chainId: sepolia.id });

      sendNotification({
        title: "✅ Network Switched",
        body: "Successfully connected to Sepolia network",
        tag: "network-switch-success",
      });

      setHasNotifiedWrongChain(false);
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to switch network";
      setError(errorMessage);

      sendNotification({
        title: "❌ Network Switch Failed",
        body: errorMessage,
        tag: "network-switch-error",
      });
    }
  };

  useEffect(() => {
    if (isConnected && !isValidChain && chain && !hasNotifiedWrongChain) {
      sendNotification({
        title: "⚠️ Wrong Network",
        body: `Please switch to Sepolia. Currently on: ${chain.name}`,
        tag: "wrong-network",
      });

      setHasNotifiedWrongChain(true);
    }
  }, [
    isConnected,
    isValidChain,
    chain,
    hasNotifiedWrongChain,
    sendNotification,
  ]);

  useEffect(() => {
    if (switchError) {
      setError(switchError.message);
    }
  }, [switchError]);

  return {
    isValidChain,
    currentChain: chain,
    isConnected,
    isSwitching,
    error,
    switchToSepolia,
  };
};
