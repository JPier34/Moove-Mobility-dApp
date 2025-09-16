"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useUserCollection } from "./useUserCollection";
import { toast } from "react-hot-toast";

interface NotificationState {
  hasNewWins: boolean;
  lastCheckedAuctions: string[];
}

export function useAuctionNotifications() {
  const { address, isConnected } = useAccount();
  const { wonAuctions, isLoading } = useUserCollection();
  const [notificationState, setNotificationState] = useState<NotificationState>(
    {
      hasNewWins: false,
      lastCheckedAuctions: [],
    }
  );

  useEffect(() => {
    if (!isConnected || isLoading || wonAuctions.length === 0) {
      return;
    }

    // Get current auction IDs
    const currentAuctionIds = wonAuctions.map((auction) => auction.auctionId);

    // Check if there are new wins
    const lastChecked = notificationState.lastCheckedAuctions;
    const newWins = currentAuctionIds.filter((id) => !lastChecked.includes(id));

    if (newWins.length > 0) {
      console.log("🎉 New auction wins detected:", newWins);

      // Show notification for each new win
      newWins.forEach((auctionId) => {
        const auction = wonAuctions.find((a) => a.auctionId === auctionId);
        if (auction) {
          toast.success(
            `🏆 Congratulations! You won auction #${auctionId} - ${auction.nftName}`,
            {
              duration: 8000,
              position: "top-right",
              style: {
                background: "#10B981",
                color: "white",
                fontWeight: "bold",
              },
            }
          );
        }
      });

      // Update notification state
      setNotificationState({
        hasNewWins: true,
        lastCheckedAuctions: currentAuctionIds,
      });
    }
  }, [
    wonAuctions,
    isConnected,
    isLoading,
    notificationState.lastCheckedAuctions,
  ]);

  // Reset notification state when user changes
  useEffect(() => {
    if (address) {
      setNotificationState({
        hasNewWins: false,
        lastCheckedAuctions: [],
      });
    }
  }, [address]);

  return {
    hasNewWins: notificationState.hasNewWins,
    newWinsCount: wonAuctions.filter(
      (auction) =>
        !notificationState.lastCheckedAuctions.includes(auction.auctionId)
    ).length,
  };
}







