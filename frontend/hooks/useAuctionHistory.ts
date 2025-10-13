"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

export interface AuctionHistoryItem {
  type:
    | "auction_created"
    | "bid_placed"
    | "auction_settled"
    | "auction_cancelled";
  auctionId: string;
  tokenId: string;
  amount?: string; // ETH amount in wei
  winner?: string;
  seller?: string;
  bidder?: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
}

export interface AuctionHistory {
  tokenId: string;
  history: AuctionHistoryItem[];
  finalPrice?: string; // Final price paid in wei
  winner?: string;
  auctionId?: string;
}

export function useAuctionHistory(tokenId: string | null) {
  const { address } = useAccount();
  const [history, setHistory] = useState<AuctionHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuctionHistory = useCallback(async () => {
    if (!tokenId || !address) return;

    // Validate tokenId is a number
    const tokenIdNum = parseInt(tokenId);
    if (isNaN(tokenIdNum)) {
      console.warn(`⚠️ [useAuctionHistory] Invalid tokenId: ${tokenId}`);
      setError(`Invalid tokenId: ${tokenId}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || "https://1rpc.io/sepolia"
      );

      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      console.log(
        `🔍 [useAuctionHistory] Fetching events for token ${tokenId}`
      );

      // Get all events related to this token
      const [auctionCreatedEvents, bidPlacedEvents, auctionSettledEvents] =
        await Promise.all([
          auctionContract.queryFilter(
            auctionContract.filters.AuctionCreated(null, tokenIdNum)
          ),
          auctionContract.queryFilter(
            auctionContract.filters.BidPlaced(null, tokenIdNum)
          ),
          auctionContract.queryFilter(
            auctionContract.filters.AuctionSettled(null, tokenIdNum)
          ),
        ]);

      console.log(`📊 [useAuctionHistory] Found events:`, {
        auctionCreated: auctionCreatedEvents.length,
        bidPlaced: bidPlacedEvents.length,
        auctionSettled: auctionSettledEvents.length,
      });

      // Process events into history items
      const historyItems: AuctionHistoryItem[] = [];

      // Process AuctionCreated events
      auctionCreatedEvents.forEach((event) => {
        if ("args" in event && event.args) {
          historyItems.push({
            type: "auction_created",
            auctionId: event.args.auctionId.toString(),
            tokenId: event.args.tokenId.toString(),
            seller: event.args.seller,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(), // We'll get this from the block later
          });
        }
      });

      // Process BidPlaced events
      bidPlacedEvents.forEach((event) => {
        if ("args" in event && event.args) {
          historyItems.push({
            type: "bid_placed",
            auctionId: event.args.auctionId.toString(),
            tokenId: event.args.tokenId.toString(),
            amount: event.args.value.toString(),
            bidder: event.args.bidder,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(),
          });
        }
      });

      // Process AuctionSettled events
      auctionSettledEvents.forEach((event) => {
        if ("args" in event && event.args) {
          historyItems.push({
            type: "auction_settled",
            auctionId: event.args.auctionId.toString(),
            tokenId: event.args.tokenId.toString(),
            amount: event.args.finalPrice?.toString(),
            winner: event.args.winner,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(),
          });
        }
      });

      // Sort by block number (chronological order)
      historyItems.sort((a, b) => a.blockNumber - b.blockNumber);

      // Get timestamps from blocks
      const uniqueBlockNumbers = [
        ...new Set(historyItems.map((item) => item.blockNumber)),
      ];

      const blockTimestamps: Record<number, number> = {};
      for (const blockNumber of uniqueBlockNumbers) {
        try {
          const block = await provider.getBlock(blockNumber);
          blockTimestamps[blockNumber] = block?.timestamp || Date.now();
        } catch (err) {
          console.warn(
            `⚠️ [useAuctionHistory] Failed to get block ${blockNumber}:`,
            err
          );
          blockTimestamps[blockNumber] = Date.now();
        }
      }

      // Update timestamps
      historyItems.forEach((item) => {
        item.timestamp = blockTimestamps[item.blockNumber] * 1000; // Convert to milliseconds
      });

      // Find the final auction data
      const settledEvent =
        auctionSettledEvents[auctionSettledEvents.length - 1];
      const finalPrice =
        settledEvent && "args" in settledEvent
          ? settledEvent.args?.finalPrice?.toString()
          : "";
      const winner =
        settledEvent && "args" in settledEvent ? settledEvent.args?.winner : "";

      const auctionHistory: AuctionHistory = {
        tokenId,
        history: historyItems,
        finalPrice,
        winner,
        auctionId: historyItems[0]?.auctionId,
      };

      console.log(`✅ [useAuctionHistory] Successfully fetched history:`, {
        tokenId,
        itemCount: historyItems.length,
        finalPrice,
        winner,
      });

      setHistory(auctionHistory);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch auction history";
      console.error(`❌ [useAuctionHistory] Error:`, errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [tokenId, address]);

  useEffect(() => {
    fetchAuctionHistory();
  }, [fetchAuctionHistory]);

  return {
    history,
    isLoading,
    error,
    refetch: fetchAuctionHistory,
  };
}

export function useMultipleAuctionHistory(tokenIds: string[]) {
  const { address } = useAccount();
  const [histories, setHistories] = useState<AuctionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllHistories = useCallback(async () => {
    if (!tokenIds.length || !address) return;

    console.log(
      `🚀 [useMultipleAuctionHistory] Starting fetch for ${tokenIds.length} tokens`
    );
    setIsLoading(true);
    setError(null);

    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || "https://1rpc.io/sepolia"
      );

      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      const allHistories: AuctionHistory[] = [];

      // Process each token ID
      for (const tokenId of tokenIds) {
        const tokenIdNum = parseInt(tokenId);
        if (isNaN(tokenIdNum)) {
          console.warn(
            `⚠️ [useMultipleAuctionHistory] Invalid tokenId: ${tokenId}`
          );
          continue;
        }

        console.log(
          `🔍 [useMultipleAuctionHistory] Processing token ${tokenId}`
        );

        try {
          // Get all events related to this token
          const [auctionCreatedEvents, bidPlacedEvents, auctionSettledEvents] =
            await Promise.all([
              auctionContract.queryFilter(
                auctionContract.filters.AuctionCreated(null, tokenIdNum)
              ),
              auctionContract.queryFilter(
                auctionContract.filters.BidPlaced(null, tokenIdNum)
              ),
              auctionContract.queryFilter(
                auctionContract.filters.AuctionSettled(null, tokenIdNum)
              ),
            ]);

          // Process events into history items
          const historyItems: AuctionHistoryItem[] = [];

          // Process AuctionCreated events
          auctionCreatedEvents.forEach((event) => {
            if ("args" in event && event.args) {
              historyItems.push({
                type: "auction_created",
                auctionId: event.args.auctionId.toString(),
                tokenId: event.args.tokenId.toString(),
                seller: event.args.seller,
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                timestamp: Date.now(),
              });
            }
          });

          // Process BidPlaced events
          bidPlacedEvents.forEach((event) => {
            if ("args" in event && event.args) {
              historyItems.push({
                type: "bid_placed",
                auctionId: event.args.auctionId.toString(),
                tokenId: event.args.tokenId.toString(),
                amount: event.args.value.toString(),
                bidder: event.args.bidder,
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                timestamp: Date.now(),
              });
            }
          });

          // Process AuctionSettled events
          auctionSettledEvents.forEach((event) => {
            if ("args" in event && event.args) {
              historyItems.push({
                type: "auction_settled",
                auctionId: event.args.auctionId.toString(),
                tokenId: event.args.tokenId.toString(),
                amount: event.args.finalPrice?.toString(),
                winner: event.args.winner,
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                timestamp: Date.now(),
              });
            }
          });

          // Sort by block number (chronological order)
          historyItems.sort((a, b) => a.blockNumber - b.blockNumber);

          // Get timestamps from blocks
          const uniqueBlockNumbers = [
            ...new Set(historyItems.map((item) => item.blockNumber)),
          ];

          const blockTimestamps: Record<number, number> = {};
          for (const blockNumber of uniqueBlockNumbers) {
            try {
              const block = await provider.getBlock(blockNumber);
              blockTimestamps[blockNumber] = block?.timestamp || Date.now();
            } catch (err) {
              console.warn(
                `⚠️ [useMultipleAuctionHistory] Failed to get block ${blockNumber}:`,
                err
              );
              blockTimestamps[blockNumber] = Date.now();
            }
          }

          // Update timestamps
          historyItems.forEach((item) => {
            item.timestamp = blockTimestamps[item.blockNumber] * 1000; // Convert to milliseconds
          });

          // Find the final auction data
          const settledEvent =
            auctionSettledEvents[auctionSettledEvents.length - 1];
          const finalPrice =
            settledEvent && "args" in settledEvent
              ? settledEvent.args?.finalPrice?.toString()
              : "";
          const winner =
            settledEvent && "args" in settledEvent
              ? settledEvent.args?.winner
              : "";

          const auctionHistory: AuctionHistory = {
            tokenId,
            history: historyItems,
            finalPrice,
            winner,
            auctionId: historyItems[0]?.auctionId,
          };

          allHistories.push(auctionHistory);

          console.log(
            `✅ [useMultipleAuctionHistory] Processed token ${tokenId}:`,
            {
              itemCount: historyItems.length,
              finalPrice,
              winner,
            }
          );
        } catch (err) {
          console.error(
            `❌ [useMultipleAuctionHistory] Error processing token ${tokenId}:`,
            err
          );
          // Continue with other tokens even if one fails
        }
      }

      console.log(
        `✅ [useMultipleAuctionHistory] Successfully processed ${allHistories.length} tokens`
      );
      setHistories(allHistories);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch auction histories";
      console.error(`❌ [useMultipleAuctionHistory] Error:`, errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [tokenIds, address]);

  useEffect(() => {
    fetchAllHistories();
  }, [fetchAllHistories]);

  return {
    histories,
    isLoading,
    error,
    refetch: fetchAllHistories,
  };
}
