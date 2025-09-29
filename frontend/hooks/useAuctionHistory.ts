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

    console.log(`🚀 [useAuctionHistory] Starting fetch for token ${tokenId}`);
    setIsLoading(true);
    setError(null);

    try {
      // Create contract instance
      if (!window.ethereum) {
        throw new Error("No ethereum provider available");
      }
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      console.log(
        `🔍 [useAuctionHistory] Fetching auction events for token #${tokenId}`
      );

      const historyItems: AuctionHistoryItem[] = [];
      let finalPrice: string | undefined;
      let winner: string | undefined;
      let auctionId: string | undefined;

      // Get AuctionCreated events for this NFT contract
      // Note: tokenId is non-indexed, so we can't filter by it directly
      const createdFilter = auctionContract.filters.AuctionCreated(
        null, // auctionId
        null, // seller
        contracts.MooveNFT.address // nftContract
      );
      const allCreatedEvents = await auctionContract.queryFilter(createdFilter);

      console.log(
        `📜 [useAuctionHistory] Found ${allCreatedEvents.length} total AuctionCreated events for NFT contract`
      );

      // Debug: show first few events to understand structure
      if (allCreatedEvents.length > 0) {
        console.log(
          "📜 [useAuctionHistory] Sample AuctionCreated events:",
          allCreatedEvents.slice(0, 3).map((event) => ({
            tokenId: event.args?.tokenId?.toString(),
            auctionId: event.args?.auctionId?.toString(),
            seller: event.args?.seller,
            nftContract: event.args?.nftContract,
            blockNumber: event.blockNumber,
          }))
        );
      }

      // Filter by tokenId manually since it's non-indexed
      const createdEvents = allCreatedEvents.filter((event) => {
        const eventTokenId = event.args?.tokenId?.toString();
        return eventTokenId === tokenId;
      });

      console.log(
        `📜 [useAuctionHistory] Found ${createdEvents.length} AuctionCreated events for token #${tokenId}`
      );

      for (const event of createdEvents) {
        try {
          const block = await provider.getBlock(event.blockNumber);
          if (!block) continue;

          const eventLog = event as ethers.EventLog;
          auctionId = eventLog.args.auctionId.toString();

          const historyItem: AuctionHistoryItem = {
            type: "auction_created",
            auctionId: auctionId,
            tokenId: eventLog.args.tokenId.toString(),
            seller: eventLog.args.seller,
            transactionHash: eventLog.transactionHash,
            blockNumber: eventLog.blockNumber,
            timestamp: block.timestamp,
          };

          historyItems.push(historyItem);
          console.log(
            `🔍 [useAuctionHistory] AuctionCreated: ${auctionId} for token ${tokenId}`
          );
        } catch (e) {
          console.error(
            `❌ [useAuctionHistory] Error processing AuctionCreated event:`,
            e
          );
        }
      }

      // Get BidPlaced events for this token's auctions
      if (auctionId) {
        const bidFilter = auctionContract.filters.BidPlaced(auctionId);
        const bidEvents = await auctionContract.queryFilter(bidFilter);

        console.log(
          `📜 [useAuctionHistory] Found ${bidEvents.length} BidPlaced events for auction ${auctionId}`
        );

        for (const event of bidEvents) {
          try {
            const block = await provider.getBlock(event.blockNumber);
            if (!block) continue;

            const eventLog = event as ethers.EventLog;

            const historyItem: AuctionHistoryItem = {
              type: "bid_placed",
              auctionId: eventLog.args.auctionId.toString(),
              tokenId: tokenId,
              amount: eventLog.args.amount.toString(),
              bidder: eventLog.args.bidder,
              transactionHash: eventLog.transactionHash,
              blockNumber: eventLog.blockNumber,
              timestamp: block.timestamp,
            };

            historyItems.push(historyItem);
            console.log(
              `🔍 [useAuctionHistory] BidPlaced: ${eventLog.args.amount.toString()} by ${
                eventLog.args.bidder
              }`
            );
          } catch (e) {
            console.error(
              `❌ [useAuctionHistory] Error processing BidPlaced event:`,
              e
            );
          }
        }

        // Get AuctionSettled events for this auction
        const settledFilter = auctionContract.filters.AuctionSettled(auctionId);
        const settledEvents = await auctionContract.queryFilter(settledFilter);

        console.log(
          `📜 [useAuctionHistory] Found ${settledEvents.length} AuctionSettled events for auction ${auctionId}`
        );

        for (const event of settledEvents) {
          try {
            const block = await provider.getBlock(event.blockNumber);
            if (!block) continue;

            const eventLog = event as ethers.EventLog;
            finalPrice = eventLog.args.finalPrice.toString();
            winner = eventLog.args.winner;

            const historyItem: AuctionHistoryItem = {
              type: "auction_settled",
              auctionId: eventLog.args.auctionId.toString(),
              tokenId: tokenId,
              amount: eventLog.args.finalPrice.toString(),
              winner: eventLog.args.winner,
              transactionHash: eventLog.transactionHash,
              blockNumber: eventLog.blockNumber,
              timestamp: block.timestamp,
            };

            historyItems.push(historyItem);
            console.log(
              `🔍 [useAuctionHistory] AuctionSettled: finalPrice=${finalPrice}, winner=${winner}`
            );
          } catch (e) {
            console.error(
              `❌ [useAuctionHistory] Error processing AuctionSettled event:`,
              e
            );
          }
        }
      }

      // Sort history by timestamp (oldest first)
      historyItems.sort((a, b) => a.timestamp - b.timestamp);

      const auctionHistory: AuctionHistory = {
        tokenId,
        history: historyItems,
        finalPrice,
        winner,
        auctionId,
      };

      console.log(
        `📊 [useAuctionHistory] NFT #${tokenId} auction history:`,
        auctionHistory
      );
      setHistory(auctionHistory);
    } catch (err) {
      console.error(
        `❌ [useAuctionHistory] Error fetching auction history for #${tokenId}:`,
        err
      );
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [tokenId, address]);

  useEffect(() => {
    if (tokenId && address) {
      fetchAuctionHistory();
    }
  }, [fetchAuctionHistory, tokenId, address]);

  return {
    history,
    isLoading,
    error,
    refetch: fetchAuctionHistory,
  };
}

