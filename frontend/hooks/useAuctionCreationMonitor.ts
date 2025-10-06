"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import MooveAuctionArtifact from "@/src/abis/MooveAuction.json";

interface AuctionCreationData {
  auctionId: number;
  tokenId: number;
  seller: string;
  auctionType: number;
  startPrice: string;
  reservePrice: string;
  buyNowPrice: string;
  duration: number;
  bidIncrement: string;
  extensionThreshold: number;
  extensionDuration: number;
  startTime: number;
  endTime: number;
  status: number;
  createdAt: string;
  transactionHash?: string;
}

/**
 * Hook per monitorare le aste create dall'admin panel in tempo reale
 * Mostra i dati reali dal contratto smart
 */
export function useAuctionCreationMonitor() {
  const { address, isConnected } = useAccount();
  const [auctions, setAuctions] = useState<AuctionCreationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuctions = useCallback(async () => {
    if (!isConnected || !address) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log("🔍 Fetching auction creation data from contract...");

      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || "https://1rpc.io/sepolia"
      );
      const contract = new ethers.Contract(
        contracts.MooveAuction.address,
        MooveAuctionArtifact.abi,
        provider
      );

      // Get current auction count
      const auctionStats = await contract.getAuctionStats();
      const auctionCount = auctionStats.totalAuctionsCount;
      console.log(`📊 Total auctions in contract: ${auctionCount}`);

      const auctionData: AuctionCreationData[] = [];

      // Fetch last 10 auctions (most recent)
      const startId = Math.max(0, Number(auctionCount) - 10);
      const endId = Number(auctionCount);

      for (let i = startId; i < endId; i++) {
        try {
          const rawAuctionData = await contract.getAuction(i);

          // Parse auction data using the same logic as useIncrementalAuctions
          const auctionDataParsed = {
            auctionId: i,
            tokenId: Number(rawAuctionData[2]), // tokenId
            seller: rawAuctionData[3], // seller
            auctionType: Number(rawAuctionData[4]), // auctionType
            startPrice: ethers.formatEther(rawAuctionData[9]), // startingPrice
            reservePrice: rawAuctionData[10]
              ? ethers.formatEther(rawAuctionData[10])
              : "0", // reservePrice
            buyNowPrice: rawAuctionData[11]
              ? ethers.formatEther(rawAuctionData[11])
              : "0", // buyNowPrice
            duration: Number(rawAuctionData[18]), // extensionDuration (duration in seconds)
            bidIncrement: rawAuctionData[13]
              ? ethers.formatEther(rawAuctionData[13])
              : "0", // bidIncrement
            extensionThreshold: rawAuctionData[17]
              ? Number(rawAuctionData[17])
              : 0, // extensionThreshold
            extensionDuration: rawAuctionData[18]
              ? Number(rawAuctionData[18])
              : 0, // extensionDuration
            startTime: Number(rawAuctionData[15]), // startTime
            endTime: Number(rawAuctionData[16]), // endTime
            status: Number(rawAuctionData[5]), // status
            createdAt: new Date(
              Number(rawAuctionData[15]) * 1000
            ).toISOString(), // Convert startTime to ISO string
          };

          auctionData.push(auctionDataParsed);

          console.log(`✅ Fetched auction ${i}:`, {
            tokenId: auctionDataParsed.tokenId,
            type: auctionDataParsed.auctionType,
            startPrice: auctionDataParsed.startPrice,
            duration: auctionDataParsed.duration,
            status: auctionDataParsed.status,
          });
        } catch (error) {
          console.warn(`⚠️ Failed to fetch auction ${i}:`, error);
        }
      }

      // Sort by creation time (newest first)
      auctionData.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setAuctions(auctionData);
      console.log(`📊 Loaded ${auctionData.length} auctions from contract`);
    } catch (error) {
      console.error("❌ Error fetching auction creation data:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  // Fetch on mount and when address changes
  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchAuctions, 30000);
    return () => clearInterval(interval);
  }, [fetchAuctions]);

  const getAuctionTypeName = (type: number) => {
    switch (type) {
      case 0:
        return "English";
      case 1:
        return "Dutch";
      case 2:
        return "Sealed Bid";
      case 3:
        return "Reserve";
      default:
        return "Unknown";
    }
  };

  const getStatusName = (status: number) => {
    switch (status) {
      case 0:
        return "PENDING";
      case 1:
        return "ACTIVE";
      case 2:
        return "REVEAL";
      case 3:
        return "ENDED";
      case 4:
        return "SETTLED";
      case 5:
        return "CANCELLED";
      default:
        return "UNKNOWN";
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return {
    auctions,
    isLoading,
    error,
    refresh: fetchAuctions,
    getAuctionTypeName,
    getStatusName,
    formatDuration,
  };
}
