"use client";

import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

interface AdminAccessInfo {
  account: string;
  isMasterWallet: boolean;
  hasContractRoles: boolean;
  contractRoles: {
    MASTER_ADMIN: boolean;
    MINTER: boolean;
    AUCTION_MANAGER: boolean;
  };
  adminPanelAccess: boolean;
  headerAccess: boolean;
  issues: string[];
  solutions: string[];
}

export default function AdminAccessDebugger() {
  const { address, isConnected } = useAccount();
  const [accessInfo, setAccessInfo] = useState<AdminAccessInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAdminAccess = async (accountAddress: string) => {
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

      console.log(`🔍 Checking admin access for account: ${accountAddress}`);

      // Check if this is the master wallet
      const MASTER_WALLET = "0x777382955f33Bb8540602E914D9b650C962EF6Cc";
      const isMasterWallet =
        accountAddress.toLowerCase() === MASTER_WALLET.toLowerCase();

      // Check contract roles
      const contractRoles = {
        MASTER_ADMIN: false,
        MINTER: false,
        AUCTION_MANAGER: false,
      };

      try {
        const MASTER_ADMIN_ROLE =
          await accessControlContract.MASTER_ADMIN_ROLE();
        const MINTER_ROLE = await accessControlContract.MINTER_ROLE();
        const AUCTION_MANAGER_ROLE =
          await accessControlContract.AUCTION_MANAGER_ROLE();

        contractRoles.MASTER_ADMIN = await accessControlContract.hasRole(
          MASTER_ADMIN_ROLE,
          accountAddress
        );
        contractRoles.MINTER = await accessControlContract.hasRole(
          MINTER_ROLE,
          accountAddress
        );
        contractRoles.AUCTION_MANAGER = await accessControlContract.hasRole(
          AUCTION_MANAGER_ROLE,
          accountAddress
        );

        console.log("✅ Contract role checks completed:", contractRoles);
      } catch (roleError) {
        console.error("❌ Error checking contract roles:", roleError);
      }

      const hasContractRoles =
        contractRoles.MASTER_ADMIN ||
        contractRoles.MINTER ||
        contractRoles.AUCTION_MANAGER;

      // Determine access based on current logic
      const adminPanelAccess = isMasterWallet || hasContractRoles;
      const headerAccess = isMasterWallet || hasContractRoles;

      // Identify issues and solutions
      const issues: string[] = [];
      const solutions: string[] = [];

      if (!isMasterWallet && !hasContractRoles) {
        issues.push("Account has no admin privileges in the contract");
        solutions.push(
          "Grant MASTER_ADMIN role to this account in the contract"
        );
        solutions.push("Or grant MINTER role for NFT creation access");
        solutions.push("Or grant AUCTION_MANAGER role for auction management");
      }

      if (!isMasterWallet && hasContractRoles) {
        issues.push("Account has contract roles but is not the master wallet");
        solutions.push("This is normal - contract roles should work");
      }

      if (isMasterWallet && !hasContractRoles) {
        issues.push("Master wallet has no contract roles");
        solutions.push("Consider granting contract roles for redundancy");
        solutions.push("Or rely on hardcoded master wallet access");
      }

      const info: AdminAccessInfo = {
        account: accountAddress,
        isMasterWallet,
        hasContractRoles,
        contractRoles,
        adminPanelAccess,
        headerAccess,
        issues,
        solutions,
      };

      setAccessInfo(info);
      console.log("🎯 Admin access check completed:", info);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("❌ Admin access check failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (address && isConnected) {
      checkAdminAccess(address);
    }
  }, [address, isConnected]);

  const handleManualCheck = () => {
    if (address) {
      checkAdminAccess(address);
    }
  };

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-md max-h-96 overflow-y-auto">
      <div className="font-bold mb-3 text-orange-400">
        🚨 Admin Access Debugger
      </div>

      {isLoading && (
        <div className="text-yellow-400 mb-3">🔄 Checking admin access...</div>
      )}

      {error && <div className="text-red-400 mb-3">❌ Error: {error}</div>}

      {accessInfo && (
        <div className="space-y-3">
          {/* Account Info */}
          <div>
            <div className="text-yellow-400 font-semibold">Account:</div>
            <div className="break-all">{accessInfo.account}</div>
            <div>Master Wallet: {accessInfo.isMasterWallet ? "✅" : "❌"}</div>
          </div>

          {/* Contract Roles */}
          <div>
            <div className="text-yellow-400 font-semibold">Contract Roles:</div>
            <div
              className={
                accessInfo.contractRoles.MASTER_ADMIN
                  ? "text-green-400"
                  : "text-red-400"
              }
            >
              {accessInfo.contractRoles.MASTER_ADMIN ? "✅" : "❌"} MASTER_ADMIN
            </div>
            <div
              className={
                accessInfo.contractRoles.MINTER
                  ? "text-green-400"
                  : "text-red-400"
              }
            >
              {accessInfo.contractRoles.MINTER ? "✅" : "❌"} MINTER
            </div>
            <div
              className={
                accessInfo.contractRoles.AUCTION_MANAGER
                  ? "text-green-400"
                  : "text-red-400"
              }
            >
              {accessInfo.contractRoles.AUCTION_MANAGER ? "✅" : "❌"}{" "}
              AUCTION_MANAGER
            </div>
          </div>

          {/* Access Status */}
          <div>
            <div className="text-yellow-400 font-semibold">Access Status:</div>
            <div
              className={
                accessInfo.adminPanelAccess ? "text-green-400" : "text-red-400"
              }
            >
              {accessInfo.adminPanelAccess ? "✅" : "❌"} Admin Panel Access
            </div>
            <div
              className={
                accessInfo.headerAccess ? "text-green-400" : "text-red-400"
              }
            >
              {accessInfo.headerAccess ? "✅" : "❌"} Header Admin Link
            </div>
          </div>

          {/* Issues */}
          {accessInfo.issues.length > 0 && (
            <div>
              <div className="text-red-400 font-semibold">Issues:</div>
              {accessInfo.issues.map((issue, i) => (
                <div key={i} className="text-red-300">
                  • {issue}
                </div>
              ))}
            </div>
          )}

          {/* Solutions */}
          {accessInfo.solutions.length > 0 && (
            <div>
              <div className="text-green-400 font-semibold">Solutions:</div>
              {accessInfo.solutions.map((solution, i) => (
                <div key={i} className="text-green-300">
                  • {solution}
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="border-t border-gray-600 pt-2">
            <div className="text-yellow-400 font-semibold">Summary:</div>
            {accessInfo.adminPanelAccess ? (
              <div className="text-green-400">🎯 Admin access should work!</div>
            ) : (
              <div className="text-red-400">❌ Admin access blocked</div>
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
          {isLoading ? "Checking..." : "Check Admin Access"}
        </button>

        <button
          onClick={() => {
            console.log("🔍 Current admin access info:", accessInfo);
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
