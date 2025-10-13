"use client";

import { useEffect, useRef, useCallback } from "react";
import { useWatchContractEvent } from "wagmi";
import { useAccount } from "wagmi";
import { auctionContractConfig } from "@/utils/contracts";

export interface AuctionEventData {
  auctionId: string;
  bidder: string;
  amount: string;
  isHighestBid: boolean;
  transactionHash: string;
  blockNumber: number;
}

export interface AuctionEventCallbacks {
  onBidPlaced?: (data: AuctionEventData) => void;
  onAuctionSettled?: (data: {
    auctionId: string;
    winner: string;
    amount: string;
  }) => void;
  onAuctionCreated?: (data: {
    auctionId: string;
    seller: string;
    tokenId: string;
  }) => void;
}

export function useAuctionEventListening(
  callbacks: AuctionEventCallbacks = {}
) {
  const { address } = useAccount();
  const processedEvents = useRef<Set<string>>(new Set());

  // Listen for BidPlaced events
  useWatchContractEvent({
    ...auctionContractConfig,
    eventName: "BidPlaced",
    onLogs: useCallback(
      (logs: any[]) => {
        logs.forEach((log) => {
          if ("args" in log && log.args) {
            const eventId = `${log.transactionHash}-${log.logIndex}`;

            // Prevent duplicate processing
            if (processedEvents.current.has(eventId)) {
              return;
            }
            processedEvents.current.add(eventId);

            const { auctionId, bidder, amount, isHighestBid } = log.args;

            console.log("🎯 BidPlaced event received:", {
              auctionId: auctionId.toString(),
              bidder,
              amount: amount.toString(),
              isHighestBid,
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber,
            });

            // Only process events for the current user
            if (bidder.toLowerCase() === address?.toLowerCase()) {
              const eventData: AuctionEventData = {
                auctionId: auctionId.toString(),
                bidder,
                amount: amount.toString(),
                isHighestBid,
                transactionHash: log.transactionHash,
                blockNumber: log.blockNumber,
              };

              callbacks.onBidPlaced?.(eventData);
            }
          }
        });
      },
      [address, callbacks.onBidPlaced]
    ),
  });

  // Listen for AuctionSettled events
  useWatchContractEvent({
    ...auctionContractConfig,
    eventName: "AuctionSettled",
    onLogs: useCallback(
      (logs: any[]) => {
        logs.forEach((log) => {
          if ("args" in log && log.args) {
            const eventId = `${log.transactionHash}-${log.logIndex}`;

            if (processedEvents.current.has(eventId)) {
              return;
            }
            processedEvents.current.add(eventId);

            const { auctionId, winner, amount } = log.args;

            console.log("🏆 AuctionSettled event received:", {
              auctionId: auctionId.toString(),
              winner,
              amount: amount.toString(),
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber,
            });

            // Process for current user if they're the winner
            if (winner.toLowerCase() === address?.toLowerCase()) {
              callbacks.onAuctionSettled?.({
                auctionId: auctionId.toString(),
                winner,
                amount: amount.toString(),
              });
            }
          }
        });
      },
      [address, callbacks.onAuctionSettled]
    ),
  });

  // Listen for AuctionCreated events
  useWatchContractEvent({
    ...auctionContractConfig,
    eventName: "AuctionCreated",
    onLogs: useCallback(
      (logs: any[]) => {
        logs.forEach((log) => {
          if ("args" in log && log.args) {
            const eventId = `${log.transactionHash}-${log.logIndex}`;

            if (processedEvents.current.has(eventId)) {
              return;
            }
            processedEvents.current.add(eventId);

            const { auctionId, seller, tokenId } = log.args;

            console.log("🆕 AuctionCreated event received:", {
              auctionId: auctionId.toString(),
              seller,
              tokenId: tokenId.toString(),
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber,
            });

            callbacks.onAuctionCreated?.({
              auctionId: auctionId.toString(),
              seller,
              tokenId: tokenId.toString(),
            });
          }
        });
      },
      [callbacks.onAuctionCreated]
    ),
  });

  // Cleanup processed events periodically to prevent memory leaks
  useEffect(() => {
    const cleanup = setInterval(() => {
      if (processedEvents.current.size > 1000) {
        processedEvents.current.clear();
      }
    }, 60000); // Cleanup every minute

    return () => clearInterval(cleanup);
  }, []);

  return {
    processedEventsCount: processedEvents.current.size,
  };
}
