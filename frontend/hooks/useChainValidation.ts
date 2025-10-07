"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { useEffect, useState, useContext } from "react";
import { AuctionNotificationsContext } from "@/providers/AuctionNotificationsProvider";

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

  const context = useContext(AuctionNotificationsContext);
  const notifications = context?.refundNotifications || [];

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

  useEffect(() => {
    if (isConnected && !isValidChain && chain && !hasNotifiedWrongChain) {
      setHasNotifiedWrongChain(true);
    }
  }, [isConnected, isValidChain, chain, hasNotifiedWrongChain]);

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
