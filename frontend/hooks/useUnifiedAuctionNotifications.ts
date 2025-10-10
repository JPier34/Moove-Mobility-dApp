"use client";

import { useCallback } from "react";
import { useAuctionNotifications } from "@/providers/AuctionNotificationsProvider";

export interface NotificationTrigger {
  notifyReserveWin: (auctionId: string, amount: number) => void;
  notifyAuctionFailed: (auctionId: string, reason: string) => void;
  notifyClaimReady: (auctionId: string) => void;
  notifyDutchPurchase: (auctionId: string, amount: number) => void;
  notifyAuctionDeserted: (auctionId: string) => void;
  notifyBidRefunded: (auctionId: string, amount: number) => void;
  notifySealedBidWin: (auctionId: string, amount: number) => void;
  notifySealedBidLoss: (
    auctionId: string,
    winner: string,
    winningBid: number
  ) => void;
  notifyAuctionSuccess: (auctionId: string, message: string) => void;
  notifyEnglishWin: (auctionId: string, amount: number) => void;
  addNotification: (notification: any) => void;
}

export function useAuctionNotificationTriggers(): NotificationTrigger {
  // Try to get context, but don't fail if not available (SSR compatibility)
  let context: any = null;
  try {
    context = useAuctionNotifications();
  } catch (error) {
    // Context not available during SSR - this is expected
    console.log("useAuctionNotifications not available during SSR");
  }

  // Helper function to add notifications to the appropriate system
  const addNotificationToSystem = useCallback(
    (notification: any) => {
      if (!context) return;

      if (
        notification.notificationType === "sealedBidWin" ||
        notification.notificationType === "sealedBidLoss" ||
        notification.notificationType === "auctionFailed"
      ) {
        // Add sealed bid notifications to the main system
        context.addSealedBidNotification?.(notification);
      } else if (notification.notificationType === "bidRefunded") {
        context.addRefundNotification?.(notification);
      } else if (
        notification.notificationType === "claimReady" ||
        notification.notificationType === "endAuction" ||
        notification.notificationType === "settleAuction"
      ) {
        context.addClaimNotification?.(notification);
      }
    },
    [context]
  );

  const notifyReserveWin = useCallback(
    (auctionId: string, amount: number) => {
      console.log(`🏆 Reserve auction ${auctionId} won with ${amount} ETH`);

      // Add notification to the system if context is available
      if (context) {
        const notification = {
          id: `reserve-win-${auctionId}-${Date.now()}`,
          auctionId,
          timestamp: Date.now(),
          isRead: false,
          message: `🎉 Congratulations! You won the reserve auction #${auctionId} with ${amount} ETH!`,
          notificationType: "reserveWin" as const,
          priority: "high" as const,
          amount: amount.toString(),
        };
        addNotificationToSystem(notification);
      }
    },
    [context]
  );

  const notifyAuctionFailed = useCallback(
    (auctionId: string, reason: string) => {
      console.log(`❌ Auction ${auctionId} failed: ${reason}`);

      // Add notification to the system if context is available
      if (context) {
        const notification = {
          id: `auction-failed-${auctionId}-${Date.now()}`,
          auctionId,
          timestamp: Date.now(),
          isRead: false,
          message: `❌ Auction #${auctionId} failed: ${reason}`,
          notificationType: "auctionFailed" as const,
          priority: "medium" as const,
        };
        addNotificationToSystem(notification);
      }
    },
    [context]
  );

  const notifyClaimReady = useCallback(
    (auctionId: string) => {
      console.log(`✅ Auction ${auctionId} ready for claim`);

      // Add notification to the system if context is available
      if (context) {
        const notification = {
          id: `claim-ready-${auctionId}-${Date.now()}`,
          auctionId,
          timestamp: Date.now(),
          isRead: false,
          message: `✅ Auction #${auctionId} is ready for claim!`,
          notificationType: "claimReady" as const,
          priority: "high" as const,
        };
        addNotificationToSystem(notification);
      }
    },
    [context]
  );

  const notifyDutchPurchase = useCallback(
    (auctionId: string, amount: number) => {
      console.log(`🛒 Dutch auction ${auctionId} purchased for ${amount} ETH`);

      // Add notification to the system if context is available
      if (context) {
        const notification = {
          id: `dutch-purchase-${auctionId}-${Date.now()}`,
          auctionId,
          timestamp: Date.now(),
          isRead: false,
          message: `🛒 You purchased Dutch auction #${auctionId} for ${amount} ETH!`,
          notificationType: "dutchPurchase" as const,
          priority: "high" as const,
          amount: amount.toString(),
        };
        addNotificationToSystem(notification);
      }
    },
    [context]
  );

  const notifyAuctionDeserted = useCallback(
    (auctionId: string) => {
      console.log(`🏜️ Auction ${auctionId} deserted - no valid bids`);

      // Add notification to the system if context is available
      if (context) {
        const notification = {
          id: `auction-deserted-${auctionId}-${Date.now()}`,
          auctionId,
          timestamp: Date.now(),
          isRead: false,
          message: `🏜️ Auction #${auctionId} was deserted - no valid bids`,
          notificationType: "auctionDeserted" as const,
          priority: "medium" as const,
        };
        addNotificationToSystem(notification);
      }
    },
    [context]
  );

  const notifyBidRefunded = useCallback(
    (auctionId: string, amount: number) => {
      console.log(`💰 Bid refunded for auction ${auctionId}: ${amount} ETH`);

      // Add notification to the system if context is available
      if (context) {
        const notification = {
          id: `bid-refunded-${auctionId}-${Date.now()}`,
          auctionId,
          timestamp: Date.now(),
          isRead: false,
          message: `💰 Your bid on auction #${auctionId} was refunded: ${amount} ETH`,
          notificationType: "bidRefunded" as const,
          priority: "medium" as const,
          amount: amount.toString(),
        };
        addNotificationToSystem(notification);
      }
    },
    [context]
  );

  const notifySealedBidWin = useCallback(
    (auctionId: string, amount: number) => {
      console.log(`🔒 Sealed bid auction ${auctionId} won with ${amount} ETH`);

      // Add notification to the system
      if (context) {
        const notification = {
          id: `sealed-bid-win-${auctionId}-${Date.now()}`,
          auctionId,
          timestamp: Date.now(),
          isRead: false,
          message: `🎉 Congratulations! You won the sealed bid auction #${auctionId} with ${amount} ETH!`,
          notificationType: "sealedBidWin" as const,
          priority: "high" as const,
          amount: amount.toString(),
        };
        addNotificationToSystem(notification);
      }
    },
    [context]
  );

  const notifySealedBidLoss = useCallback(
    (auctionId: string, winner: string, winningBid: number) => {
      console.log(
        `😔 Sealed bid auction ${auctionId} lost - Winner: ${winner}, Bid: ${winningBid} ETH`
      );

      // Add notification to the system
      if (context) {
        const notification = {
          id: `sealed-bid-loss-${auctionId}-${Date.now()}`,
          auctionId,
          timestamp: Date.now(),
          isRead: false,
          message: `😔 You didn't win the sealed bid auction #${auctionId}. Winner: ${winner.slice(
            0,
            6
          )}...${winner.slice(-4)}, Bid: ${winningBid} ETH`,
          notificationType: "sealedBidLoss" as const,
          priority: "medium" as const,
          winner,
          winningBid: winningBid.toString(),
        };
        addNotificationToSystem(notification);
      }
    },
    [context]
  );

  const notifyAuctionSuccess = useCallback(
    (auctionId: string, message: string) => {
      console.log(`✅ Auction ${auctionId} success: ${message}`);

      // Add notification to the system if context is available
      if (context) {
        const notification = {
          id: `auction-success-${auctionId}-${Date.now()}`,
          auctionId,
          timestamp: Date.now(),
          isRead: false,
          message: `✅ Auction #${auctionId} success: ${message}`,
          notificationType: "auctionSuccess" as const,
          priority: "medium" as const,
        };
        addNotificationToSystem(notification);
      }
    },
    [context]
  );

  const notifyEnglishWin = useCallback(
    (auctionId: string, amount: number) => {
      console.log(`🏆 English auction ${auctionId} won with ${amount} ETH`);

      // Add notification to the system if context is available
      if (context) {
        const notification = {
          id: `english-win-${auctionId}-${Date.now()}`,
          auctionId,
          timestamp: Date.now(),
          isRead: false,
          message: `🎉 Congratulations! You won the English auction #${auctionId} with ${amount} ETH!`,
          notificationType: "englishWin" as const,
          priority: "high" as const,
          amount: amount.toString(),
        };
        addNotificationToSystem(notification);
      }
    },
    [context]
  );

  const addNotification = useCallback(
    (notification: any) => {
      console.log(`📢 Notification added:`, notification);

      // Add notification to the system if context is available
      if (context) {
        addNotificationToSystem(notification);
      }
    },
    [context]
  );

  return {
    notifyReserveWin,
    notifyAuctionFailed,
    notifyClaimReady,
    notifyDutchPurchase,
    notifyAuctionDeserted,
    notifyBidRefunded,
    notifySealedBidWin,
    notifySealedBidLoss,
    notifyAuctionSuccess,
    notifyEnglishWin,
    addNotification,
  };
}

// Main export for backward compatibility
export const useUnifiedAuctionNotifications = useAuctionNotificationTriggers;
