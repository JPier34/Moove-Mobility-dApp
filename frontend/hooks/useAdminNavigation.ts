"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export function useAdminNavigation() {
  const { isConnected, address } = useAccount();
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasCheckedConnection, setHasCheckedConnection] = useState(false);

  useEffect(() => {
    // Mark that we've checked the connection state
    setHasCheckedConnection(true);
  }, [isConnected]);

  useEffect(() => {
    // Reset navigation state when connection changes
    if (isConnected) {
      setIsNavigating(false);
    }
  }, [isConnected]);

  const startNavigation = () => {
    setIsNavigating(true);
  };

  const endNavigation = () => {
    setIsNavigating(false);
  };

  return {
    isConnected,
    address,
    isNavigating,
    hasCheckedConnection,
    startNavigation,
    endNavigation,
  };
}
