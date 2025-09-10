// Auto-generated contract configuration (UPDATED - NEW DEPLOYMENT)
import MooveAccessControlABI from "@/src/abis/MooveAccessControl.json";
import MooveNFTABI from "@/src/abis/MooveNFT.json";
import MooveAuctionABI from "@/src/abis/MooveAuction.json";

export const contracts = {
  MooveAccessControl: {
    address: "0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42",
    abi: (MooveAccessControlABI as any).abi,
  },
  MooveNFT: {
    address: "0x40E455515bf712144C1A5D859F19d64b537754f7",
    abi: (MooveNFTABI as any).abi,
  },
  MooveAuction: {
    address: "0xC2c1433FdF833640d0987625680DBe6Bc73416D8",
    abi: (MooveAuctionABI as any).abi,
  },
  MooveRentalPass: {
    address: "0x0a2af1Fc7E02F9FB82f1D727d325435D128A4127",
    abi: (MooveAccessControlABI as any).abi, // Using AccessControl ABI (same as rental pass)
  },
} as const;
