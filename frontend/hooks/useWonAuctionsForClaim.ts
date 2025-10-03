"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { useAuctionsEnhanced } from "./enhanced-auction-utils";
import { Auction } from "@/types/auction";

export function useWonAuctionsForClaim() {
  const { address } = useAccount();
  const {
    auctions,
    isLoading: auctionsLoading,
    error: auctionsError,
  } = useAuctionsEnhanced();
  const [wonAuctions, setWonAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWonAuctions = useCallback(async () => {
    if (!address || !auctions.length) return;

    try {
      setIsLoading(true);
      setError(null);

      // Filter auctions where user is the highest bidder and auction is ended/settled
      // CORRECTED STATUS VALUES FROM CONTRACT: 0=PENDING, 1=ACTIVE, 2=REVEAL, 3=ENDED, 4=SETTLED, 5=CANCELLED
      const userWonAuctions = auctions.filter((auction) => {
        const isWinner =
          auction.highestBidder?.toLowerCase() === address.toLowerCase();
        const isEnded = auction.status === 3; // ENDED (corrected to match contract)
        const isSettled = auction.status === 4 || auction.isSettled; // SETTLED or isSettled field

        // ONLY consider ENDED or SETTLED auctions - NOT ACTIVE even if time-expired
        return isWinner && (isEnded || isSettled);
      });

      console.log(
        `🎯 Found ${userWonAuctions.length} won auctions for user ${address}`
      );
      setWonAuctions(userWonAuctions);
    } catch (err) {
      console.error("Error loading won auctions:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [address, auctions]);

  useEffect(() => {
    if (address && auctions.length > 0) {
      loadWonAuctions();
    }
  }, [address, auctions, loadWonAuctions]);

  const refetch = useCallback(() => {
    loadWonAuctions();
  }, [loadWonAuctions]);

  return {
    unsettledAuctions: wonAuctions,
    isLoading: isLoading || auctionsLoading,
    error: error || auctionsError,
    refetch,
  };
}
