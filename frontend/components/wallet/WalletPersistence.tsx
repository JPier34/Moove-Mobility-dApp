"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";

interface WalletPersistenceProps {
  children: React.ReactNode;
}

export default function WalletPersistence({
  children,
}: WalletPersistenceProps) {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated after component mounts
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Only run on client side after hydration
    if (!isHydrated) return;

    const attemptReconnection = async () => {
      try {
        // Check if there's a stored connection
        const storedConnection = localStorage.getItem("moove-wagmi-store");

        if (storedConnection && !isConnected) {
          const parsed = JSON.parse(storedConnection);
          const hasStoredConnection = parsed?.state?.connections?.size > 0;

          if (hasStoredConnection) {
            // Try to reconnect with the first available connector
            const connector = connectors[0];
            if (connector) {
              try {
                await connect({ connector });
                console.log("Wallet reconnected successfully");
              } catch (error) {
                console.log("Failed to auto-reconnect wallet:", error);
              }
            }
          }
        }
      } catch (error) {
        console.log("Error during wallet reconnection:", error);
      }
    };

    // Longer delay to ensure everything is loaded and avoid conflicts
    const timeoutId = setTimeout(attemptReconnection, 500);

    return () => clearTimeout(timeoutId);
  }, [isHydrated, isConnected, connect, connectors]);

  // Don't show loading state during hydration to avoid flash
  // Just render children immediately to prevent disconnection issues
  return <>{children}</>;
}
