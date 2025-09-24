"use client";

import { useEffect, useState } from "react";
import { useWatchContractEvent } from "wagmi";
import { contracts } from "../utils/contracts";
import { toast } from "react-hot-toast";

export interface AuctionExtensionEvent {
  auctionId: number;
  bidder: string;
  extensionDuration: number;
  newEndTime: number;
  reason: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: Date;
}

export function useAuctionExtensionEvents() {
  const [recentExtensions, setRecentExtensions] = useState<
    AuctionExtensionEvent[]
  >([]);

  // Watch for AuctionExtended events
  // AuctionExtended event not available in simplified ABI
  // useWatchContractEvent({
  //   address: contracts.MooveAuction.address as `0x${string}`,
  //   abi: contracts.MooveAuction.abi,
  //   eventName: "AuctionExtended",
  //   onLogs(logs) {
  //     console.log("🔄 AuctionExtended events received:", logs);

  //     logs.forEach((log) => {
  //       const { auctionId, bidder, extensionDuration, newEndTime, reason } = (
  //         log as any
  //       ).args as {
  //         auctionId: bigint;
  //         bidder: string;
  //         extensionDuration: bigint;
  //         newEndTime: bigint;
  //         reason: string;
  //       };

  //       const extensionEvent: AuctionExtensionEvent = {
  //         auctionId: Number(auctionId),
  //         bidder,
  //         extensionDuration: Number(extensionDuration),
  //         newEndTime: Number(newEndTime),
  //         reason,
  //         transactionHash: (log as any).transactionHash || "",
  //         blockNumber: Number((log as any).blockNumber),
  //         timestamp: new Date(),
  //       };

  //       console.log("⏰ Auction Extended:", {
  //         auctionId: extensionEvent.auctionId,
  //         bidder: extensionEvent.bidder,
  //         extensionMinutes: extensionEvent.extensionDuration / 60,
  //         newEndTime: new Date(
  //           extensionEvent.newEndTime * 1000
  //         ).toLocaleString(),
  //         reason: extensionEvent.reason,
  //       });

  //       // Add to recent extensions
  //       setRecentExtensions((prev) => [extensionEvent, ...prev.slice(0, 9)]); // Keep last 10

  //       // Show toast notification
  //       const extensionMinutes = Math.round(
  //         extensionEvent.extensionDuration / 60
  //       );
  //       const newEndTimeFormatted = new Date(
  //         extensionEvent.newEndTime * 1000
  //       ).toLocaleTimeString();

  //       toast.success(
  //         `🔄 Auction #${extensionEvent.auctionId} extended by ${extensionMinutes} minutes! New end time: ${newEndTimeFormatted}`,
  //         {
  //           duration: 5000,
  //           icon: "⏰",
  //         }
  //       );
  //     });
  //   },
  // });

  // Clear old extensions (older than 1 hour)
  useEffect(() => {
    const interval = setInterval(() => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      setRecentExtensions((prev) =>
        prev.filter((ext) => ext.timestamp.getTime() > oneHourAgo)
      );
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, []);

  return {
    recentExtensions,
    clearExtensions: () => setRecentExtensions([]),
  };
}

// Hook to get extension info for a specific auction
export function useAuctionExtensionInfo(auctionId: number) {
  const [extensionInfo, setExtensionInfo] = useState<{
    extensionThreshold: number;
    extensionDuration: number;
    isInExtensionZone: boolean;
    timeUntilExtensionZone: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExtensionInfo = async () => {
      if (!auctionId) return;

      setIsLoading(true);
      setError(null);

      try {
        // This would call the getAuctionExtensionInfo function from the contract
        // For now, we'll use default values since the contract isn't deployed yet
        const info = {
          extensionThreshold: 5 * 60, // 5 minutes in seconds
          extensionDuration: 10 * 60, // 10 minutes in seconds
          isInExtensionZone: false,
          timeUntilExtensionZone: 0,
        };

        setExtensionInfo(info);
      } catch (err) {
        console.error("Failed to fetch extension info:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExtensionInfo();
  }, [auctionId]);

  return {
    extensionInfo,
    isLoading,
    error,
  };
}
