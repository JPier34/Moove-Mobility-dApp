"use client";

import { useAccount } from "wagmi";
import { useHasRole, useUserRoles } from "../../hooks/useContract";

const ROLES = {
  DEFAULT_ADMIN:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  MASTER_ADMIN:
    "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775",
  MINTER: "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",
  AUCTION_MANAGER:
    "0x2e1a7d4d13322e7b96f9a57413e1525c250fb7a9021cf91d1540d5b69f16a49f",
  CUSTOMIZATION_ADMIN:
    "0xf0887ba65ee2024ea881d91b74c2450ef19e1557f03bed3ea9f16b037cbe2dc9",
} as const;

export default function RoleChecker() {
  const { address, isConnected } = useAccount();
  const { isMasterAdmin, canMint, isLoading } = useUserRoles(address);

  const { data: hasDefaultAdmin } = useHasRole(ROLES.DEFAULT_ADMIN, address);
  const { data: hasMasterAdmin } = useHasRole(ROLES.MASTER_ADMIN, address);
  const { data: hasMinter } = useHasRole(ROLES.MINTER, address);
  const { data: hasAuctionManager } = useHasRole(
    ROLES.AUCTION_MANAGER,
    address
  );
  const { data: hasCustomizationAdmin } = useHasRole(
    ROLES.CUSTOMIZATION_ADMIN,
    address
  );

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-yellow-800">🔐 Connect wallet to check roles</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-blue-800">🔄 Checking wallet roles...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3 text-gray-900">
        🔐 Wallet Role Checker
      </h3>

      <div className="space-y-2 mb-4">
        <p className="text-sm text-gray-600">
          <strong>Wallet:</strong> {address}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-medium text-gray-800">Primary Roles</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span>Master Admin:</span>
              <span
                className={isMasterAdmin ? "text-green-600" : "text-red-600"}
              >
                {isMasterAdmin ? "✅ Yes" : "❌ No"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Can Mint NFTs:</span>
              <span className={canMint ? "text-green-600" : "text-red-600"}>
                {canMint ? "✅ Yes" : "❌ No"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-gray-800">Detailed Roles</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span>Default Admin:</span>
              <span
                className={hasDefaultAdmin ? "text-green-600" : "text-red-600"}
              >
                {hasDefaultAdmin ? "✅ Yes" : "❌ No"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Master Admin:</span>
              <span
                className={hasMasterAdmin ? "text-green-600" : "text-red-600"}
              >
                {hasMasterAdmin ? "✅ Yes" : "❌ No"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Minter:</span>
              <span className={hasMinter ? "text-green-600" : "text-red-600"}>
                {hasMinter ? "✅ Yes" : "❌ No"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Auction Manager:</span>
              <span
                className={
                  hasAuctionManager ? "text-green-600" : "text-red-600"
                }
              >
                {hasAuctionManager ? "✅ Yes" : "❌ No"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Customization Admin:</span>
              <span
                className={
                  hasCustomizationAdmin ? "text-green-600" : "text-red-600"
                }
              >
                {hasCustomizationAdmin ? "✅ Yes" : "❌ No"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Extension capability warning */}
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <h5 className="font-medium text-amber-800 mb-1">
          ⏰ English Auction Auto-Extension
        </h5>
        <p className="text-sm text-amber-700">
          {hasAuctionManager
            ? "✅ Your wallet can extend auctions. English auction auto-extension should work properly."
            : "⚠️ Your wallet cannot extend auctions. English auction auto-extension may not work - auctions may end as originally scheduled."}
        </p>
      </div>

      {/* Role explanations */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <h5 className="font-medium text-gray-800 mb-2">Role Explanations</h5>
        <div className="space-y-1 text-xs text-gray-600">
          <p>
            <strong>Default Admin:</strong> Can grant/revoke all roles
          </p>
          <p>
            <strong>Master Admin:</strong> Full system administration privileges
          </p>
          <p>
            <strong>Minter:</strong> Can mint new NFTs
          </p>
          <p>
            <strong>Auction Manager:</strong> Can extend auction durations
            (required for auto-extension)
          </p>
          <p>
            <strong>Customization Admin:</strong> Can modify system settings
          </p>
        </div>
      </div>
    </div>
  );
}

