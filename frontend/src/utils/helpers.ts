import { formatEther, parseEther } from "viem";
import { AuctionType, AuctionStatus } from "../types/auction";
import { VehicleType } from "../../../contracts/interfaces/IMooveVehicleNFT.sol";

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
