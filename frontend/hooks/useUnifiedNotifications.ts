"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "../utils/contracts";

interface UnifiedNotification {
  id: string; // Unique ID to prevent duplicates
  auctionId: string;
  type: "claim_ready" | "claimed" | "refund";
  message: string;
  timestamp: number;
  transactionHash?: string;
  amount?: string;
  isRead: boolean;
}

interface AuctionEventData {
  auctionId: string;
  bidder: string;
  amount: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
}

export function useUnifiedNotifications() {
  const { address } = useAccount();
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheckedBlock, setLastCheckedBlock] = useState<number>(0);

  // Initialize dismissed notifications from localStorage
  const [dismissedNotifications, setDismissedNotifications] = useState<
    Set<string>
  >(() => {
    if (typeof window === "undefined") return new Set();

    try {
      const stored = localStorage.getItem("moove-dismissed-notifications");
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(parsed);
      }
    } catch (error) {
      console.warn(
        "Failed to load dismissed notifications from localStorage:",
        error
      );
    }
    return new Set();
  });

  // Generate unique ID for notifications to prevent duplicates
  const generateNotificationId = (
    auctionId: string,
    type: string,
    timestamp: number
  ): string => {
    return `${auctionId}-${type}-${timestamp}`;
  };

  // Clean up old dismissed notifications (older than 7 days)
  const cleanupOldDismissedNotifications = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem("moove-dismissed-notifications");
      if (!stored) return;

      const dismissed = JSON.parse(stored);
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      // Filter out notifications older than 7 days
      const recentDismissed = dismissed.filter((id: string) => {
        // Extract timestamp from notification ID (format: auctionId-type-timestamp)
        const parts = id.split("-");
        if (parts.length >= 3) {
          const timestamp = parseInt(parts[parts.length - 1]);
          return timestamp > sevenDaysAgo;
        }
        return true; // Keep if we can't parse the timestamp
      });

      if (recentDismissed.length !== dismissed.length) {
        localStorage.setItem(
          "moove-dismissed-notifications",
          JSON.stringify(recentDismissed)
        );
        setDismissedNotifications(new Set(recentDismissed));
        console.log(
          `🧹 Cleaned up ${
            dismissed.length - recentDismissed.length
          } old dismissed notifications`
        );
      }
    } catch (error) {
      console.warn("Failed to cleanup old dismissed notifications:", error);
    }
  }, []);

  // Save dismissed notifications to localStorage
  const saveDismissedNotifications = useCallback((dismissed: Set<string>) => {
    if (typeof window === "undefined") return;

    try {
      const array = Array.from(dismissed);
      localStorage.setItem(
        "moove-dismissed-notifications",
        JSON.stringify(array)
      );
      console.log(
        `💾 Saved ${array.length} dismissed notifications to localStorage`
      );
    } catch (error) {
      console.warn(
        "Failed to save dismissed notifications to localStorage:",
        error
      );
    }
  }, []);

  const fetchAuctionEvents = useCallback(async () => {
    if (!address) return;

    try {
      setLoading(true);
      console.log("🔍 Fetching auction events for unified notifications...");

      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || "https://1rpc.io/sepolia"
      );

      const auctionABI = [
        "event AuctionSettled(uint256 indexed auctionId, address indexed winner, uint256 finalPrice, uint256 platformFee, uint256 royaltyFee)",
        "event BidRefunded(uint256 indexed auctionId, address indexed bidder, uint256 amount)",
        "event AuctionEnded(uint256 indexed auctionId)",
      ];

      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        auctionABI,
        provider
      );

      // Get events from the last 2000 blocks
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 2000);

      console.log(
        `📡 Fetching events from block ${fromBlock} to ${currentBlock}`
      );

      // Fetch relevant events
      const [settledEvents, refundEvents] = await Promise.all([
        auctionContract.queryFilter(
          auctionContract.filters.AuctionSettled(null, address),
          fromBlock,
          currentBlock
        ),
        auctionContract.queryFilter(
          auctionContract.filters.BidRefunded(null, address),
          fromBlock,
          currentBlock
        ),
      ]);

      console.log(`📊 Found events:`, {
        settled: settledEvents.length,
        refund: refundEvents.length,
      });

      const newNotifications: UnifiedNotification[] = [];

      // Process AuctionSettled events (NFT already claimed)
      for (const event of settledEvents) {
        if ("args" in event && event.args) {
          const { auctionId, winner, finalPrice } = event.args;

          if (winner.toLowerCase() === address.toLowerCase()) {
            const block = await provider.getBlock(event.blockNumber);
            const notificationId = generateNotificationId(
              auctionId.toString(),
              "claimed",
              block?.timestamp || 0
            );

            // Skip if already dismissed
            if (dismissedNotifications.has(notificationId)) {
              continue;
            }

            newNotifications.push({
              id: notificationId,
              auctionId: auctionId.toString(),
              type: "claimed",
              message: `✅ Auction ${auctionId} completed! Your NFT has been claimed for ${ethers.formatEther(
                finalPrice
              )} ETH`,
              timestamp: block?.timestamp || 0,
              transactionHash: event.transactionHash,
              amount: ethers.formatEther(finalPrice),
              isRead: false,
            });
          }
        }
      }

      // Process BidRefunded events
      for (const event of refundEvents) {
        if ("args" in event && event.args) {
          const { auctionId, bidder, amount } = event.args;

          if (bidder.toLowerCase() === address.toLowerCase()) {
            const block = await provider.getBlock(event.blockNumber);
            const notificationId = generateNotificationId(
              auctionId.toString(),
              "refund",
              block?.timestamp || 0
            );

            // Skip if already dismissed
            if (dismissedNotifications.has(notificationId)) {
              continue;
            }

            newNotifications.push({
              id: notificationId,
              auctionId: auctionId.toString(),
              type: "refund",
              message: `💰 You received a refund of ${ethers.formatEther(
                amount
              )} ETH for Auction ${auctionId}`,
              timestamp: block?.timestamp || 0,
              transactionHash: event.transactionHash,
              amount: ethers.formatEther(amount),
              isRead: false,
            });
          }
        }
      }

      // Check for auctions that ended but haven't been claimed yet
      try {
        const auctionContract = new ethers.Contract(
          contracts.MooveAuction.address,
          contracts.MooveAuction.abi,
          provider
        );

        // Get recent auctions (last 50 auctions)
        for (let auctionId = 1; auctionId <= 50; auctionId++) {
          try {
            const auction = await auctionContract.getAuction(auctionId);
            const endTime = Number(auction.endTime);
            const status = Number(auction.status);
            const highestBidder = auction.highestBidder;
            const currentTime = Math.floor(Date.now() / 1000);

            // Check if auction ended, user is winner, but not yet claimed
            // ONLY consider ENDED status (3) - NOT ACTIVE even if time-expired
            const isAuctionEnded = status === 3; // Only ENDED status

            console.log(
              `🔍 Checking auction ${auctionId} for claim notification:`,
              {
                status,
                endTime: new Date(endTime * 1000).toISOString(),
                currentTime: new Date().toISOString(),
                isAuctionEnded,
                isWinner: highestBidder.toLowerCase() === address.toLowerCase(),
                timeExpired: currentTime >= endTime,
              }
            );

            // Special debug for auction 21
            if (auctionId === 21) {
              console.log(`🎯 [Auction 21] Special debug:`, {
                auctionId,
                status,
                endTime: new Date(endTime * 1000).toISOString(),
                currentTime: new Date().toISOString(),
                timeExpired: currentTime >= endTime,
                isAuctionEnded,
                highestBidder,
                userAddress: address,
                isWinner: highestBidder.toLowerCase() === address.toLowerCase(),
                currentBid: auction.currentBid,
                allConditions: {
                  isAuctionEnded,
                  isWinner:
                    highestBidder.toLowerCase() === address.toLowerCase(),
                  timeExpired: currentTime >= endTime,
                },
              });
            }

            if (
              isAuctionEnded && // ENDED status OR ACTIVE but time-expired
              highestBidder.toLowerCase() === address.toLowerCase() &&
              currentTime >= endTime
            ) {
              // Check if we already have a notification for this auction
              const hasNotification = newNotifications.some(
                (n) => n.auctionId === auctionId.toString()
              );

              if (!hasNotification) {
                const notificationId = generateNotificationId(
                  auctionId.toString(),
                  "claim_ready",
                  currentTime
                );

                // Skip if already dismissed
                if (dismissedNotifications.has(notificationId)) {
                  continue;
                }

                console.log(
                  `🎉 Creating claim notification for auction ${auctionId}:`,
                  {
                    status,
                    isAuctionEnded,
                    isWinner:
                      highestBidder.toLowerCase() === address.toLowerCase(),
                    timeExpired: currentTime >= endTime,
                  }
                );

                newNotifications.push({
                  id: notificationId,
                  auctionId: auctionId.toString(),
                  type: "claim_ready",
                  message: `🎉 Auction ${auctionId} ended! You can now claim your NFT!`,
                  timestamp: currentTime,
                  amount: ethers.formatEther(auction.currentBid || "0"),
                  isRead: false,
                });
              }
            }
          } catch (error) {
            // Auction doesn't exist or other error, skip
            continue;
          }
        }
      } catch (error) {
        console.warn(
          "⚠️ Could not check auction status for claim ready:",
          error
        );
      }

      // Remove duplicates and sort by timestamp (newest first)
      const uniqueNotifications = newNotifications.filter(
        (notification, index, self) =>
          index === self.findIndex((n) => n.id === notification.id)
      );

      uniqueNotifications.sort((a, b) => b.timestamp - a.timestamp);

      console.log(
        `🔔 Generated ${uniqueNotifications.length} unique notifications`
      );

      setNotifications(uniqueNotifications);
      setLastCheckedBlock(currentBlock);
    } catch (error) {
      console.error("❌ Error fetching auction events:", error);
    } finally {
      setLoading(false);
    }
  }, [address, dismissedNotifications]);

  useEffect(() => {
    fetchAuctionEvents();

    // Cleanup old dismissed notifications on mount
    cleanupOldDismissedNotifications();

    // Refresh every 60 seconds (reduced frequency)
    const interval = setInterval(fetchAuctionEvents, 60000);
    return () => clearInterval(interval);
  }, [fetchAuctionEvents, cleanupOldDismissedNotifications]);

  const hasUnreadNotifications = notifications.some((n) => !n.isRead);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  }, []);

  const dismissNotification = useCallback(
    (notificationId: string) => {
      // Add to dismissed set to prevent re-appearance
      setDismissedNotifications((prev) => {
        const newSet = new Set([...prev, notificationId]);
        saveDismissedNotifications(newSet);
        return newSet;
      });

      // Remove from notifications
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

      console.log(`🗑️ Dismissed notification: ${notificationId}`);
    },
    [saveDismissedNotifications]
  );

  const clearAllNotifications = useCallback(() => {
    // Add all current notifications to dismissed set
    const currentIds = notifications.map((n) => n.id);
    setDismissedNotifications((prev) => {
      const newSet = new Set([...prev, ...currentIds]);
      saveDismissedNotifications(newSet);
      return newSet;
    });

    // Clear notifications
    setNotifications([]);

    console.log(`🗑️ Cleared all notifications: ${currentIds.length} items`);
  }, [notifications, saveDismissedNotifications]);

  return {
    notifications,
    loading,
    hasUnreadNotifications,
    unreadCount,
    markAsRead,
    dismissNotification,
    clearAllNotifications,
    refetch: fetchAuctionEvents,
  };
}
