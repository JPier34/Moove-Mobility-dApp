"use client";

import React from "react";
import { useAccount } from "wagmi";
import { useUserRoles, useHasRole } from "@/hooks/useContract";

const ROLES = {
  DEFAULT_ADMIN:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  MASTER_ADMIN:
    "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775", // keccak256("MASTER_ADMIN_ROLE")
  MINTER: "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6", // keccak256("MINTER_ROLE")
  AUCTION_MANAGER:
    "0x2e1a7d4d13322e7b96f9a57413e1525c250fb7a9021cf91d1540d5b69f16a49f", // keccak256("AUCTION_MANAGER_ROLE")
  CUSTOMIZATION_ADMIN:
    "0xf0887ba65ee2024ea881d91b74c2450ef19e1557f03bed3ea9f16b037cbe2dc9", // keccak256("CUSTOMIZATION_ADMIN_ROLE")
} as const;

export function AdminPermissionsDebug() {
  const { address, isConnected } = useAccount();
  const { canMint, isMasterAdmin, isLoading } = useUserRoles(address);

  // Check individual roles
  const defaultAdmin = useHasRole(ROLES.DEFAULT_ADMIN, address);
  const masterAdminRole = useHasRole(ROLES.MASTER_ADMIN, address);
  const minterRole = useHasRole(ROLES.MINTER, address);
  const auctionManagerRole = useHasRole(ROLES.AUCTION_MANAGER, address);
  const customizationAdminRole = useHasRole(ROLES.CUSTOMIZATION_ADMIN, address);

  const roleChecks = [
    {
      name: "Default Admin",
      role: ROLES.DEFAULT_ADMIN,
      hasRole: defaultAdmin.data || false,
      isLoading: defaultAdmin.isLoading,
    },
    {
      name: "Master Admin",
      role: ROLES.MASTER_ADMIN,
      hasRole: masterAdminRole.data || false,
      isLoading: masterAdminRole.isLoading,
    },
    {
      name: "Minter",
      role: ROLES.MINTER,
      hasRole: minterRole.data || false,
      isLoading: minterRole.isLoading,
    },
    {
      name: "Auction Manager",
      role: ROLES.AUCTION_MANAGER,
      hasRole: auctionManagerRole.data || false,
      isLoading: auctionManagerRole.isLoading,
    },
    {
      name: "Customization Admin",
      role: ROLES.CUSTOMIZATION_ADMIN,
      hasRole: customizationAdminRole.data || false,
      isLoading: customizationAdminRole.isLoading,
    },
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-3">
        Admin Permissions Debug
      </h3>

      <div className="space-y-3">
        {/* Wallet Status */}
        <div className="p-3 bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-white mb-2">Wallet Status</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-300">Connected:</span>
              <span className={isConnected ? "text-green-400" : "text-red-400"}>
                {isConnected ? "✅ Yes" : "❌ No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Address:</span>
              <span className="text-gray-400 font-mono text-xs">
                {address
                  ? `${address.slice(0, 6)}...${address.slice(-4)}`
                  : "Not connected"}
              </span>
            </div>
          </div>
        </div>

        {/* Role Checks */}
        <div className="p-3 bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-white mb-2">Role Checks</h4>
          <div className="space-y-2">
            {roleChecks.map((check, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-3 h-3 rounded-full flex items-center justify-center text-xs ${
                      check.isLoading
                        ? "bg-yellow-500 text-white animate-pulse"
                        : check.hasRole
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {check.isLoading ? "⏳" : check.hasRole ? "✓" : "✗"}
                  </span>
                  <span className="text-gray-300 text-xs">{check.name}</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">
                  {check.role.slice(0, 10)}...
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="p-3 bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-white mb-2">Summary</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-300">isMasterAdmin:</span>
              <span
                className={isMasterAdmin ? "text-green-400" : "text-red-400"}
              >
                {isMasterAdmin ? "✅ true" : "❌ false"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">canMint:</span>
              <span className={canMint ? "text-green-400" : "text-red-400"}>
                {canMint ? "✅ true" : "❌ false"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Loading:</span>
              <span
                className={isLoading ? "text-yellow-400" : "text-green-400"}
              >
                {isLoading ? "⏳ true" : "✅ false"}
              </span>
            </div>
          </div>
        </div>

        {/* Contract Info */}
        <div className="p-3 bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-white mb-2">Contract Info</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-300">AccessControl:</span>
              <span className="text-gray-400 font-mono">
                0x01EfE9998c764bc1f41E71DBa0f946Ad057E50C2
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


