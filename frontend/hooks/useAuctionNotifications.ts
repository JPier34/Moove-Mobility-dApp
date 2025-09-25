"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useUserCollection } from "./useUserCollection";
import { useUnifiedAuctionNotifications } from "./useUnifiedAuctionNotifications";

interface NotificationState {
  hasNewWins: boolean;
  lastCheckedAuctions: string[];
}

export function useAuctionNotifications() {
  const { address, isConnected } = useAccount();
  const { wonAuctions, isLoading } = useUserCollection();
  const { addNotification } = useUnifiedAuctionNotifications();
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

      // Usa il sistema di notifiche unificato per evitare duplicazioni
      newWins.forEach((auctionId) => {
        const auction = wonAuctions.find((a) => a.auctionId === auctionId);
        if (auction) {
          // Usa un tipo generico per le notifiche da collezione
          // Il tipo specifico sarà determinato dalle notifiche immediate
          addNotification("sealed_bid_win", auctionId, {
            nftName: auction.nftName,
            price: auction.finalBid,
            source: "collection_check", // Marca come controllo collezione per evitare toast duplicati
          });
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
