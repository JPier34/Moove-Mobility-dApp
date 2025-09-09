"use client";

import { useEffect, useState } from "react";
import WalletLoadingScreen from "./WalletLoadingScreen";

interface WalletProviderProps {
  children: React.ReactNode;
}

export default function WalletProvider({ children }: WalletProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  // Mark as hydrated after component mounts
  useEffect(() => {
    // Reduced timeout for faster initialization
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // Show loading state during hydration
  if (!isHydrated) {
    return <WalletLoadingScreen message="Loading..." />;
  }

  return <>{children}</>;
}
