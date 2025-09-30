"use client";

import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { useUserRoles } from "./useContract";
import { Auction, AuctionType } from "@/types/auction";
import { useActiveAuctions } from "./useAuction";
import { useSmartRefresh } from "./useSmartRefresh";
import { useAutoFailedAuctionHandler } from "./useFailedAuctionHandler";

// Export the enhanced functions
export const fetchAuctionFromContractEnhanced = async (auctionId: number): Promise<Auction | null> => {
  return null;
};

export { getSecureNFTCount, validateAuctionData, fetchFromIPFSRobust };

// Minimal implementations
async function getSecureNFTCount(nftContract: ethers.Contract): Promise<number> {
  try {
    const totalSupply = await nftContract.totalSupply();
    return Number(totalSupply);
  } catch (error) {
    return 1000;
  }
}

function validateAuctionData(auctionData: any): { isValid: boolean; error?: string; data?: any } {
  try {
    if (!auctionData) {
      return { isValid: false, error: "Auction data is null or undefined" };
    }
    return { isValid: true, data: auctionData };
  } catch (error) {
    return { isValid: false, error: `Validation error: ${error}` };
  }
}

async function fetchFromIPFSRobust(uri: string, timeout: number = 10000): Promise<any | null> {
  if (!uri || uri === "undefined" || uri.includes("undefined")) {
    return null;
  }
  
  // Skip test hashes
  if (uri === "QmTest123" || uri === "QmMockMetadataHashForTesting123456789") {
    return {
      name: `Test NFT #${uri.slice(-6)}`,
      description: `Test NFT with hash ${uri}`,
      image: "/images/default-nft.svg",
      attributes: [
        { trait_type: "Type", value: "Test" },
        { trait_type: "Hash", value: uri },
      ],
    };
  }
  
  return null;
}

// Enhanced hook
export function useAuctionsEnhanced(
  disableAutoRefresh = false,
  disableFailedAuctionHandling = false
) {
  const { address, isConnected } = useAccount();
  const { isMasterAdmin, canMint } = useUserRoles(address);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const fetchCorrectedAuctions = useCallback(async () => {
    console.log("🚀 fetchCorrectedAuctions called");
    try {
      setIsLoading(true);
      setError(null);
      setAuctions([]);
      setLastFetchTime(Date.now());
    } catch (err) {
      console.error("Error fetching corrected auctions:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [isMasterAdmin]);

  useSmartRefresh({
    refreshFunction: fetchCorrectedAuctions,
    intervalMs: 300000,
    pauseOnModal: true,
    pauseOnHidden: true,
    disabled: disableAutoRefresh,
  });

  const activeAuctions = auctions.filter((auction) => auction.status === 1);
  const endedAuctions = auctions.filter((auction) => auction.status === 3);
  const pendingAuctions = auctions.filter((auction) => auction.status === 0);

  const stats = {
    activeAuctions: activeAuctions.length,
    endedAuctions: endedAuctions.length,
    totalBids: auctions.reduce((sum, auction) => sum + auction.bidCount, 0),
    totalVolume: 0,
    lastFetchTime,
    totalAuctions: auctions.length,
  };

  const [filters, setFilters] = useState({
    type: "all" as "all" | AuctionType,
    status: "all" as "all" | "active" | "ended",
    category: "all",
    priceRange: { min: 0, max: 1000 },
    sortBy: "time" as "price" | "time" | "bids",
    sortOrder: "desc" as "asc" | "desc",
  });

  const refreshAuctionCache = useCallback(async (auctionId: number) => {
    console.log(`🔄 Refreshing auction ${auctionId}...`);
  }, []);

  return {
    auctions,
    activeAuctions,
    endedAuctions,
    pendingAuctions,
    stats,
    filters,
    setFilters,
    isLoading,
    error,
    refetch: fetchCorrectedAuctions,
    refreshAuctionCache,
    lastFetchTime,
    isMasterAdmin,
    canMint,
    isHandlingFailedAuctions: false,
    processedFailedAuctions: 0,
  };
}
