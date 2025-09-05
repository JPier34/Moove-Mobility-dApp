"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";

export function useWalletPersistence() {
  const { isConnected, address, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const [isInitialized, setIsInitialized] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    // Mark as initialized immediately to avoid blocking UI
    setIsInitialized(true);

    // Check if we have a stored connection
    const checkStoredConnection = async () => {
      try {
        // Small delay to ensure wagmi is fully initialized
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Check if there's a stored wallet connection in localStorage
        const storedConnection = localStorage.getItem("moove-wagmi-store");

        if (storedConnection) {
          const parsed = JSON.parse(storedConnection);
          const hasStoredConnection = parsed?.state?.connections?.size > 0;

          if (hasStoredConnection && !isConnected) {
            // Try to reconnect with the first available connector
            const connector = connectors[0];
            if (connector) {
              try {
                await connect({ connector });
                console.log("Wallet auto-reconnected successfully");
              } catch (error) {
                console.log("Failed to auto-reconnect:", error);
              }
            }
          }
        }
      } catch (error) {
        console.log("Error checking stored connection:", error);
      }
    };

    checkStoredConnection();
  }, [isConnected, connect, connectors]);

  // Funzione per forzare la riconnessione
  const forceReconnect = async () => {
    if (reconnectAttempts >= 3) {
      console.log("Max reconnection attempts reached");
      return false;
    }

    try {
      setReconnectAttempts((prev) => prev + 1);
      const connector = connectors[0];
      if (connector) {
        await connect({ connector });
        console.log("Force reconnection successful");
        return true;
      }
    } catch (error) {
      console.log("Force reconnection failed:", error);
    }
    return false;
  };

  return {
    isConnected,
    address,
    isInitialized,
    isConnecting,
    reconnectAttempts,
    forceReconnect,
  };
}
