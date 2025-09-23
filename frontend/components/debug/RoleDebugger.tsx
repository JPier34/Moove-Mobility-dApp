"use client";

import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

const ROLES = {
  DEFAULT_ADMIN:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  MASTER_ADMIN:
    "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775",
  MINTER: "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",
  AUCTION_MANAGER:
    "0x2e1a7d4d13322e7b96f9a57413e1525c250fb7a9021cf91d1540d5b69f16a49f",
} as const;

interface RoleCheckResult {
  account: string;
  roles: {
    DEFAULT_ADMIN: boolean;
    MASTER_ADMIN: boolean;
    MINTER: boolean;
    AUCTION_MANAGER: boolean;
  };
  roleConstants: {
    DEFAULT_ADMIN_ROLE: string;
    MASTER_ADMIN_ROLE: string;
    MINTER_ROLE: string;
    AUCTION_MANAGER_ROLE: string;
  };
  contractAddress: string;
  errors: string[];
}

export default function RoleDebugger() {
  const { address, isConnected } = useAccount();
  const [roleInfo, setRoleInfo] = useState<RoleCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkRoles = async (accountAddress: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No ethereum provider available");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);

      // Use MooveAccessControl contract for access control
      const accessControlContract = new ethers.Contract(
        contracts.MooveAccessControl.address,
        contracts.MooveAccessControl.abi,
        provider
      );

      console.log(`🔍 Checking roles for account: ${accountAddress}`);
      console.log(`📋 Using contract: ${contracts.MooveAccessControl.address}`);

      // Get role constants from contract
      let roleConstants = {
        DEFAULT_ADMIN_ROLE: ROLES.DEFAULT_ADMIN,
        MASTER_ADMIN_ROLE: ROLES.MASTER_ADMIN,
        MINTER_ROLE: ROLES.MINTER,
        AUCTION_MANAGER_ROLE: ROLES.AUCTION_MANAGER,
      };

      try {
        // Try to get role constants from contract
        roleConstants.DEFAULT_ADMIN_ROLE =
          await accessControlContract.DEFAULT_ADMIN_ROLE();
        roleConstants.MASTER_ADMIN_ROLE =
          await accessControlContract.MASTER_ADMIN_ROLE();
        roleConstants.MINTER_ROLE = await accessControlContract.MINTER_ROLE();
        roleConstants.AUCTION_MANAGER_ROLE =
          await accessControlContract.AUCTION_MANAGER_ROLE();

        console.log("📋 Role constants from contract:", roleConstants);
      } catch (roleConstantError) {
        console.warn(
          "⚠️ Could not get role constants from contract, using hardcoded values:",
          roleConstantError
        );
      }

      // Check each role
      const roles = {
        DEFAULT_ADMIN: false,
        MASTER_ADMIN: false,
        MINTER: false,
        AUCTION_MANAGER: false,
      };

      try {
        roles.DEFAULT_ADMIN = await accessControlContract.hasRole(
          roleConstants.DEFAULT_ADMIN_ROLE,
          accountAddress
        );
        roles.MASTER_ADMIN = await accessControlContract.hasRole(
          roleConstants.MASTER_ADMIN_ROLE,
          accountAddress
        );
        roles.MINTER = await accessControlContract.hasRole(
          roleConstants.MINTER_ROLE,
          accountAddress
        );
        roles.AUCTION_MANAGER = await accessControlContract.hasRole(
          roleConstants.AUCTION_MANAGER_ROLE,
          accountAddress
        );

        console.log("✅ Role checks completed:", roles);
      } catch (roleError) {
        console.error("❌ Error checking roles:", roleError);
        throw roleError;
      }

      const result: RoleCheckResult = {
        account: accountAddress,
        roles,
        roleConstants,
        contractAddress: contracts.MooveAccessControl.address,
        errors: [],
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
      checkRoles(address);
    }
  }, [address, isConnected]);

  const handleManualCheck = () => {
    if (address) {
      checkRoles(address);
    }
  };

  const getRoleStatus = (hasRole: boolean) => {
    return hasRole ? "✅" : "❌";
  };

  const getRoleColor = (hasRole: boolean) => {
    return hasRole ? "text-green-400" : "text-red-400";
  };

  // Check if this is the master wallet
  const MASTER_WALLET = "0x777382955f33Bb8540602E914D9b650C962EF6Cc";
  const isMasterWallet = address?.toLowerCase() === MASTER_WALLET.toLowerCase();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/90 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-md">
      <div className="font-bold mb-3 text-purple-400">🔐 Role Debugger</div>

      {isLoading && (
        <div className="text-yellow-400 mb-3">🔄 Checking roles...</div>
      )}

      {error && <div className="text-red-400 mb-3">❌ Error: {error}</div>}

      {roleInfo && (
        <div className="space-y-3">
          {/* Account Info */}
          <div>
            <div className="text-yellow-400 font-semibold">Account:</div>
            <div className="break-all">{roleInfo.account}</div>
            <div>Master Wallet: {isMasterWallet ? "✅" : "❌"}</div>
          </div>

          {/* Contract Info */}
          <div>
            <div className="text-yellow-400 font-semibold">Contract:</div>
            <div className="break-all text-xs">{roleInfo.contractAddress}</div>
          </div>

          {/* Roles */}
          <div>
            <div className="text-yellow-400 font-semibold">Roles:</div>
            <div className={`${getRoleColor(roleInfo.roles.DEFAULT_ADMIN)}`}>
              {getRoleStatus(roleInfo.roles.DEFAULT_ADMIN)} DEFAULT_ADMIN
            </div>
            <div className={`${getRoleColor(roleInfo.roles.MASTER_ADMIN)}`}>
              {getRoleStatus(roleInfo.roles.MASTER_ADMIN)} MASTER_ADMIN
            </div>
            <div className={`${getRoleColor(roleInfo.roles.MINTER)}`}>
              {getRoleStatus(roleInfo.roles.MINTER)} MINTER
            </div>
            <div className={`${getRoleColor(roleInfo.roles.AUCTION_MANAGER)}`}>
              {getRoleStatus(roleInfo.roles.AUCTION_MANAGER)} AUCTION_MANAGER
            </div>
          </div>

          {/* Role Constants */}
          <details className="border-t border-gray-600 pt-2">
            <summary className="text-yellow-400 cursor-pointer">
              Role Constants
            </summary>
            <div className="text-xs mt-2 space-y-1">
              <div>
                DEFAULT_ADMIN: {roleInfo.roleConstants.DEFAULT_ADMIN_ROLE}
              </div>
              <div>
                MASTER_ADMIN: {roleInfo.roleConstants.MASTER_ADMIN_ROLE}
              </div>
              <div>MINTER: {roleInfo.roleConstants.MINTER_ROLE}</div>
              <div>
                AUCTION_MANAGER: {roleInfo.roleConstants.AUCTION_MANAGER_ROLE}
              </div>
            </div>
          </details>

          {/* Summary */}
          <div className="border-t border-gray-600 pt-2">
            <div className="text-yellow-400 font-semibold">Access Summary:</div>
            {isMasterWallet ? (
              <div className="text-green-400">
                🎯 Master Wallet - Hardcoded Access!
              </div>
            ) : roleInfo.roles.MASTER_ADMIN ? (
              <div className="text-green-400">
                🎯 MASTER_ADMIN - Full access!
              </div>
            ) : roleInfo.roles.MINTER ? (
              <div className="text-green-400">🎯 MINTER - Can mint NFTs</div>
            ) : roleInfo.roles.AUCTION_MANAGER ? (
              <div className="text-green-400">
                🎯 AUCTION_MANAGER - Can manage auctions
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
          {isLoading ? "Checking..." : "Check Roles"}
        </button>

        <button
          onClick={() => {
            console.log("🔍 Current role info:", roleInfo);
            console.log("🔍 Account address:", address);
            console.log("🔍 Is master wallet:", isMasterWallet);
            console.log(
              "🔍 Contract address:",
              contracts.MooveAccessControl.address
            );
          }}
          className="w-full px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
        >
          Log to Console
        </button>
      </div>
    </div>
  );
}
