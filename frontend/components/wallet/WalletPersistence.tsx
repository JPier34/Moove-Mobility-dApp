"use client";

import { useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import WalletLoadingScreen from "./WalletLoadingScreen";

interface WalletPersistenceProps {
  children: React.ReactNode;
}

export default function WalletPersistence({
  children,
}: WalletPersistenceProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { disconnect } = useDisconnect();

  // Safe useAccount with error handling
  let accountData = null;
  try {
    accountData = useAccount();
  } catch (error) {
    console.warn("useAccount error in WalletPersistence:", error);
  }

  // Mark as hydrated after component mounts
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Update connection state safely
  useEffect(() => {
    if (accountData) {
      setIsConnected(accountData.isConnected);
    }
  }, [accountData]);

  // Listen for account changes and handle disconnections
  useEffect(() => {
    if (!isHydrated) return;

    const handleAccountChange = (accounts: string[]) => {
      if (accounts.length === 0 && isConnected) {
        console.log("🔄 Account disconnected, clearing state");
        disconnect();
      }
    };

    // Listen for MetaMask account changes
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountChange);

      return () => {
        window.ethereum?.removeListener("accountsChanged", handleAccountChange);
      };
    }
  }, [isHydrated, isConnected, disconnect]);

  // Show loading state during hydration to prevent flash
  if (!isHydrated) {
    return <WalletLoadingScreen message="Initializing wallet..." />;
  }

  return <>{children}</>;
}
