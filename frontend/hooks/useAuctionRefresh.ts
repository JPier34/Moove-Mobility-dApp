"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { useAuctionsEnhanced } from "./enhanced-auction-utils";

/**
 * Hook per gestire il refresh globale delle aste
 * Fornisce un sistema centralizzato per aggiornare tutti i componenti
 */
export function useAuctionRefresh() {
  const { address, isConnected } = useAccount();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const { auctions, refetch, isLoading } = useAuctionsEnhanced();

  // Log when auctions data changes
  useEffect(() => {
    console.log("🔍 [useAuctionRefresh] Auctions data changed:", {
      auctionsCount: auctions.length,
      isLoading,
      refreshTrigger,
      lastRefresh: lastRefresh?.toISOString(),
    });

    if (auctions.length > 0) {
      console.log("🔍 [useAuctionRefresh] Sample auction data:", {
        auctionId: auctions[0].auctionId,
        currentBid: auctions[0].currentBid,
        startPrice: auctions[0].startPrice,
        status: auctions[0].status,
      });
    }
  }, [auctions, isLoading, refreshTrigger, lastRefresh]);

  // Funzione per forzare il refresh
  const triggerRefresh = useCallback(() => {
    console.log("🔄 Triggering global auction refresh...");
    console.log("🔍 Current auctions before refresh:", auctions.length);
    setRefreshTrigger((prev) => prev + 1);
    setLastRefresh(new Date());
    refetch();
  }, [refetch, auctions.length]);

  // Ascolta gli eventi di sistema per refresh automatico
  useEffect(() => {
    const handleAuctionSettled = (event: CustomEvent) => {
      console.log("🔔 Auction settled event received:", event.detail);
      triggerRefresh();
    };

    const handleAuctionEnded = (event: CustomEvent) => {
      console.log("🔔 Auction ended event received:", event.detail);
      triggerRefresh();
    };

    const handleBidPlaced = (event: CustomEvent) => {
      console.log("🔔 Bid placed event received:", event.detail);
      triggerRefresh();
    };

    // Registra i listener per gli eventi
    window.addEventListener(
      "auctionSettled",
      handleAuctionSettled as EventListener
    );
    window.addEventListener(
      "auctionEnded",
      handleAuctionEnded as EventListener
    );
    window.addEventListener("bidPlaced", handleBidPlaced as EventListener);

    return () => {
      window.removeEventListener(
        "auctionSettled",
        handleAuctionSettled as EventListener
      );
      window.removeEventListener(
        "auctionEnded",
        handleAuctionEnded as EventListener
      );
      window.removeEventListener("bidPlaced", handleBidPlaced as EventListener);
    };
  }, [triggerRefresh]);

  // Refresh automatico disabilitato - usa solo useSmartRefresh in useAuctionsEnhanced
  // Questo evita conflitti tra diversi sistemi di refresh
  // useEffect(() => {
  //   if (!isConnected) return;
  //   const interval = setInterval(() => {
  //     console.log("🔄 Auto-refreshing auction data...");
  //     triggerRefresh();
  //   }, 30000);
  //   return () => clearInterval(interval);
  // }, [isConnected, triggerRefresh]);

  return {
    auctions,
    isLoading,
    refreshTrigger,
    lastRefresh,
    triggerRefresh,
    refetch,
  };
}
