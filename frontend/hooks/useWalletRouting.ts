"use client";

import { useEffect, useCallback } from "react";
import { useDisconnect } from "wagmi";
import { usePathname } from "next/navigation";
import { useWalletPersistence } from "./useWalletPersistence";

export function useWalletRouting() {
  const { isConnected, address } = useWalletPersistence();
  const { disconnect } = useDisconnect();
  const pathname = usePathname();

  // Handle wallet state during route changes
  const handleRouteChange = useCallback(() => {
    // Check if wallet is still connected after route change
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts.length === 0 && isConnected) {
            console.log("🔄 No accounts found, disconnecting wallet");
            disconnect();
          }
        })
        .catch((error) => {
          console.log("❌ Error checking accounts:", error);
        });
    }
  }, [isConnected, disconnect]);

  // Listen for route changes
  useEffect(() => {
    // Small delay to ensure the route change is complete
    const timeoutId = setTimeout(handleRouteChange, 100);
    return () => clearTimeout(timeoutId);
  }, [pathname, handleRouteChange]);

  // Listen for visibility changes (tab focus/blur)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isConnected) {
        // Check wallet connection when tab becomes visible
        handleRouteChange();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isConnected, handleRouteChange]);

  // Listen for window focus events
  useEffect(() => {
    const handleWindowFocus = () => {
      if (isConnected) {
        handleRouteChange();
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    return () => window.removeEventListener("focus", handleWindowFocus);
  }, [isConnected, handleRouteChange]);

  return {
    isConnected,
    address,
    currentPath: pathname,
  };
}