export function useMultipleAuctionHistory(tokenIds: string[]) {
  const { address } = useAccount();
  const [histories, setHistories] = useState<Map<string, AuctionHistory>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log(
    `🚀 [useMultipleAuctionHistory] Called with ${tokenIds.length} token IDs:`,
    tokenIds
  );

  const fetchAllHistories = useCallback(async () => {
    if (tokenIds.length === 0 || !address) return;

    setIsLoading(true);
    setError(null);

    try {
      const newHistories = new Map<string, AuctionHistory>();

      // Process each token ID
      for (const tokenId of tokenIds) {
        try {
          console.log(
            `🔍 [useMultipleAuctionHistory] Processing token ${tokenId}`
          );

          // Validate tokenId is a number
          const tokenIdNum = parseInt(tokenId);
          if (isNaN(tokenIdNum)) {
            console.warn(
              `⚠️ [useMultipleAuctionHistory] Invalid tokenId: ${tokenId}, skipping`
            );
            continue;
          }

          // Create contract instance
          if (!window.ethereum) {
            throw new Error("No ethereum provider available");
          }
          const provider = new ethers.BrowserProvider(window.ethereum as any);
          const auctionContract = new ethers.Contract(
            contracts.MooveAuction.address,
            contracts.MooveAuction.abi,
            provider
          );

          console.log(
            `🔍 [useMultipleAuctionHistory] Token ${tokenId}: Contract address: ${contracts.MooveAuction.address}`
          );

          const historyItems: AuctionHistoryItem[] = [];
          let finalPrice: string | undefined;
          let winner: string | undefined;
          let auctionId: string | undefined;

          // Get AuctionCreated events for this NFT contract
          // Note: tokenId is non-indexed, so we can't filter by it directly
          const createdFilter = auctionContract.filters.AuctionCreated(
            null, // auctionId
            null, // seller
            contracts.MooveNFT.address // nftContract
          );
          const allCreatedEvents = await auctionContract.queryFilter(
            createdFilter
          );

          console.log(
            `🔍 [useMultipleAuctionHistory] Token ${tokenId}: Found ${allCreatedEvents.length} total AuctionCreated events for NFT contract`
          );

          // Debug: show first few events to understand structure (only for first token to avoid spam)
          if (tokenId === tokenIds[0] && allCreatedEvents.length > 0) {
            console.log(
              "🔍 [useMultipleAuctionHistory] Sample AuctionCreated events:",
              allCreatedEvents.slice(0, 3).map((event) => ({
                tokenId: event.args?.tokenId?.toString(),
                auctionId: event.args?.auctionId?.toString(),
                seller: event.args?.seller,
                nftContract: event.args?.nftContract,
                blockNumber: event.blockNumber,
              }))
            );

            // Show ALL tokenIds that have auctions
            const allTokenIdsWithAuctions = allCreatedEvents
              .map((event) => event.args?.tokenId?.toString())
              .filter(Boolean);
            console.log(
              "🔍 [useMultipleAuctionHistory] All tokenIds with auctions:",
              allTokenIdsWithAuctions
            );
          }

          // Filter by tokenId manually since it's non-indexed
          const createdEvents = allCreatedEvents.filter((event) => {
            const eventTokenId = event.args?.tokenId?.toString();
            return eventTokenId === tokenId;
          });

          console.log(
            `🔍 [useMultipleAuctionHistory] Token ${tokenId}: Found ${createdEvents.length} AuctionCreated events for this token`
          );

          for (const event of createdEvents) {
            try {
              const block = await provider.getBlock(event.blockNumber);
              if (!block) continue;

              const eventLog = event as ethers.EventLog;
              auctionId = eventLog.args.auctionId.toString();

              const historyItem: AuctionHistoryItem = {
                type: "auction_created",
                auctionId: auctionId,
                tokenId: eventLog.args.tokenId.toString(),
                seller: eventLog.args.seller,
                transactionHash: eventLog.transactionHash,
                blockNumber: eventLog.blockNumber,
                timestamp: block.timestamp,
              };

              historyItems.push(historyItem);
            } catch (e) {
              console.error(
                `❌ [useMultipleAuctionHistory] Error processing AuctionCreated event for token ${tokenId}:`,
                e
              );
            }
          }

          // Get BidPlaced and AuctionSettled events if auction exists
          if (auctionId) {
            console.log(
              `🔍 [useMultipleAuctionHistory] Token ${tokenId}: Processing auction ${auctionId}`
            );

            // Get BidPlaced events
            const bidFilter = auctionContract.filters.BidPlaced(auctionId);
            const bidEvents = await auctionContract.queryFilter(bidFilter);

            console.log(
              `🔍 [useMultipleAuctionHistory] Token ${tokenId}: Found ${bidEvents.length} BidPlaced events`
            );

            for (const event of bidEvents) {
              try {
                const block = await provider.getBlock(event.blockNumber);
                if (!block) continue;

                const eventLog = event as ethers.EventLog;

                const historyItem: AuctionHistoryItem = {
                  type: "bid_placed",
                  auctionId: eventLog.args.auctionId.toString(),
                  tokenId: tokenId,
                  amount: eventLog.args.amount.toString(),
                  bidder: eventLog.args.bidder,
                  transactionHash: eventLog.transactionHash,
                  blockNumber: eventLog.blockNumber,
                  timestamp: block.timestamp,
                };

                historyItems.push(historyItem);
              } catch (e) {
                console.error(
                  `❌ [useMultipleAuctionHistory] Error processing BidPlaced event for token ${tokenId}:`,
                  e
                );
              }
            }

            // Get AuctionSettled events
            const settledFilter =
              auctionContract.filters.AuctionSettled(auctionId);
            const settledEvents = await auctionContract.queryFilter(
              settledFilter
            );

            console.log(
              `🔍 [useMultipleAuctionHistory] Token ${tokenId}: Found ${settledEvents.length} AuctionSettled events`
            );

            for (const event of settledEvents) {
              try {
                const block = await provider.getBlock(event.blockNumber);
                if (!block) continue;

                const eventLog = event as ethers.EventLog;
                finalPrice = eventLog.args.finalPrice.toString();
                winner = eventLog.args.winner;

                const historyItem: AuctionHistoryItem = {
                  type: "auction_settled",
                  auctionId: eventLog.args.auctionId.toString(),
                  tokenId: tokenId,
                  amount: eventLog.args.finalPrice.toString(),
                  winner: eventLog.args.winner,
                  transactionHash: eventLog.transactionHash,
                  blockNumber: eventLog.blockNumber,
                  timestamp: block.timestamp,
                };

                historyItems.push(historyItem);
              } catch (e) {
                console.error(
                  `❌ [useMultipleAuctionHistory] Error processing AuctionSettled event for token ${tokenId}:`,
                  e
                );
              }
            }
          }

          // Sort history by timestamp
          historyItems.sort((a, b) => a.timestamp - b.timestamp);

          const auctionHistory: AuctionHistory = {
            tokenId,
            history: historyItems,
            finalPrice,
            winner,
            auctionId,
          };

          console.log(
            `🔍 [useMultipleAuctionHistory] Token ${tokenId}: Final result:`,
            {
              hasAuction: !!auctionId,
              hasFinalPrice: !!finalPrice,
              finalPrice: finalPrice ? ethers.formatEther(finalPrice) : "0",
              winner,
              historyCount: historyItems.length,
            }
          );

          newHistories.set(tokenId, auctionHistory);
        } catch (err) {
          console.error(
            `❌ [useMultipleAuctionHistory] Error fetching auction history for token ${tokenId}:`,
            err
          );
          // Continue with next token instead of failing completely
          continue;
        }
      }

      setHistories(newHistories);
      console.log(
        `📊 [useMultipleAuctionHistory] Fetched auction histories for ${newHistories.size} tokens`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [tokenIds, address]);

  useEffect(() => {
    if (tokenIds.length > 0 && address) {
      fetchAllHistories();
    }
  }, [fetchAllHistories, tokenIds, address]);

  return {
    histories,
    isLoading,
    error,
    refetch: fetchAllHistories,
  };
}
