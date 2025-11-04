"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useUserRoles } from "@/hooks/useContract";
import { getAdminAddress } from "@/config/admin";

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { address, isConnected } = useAccount();
  const [isReady, setIsReady] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Master admin wallet - always has access (check first, no RPC needed)
  const MASTER_WALLET = getAdminAddress();
  const isMasterWallet = address?.toLowerCase() === MASTER_WALLET?.toLowerCase();

  // Check roles (hook will skip RPC calls if master wallet)
  const {
    isMasterAdmin,
    canMint,
    isLoading: rolesLoading,
  } = useUserRoles(address);

  useEffect(() => {
    // Mark as ready after a short delay to ensure wallet state is stable
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 200);

    // Timeout after 10 seconds if still loading (429 error likely)
    const timeoutTimer = setTimeout(() => {
      if (rolesLoading && !isMasterWallet) {
        console.warn("⚠️ [AdminGuard] Permission check timeout, assuming access denied");
        setLoadingTimeout(true);
      }
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearTimeout(timeoutTimer);
    };
  }, [rolesLoading, isMasterWallet]);

  // Show loading state while checking permissions (but not for master wallet)
  if (!isReady || (rolesLoading && !isMasterWallet && !loadingTimeout)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {!isReady ? "Initializing..." : "Checking permissions..."}
          </p>
          {loadingTimeout && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
              ⚠️ Taking longer than expected. Please check your RPC connection.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Check if user is connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Wallet Not Connected
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Please connect your wallet to access the admin panel
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check admin permissions
  if (!isMasterWallet && !isMasterAdmin && !canMint) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            You don't have permission to access the admin panel
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
