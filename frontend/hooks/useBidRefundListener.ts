"use client";

import { useEffect, useCallback } from "react";
import { useAccount, useWatchContractEvent } from "wagmi";
import { contracts } from "@/utils/contracts";
import { useAuctionNotificationTriggers } from "./useUnifiedAuctionNotifications";

/**
 * Hook to listen for BidRefunded events and integrate notifications
 * into the existing unified system
 */
export function useBidRefundListener() {
  const { address, isConnected } = useAccount();
  const { notifyBidRefunded } = useAuctionNotificationTriggers();

  // Convert wei to ETH
  const formatEther = useCallback((weiValue: bigint): string => {
    return (Number(weiValue) / 1e18).toFixed(6);
  }, []);

  // Listen for BidRefunded events from MooveAuction contract
  useWatchContractEvent({
    address: contracts.MooveAuction.address as `0x${string}`,
    abi: contracts.MooveAuction.abi,
    eventName: "BidRefunded",
    onLogs: useCallback(
      (logs: any[]) => {
        console.log("🔔 BidRefunded events received:", logs);

        logs.forEach((log) => {
          try {
            const { auctionId, bidder, refundAmount } = log.args;
            const transactionHash = log.transactionHash;

            console.log("💰 Processing refund event:", {
              auctionId: auctionId.toString(),
              bidder,
              refundAmount: refundAmount.toString(),
              transactionHash,
            });

            // Only if it's our address
            if (!address || bidder.toLowerCase() !== address.toLowerCase()) {
              console.log("💰 Refund event not for current user, skipping");
              return;
            }

            // Use the existing unified notification system
            notifyBidRefunded(
              auctionId.toString(),
              parseFloat(formatEther(refundAmount))
            );

            console.log("💰 Refund notification sent to unified system");
          } catch (error) {
            console.error("❌ Error processing BidRefunded event:", error);
          }
        });
      },
      [address, notifyBidRefunded, formatEther]
    ),
    enabled: isConnected && !!address,
  });

  // Listener status logging
  useEffect(() => {
    if (isConnected && address) {
      console.log("🔔 Bid refund listener initialized for address:", address);
    } else {
      console.log("🔔 Bid refund listener disabled - wallet not connected");
    }
  }, [isConnected, address]);

  return {
    isActive: isConnected && !!address,
  };
}
