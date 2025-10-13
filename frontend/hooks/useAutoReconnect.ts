"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";

export function useAutoReconnect() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const [hasAttemptedReconnect, setHasAttemptedReconnect] = useState(false);

  useEffect(() => {
    // Only if we're not already connected, not connecting, and haven't already tried
    if (!isConnected && !isConnecting && !hasAttemptedReconnect) {
      console.log(
        "🔄 Auto-reconnect: Wallet not connected, attempting reconnection..."
      );

      // Find the most common connector (MetaMask or WalletConnect)
      const preferredConnector =
        connectors.find((c) => c.name === "MetaMask") ||
        connectors.find((c) => c.name === "WalletConnect") ||
        connectors[0];

      if (preferredConnector) {
        console.log(
          `🔄 Attempting to reconnect with ${preferredConnector.name}...`
        );

        try {
          connect({ connector: preferredConnector });
          console.log("✅ Auto-reconnect initiated!");
        } catch (error) {
          console.log("❌ Auto-reconnect failed:", error);
        } finally {
          setHasAttemptedReconnect(true);
        }
      } else {
        console.log("❌ No connectors available for auto-reconnect");
        setHasAttemptedReconnect(true);
      }
    }
  }, [isConnected, isConnecting, hasAttemptedReconnect, connect, connectors]);

  // Reset quando l'address cambia (nuovo wallet connesso)
  useEffect(() => {
    if (isConnected && address) {
      setHasAttemptedReconnect(false);
    }
  }, [isConnected, address]);

  return {
    hasAttemptedReconnect,
    isAttemptingReconnect:
      !isConnected && !isConnecting && !hasAttemptedReconnect,
  };
}
