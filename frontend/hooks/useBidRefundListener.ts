"use client";

import { useEffect, useCallback } from "react";
import { useAccount, useWatchContractEvent } from "wagmi";
import { contracts } from "@/utils/contracts";
import { useAuctionNotificationTriggers } from "./useUnifiedAuctionNotifications";

/**
 * Hook per ascoltare eventi BidRefunded e integrare le notifiche
 * nel sistema unificato esistente
 */
export function useBidRefundListener() {
  const { address, isConnected } = useAccount();
  const { notifyBidRefunded } = useAuctionNotificationTriggers();

  // Converte wei in ETH
  const formatEther = useCallback((weiValue: bigint): string => {
    return (Number(weiValue) / 1e18).toFixed(6);
  }, []);

  // Ascolta eventi BidRefunded dal contratto MooveAuction
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

            // Solo se è il nostro indirizzo
            if (!address || bidder.toLowerCase() !== address.toLowerCase()) {
              console.log("💰 Refund event not for current user, skipping");
              return;
            }

            // Usa il sistema di notifiche unificato esistente
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

  // Log dello stato del listener
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
