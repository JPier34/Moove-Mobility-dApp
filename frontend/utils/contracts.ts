// Import ABI from JSON files (more reliable)
import MooveNFTABI from "../src/abis/MooveNFT.json";
import MooveAuctionABI from "../src/abis/MooveAuction.json";
import MooveAccessControlABI from "../src/abis/MooveAccessControl.json";

// Type assertion for JSON imports
const nftABI = MooveNFTABI as any;
const auctionABI = MooveAuctionABI as any;
const accessControlABI = MooveAccessControlABI as any;

// Auto-generated contract configuration
export const contracts = {
  MooveNFT: {
    address: "0x40E455515bf712144C1A5D859F19d64b537754f7", // NFT contract address
    abi: nftABI.abi,
  },
  MooveAuction: {
    address: "0xF3A15bf233D28435E338DFF2aF2E33c72b701525", // CORRECTED auction contract address
    abi: auctionABI.abi,
  },
  MooveAccessControl: {
    address: "0x005672EcC14b09A958742B960Ebb76eBE52Be44A",
    abi: accessControlABI,
  },
  MooveRentalPass: {
    address: "0x8fd53ca6D96a3fF33b820E0531d2446524E6400C",
    abi: [], // Add ABI if needed
  },
} as const;
