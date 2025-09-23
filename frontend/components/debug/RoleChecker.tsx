"use client";

import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

export default function RoleChecker() {
  const { address, isConnected } = useAccount();
  const [roleInfo, setRoleInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkRoles = async () => {
    if (!address || !isConnected) return;
    
    setIsLoading(true);
    setError(null);

    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No ethereum provider available");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accessControlContract = new ethers.Contract(
        contracts.MooveAccessControl.address,
        contracts.MooveAccessControl.abi,
        provider
      );

      console.log(`🔍 Checking roles for account: ${address}`);
      console.log(`📋 Using access control contract: ${contracts.MooveAccessControl.address}`);

      // Get role constants
      const DEFAULT_ADMIN_ROLE = await accessControlContract.DEFAULT_ADMIN_ROLE();
      const MASTER_ADMIN_ROLE = await accessControlContract.MASTER_ADMIN_ROLE();
      const MINTER_ROLE = await accessControlContract.MINTER_ROLE();
      const AUCTION_MANAGER_ROLE = await accessControlContract.AUCTION_MANAGER_ROLE();

      console.log("📋 Role constants:", {
        DEFAULT_ADMIN_ROLE,
        MASTER_ADMIN_ROLE,
        MINTER_ROLE,
        AUCTION_MANAGER_ROLE
      });

      // Check roles
      const hasDefaultAdmin = await accessControlContract.hasRole(DEFAULT_ADMIN_ROLE, address);
      const hasMasterAdmin = await accessControlContract.hasRole(MASTER_ADMIN_ROLE, address);
      const hasMinter = await accessControlContract.hasRole(MINTER_ROLE, address);
      const hasAuctionManager = await accessControlContract.hasRole(AUCTION_MANAGER_ROLE, address);

      // Check convenience functions
      const canMint = await accessControlContract.canMint(address);
      const canManageAuctions = await accessControlContract.canManageAuctions(address);

      const result = {
        account: address,
        roles: {
          DEFAULT_ADMIN: hasDefaultAdmin,
          MASTER_ADMIN: hasMasterAdmin,
          MINTER: hasMinter,
          AUCTION_MANAGER: hasAuctionManager,
        },
        convenience: {
          canMint,
          canManageAuctions,
        },
        roleConstants: {
          DEFAULT_ADMIN_ROLE,
          MASTER_ADMIN_ROLE,
          MINTER_ROLE,
          AUCTION_MANAGER_ROLE,
        }
      };

      setRoleInfo(result);
      console.log("🎯 Role check completed:", result);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("❌ Role check failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (address && isConnected) {
      checkRoles();
    }
  }, [address, isConnected]);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-md">
      <div className="font-bold mb-3 text-green-400">🔐 Role Checker</div>
      
      {isLoading && (
        <div className="text-yellow-400 mb-3">🔄 Checking roles...</div>
      )}

      {error && (
        <div className="text-red-400 mb-3">❌ Error: {error}</div>
      )}

      {roleInfo && (
        <div className="space-y-3">
          {/* Account Info */}
          <div>
            <div className="text-yellow-400 font-semibold">Account:</div>
            <div className="break-all">{roleInfo.account}</div>
          </div>

          {/* Roles */}
          <div>
            <div className="text-yellow-400 font-semibold">Roles:</div>
            <div className={roleInfo.roles.DEFAULT_ADMIN ? "text-green-400" : "text-red-400"}>
              {roleInfo.roles.DEFAULT_ADMIN ? "✅" : "❌"} DEFAULT_ADMIN
            </div>
            <div className={roleInfo.roles.MASTER_ADMIN ? "text-green-400" : "text-red-400"}>
              {roleInfo.roles.MASTER_ADMIN ? "✅" : "❌"} MASTER_ADMIN
            </div>
            <div className={roleInfo.roles.MINTER ? "text-green-400" : "text-red-400"}>
              {roleInfo.roles.MINTER ? "✅" : "❌"} MINTER
            </div>
            <div className={roleInfo.roles.AUCTION_MANAGER ? "text-green-400" : "text-red-400"}>
              {roleInfo.roles.AUCTION_MANAGER ? "✅" : "❌"} AUCTION_MANAGER
            </div>
          </div>

          {/* Convenience Functions */}
          <div>
            <div className="text-yellow-400 font-semibold">Convenience:</div>
            <div className={roleInfo.convenience.canMint ? "text-green-400" : "text-red-400"}>
              {roleInfo.convenience.canMint ? "✅" : "❌"} canMint()
            </div>
            <div className={roleInfo.convenience.canManageAuctions ? "text-green-400" : "text-red-400"}>
              {roleInfo.convenience.canManageAuctions ? "✅" : "❌"} canManageAuctions()
            </div>
          </div>

          {/* Summary */}
          <div className="border-t border-gray-600 pt-2">
            <div className="text-yellow-400 font-semibold">Summary:</div>
            {roleInfo.convenience.canMint ? (
              <div className="text-green-400">🎯 Can mint NFTs!</div>
            ) : (
              <div className="text-red-400">❌ Cannot mint NFTs - missing MINTER_ROLE</div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 space-y-2">
        <button
          onClick={checkRoles}
          disabled={isLoading || !address}
          className="w-full px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? "Checking..." : "Check Roles"}
        </button>
      </div>
    </div>
  );
}