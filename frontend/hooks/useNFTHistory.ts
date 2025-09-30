"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

export interface NFTHistoryItem {
  type:
    | "mint"
    | "transfer"
    | "auction_created"
    | "auction_won"
    | "auction_lost";
  from: string;
  to: string;
  tokenId: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  amount?: string; // For auction events
  auctionId?: string; // For auction events
}

export interface NFTHistory {
  tokenId: string;
  history: NFTHistoryItem[];
  currentOwner: string;
  totalTransfers: number;
}

export function useNFTHistory(tokenId: string | null) {
  const { address } = useAccount();
  const [history, setHistory] = useState<NFTHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchNFTHistory = useCallback(async () => {
    if (!tokenId || !address) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Validate tokenId is a number
    const tokenIdNum = parseInt(tokenId);
    if (isNaN(tokenIdNum)) {
      console.warn(`⚠️ [useNFTHistory] Invalid tokenId: ${tokenId}`);
      setError(`Invalid tokenId: ${tokenId}`);
      return;
    }

    console.log(`🚀 [useNFTHistory] Starting fetch for token ${tokenId}`);
    setIsLoading(true);
    setError(null);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL ||
          "https://ethereum-sepolia.publicnode.com"
      );

      const nftContract = new ethers.Contract(
        contracts.MooveNFT.address,
        contracts.MooveNFT.abi,
        provider
      );

      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      console.log(`🔍 [useNFTHistory] Fetching events for token ${tokenId}`);

      // Get all events related to this token
      const [transferEvents, auctionCreatedEvents, auctionSettledEvents] =
        await Promise.all([
          nftContract.queryFilter(
            nftContract.filters.Transfer(null, null, tokenIdNum)
          ),
          auctionContract.queryFilter(
            auctionContract.filters.AuctionCreated(null, tokenIdNum)
          ),
          auctionContract.queryFilter(
            auctionContract.filters.AuctionSettled(null, tokenIdNum)
          ),
        ]);

      console.log(`📊 [useNFTHistory] Found events:`, {
        transfers: transferEvents.length,
        auctionCreated: auctionCreatedEvents.length,
        auctionSettled: auctionSettledEvents.length,
      });

      // Process events into history items
      const historyItems: NFTHistoryItem[] = [];

      // Process Transfer events
      transferEvents.forEach((event) => {
        const args = event instanceof ethers.EventLog ? event.args : null;
        if (args) {
          const isMint = args.from === ethers.ZeroAddress;
          historyItems.push({
            type: isMint ? "mint" : "transfer",
            from: args.from,
            to: args.to,
            tokenId: args.tokenId.toString(),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(), // We'll get this from the block later
          });
        }
      });

      // Process AuctionCreated events
      auctionCreatedEvents.forEach((event) => {
        const args = event instanceof ethers.EventLog ? event.args : null;
        if (args) {
          historyItems.push({
            type: "auction_created",
            from: args.seller,
            to: "auction_contract",
            tokenId: args.tokenId.toString(),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(),
            auctionId: args.auctionId.toString(),
          });
        }
      });

      // Process AuctionSettled events
      auctionSettledEvents.forEach((event) => {
        const args = event instanceof ethers.EventLog ? event.args : null;
        if (args) {
          historyItems.push({
            type: "auction_won",
            from: "auction_contract",
            to: args.winner,
            tokenId: args.tokenId.toString(),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(),
            amount: args.finalPrice?.toString(),
            auctionId: args.auctionId.toString(),
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
            `⚠️ [useNFTHistory] Failed to get block ${blockNumber}:`,
            err
          );
          blockTimestamps[blockNumber] = Date.now();
        }
      }

      // Update timestamps
      historyItems.forEach((item) => {
        item.timestamp = blockTimestamps[item.blockNumber] * 1000; // Convert to milliseconds
      });

      // Get current owner
      const currentOwner = await nftContract.ownerOf(tokenIdNum);

      const nftHistory: NFTHistory = {
        tokenId,
        history: historyItems,
        currentOwner,
        totalTransfers: transferEvents.length,
      };

      console.log(`✅ [useNFTHistory] Successfully fetched history:`, {
        tokenId,
        itemCount: historyItems.length,
        currentOwner,
        totalTransfers: transferEvents.length,
      });

      setHistory(nftHistory);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log(`🛑 [useNFTHistory] Request aborted for token ${tokenId}`);
        return;
      }

      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch NFT history";
      console.error(`❌ [useNFTHistory] Error:`, errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [tokenId, address]);

  useEffect(() => {
    fetchNFTHistory();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchNFTHistory]);

  return {
    history,
    isLoading,
    error,
    refetch: fetchNFTHistory,
  };
}

export function useMultipleNFTHistory(tokenIds: string[]) {
  const { address } = useAccount();
  const [histories, setHistories] = useState<NFTHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAllHistories = useCallback(async () => {
    if (!tokenIds.length || !address) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    console.log(
      `🚀 [useMultipleNFTHistory] Starting fetch for ${tokenIds.length} tokens`
    );
    setIsLoading(true);
    setError(null);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL ||
          "https://ethereum-sepolia.publicnode.com"
      );

      const nftContract = new ethers.Contract(
        contracts.MooveNFT.address,
        contracts.MooveNFT.abi,
        provider
      );

      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      const allHistories: NFTHistory[] = [];

      // Process each token ID
      for (const tokenId of tokenIds) {
        const tokenIdNum = parseInt(tokenId);
        if (isNaN(tokenIdNum)) {
          console.warn(
            `⚠️ [useMultipleNFTHistory] Invalid tokenId: ${tokenId}`
          );
          continue;
        }

        console.log(`🔍 [useMultipleNFTHistory] Processing token ${tokenId}`);

        try {
          // Get all events related to this token
          const [transferEvents, auctionCreatedEvents, auctionSettledEvents] =
            await Promise.all([
              nftContract.queryFilter(
                nftContract.filters.Transfer(null, null, tokenIdNum)
              ),
              auctionContract.queryFilter(
                auctionContract.filters.AuctionCreated(null, tokenIdNum)
              ),
              auctionContract.queryFilter(
                auctionContract.filters.AuctionSettled(null, tokenIdNum)
              ),
            ]);

          // Process events into history items
          const historyItems: NFTHistoryItem[] = [];

          // Process Transfer events
          transferEvents.forEach((event) => {
            const args = event instanceof ethers.EventLog ? event.args : null;
            if (args) {
              const isMint = args.from === ethers.ZeroAddress;
              historyItems.push({
                type: isMint ? "mint" : "transfer",
                from: args.from,
                to: args.to,
                tokenId: args.tokenId.toString(),
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                timestamp: Date.now(),
              });
            }
          });

          // Process AuctionCreated events
          auctionCreatedEvents.forEach((event) => {
            const args = event instanceof ethers.EventLog ? event.args : null;
            if (args) {
              historyItems.push({
                type: "auction_created",
                from: args.seller,
                to: "auction_contract",
                tokenId: args.tokenId.toString(),
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                timestamp: Date.now(),
                auctionId: args.auctionId.toString(),
              });
            }
          });

          // Process AuctionSettled events
          auctionSettledEvents.forEach((event) => {
            const args = event instanceof ethers.EventLog ? event.args : null;
            if (args) {
              historyItems.push({
                type: "auction_won",
                from: "auction_contract",
                to: args.winner,
                tokenId: args.tokenId.toString(),
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                timestamp: Date.now(),
                amount: args.finalPrice?.toString(),
                auctionId: args.auctionId.toString(),
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
                `⚠️ [useMultipleNFTHistory] Failed to get block ${blockNumber}:`,
                err
              );
              blockTimestamps[blockNumber] = Date.now();
            }
          }

          // Update timestamps
          historyItems.forEach((item) => {
            item.timestamp = blockTimestamps[item.blockNumber] * 1000; // Convert to milliseconds
          });

          // Get current owner
          const currentOwner = await nftContract.ownerOf(tokenIdNum);

          const nftHistory: NFTHistory = {
            tokenId,
            history: historyItems,
            currentOwner,
            totalTransfers: transferEvents.length,
          };

          allHistories.push(nftHistory);

          console.log(
            `✅ [useMultipleNFTHistory] Processed token ${tokenId}:`,
            {
              itemCount: historyItems.length,
              currentOwner,
              totalTransfers: transferEvents.length,
            }
          );
        } catch (err) {
          console.error(
            `❌ [useMultipleNFTHistory] Error processing token ${tokenId}:`,
            err
          );
          // Continue with other tokens even if one fails
        }
      }

      console.log(
        `✅ [useMultipleNFTHistory] Successfully processed ${allHistories.length} tokens`
      );
      setHistories(allHistories);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log(`🛑 [useMultipleNFTHistory] Request aborted`);
        return;
      }

      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch NFT histories";
      console.error(`❌ [useMultipleNFTHistory] Error:`, errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [tokenIds, address]);

  useEffect(() => {
    fetchAllHistories();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAllHistories]);

  return {
    histories,
    isLoading,
    error,
    refetch: fetchAllHistories,
  };
}
