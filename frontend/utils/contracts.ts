// Moove dApp Contract Configuration
// Centralized contract addresses and ABIs for modular management

// Contract Addresses (Updated with deployed contracts)
export const CONTRACT_ADDRESSES = {
  MooveAccessControl: "0x005672EcC14b09A958742B960Ebb76eBE52Be44A",
  MooveNFT: "0x40E455515bf712144C1A5D859F19d64b537754f7",
  MooveAuction: "0xE8f6836A0054B83b9a952e8B62D92e62f5c67606",
  MooveRentalPass: "0x74aAb47A0439B728A5956A1d7faAc6716F1F18Df",
} as const;

// Auction Types
export const AUCTION_TYPES = {
  ENGLISH: 0,
  DUTCH: 1,
  SEALED_BID: 2,
  RESERVE: 3,
} as const;

// Auction Status
export const AUCTION_STATUS = {
  PENDING: 0, // Created but not started
  ACTIVE: 1, // Currently accepting bids
  REVEAL: 2, // Sealed bid reveal phase
  ENDED: 3, // Finished, awaiting settlement
  SETTLED: 4, // Completed and settled
  CANCELLED: 5, // Cancelled by seller or admin
} as const;

// Vehicle Types
export const VEHICLE_TYPES = {
  CAR: 0,
  MOTORCYCLE: 1,
  SCOOTER: 2,
  BICYCLE: 3,
} as const;

// Vehicle Prices (in ETH)
export const VEHICLE_PRICES = {
  CAR: "0.1",
  MOTORCYCLE: "0.05",
  SCOOTER: "0.03",
  BICYCLE: "0.01",
} as const;

// Role Constants
export const ROLES = {
  DEFAULT_ADMIN_ROLE:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  MASTER_ADMIN_ROLE:
    "0xf83591f6d256ac9a12084d6de9c89a3e1fd09d594aa1184c76eef05bae103fc3",
  MINTER_ROLE:
    "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",
  AUCTION_MANAGER_ROLE:
    "0xfc15875e223f196de4d28f104664030b8067b4a40d0372ee3095567046e5e0b3",
} as const;

// Import ABIs
import MooveAccessControlABI from "@/src/abis/MooveAccessControl.json";
import MooveNFTABI from "@/src/abis/MooveNFT.json";
import MooveAuctionABI from "@/src/abis/MooveAuction.json";
import MooveRentalPassABI from "@/src/abis/MooveRentalPass.json";

// Helper function to extract ABI from different formats
function extractABI(abiData: any): any[] {
  // If it's already an array, return it
  if (Array.isArray(abiData)) {
    return abiData;
  }
  // If it's an object with 'abi' property, return that
  if (abiData && typeof abiData === "object" && "abi" in abiData) {
    return abiData.abi;
  }
  // Fallback
  return abiData;
}

// Contract Objects for Easy Access
export const contracts = {
  MooveAccessControl: {
    address: CONTRACT_ADDRESSES.MooveAccessControl,
    abi: extractABI(MooveAccessControlABI),
  },
  MooveNFT: {
    address: CONTRACT_ADDRESSES.MooveNFT,
    abi: extractABI(MooveNFTABI),
  },
  MooveAuction: {
    address: CONTRACT_ADDRESSES.MooveAuction,
    abi: extractABI(MooveAuctionABI),
  },
  MooveRentalPass: {
    address: CONTRACT_ADDRESSES.MooveRentalPass,
    abi: extractABI(MooveRentalPassABI),
  },
} as const;

// Wagmi Contract Configurations
export const auctionContractConfig = {
  address: CONTRACT_ADDRESSES.MooveAuction,
  abi: extractABI(MooveAuctionABI),
} as const;

export const nftContractConfig = {
  address: CONTRACT_ADDRESSES.MooveNFT,
  abi: extractABI(MooveNFTABI),
} as const;

export const accessControlContractConfig = {
  address: CONTRACT_ADDRESSES.MooveAccessControl,
  abi: extractABI(MooveAccessControlABI),
} as const;

export const rentalPassContractConfig = {
  address: CONTRACT_ADDRESSES.MooveRentalPass,
  abi: extractABI(MooveRentalPassABI),
} as const;

// Legacy exports for backward compatibility
export const CONTRACT_ABIS = {
  MooveAccessControl: extractABI(MooveAccessControlABI),
  MooveNFT: extractABI(MooveNFTABI),
  MooveAuction: extractABI(MooveAuctionABI),
  MooveRentalPass: extractABI(MooveRentalPassABI),
} as const;
