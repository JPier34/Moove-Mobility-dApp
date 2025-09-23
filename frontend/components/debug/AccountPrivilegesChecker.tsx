"use client";

import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

interface PrivilegeInfo {
  account: string;
  isConnected: boolean;
  roles: {
    DEFAULT_ADMIN: boolean;
    MASTER_ADMIN: boolean;
    MINTER_ROLE: boolean;
    AUCTION_MANAGER_ROLE: boolean;
  };
  nftBalance: number;
  auctionCount: number;
  errors: string[];
}

export default function AccountPrivilegesChecker() {
  const { address, isConnected } = useAccount();
  const [privilegeInfo, setPrivilegeInfo] = useState<PrivilegeInfo | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAccountPrivileges = async (accountAddress: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No ethereum provider available");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);

      // Create contract instances
      const accessControlContract = new ethers.Contract(
        contracts.MooveAccessControl.address,
        contracts.MooveAccessControl.abi,
        provider
      );

      const nftContract = new ethers.Contract(
        contracts.MooveNFT.address,
        contracts.MooveNFT.abi,
        provider
      );

      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      console.log(`🔍 Checking privileges for account: ${accountAddress}`);

      // Check roles
      const roles = {
        DEFAULT_ADMIN: false,
        MASTER_ADMIN: false,
        MINTER_ROLE: false,
        AUCTION_MANAGER_ROLE: false,
      };

      try {
        // Get role constants
        const DEFAULT_ADMIN_ROLE =
          await accessControlContract.DEFAULT_ADMIN_ROLE();
        const MASTER_ADMIN_ROLE =
          await accessControlContract.MASTER_ADMIN_ROLE();
        const MINTER_ROLE = await accessControlContract.MINTER_ROLE();
        const AUCTION_MANAGER_ROLE =
          await accessControlContract.AUCTION_MANAGER_ROLE();

        console.log("📋 Role constants:", {
          DEFAULT_ADMIN_ROLE,
          MASTER_ADMIN_ROLE,
          MINTER_ROLE,
          AUCTION_MANAGER_ROLE,
        });

        // Check each role
        roles.DEFAULT_ADMIN = await accessControlContract.hasRole(
          DEFAULT_ADMIN_ROLE,
          accountAddress
        );
        roles.MASTER_ADMIN = await accessControlContract.hasRole(
          MASTER_ADMIN_ROLE,
          accountAddress
        );
        roles.MINTER_ROLE = await accessControlContract.hasRole(
          MINTER_ROLE,
          accountAddress
        );
        roles.AUCTION_MANAGER_ROLE = await accessControlContract.hasRole(
          AUCTION_MANAGER_ROLE,
          accountAddress
        );

        console.log("✅ Role checks completed:", roles);
      } catch (roleError) {
        console.error("❌ Error checking roles:", roleError);
      }

      // Check NFT balance
      let nftBalance = 0;
      try {
        nftBalance = await nftContract.balanceOf(accountAddress);
        console.log(`📊 NFT Balance: ${nftBalance}`);
      } catch (balanceError) {
        console.error("❌ Error checking NFT balance:", balanceError);
      }

      // Check auction count
      let auctionCount = 0;
      try {
        auctionCount = await auctionContract.totalAuctions();
        console.log(`🏆 Total Auctions: ${auctionCount}`);
      } catch (auctionError) {
        console.error("❌ Error checking auction count:", auctionError);
      }

      const info: PrivilegeInfo = {
        account: accountAddress,
        isConnected,
        roles,
        nftBalance: Number(nftBalance),
        auctionCount: Number(auctionCount),
        errors: [],
      };

      setPrivilegeInfo(info);
      console.log("🎯 Privilege check completed:", info);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("❌ Privilege check failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (address && isConnected) {
      checkAccountPrivileges(address);
    }
  }, [address, isConnected]);

  const handleManualCheck = () => {
    if (address) {
      checkAccountPrivileges(address);
    }
  };

  const getRoleStatus = (hasRole: boolean) => {
    return hasRole ? "✅" : "❌";
  };

  const getRoleColor = (hasRole: boolean) => {
    return hasRole ? "text-green-400" : "text-red-400";
  };

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 bg-black/90 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-md">
      <div className="font-bold mb-3 text-blue-400">
        🔐 Account Privileges Checker
      </div>

      {isLoading && (
        <div className="text-yellow-400 mb-3">🔄 Checking privileges...</div>
      )}

      {error && <div className="text-red-400 mb-3">❌ Error: {error}</div>}

      {privilegeInfo && (
        <div className="space-y-3">
          {/* Account Info */}
          <div>
            <div className="text-yellow-400 font-semibold">Account:</div>
            <div className="break-all">{privilegeInfo.account}</div>
            <div>Connected: {privilegeInfo.isConnected ? "✅" : "❌"}</div>
          </div>

          {/* Roles */}
          <div>
            <div className="text-yellow-400 font-semibold">Roles:</div>
            <div
              className={`${getRoleColor(privilegeInfo.roles.DEFAULT_ADMIN)}`}
            >
              {getRoleStatus(privilegeInfo.roles.DEFAULT_ADMIN)} DEFAULT_ADMIN
            </div>
            <div
              className={`${getRoleColor(privilegeInfo.roles.MASTER_ADMIN)}`}
            >
              {getRoleStatus(privilegeInfo.roles.MASTER_ADMIN)} MASTER_ADMIN
            </div>
            <div className={`${getRoleColor(privilegeInfo.roles.MINTER_ROLE)}`}>
              {getRoleStatus(privilegeInfo.roles.MINTER_ROLE)} MINTER_ROLE
            </div>
            <div
              className={`${getRoleColor(
                privilegeInfo.roles.AUCTION_MANAGER_ROLE
              )}`}
            >
              {getRoleStatus(privilegeInfo.roles.AUCTION_MANAGER_ROLE)}{" "}
              AUCTION_MANAGER_ROLE
            </div>
          </div>

          {/* Stats */}
          <div>
            <div className="text-yellow-400 font-semibold">Stats:</div>
            <div>NFT Balance: {privilegeInfo.nftBalance}</div>
            <div>Total Auctions: {privilegeInfo.auctionCount}</div>
          </div>

          {/* Summary */}
          <div className="border-t border-gray-600 pt-2">
            <div className="text-yellow-400 font-semibold">Summary:</div>
            {privilegeInfo.roles.MASTER_ADMIN ? (
              <div className="text-green-400">
                🎯 MASTER_ADMIN - Full access!
              </div>
            ) : privilegeInfo.roles.MINTER_ROLE ? (
              <div className="text-green-400">
                🎯 MINTER_ROLE - Can mint NFTs
              </div>
            ) : privilegeInfo.roles.AUCTION_MANAGER_ROLE ? (
              <div className="text-green-400">
                🎯 AUCTION_MANAGER_ROLE - Can manage auctions
              </div>
            ) : (
              <div className="text-red-400">❌ No special privileges</div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 space-y-2">
        <button
          onClick={handleManualCheck}
          disabled={isLoading || !address}
          className="w-full px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? "Checking..." : "Check Privileges"}
        </button>

        <button
          onClick={() => {
            console.log("🔍 Current privilege info:", privilegeInfo);
            console.log("🔍 Account address:", address);
            console.log("🔍 Is connected:", isConnected);
          }}
          className="w-full px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
        >
          Log to Console
        </button>
      </div>
    </div>
  );
}
