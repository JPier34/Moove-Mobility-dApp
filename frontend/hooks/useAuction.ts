"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { useReadMooveAuction, useWriteMooveAuction } from "./useContract";
import { Auction, Bid, AuctionType, AuctionStatus } from "@/types/auction";
import { useUserRoles } from "./useContract";
import { contracts } from "@/utils/contracts";
import { ethers } from "ethers";
import {
  fetchAuctionFromContractEnhanced,
  useAuctionsEnhanced,
} from "./enhanced-auction-utils";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AuctionFilters {
  type: AuctionType | "all";
  status: "active" | "ended" | "all";
  category: string;
  priceRange: {
    min: number;
    max: number;
  };
  sortBy: "price" | "time" | "bids";
  sortOrder: "asc" | "desc";
}

interface AuctionStats {
  activeAuctions: number;
  totalBids: number;
  endedAuctions: number;
  totalVolume: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Function to fetch individual auction details from contract
// Use the enhanced auction fetching function
const fetchAuctionFromContract = fetchAuctionFromContractEnhanced;

// ============================================================================
// SINGLE AUCTION HOOKS
// ============================================================================

export function useActiveAuctions() {
  const {
    data: auctionIds,
    isLoading,
    error,
    refetch,
  } = useReadMooveAuction<number[]>("getActiveAuctions");

  console.log(`🔍 useActiveAuctions result:`, {
    auctionIds,
    isLoading,
    error,
    count: auctionIds?.length || 0,
  });

  return { auctionIds, isLoading, error, refetch };
}

export function useAuction(auctionId: number) {
  const {
    data: auction,
    isLoading,
    error,
  } = useReadMooveAuction<Auction>("getAuction", [auctionId], {
    enabled: auctionId >= 0,
  });

  return { auction, isLoading, error };
}

export function useAuctionBids(auctionId: number) {
  const {
    data: bids,
    isLoading,
    error,
  } = useReadMooveAuction<Bid[]>("getAuctionBids", [auctionId], {
    enabled: auctionId >= 0,
  });

  return { bids, isLoading, error };
}

export function useCurrentDutchPrice(auctionId: number) {
  const {
    data: price,
    isLoading,
    error,
  } = useReadMooveAuction<bigint>("getCurrentDutchPrice", [auctionId], {
    enabled: auctionId >= 0,
  });

  return { price, isLoading, error };
}

// ============================================================================
// AUCTION CREATION & MANAGEMENT HOOKS
// ============================================================================
// Note: useCreateAuction removed - use useSecureNFTAuctionFlow instead

export function usePlaceBid() {
  const { writeMooveAuction, isPending, isSuccess, error, hash } =
    useWriteMooveAuction();

  const placeBid = (auctionId: number, bidAmount: bigint) => {
    console.log("🎯 usePlaceBid: Calling writeMooveAuction", {
      auctionId,
      bidAmount: bidAmount.toString(),
      isPending,
      isSuccess,
    });
    writeMooveAuction("placeBid", [auctionId], bidAmount);
  };

  // ✅ OPTIMIZED: Removed automatic refresh events to prevent re-render loops
  // The AuctionModal will handle refresh events only after MetaMask confirmation

  return {
    placeBid,
    isPending,
    isSuccess,
    error,
    hash,
  };
}

export function useEndAuction() {
  const { writeMooveAuction, isPending, isSuccess, error, hash } =
    useWriteMooveAuction();

  const endAuction = (auctionId: number) => {
    writeMooveAuction("endAuction", [auctionId]);
  };

  return {
    endAuction,
    isPending,
    isSuccess,
    error,
    hash,
  };
}

export function useClaimNFT() {
  const { writeMooveAuction, isPending, isSuccess, error, hash } =
    useWriteMooveAuction();

  const claimNFT = (auctionId: number) => {
    writeMooveAuction("claimNFT", [auctionId]);
  };

  return {
    claimNFT,
    isPending,
    isSuccess,
    error,
    hash,
  };
}

// ============================================================================
// DUTCH AUCTION SIMPLIFIED HOOKS
// ============================================================================

export function useBuyNowDutch() {
  const { writeMooveAuction, isPending, isSuccess, error, hash } =
    useWriteMooveAuction();

  const buyNowDutch = (auctionId: number, value: bigint) => {
    writeMooveAuction("buyNowDutch", [auctionId], value);
  };

  return {
    buyNowDutch,
    isPending,
    isSuccess,
    error,
    hash,
  };
}

export function useStartRevealPhase() {
  const { writeMooveAuction, isPending, isSuccess, error, hash } =
    useWriteMooveAuction();

  const startRevealPhase = (auctionId: number) => {
    writeMooveAuction("startRevealPhase", [auctionId]);
  };

  return {
    startRevealPhase,
    isPending,
    isSuccess,
    error,
    hash,
  };
}

export function useRefundRemainingBidders() {
  const { writeMooveAuction, isPending, isSuccess, error, hash } =
    useWriteMooveAuction();

  const refundRemainingBidders = (
    auctionId: number,
    startIndex: number,
    batchSize: number
  ) => {
    writeMooveAuction("refundRemainingBidders", [
      auctionId,
      startIndex,
      batchSize,
    ]);
  };

  return {
    refundRemainingBidders,
    isPending,
    isSuccess,
    error,
    hash,
  };
}

// ============================================================================
// COLLECTION & FILTERING HOOKS
// ============================================================================

export function useAuctions() {
  const { address, isConnected } = useAccount();
  const { isMasterAdmin, canMint } = useUserRoles(address);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [filters, setFilters] = useState<AuctionFilters>({
    type: "all",
    status: "all",
    category: "all",
    priceRange: { min: 0, max: 1000 },
    sortBy: "time",
    sortOrder: "desc",
  });

  // Use existing hook to get active auctions
  const {
    auctionIds,
    isLoading: isLoadingActive,
    error: activeError,
    refetch: refetchActive,
  } = useActiveAuctions();

  // Fetch individual auction details when auctionIds change
  useEffect(() => {
    console.log("🔍 useAuctions: auctionIds changed", {
      auctionIds,
      length: auctionIds?.length,
    });

    if (auctionIds && auctionIds.length > 0) {
      console.log(
        "🔍 useAuctions: Fetching auction details for",
        auctionIds.length,
        "auctions"
      );

      const fetchAuctionDetails = async () => {
        const auctionPromises = auctionIds.map(async (auctionId) => {
          try {
            console.log(`🔍 Fetching auction ${auctionId} details...`);
            const auctionData = await fetchAuctionFromContract(auctionId);

            if (auctionData) {
              console.log(`✅ Auction ${auctionId} fetched:`, auctionData);
              return auctionData;
            } else {
              console.warn(`⚠️ Auction ${auctionId} not found or invalid`);
              return null;
            }
          } catch (error) {
            console.error(`❌ Error fetching auction ${auctionId}:`, error);
            return null;
          }
        });

        const auctionDetails = await Promise.all(auctionPromises);
        const validAuctions = auctionDetails.filter(
          (auction) => auction !== null
        ) as unknown as Auction[];
        console.log("🔍 useAuctions: Fetched auction details", {
          total: auctionDetails.length,
          valid: validAuctions.length,
          auctions: validAuctions,
        });
        setAuctions(validAuctions);
      };

      fetchAuctionDetails();
    } else {
      console.log(
        "🔍 useAuctions: No auction IDs available, clearing auctions"
      );
      setAuctions([]);
    }
  }, [auctionIds, address]);

  const isLoading = isLoadingActive;
  const error = activeError?.message || null;

  // Filter auctions based on current filters
  const filteredAuctions = auctions.filter((auction) => {
    if (
      filters.status !== "all" &&
      String(auction.status).toLowerCase() !== filters.status
    )
      return false;
    if (filters.type !== "all" && auction.auctionType !== filters.type)
      return false;
    if (filters.category !== "all" && auction.nftCategory !== filters.category)
      return false;

    // Price range filtering
    const price = parseFloat(
      auction.currentBid === "???" ? auction.startPrice : auction.currentBid
    );
    if (price < filters.priceRange.min || price > filters.priceRange.max) {
      return false;
    }

    return true;
  });

  // Calculate stats
  const stats: AuctionStats = {
    activeAuctions: auctions.filter((a) => a.status === AuctionStatus.ACTIVE)
      .length,
    totalBids: auctions.reduce((sum, auction) => sum + auction.bidCount, 0),
    endedAuctions: auctions.filter((a) => a.status === AuctionStatus.ENDED)
      .length,
    totalVolume: parseFloat(
      auctions
        .filter((a) => a.status === AuctionStatus.ENDED)
        .reduce((total, auction) => {
          const price = parseFloat(
            auction.currentBid || auction.startPrice || "0"
          );
          return total + price;
        }, 0)
        .toFixed(4)
    ), // Limit to 4 decimal places
  };

  // Categorized auctions
  const activeAuctions = filteredAuctions.filter(
    (a) => a.status === AuctionStatus.ACTIVE
  );
  const endedAuctions = filteredAuctions.filter(
    (a) => a.status === AuctionStatus.ENDED
  );
  const pendingAuctions = filteredAuctions.filter(
    (a) => a.status === AuctionStatus.PENDING
  );

  // Auto-refetch when auctions change
  const refetch = () => {
    refetchActive();
  };

  return {
    auctions: filteredAuctions,
    activeAuctions,
    endedAuctions,
    pendingAuctions,
    stats,
    filters,
    setFilters,
    isLoading,
    error,
    refetch,
    // Admin permissions
    isMasterAdmin,
    canMint,
  };
}

// ============================================================================
// EXPORT ALL HOOKS
// ============================================================================

export { type AuctionFilters, type AuctionStats, fetchAuctionFromContract };
