import { formatEther, parseEther } from "viem";
import { AuctionType, AuctionStatus } from "../types/auction";
import { VehicleType } from "@/types/nft";

// ABI for the Moove Vehicle NFT contract (copied from the contract)
export const MOOVE_NFT_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getVehicleInfo",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "tokenId", type: "uint256" },
          {
            internalType: "enum IMooveVehicleNFT.VehicleType",
            name: "vehicleType",
            type: "uint8",
          },
          { internalType: "string", name: "name", type: "string" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "uint256", name: "dailyRate", type: "uint256" },
          { internalType: "bool", name: "isActive", type: "bool" },
          { internalType: "address", name: "currentOwner", type: "address" },
        ],
        internalType: "struct IMooveVehicleNFT.VehicleInfo",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      {
        internalType: "enum IMooveVehicleNFT.VehicleType",
        name: "vehicleType",
        type: "uint8",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export function createMooveNFTContract(address: string, signer: any) {
  const { Contract } = require("ethers");
  return new Contract(address, MOOVE_NFT_ABI, signer);
}

export function formatPrice(price: bigint): string {
  return `${formatEther(price)} ETH`;
}

export function parsePrice(price: string): bigint {
  return parseEther(price);
}

export function getVehicleTypeName(type: VehicleType): string {
  const names = {
    [VehicleType.BIKE]: "Electric Bike",
    [VehicleType.SCOOTER]: "Electric Scooter",
    [VehicleType.MONOPATTINO]: "Electric Monopattino",
  };
  return names[type] || "Unknown Vehicle";
}

export function getVehicleTypeIcon(type: VehicleType): string {
  const icons = {
    [VehicleType.BIKE]: "🚲",
    [VehicleType.SCOOTER]: "🛴",
    [VehicleType.MONOPATTINO]: "🛵",
  };
  return icons[type] || "🚗";
}

export function getAuctionTypeName(type: AuctionType): string {
  const names = {
    [AuctionType.TRADITIONAL]: "Traditional",
    [AuctionType.ENGLISH]: "English",
    [AuctionType.DUTCH]: "Dutch",
    [AuctionType.SEALED_BID]: "Sealed Bid",
  };
  return names[type] || "Unknown Auction";
}

export function getAuctionStatusName(status: AuctionStatus): string {
  const names = {
    [AuctionStatus.ACTIVE]: "Active",
    [AuctionStatus.ENDED]: "Ended",
    [AuctionStatus.CANCELLED]: "Cancelled",
    [AuctionStatus.REVEALING]: "Revealing",
  };
  return names[status] || "Unknown Status";
}

export function getAuctionStatusColor(status: AuctionStatus): string {
  const colors = {
    [AuctionStatus.ACTIVE]: "bg-green-100 text-green-800",
    [AuctionStatus.ENDED]: "bg-gray-100 text-gray-800",
    [AuctionStatus.CANCELLED]: "bg-red-100 text-red-800",
    [AuctionStatus.REVEALING]: "bg-yellow-100 text-yellow-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function formatTimeRemaining(endTime: bigint): string {
  const now = Math.floor(Date.now() / 1000);
  const end = Number(endTime);
  const remaining = end - now;

  if (remaining <= 0) return "Ended";

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function truncateAddress(address: string, length = 6): string {
  if (!address) return "";
  return `${address.slice(0, length)}...${address.slice(-4)}`;
}

export function getExplorerUrl(
  hash: string,
  type: "tx" | "address" = "tx"
): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_EXPLORER_URL || "https://sepolia.etherscan.io";
  return `${baseUrl}/${type}/${hash}`;
}

export function formatCurrency(amount: bigint, decimals = 18): string {
  const formatted = formatEther(amount);
  const num = parseFloat(formatted);
  return num.toLocaleString("it-IT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

export function formatDate(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString("it-IT", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
