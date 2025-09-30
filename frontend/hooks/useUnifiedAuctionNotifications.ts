"use client";

import { useCallback } from "react";

export interface NotificationTrigger {
  notifyReserveWin: (auctionId: string, amount: number) => void;
  notifyAuctionFailed: (auctionId: string, reason: string) => void;
  notifyClaimReady: (auctionId: string) => void;
  notifyDutchPurchase: (auctionId: string, amount: number) => void;
  notifyAuctionDeserted: (auctionId: string) => void;
  notifyBidRefunded: (auctionId: string, amount: number) => void;
  notifySealedBidWin: (auctionId: string, amount: number) => void;
  notifyAuctionSuccess: (auctionId: string, message: string) => void;
  notifyEnglishWin: (auctionId: string, amount: number) => void;
  addNotification: (notification: any) => void;
}

export function useAuctionNotificationTriggers(): NotificationTrigger {
  const notifyReserveWin = useCallback((auctionId: string, amount: number) => {
    console.log(`🏆 Reserve auction ${auctionId} won with ${amount} ETH`);
  }, []);

  const notifyAuctionFailed = useCallback(
    (auctionId: string, reason: string) => {
      console.log(`❌ Auction ${auctionId} failed: ${reason}`);
    },
    []
  );

  const notifyClaimReady = useCallback((auctionId: string) => {
    console.log(`✅ Auction ${auctionId} ready for claim`);
  }, []);

  const notifyDutchPurchase = useCallback(
    (auctionId: string, amount: number) => {
      console.log(`🛒 Dutch auction ${auctionId} purchased for ${amount} ETH`);
    },
    []
  );

  const notifyAuctionDeserted = useCallback((auctionId: string) => {
    console.log(`🏜️ Auction ${auctionId} deserted - no valid bids`);
  }, []);

  const notifyBidRefunded = useCallback((auctionId: string, amount: number) => {
    console.log(`💰 Bid refunded for auction ${auctionId}: ${amount} ETH`);
  }, []);

  const notifySealedBidWin = useCallback(
    (auctionId: string, amount: number) => {
      console.log(`🔒 Sealed bid auction ${auctionId} won with ${amount} ETH`);
    },
    []
  );

  const notifyAuctionSuccess = useCallback(
    (auctionId: string, message: string) => {
      console.log(`✅ Auction ${auctionId} success: ${message}`);
    },
    []
  );

  const notifyEnglishWin = useCallback((auctionId: string, amount: number) => {
    console.log(`🏆 English auction ${auctionId} won with ${amount} ETH`);
  }, []);

  const addNotification = useCallback((notification: any) => {
    console.log(`📢 Notification added:`, notification);
  }, []);

  return {
    notifyReserveWin,
    notifyAuctionFailed,
    notifyClaimReady,
    notifyDutchPurchase,
    notifyAuctionDeserted,
    notifyBidRefunded,
    notifySealedBidWin,
    notifyAuctionSuccess,
    notifyEnglishWin,
    addNotification,
  };
}

// Main export for backward compatibility
export const useUnifiedAuctionNotifications = useAuctionNotificationTriggers;
