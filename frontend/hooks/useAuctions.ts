"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { AuctionType, AuctionStatus, type Auction } from "@/types/auction";
import { useActiveAuctions } from "./useAuction";
import { useUserRoles } from "./useContract";

interface AuctionFilters {
  status: "all" | "active" | "ended" | "revealing";
  type: "all" | "traditional" | "english" | "dutch" | "sealed";
  category: "all" | "sticker" | "badge" | "skin" | "avatar";
  priceRange: "all" | "low" | "medium" | "high";
}

interface AuctionStats {
  activeAuctions: number;
  totalBids: number;
  endedAuctions: number;
  totalVolume: string;
}

export function useAuctions() {
  const { address, isConnected } = useAccount();
  const { isMasterAdmin, canMint } = useUserRoles(address);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [filters, setFilters] = useState<AuctionFilters>({
    status: "all",
    type: "all",
    category: "all",
    priceRange: "all",
  });

  // Use existing hook to get active auctions
  const {
    auctionIds,
    isLoading: isLoadingActive,
    error: activeError,
    refetch: refetchActive,
  } = useActiveAuctions();

  // TODO: Implement fetching individual auction details
  // For now, we'll use empty array since contracts are not deployed yet
  const isLoading = isLoadingActive;
  const error = activeError?.message || null;

  // Filter auctions based on current filters
  const filteredAuctions = auctions.filter((auction) => {
    if (
      filters.status !== "all" &&
      String(auction.status).toLowerCase() !== filters.status
    )
      return false;
    if (
      filters.type !== "all" &&
      String(auction.auctionType).toLowerCase() !== filters.type
    )
      return false;
    if (filters.category !== "all" && auction.nftCategory !== filters.category)
      return false;

    // Price range filtering
    if (filters.priceRange !== "all") {
      const price = parseFloat(
        auction.currentBid === "???" ? auction.startPrice : auction.currentBid
      );
      if (filters.priceRange === "low" && price >= 0.001) return false;
      if (filters.priceRange === "medium" && (price < 0.001 || price > 0.005))
        return false;
      if (filters.priceRange === "high" && price <= 0.005) return false;
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
    totalVolume: "0.0000", // TODO: Calculate from actual auction data
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
    refetch: refetchActive,
    // Admin permissions
    isMasterAdmin,
    canMint,
  };
}
