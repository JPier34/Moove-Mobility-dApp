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

  const fetchAuctionEvents = useCallback(async () => {
    if (!address) return;

    try {
      setLoading(true);
      console.log("🔍 Fetching auction events for notifications...");

      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL ||
          "https://ethereum-sepolia.publicnode.com"
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

      // Check for auctions that should be claimable (based on time since last bid)
      const currentTime = Math.floor(Date.now() / 1000);
      const AUCTION_TIMEOUT = 300; // 5 minutes - consider auction ended if no activity

      for (const [auctionId, bidData] of userBids) {
        const timeSinceBid = currentTime - bidData.timestamp;

        // If it's been more than 5 minutes since the bid, consider it claimable
        if (timeSinceBid > AUCTION_TIMEOUT) {
          // Check if we already have a settlement notification for this auction
          const hasSettlement = newNotifications.some(
            (n) => n.auctionId === auctionId && n.type === "claim_ready"
          );

          if (!hasSettlement) {
            newNotifications.push({
              auctionId,
              type: "claim_ready",
              message: `⏰ Auction ${auctionId} appears to be ended. Check if you can claim your NFT!`,
              timestamp: currentTime,
              amount: bidData.amount,
            });
          }
        }
      }

      // Sort notifications by timestamp (newest first)
      newNotifications.sort((a, b) => b.timestamp - a.timestamp);

      console.log(
        `🔔 Generated ${newNotifications.length} notifications based on events`
      );
      setNotifications(newNotifications);
      setLastCheckedBlock(currentBlock);
    } catch (error) {
      console.error("❌ Error fetching auction events:", error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchAuctionEvents();

    // Refresh every 30 seconds
    const interval = setInterval(fetchAuctionEvents, 30000);
    return () => clearInterval(interval);
  }, [fetchAuctionEvents]);

  const hasUnreadNotifications = notifications.length > 0;
  const unreadCount = notifications.length;

  const markAsRead = useCallback((auctionId: string) => {
    setNotifications((prev) => prev.filter((n) => n.auctionId !== auctionId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

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
