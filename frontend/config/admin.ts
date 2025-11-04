// Admin Configuration
// Centralized admin address management
// NO HARDCODED ADDRESSES - All addresses come from environment variables

import { CONTRACT_ADDRESSES } from "@/utils/contracts";

// Get master admin address from environment
function getMasterAdminAddress(): string {
  const value = process.env.NEXT_PUBLIC_MASTER_WALLET_ADDRESS?.trim() || "";
  return value && value !== "your_..._address_here" && value !== "0x..." ? value : "";
}

// Admin Role Hashes (computed from contract - these are constants, not addresses)
export const ADMIN_CONFIG = {
  // Admin Role Hashes (computed from contract)
  ROLES: {
    MASTER_ADMIN_ROLE:
      "0xf83591f6d256ac9a12084d6de9c89a3e1fd09d594aa1184c76eef05bae103fc3",
    MINTER_ROLE:
      "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",
    AUCTION_MANAGER_ROLE:
      "0xfc15875e223f196de4d28f104664030b8067b4a40d0372ee3095567046e5e0b3",
  },

  // Admin Permissions
  PERMISSIONS: {
    CAN_MINT_NFT: true,
    CAN_CREATE_AUCTIONS: true,
    CAN_MANAGE_AUCTIONS: true,
    CAN_ACCESS_ADMIN_PANEL: true,
    CAN_VIEW_DEBUG_INFO: true,
  },
} as const;

// Helper function to get admin address from environment
// Returns empty string if not configured (graceful degradation)
export function getAdminAddress(): string {
  try {
    return getMasterAdminAddress();
  } catch (error) {
    // Graceful degradation - admin features will be disabled but app won't crash
    console.warn("⚠️ [ADMIN] Could not load master admin address:", error);
    return "";
  }
}
