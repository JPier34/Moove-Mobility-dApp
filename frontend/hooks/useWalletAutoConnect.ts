"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

interface WalletAutoConnectState {
  isConnected: boolean;
  address: string | undefined;
  isConnecting: boolean;
  isInitialized: boolean;
}

export function useWalletAutoConnect() {
  const [state, setState] = useState<WalletAutoConnectState>({
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

  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Mark as initialized after hydration
  useEffect(() => {
    const timer = setTimeout(() => {
      setState((prev) => ({ ...prev, isInitialized: true }));
    }, 500); // Longer delay to ensure Wagmi is fully ready and prevent hydration mismatch

    return () => clearTimeout(timer);
  }, []);

  // Auto-connect logic
  useEffect(() => {
    if (!state.isInitialized) return;

    const attemptAutoConnect = async () => {
      try {
        // Check if there's a stored connection in localStorage
        const storedConnection = localStorage.getItem("wagmi.store");

        if (storedConnection && !accountData?.isConnected) {
          const parsed = JSON.parse(storedConnection);
          const hasStoredConnection = parsed?.state?.connections?.size > 0;

          if (hasStoredConnection) {
            console.log(
              "🔄 Found stored connection, attempting auto-connect..."
            );

            // Try to connect with the first available connector
            const connector = connectors[0];
            if (connector) {
              setState((prev) => ({ ...prev, isConnecting: true }));

              try {
                await connect({ connector });
                console.log("✅ Auto-connect successful");
              } catch (error) {
                console.log("❌ Auto-connect failed:", error);
              } finally {
                setState((prev) => ({ ...prev, isConnecting: false }));
              }
            }
          }
        }
      } catch (error) {
        console.log("❌ Error during auto-connect:", error);
      }
    };

    // Only attempt auto-connect if not already connected
    if (!accountData?.isConnected) {
      attemptAutoConnect();
    }
  }, [state.isInitialized, accountData?.isConnected, connect, connectors]);

  // Update state when account data changes
  useEffect(() => {
    if (accountData) {
      setState((prev) => ({
        ...prev,
        isConnected: accountData.isConnected,
        address: accountData.address,
        isConnecting: accountData.isConnecting,
      }));
    }
  }, [accountData]);

  const forceDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const forceReconnect = useCallback(async () => {
    if (state.isConnecting) return false;

    try {
      setState((prev) => ({ ...prev, isConnecting: true }));

      const connector = connectors[0];
      if (connector) {
        await connect({ connector });
        console.log("✅ Force reconnect successful");
        return true;
      }
    } catch (error) {
      console.log("❌ Force reconnect failed:", error);
    } finally {
      setState((prev) => ({ ...prev, isConnecting: false }));
    }

    return false;
  }, [state.isConnecting, connect, connectors]);

  return {
    ...state,
    forceDisconnect,
    forceReconnect,
    isReconnecting: state.isConnecting,
    reconnectAttempts: 0,
  };
}
