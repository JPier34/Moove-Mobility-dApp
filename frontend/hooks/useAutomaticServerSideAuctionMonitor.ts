"use client";

import { useCallback, useEffect, useState } from "react";
import { useServerSideAuctionActions } from "./useServerSideAuctionActions";

interface ExpiredAuction {
  auctionId: string;
  status: number;
  auctionType: number;
  endTime: number;
  isExpired: boolean;
  isSettled: boolean;
}

export function useAutomaticServerSideAuctionMonitor() {
  const { getAuctionStatus, processExpiredAuction, loading } =
    useServerSideAuctionActions();
  const [processedAuctions, setProcessedAuctions] = useState<Set<string>>(
    new Set()
  );
  const [expiredAuctions, setExpiredAuctions] = useState<ExpiredAuction[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(() => {
    // Initialize from localStorage for persistence
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("auction-monitoring-active");
      return saved === "true";
    }
    return false;
  });

  const checkExpiredAuctions = useCallback(async () => {
    if (loading) return;

    try {
      console.log("🔍 Checking for expired auctions (server-side)...");

      // Check auctions from 24 onwards (skip problematic auctions 0-23)
      const auctionsToCheck: ExpiredAuction[] = [];

      for (let i = 24; i < 50; i++) {
        // Check first 26 valid auctions
        try {
          const status = await getAuctionStatus(i.toString());

          if (status.isExpired && !status.isSettled) {
            auctionsToCheck.push({
              auctionId: i.toString(),
              status: status.status,
              auctionType: status.auctionType,
              endTime: status.endTime,
              isExpired: status.isExpired,
              isSettled: status.isSettled,
            });
          }
        } catch (err) {
          // Auction might not exist, continue
          continue;
        }
      }

      setExpiredAuctions(auctionsToCheck);

      // Process expired auctions
      for (const auction of auctionsToCheck) {
        if (processedAuctions.has(auction.auctionId)) {
          continue;
        }

        try {
          console.log(`🔄 Processing expired auction ${auction.auctionId}...`);
          await processExpiredAuction(auction.auctionId);

          setProcessedAuctions((prev) => new Set([...prev, auction.auctionId]));
          console.log(`✅ Successfully processed auction ${auction.auctionId}`);
        } catch (err) {
          console.error(
            `❌ Failed to process auction ${auction.auctionId}:`,
            err
          );
        }
      }
    } catch (err) {
      console.error("❌ Failed to check expired auctions:", err);
    }
  }, [getAuctionStatus, processExpiredAuction, loading, processedAuctions]);

  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    // Persist monitoring state
    if (typeof window !== "undefined") {
      localStorage.setItem("auction-monitoring-active", "true");
    }
    console.log("🚀 Starting automatic server-side auction monitoring...");

    // Initial check
    checkExpiredAuctions();

    // Set up interval (every 2 minutes)
    const interval = setInterval(checkExpiredAuctions, 2 * 60 * 1000);

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
      // Remove persistence when stopped
      if (typeof window !== "undefined") {
        localStorage.removeItem("auction-monitoring-active");
      }
      console.log("⏹️ Stopped automatic server-side auction monitoring");
    };
  }, [isMonitoring, checkExpiredAuctions]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    // Remove persistence when manually stopped
    if (typeof window !== "undefined") {
      localStorage.removeItem("auction-monitoring-active");
    }
    console.log("⏹️ Manual stop of server-side auction monitoring");
  }, []);

  const manualProcessAuction = useCallback(
    async (auctionId: string) => {
      try {
        console.log(`🔧 Manual processing of auction ${auctionId}...`);
        await processExpiredAuction(auctionId);
        setProcessedAuctions((prev) => new Set([...prev, auctionId]));
      } catch (err) {
        console.error(
          `❌ Manual processing failed for auction ${auctionId}:`,
          err
        );
        throw err;
      }
    },
    [processExpiredAuction]
  );

  // Auto-restart monitoring if it was active before page reload
  useEffect(() => {
    if (isMonitoring && typeof window !== "undefined") {
      console.log("🔄 Restoring monitoring after page reload...");
      // The monitoring will be automatically restored by the useState initialization
    }
  }, [isMonitoring]);

  return {
    expiredAuctions,
    processedAuctions: Array.from(processedAuctions),
    isMonitoring,
    loading,
    startMonitoring,
    stopMonitoring,
    manualProcessAuction,
    checkExpiredAuctions,
  };
}
