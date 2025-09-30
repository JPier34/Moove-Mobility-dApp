// Admin Configuration
// Centralized admin address management

export const ADMIN_CONFIG = {
  // Master Admin Address - Change this when admin wallet changes
  MASTER_ADMIN_ADDRESS: "0x777382955f33Bb8540602E914D9b650C962EF6Cc",

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

// Helper function to check if address is admin
export function isAdminAddress(address: string): boolean {
  const adminAddress = getAdminAddress();
  return address.toLowerCase() === adminAddress.toLowerCase();
}

// Helper function to get admin address
export function getAdminAddress(): string {
  return (
    process.env.NEXT_PUBLIC_MASTER_WALLET_ADDRESS ||
    ADMIN_CONFIG.MASTER_ADMIN_ADDRESS
  );
}
