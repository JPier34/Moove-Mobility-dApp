"use client";

import { useCallback, useState } from "react";

interface AuctionActionResult {
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  auctionId: string;
  action: string;
  error?: string;
}

interface AuctionStatus {
  auctionId: string;
  status: number;
  auctionType: number;
  endTime: number;
  currentTime: number;
  isExpired: boolean;
  isSettled: boolean;
  highestBidder: string;
  highestBid: string;
}

export function useServerSideAuctionActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endAuction = useCallback(
    async (auctionId: string): Promise<AuctionActionResult> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/admin-auction-action", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            auctionId,
            action: "endAuction",
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to end auction");
        }

        console.log(
          `✅ Server-side endAuction successful for auction ${auctionId}:`,
          result
        );
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error(
          `❌ Server-side endAuction failed for auction ${auctionId}:`,
          errorMessage
        );
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const settleAuction = useCallback(
    async (auctionId: string): Promise<AuctionActionResult> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/admin-auction-action", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            auctionId,
            action: "settleAuction",
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to settle auction");
        }

        console.log(
          `✅ Server-side settleAuction successful for auction ${auctionId}:`,
          result
        );
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error(
          `❌ Server-side settleAuction failed for auction ${auctionId}:`,
          errorMessage
        );
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getAuctionStatus = useCallback(
    async (auctionId: string): Promise<AuctionStatus> => {
      try {
        const response = await fetch(
          `/api/admin-auction-action?auctionId=${auctionId}`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to get auction status");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error(
          `❌ Failed to get auction status for ${auctionId}:`,
          errorMessage
        );
        throw err;
      }
    },
    []
  );

  const processExpiredAuction = useCallback(
    async (auctionId: string): Promise<AuctionActionResult[]> => {
      setLoading(true);
      setError(null);

      try {
        // Step 1: Check auction status
        const status = await getAuctionStatus(auctionId);

        console.log(`🔍 Processing expired auction ${auctionId}:`, status);

        const results: AuctionActionResult[] = [];

        // Step 2: End auction based on status and type
        if (status.status === 1 && status.isExpired) {
          // English/Dutch/Reserve auctions in ACTIVE status
          console.log(`🔄 Ending ACTIVE auction ${auctionId}...`);
          const endResult = await endAuction(auctionId);
          results.push(endResult);

          // Wait for blockchain to update
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } else if (
          status.status === 2 &&
          status.auctionType === 2 &&
          status.isExpired
        ) {
          // Sealed Bid auctions in REVEAL phase - CONTRACT BUG: endAuction requires ACTIVE
          console.log(
            `⚠️ Sealed Bid auction ${auctionId} in REVEAL phase - CONTRACT BUG: endAuction requires ACTIVE status`
          );
          console.log(
            `🔄 Skipping endAuction for Sealed Bid - going directly to settleAuction`
          );
          // Skip endAuction due to contract bug, go directly to settleAuction
        } else {
          console.log(
            `⚠️ Auction ${auctionId} status ${status.status}, cannot end automatically`
          );
          return results;
        }

        // Step 3: Settle auction
        console.log(`💰 Settling auction ${auctionId}...`);
        const settleResult = await settleAuction(auctionId);
        results.push(settleResult);

        return results;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error(
          `❌ Failed to process expired auction ${auctionId}:`,
          errorMessage
        );
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endAuction, settleAuction, getAuctionStatus]
  );

  return {
    endAuction,
    settleAuction,
    getAuctionStatus,
    processExpiredAuction,
    loading,
    error,
  };
}








