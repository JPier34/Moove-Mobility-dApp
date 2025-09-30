"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";

interface BidPlacedEvent {
  auctionId: string;
  bidder: string;
  amount: string;
  isHighestBid: boolean;
  transactionHash: string;
  blockNumber: number;
}

interface SealedBidSubmittedEvent {
  auctionId: string;
  bidder: string;
  bidHash: string;
  transactionHash: string;
  blockNumber: number;
}

interface EventBasedWinner {
  auctionId: string;
  winner: string;
  amount: string;
  transactionHash: string;
  blockNumber: number;
}

export function useEventBasedWinners() {
  const { address } = useAccount();
  const [winners, setWinners] = useState<EventBasedWinner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBidPlacedEvents = useCallback(async () => {
    if (!address) return;

    try {
      setLoading(true);
      console.log("🔍 Fetching all auction events for user:", address);

      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL ||
          "https://ethereum-sepolia.publicnode.com"
      );

      const auctionABI = [
        "event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount, bool isHighestBid)",
        "event SealedBidSubmitted(uint256 indexed auctionId, address indexed bidder, bytes32 bidHash)",
      ];

      const auctionContract = new ethers.Contract(
        "0x463a4fff0796AF7C69788463629AeF046A2fc211",
        auctionABI,
        provider
      );

      // Get events from the last 1000 blocks
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 1000);

      console.log(
        `📡 Fetching events from block ${fromBlock} to ${currentBlock}`
      );

      // Fetch BidPlaced events (English, Reserve, Dutch)
      const bidPlacedEvents = await auctionContract.queryFilter(
        auctionContract.filters.BidPlaced(null, address),
        fromBlock,
        currentBlock
      );

      // Fetch SealedBidSubmitted events (Sealed Bid)
      const sealedBidEvents = await auctionContract.queryFilter(
        auctionContract.filters.SealedBidSubmitted(null, address),
        fromBlock,
        currentBlock
      );

      console.log(
        `🎯 Found ${bidPlacedEvents.length} BidPlaced events and ${sealedBidEvents.length} SealedBidSubmitted events for user`
      );

      const eventBasedWinners: EventBasedWinner[] = [];

      // Process BidPlaced events (English, Reserve, Dutch)
      for (const event of bidPlacedEvents) {
        if ("args" in event && event.args) {
          const { auctionId, bidder, amount, isHighestBid } = event.args;

          console.log(`📊 BidPlaced Event for Auction ${auctionId}:`, {
            bidder,
            amount: ethers.formatEther(amount),
            isHighestBid,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
          });

          // Only consider events where the user is the highest bidder
          if (isHighestBid && bidder.toLowerCase() === address.toLowerCase()) {
            eventBasedWinners.push({
              auctionId: auctionId.toString(),
              winner: bidder,
              amount: ethers.formatEther(amount),
              transactionHash: event.transactionHash,
              blockNumber: event.blockNumber,
            });
          }
        }
      }

      // Process SealedBidSubmitted events (Sealed Bid)
      for (const event of sealedBidEvents) {
        if ("args" in event && event.args) {
          const { auctionId, bidder, bidHash } = event.args;

          console.log(`📊 SealedBidSubmitted Event for Auction ${auctionId}:`, {
            bidder,
            bidHash,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
          });

          // For sealed bids, we consider the user a winner if they submitted a bid
          // The actual winner determination happens in endAuction() but we don't have that event
          // So we'll mark them as a potential winner and let the settlement process handle it
          if (bidder.toLowerCase() === address.toLowerCase()) {
            eventBasedWinners.push({
              auctionId: auctionId.toString(),
              winner: bidder,
              amount: "0", // Amount unknown until reveal
              transactionHash: event.transactionHash,
              blockNumber: event.blockNumber,
            });
          }
        }
      }

      console.log(
        `✅ Found ${eventBasedWinners.length} winning bids based on events`
      );
      setWinners(eventBasedWinners);
    } catch (error) {
      console.error("❌ Error fetching auction events:", error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchBidPlacedEvents();
  }, [fetchBidPlacedEvents]);

  const isWinnerByEvent = useCallback(
    (auctionId: string) => {
      return winners.some((winner) => winner.auctionId === auctionId);
    },
    [winners]
  );

  const getWinnerByEvent = useCallback(
    (auctionId: string) => {
      return winners.find((winner) => winner.auctionId === auctionId);
    },
    [winners]
  );

  return {
    winners,
    loading,
    isWinnerByEvent,
    getWinnerByEvent,
    refetch: fetchBidPlacedEvents,
  };
}
