"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "../utils/contracts";

interface EventBasedNotification {
  auctionId: string;
  type: "win" | "claim_ready" | "refund";
  message: string;
  timestamp: number;
  transactionHash?: string;
  amount?: string;
}

interface AuctionEventData {
  auctionId: string;
  bidder: string;
  amount: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
}

export function useEventBasedNotifications() {
  const { address } = useAccount();
  const [notifications, setNotifications] = useState<EventBasedNotification[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [lastCheckedBlock, setLastCheckedBlock] = useState<number>(0);

  // Initialize dismissed notifications from localStorage
  const [dismissedNotifications, setDismissedNotifications] = useState<
    Set<string>
  >(() => {
    if (typeof window === "undefined") return new Set();

    try {
      const stored = localStorage.getItem(
        "moove-event-dismissed-notifications"
      );
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(parsed);
      }
    } catch (error) {
      console.warn(
        "Failed to load dismissed event notifications from localStorage:",
        error
      );
    }
    return new Set();
  });

  // Save dismissed notifications to localStorage
  const saveDismissedNotifications = useCallback((dismissed: Set<string>) => {
    if (typeof window === "undefined") return;

    try {
      const array = Array.from(dismissed);
      localStorage.setItem(
        "moove-event-dismissed-notifications",
        JSON.stringify(array)
      );
      console.log(
        `💾 Saved ${array.length} dismissed event notifications to localStorage`
      );
    } catch (error) {
      console.warn(
        "Failed to save dismissed event notifications to localStorage:",
        error
      );
    }
  }, []);

  const fetchAuctionEvents = useCallback(async () => {
    if (!address) return;

    try {
      setLoading(true);
      console.log("🔍 Fetching auction events for notifications...");

      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || "https://1rpc.io/sepolia"
      );

      const auctionABI = [
        "event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount, bool isHighestBid)",
        "event SealedBidSubmitted(uint256 indexed auctionId, address indexed bidder, bytes32 bidHash)",
        "event AuctionSettled(uint256 indexed auctionId, address indexed winner, uint256 finalPrice, uint256 platformFee, uint256 royaltyFee)",
        "event BidRefunded(uint256 indexed auctionId, address indexed bidder, uint256 amount)",
        "event AuctionEnded(uint256 indexed auctionId)",
      ];

      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        auctionABI,
        provider
      );

      // Get events from the last 2000 blocks (more comprehensive)
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 2000);

      console.log(
        `📡 Fetching events from block ${fromBlock} to ${currentBlock}`
      );

      // Fetch all relevant events
      const [
        bidPlacedEvents,
        sealedBidEvents,
        settledEvents,
        refundEvents,
        endedEvents,
      ] = await Promise.all([
        auctionContract.queryFilter(
          auctionContract.filters.BidPlaced(null, address),
          fromBlock,
          currentBlock
        ),
        auctionContract.queryFilter(
          auctionContract.filters.SealedBidSubmitted(null, address),
          fromBlock,
          currentBlock
        ),
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
        auctionContract.queryFilter(
          auctionContract.filters.AuctionEnded(),
          fromBlock,
          currentBlock
        ),
      ]);

      console.log(`📊 Found events:`, {
        bidPlaced: bidPlacedEvents.length,
        sealedBid: sealedBidEvents.length,
        settled: settledEvents.length,
        refund: refundEvents.length,
        ended: endedEvents.length,
      });

      const newNotifications: EventBasedNotification[] = [];
      const userBids = new Map<string, AuctionEventData>();

      // Process BidPlaced events
      for (const event of bidPlacedEvents) {
        if ("args" in event && event.args) {
          const { auctionId, bidder, amount, isHighestBid } = event.args;

          if (bidder.toLowerCase() === address.toLowerCase()) {
            const block = await provider.getBlock(event.blockNumber);

            userBids.set(auctionId.toString(), {
              auctionId: auctionId.toString(),
              bidder,
              amount: ethers.formatEther(amount),
              transactionHash: event.transactionHash,
              blockNumber: event.blockNumber,
              timestamp: block?.timestamp || 0,
            });

            if (isHighestBid) {
              newNotifications.push({
                auctionId: auctionId.toString(),
                type: "win",
                message: `🎉 You won Auction ${auctionId} with bid ${ethers.formatEther(
                  amount
                )} ETH!`,
                timestamp: block?.timestamp || 0,
                transactionHash: event.transactionHash,
                amount: ethers.formatEther(amount),
              });
            }
          }
        }
      }

      // Process SealedBidSubmitted events
      for (const event of sealedBidEvents) {
        if ("args" in event && event.args) {
          const { auctionId, bidder } = event.args;

          if (bidder.toLowerCase() === address.toLowerCase()) {
            const block = await provider.getBlock(event.blockNumber);

            userBids.set(auctionId.toString(), {
              auctionId: auctionId.toString(),
              bidder,
              amount: "0", // Unknown until reveal
              transactionHash: event.transactionHash,
              blockNumber: event.blockNumber,
              timestamp: block?.timestamp || 0,
            });

            newNotifications.push({
              auctionId: auctionId.toString(),
              type: "win",
              message: `🔒 You submitted a sealed bid for Auction ${auctionId}`,
              timestamp: block?.timestamp || 0,
              transactionHash: event.transactionHash,
            });
          }
        }
      }

      // Process AuctionSettled events
      for (const event of settledEvents) {
        if ("args" in event && event.args) {
          const { auctionId, winner, finalPrice } = event.args;

          if (winner.toLowerCase() === address.toLowerCase()) {
            const block = await provider.getBlock(event.blockNumber);

            newNotifications.push({
              auctionId: auctionId.toString(),
              type: "claim_ready",
              message: `✅ Auction ${auctionId} settled! You can claim your NFT for ${ethers.formatEther(
                finalPrice
              )} ETH`,
              timestamp: block?.timestamp || 0,
              transactionHash: event.transactionHash,
              amount: ethers.formatEther(finalPrice),
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

            newNotifications.push({
              auctionId: auctionId.toString(),
              type: "refund",
              message: `💰 You received a refund of ${ethers.formatEther(
                amount
              )} ETH for Auction ${auctionId}`,
              timestamp: block?.timestamp || 0,
              transactionHash: event.transactionHash,
              amount: ethers.formatEther(amount),
            });
          }
        }
      }

      // Check for auctions that should be claimable (based on actual auction end time)
      const currentTime = Math.floor(Date.now() / 1000);

      for (const [auctionId, bidData] of userBids) {
        try {
          // Get auction data to check actual end time
          const auctionContract = new ethers.Contract(
            contracts.MooveAuction.address,
            contracts.MooveAuction.abi,
            provider
          );

          const auction = await auctionContract.getAuction(parseInt(auctionId));
          const endTime = Number(auction.endTime);
          const status = Number(auction.status);
          const highestBidder = auction.highestBidder;

          // Only notify if auction is actually ended (status = 3) AND user is winner AND time has passed
          if (
            status === 3 && // ENDED status
            highestBidder.toLowerCase() === address.toLowerCase() &&
            currentTime >= endTime
          ) {
            // Check if we already have a settlement notification for this auction
            const hasSettlement = newNotifications.some(
              (n) => n.auctionId === auctionId && n.type === "claim_ready"
            );

            if (!hasSettlement) {
              newNotifications.push({
                auctionId,
                type: "claim_ready",
                message: `🎉 Auction ${auctionId} ended! You can now claim your NFT!`,
                timestamp: currentTime,
                amount: bidData.amount,
              });
            }
          }
        } catch (error) {
          console.warn(
            `⚠️ Could not check auction ${auctionId} status:`,
            error
          );
        }
      }

      // Filter out dismissed notifications and remove duplicates
      const filteredNotifications = newNotifications.filter(
        (notification, index, self) => {
          // Remove duplicates
          const isUnique =
            index ===
            self.findIndex(
              (n) =>
                n.auctionId === notification.auctionId &&
                n.type === notification.type
            );

          // Skip if already dismissed
          const isDismissed = dismissedNotifications.has(
            notification.auctionId
          );

          if (isDismissed) {
            console.log(
              `🚫 Skipping dismissed notification for auction ${notification.auctionId}`
            );
          }

          return isUnique && !isDismissed;
        }
      );

      // Sort notifications by timestamp (newest first)
      filteredNotifications.sort((a, b) => b.timestamp - a.timestamp);

      console.log(
        `🔔 Generated ${
          filteredNotifications.length
        } notifications based on events (${
          newNotifications.length - filteredNotifications.length
        } dismissed)`
      );
      setNotifications(filteredNotifications);
      setLastCheckedBlock(currentBlock);
    } catch (error) {
      console.error("❌ Error fetching auction events:", error);
    } finally {
      setLoading(false);
    }
  }, [address, dismissedNotifications]);

  useEffect(() => {
    fetchAuctionEvents();

    // Refresh every 30 seconds
    const interval = setInterval(fetchAuctionEvents, 30000);
    return () => clearInterval(interval);
  }, [fetchAuctionEvents]);

  const hasUnreadNotifications = notifications.length > 0;
  const unreadCount = notifications.length;

  const markAsRead = useCallback(
    (auctionId: string) => {
      setNotifications((prev) => prev.filter((n) => n.auctionId !== auctionId));

      // Add to dismissed set to prevent re-appearance
      setDismissedNotifications((prev) => {
        const newSet = new Set([...prev, auctionId]);
        saveDismissedNotifications(newSet);
        return newSet;
      });
    },
    [saveDismissedNotifications]
  );

  const clearAllNotifications = useCallback(() => {
    // Add all current notifications to dismissed set
    const currentIds = notifications.map((n) => n.auctionId);
    setDismissedNotifications((prev) => {
      const newSet = new Set([...prev, ...currentIds]);
      saveDismissedNotifications(newSet);
      return newSet;
    });

    setNotifications([]);
  }, [notifications, saveDismissedNotifications]);

  return {
    notifications,
    loading,
    hasUnreadNotifications,
    unreadCount,
    markAsRead,
    clearAllNotifications,
    refetch: fetchAuctionEvents,
  };
}
