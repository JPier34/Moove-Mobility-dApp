"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { useReadMooveAuction, useWriteMooveAuction } from "./useContract";
import { Auction, Bid, AuctionType, AuctionStatus } from "@/types/auction";
import { useUserRoles } from "./useContract";
import { contracts } from "@/utils/contracts";
import { ethers } from "ethers";

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
  totalVolume: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Function to fetch individual auction details from contract
async function fetchAuctionFromContract(
  auctionId: number
): Promise<Auction | null> {
  try {
    console.log(`🔍 Fetching auction ${auctionId} from contract...`);

    if (typeof window === "undefined" || !window.ethereum) {
      console.warn("⚠️ No ethereum provider available");
      return null;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const auctionContract = new ethers.Contract(
      contracts.MooveAuction.address,
      contracts.MooveAuction.abi,
      provider
    );

    // Fetch auction details from contract
    const auctionData = await auctionContract.getAuction(auctionId);

    console.log(`📊 Auction ${auctionId} raw data:`, auctionData);

    // Convert contract data to Auction type
    const auction: Auction = {
      auctionId: auctionId.toString(),
      nftId: auctionData.tokenId.toString(),
      nftName: `NFT #${auctionData.tokenId}`,
      nftImage: "/images/default-nft.png",
      nftCategory: "VEHICLE_DECORATION",
      seller: auctionData.seller,
      auctionType: Number(auctionData.auctionType),
      status: Number(auctionData.status),
      startPrice: ethers.formatEther(auctionData.startingPrice),
      reservePrice: ethers.formatEther(auctionData.reservePrice),
      buyNowPrice: ethers.formatEther(auctionData.buyNowPrice),
      currentBid: ethers.formatEther(auctionData.highestBid),
      highestBidder: auctionData.highestBidder,
      bidCount: 0, // Will be fetched separately if needed
      startTime: new Date(Number(auctionData.startTime) * 1000),
      endTime: new Date(Number(auctionData.endTime) * 1000),
      bidIncrement: ethers.formatEther(auctionData.bidIncrement),
      currency: "ETH",
      attributes: {
        rarity: "COMMON",
        designer: "Moove",
        collection: "Genesis",
        range: "100",
        speed: "50",
        battery: "80",
        condition: "New",
      },
    };

    console.log(`✅ Auction ${auctionId} processed:`, auction);
    return auction;
  } catch (error) {
    console.error(`❌ Error fetching auction ${auctionId}:`, error);
    return null;
  }
}

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

export function useCreateAuction() {
  const { writeMooveAuction, isPending, isConfirming, isSuccess, error, hash } =
    useWriteMooveAuction();

  const createAuction = async (
    nftContract: string,
    nftId: number,
    auctionType: AuctionType,
    startPrice: bigint,
    reservePrice: bigint,
    buyNowPrice: bigint,
    duration: number,
    bidIncrement: bigint
  ) => {
    console.log("🔧 useCreateAuction: Starting auction creation...");
    console.log("🔧 Parameters:", {
      nftContract,
      nftId,
      auctionType,
      startPrice: startPrice.toString(),
      reservePrice: reservePrice.toString(),
      buyNowPrice: buyNowPrice.toString(),
      duration,
      bidIncrement: bidIncrement.toString(),
    });

    return new Promise((resolve, reject) => {
      try {
        console.log("🔧 Calling writeMooveAuction...");

        writeMooveAuction("createAuction", [
          nftContract,
          nftId,
          auctionType,
          startPrice,
          reservePrice,
          buyNowPrice,
          duration,
          bidIncrement,
        ]);

        console.log("🔧 writeMooveAuction called successfully");

        setTimeout(() => {
          console.log("🔧 Checking transaction status after 2 seconds...");
          console.log("🔧 Current status:", {
            hash,
            isPending,
            isConfirming,
            isSuccess,
            error,
          });

          const isActuallySuccessful = hash && !error;

          resolve({
            success: isActuallySuccessful,
            hash: hash,
            isPending: isPending,
            isConfirming: isConfirming,
            isSuccess: isSuccess,
            error: error,
          });
        }, 2000);
      } catch (error) {
        console.error("🔧 Error in writeMooveAuction:", error);
        reject(error);
      }
    });
  };

  useEffect(() => {
    if (hash) {
      console.log("🔗 Auction creation transaction hash:", hash);
    }
    if (isSuccess) {
      console.log("🎉 Auction creation transaction successful!");
    }
    if (error) {
      console.error("❌ Auction creation error:", error);
    }
  }, [hash, isSuccess, error]);

  return {
    createAuction,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function usePlaceBid() {
  const { writeMooveAuction, isPending, isConfirming, isSuccess, error } =
    useWriteMooveAuction();

  const placeBid = (auctionId: number, bidAmount: bigint) => {
    writeMooveAuction("placeBid", [auctionId], bidAmount);
  };

  return {
    placeBid,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useEndAuction() {
  const { writeMooveAuction, isPending, isConfirming, isSuccess, error } =
    useWriteMooveAuction();

  const endAuction = (auctionId: number) => {
    writeMooveAuction("endAuction", [auctionId]);
  };

  return {
    endAuction,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useClaimNFT() {
  const { writeMooveAuction, isPending, isConfirming, isSuccess, error } =
    useWriteMooveAuction();

  const claimNFT = (auctionId: number) => {
    writeMooveAuction("claimNFT", [auctionId]);
  };

  return {
    claimNFT,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// ============================================================================
// DUTCH AUCTION COMMIT-REVEAL HOOKS
// ============================================================================

export function useCommitToBuyDutch() {
  const { writeMooveAuction, isPending, isConfirming, isSuccess, error } =
    useWriteMooveAuction();

  const commitToBuyDutch = (auctionId: number, commitment: string) => {
    writeMooveAuction("commitToBuyDutch", [auctionId, commitment]);
  };

  return {
    commitToBuyDutch,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useBuyNowDutch() {
  const { writeMooveAuction, isPending, isConfirming, isSuccess, error } =
    useWriteMooveAuction();

  const buyNowDutch = (auctionId: number, nonce: bigint, value: bigint) => {
    writeMooveAuction("buyNowDutch", [auctionId, nonce], value);
  };

  return {
    buyNowDutch,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useStartRevealPhase() {
  const { writeMooveAuction, isPending, isConfirming, isSuccess, error } =
    useWriteMooveAuction();

  const startRevealPhase = (auctionId: number) => {
    writeMooveAuction("startRevealPhase", [auctionId]);
  };

  return {
    startRevealPhase,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useRefundRemainingBidders() {
  const { writeMooveAuction, isPending, isConfirming, isSuccess, error } =
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
    isConfirming,
    isSuccess,
    error,
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
    totalVolume: auctions
      .filter((a) => a.status === AuctionStatus.ENDED)
      .reduce((total, auction) => {
        const price = parseFloat(
          auction.currentBid || auction.startPrice || "0"
        );
        return total + price;
      }, 0)
      .toFixed(4),
  };

  // Categorized auctions
  const activeAuctions = filteredAuctions.filter(
    (a) => a.status === AuctionStatus.ACTIVE
  );
  const endedAuctions = filteredAuctions.filter(
    (a) => a.status === AuctionStatus.ENDED
  );
  const revealingAuctions = filteredAuctions.filter(
    (a) => a.status === AuctionStatus.REVEALING
  );

  // Auto-refetch when auctions change
  const refetch = () => {
    refetchActive();
  };

  return {
    auctions: filteredAuctions,
    activeAuctions,
    endedAuctions,
    revealingAuctions,
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
