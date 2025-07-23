"use client";

import { useChainId, useSwitchChain, useAccount } from "wagmi";
import { sepolia } from "wagmi/chains";
import { useEffect, useState } from "react";

interface ChainValidationResult {
  isValidChain: boolean;
  currentChainId: number | undefined;
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
  const { isConnected } = useAccount();

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

      setHasNotifiedWrongChain(false);
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to switch network";
      setError(errorMessage);
    }
  };

  // Handle switch network errors
  useEffect(() => {
    if (switchError) {
      setError(switchError.message);
    }
  }, [switchError]);

  return {
    isValidChain,
    currentChainId: chainId,
    isConnected,
    isSwitching,
    error,
    switchToSepolia,
  };
};
