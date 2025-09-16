"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount, useDisconnect } from "wagmi";

interface WalletState {
  isConnected: boolean;
  address: string | undefined;
  isConnecting: boolean;
  isInitialized: boolean;
}

export function useWalletOptimized() {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: undefined,
    isConnecting: false,
    isInitialized: false,
  });

  // Safe useAccount with error handling
  let accountData = null;
  try {
    accountData = useAccount();
  } catch (error) {
    console.warn("useAccount error:", error);
  }

  const { disconnect } = useDisconnect();

  // Update state when account data changes
  useEffect(() => {
    if (accountData) {
      setState((prev) => ({
        ...prev,
        isConnected: accountData.isConnected,
        address: accountData.address,
        isConnecting: accountData.isConnecting,
        isInitialized: true,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        isInitialized: true,
      }));
    }
  }, [accountData]);

  // Mark as initialized after hydration
  useEffect(() => {
    const timer = setTimeout(() => {
      setState((prev) => ({ ...prev, isInitialized: true }));
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const forceDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  return {
    ...state,
    forceDisconnect,
    forceReconnect: async () => false, // Simplified
    isReconnecting: false,
    reconnectAttempts: 0,
  };
}






