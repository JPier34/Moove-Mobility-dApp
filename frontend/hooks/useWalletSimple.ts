"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount, useDisconnect } from "wagmi";

interface WalletSimpleState {
  isConnected: boolean;
  address: string | undefined;
  isConnecting: boolean;
  isInitialized: boolean;
}

export function useWalletSimple() {
  const [state, setState] = useState<WalletSimpleState>({
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

  // Mark as initialized after hydration
  useEffect(() => {
    const timer = setTimeout(() => {
      setState((prev) => ({ ...prev, isInitialized: true }));
    }, 200); // Slightly longer delay to ensure Wagmi is ready

    return () => clearTimeout(timer);
  }, []);

  // Update state when account data changes, but only after initialization
  useEffect(() => {
    if (!state.isInitialized) return;

    if (accountData) {
      setState((prev) => ({
        ...prev,
        isConnected: accountData.isConnected,
        address: accountData.address,
        isConnecting: accountData.isConnecting,
      }));
    }
  }, [accountData, state.isInitialized]);

  const forceDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  return {
    ...state,
    forceDisconnect,
    forceReconnect: async () => false,
    isReconnecting: false,
    reconnectAttempts: 0,
  };
}






