"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

export interface NFTHistoryItem {
  type: "mint" | "transfer";
  from: string;
  to: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
}

export interface NFTHistory {
  tokenId: string;
  creationType: "direct_mint" | "auction_won" | "transferred";
  history: NFTHistoryItem[];
  originalOwner: string;
  currentOwner: string;
}

export function useNFTHistory(tokenId: string | null) {
  const { address } = useAccount();
  const [history, setHistory] = useState<NFTHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTHistory = useCallback(async () => {
    if (!tokenId || !address) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔍 Fetching NFT history for token #${tokenId}`);

      // Create contract instance
      if (!window.ethereum) {
        throw new Error("No ethereum provider available");
      }
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const nftContract = new ethers.Contract(
        contracts.MooveNFT.address,
        contracts.MooveNFT.abi,
        provider
      );

      // Get current owner
      const currentOwner = await nftContract.ownerOf(tokenId);
      console.log(`👤 Current owner of NFT #${tokenId}:`, currentOwner);

      // Get Transfer events for this NFT
      const filter = nftContract.filters.Transfer(null, null, tokenId);
      const events = await nftContract.queryFilter(filter);

      console.log(
        `📜 Found ${events.length} transfer events for NFT #${tokenId}`
      );

      const historyItems: NFTHistoryItem[] = [];
      let originalOwner = "";
      let creationType: "direct_mint" | "auction_won" | "transferred" =
        "transferred";

      for (const event of events) {
        try {
          const block = await provider.getBlock(event.blockNumber);
          if (!block) {
            console.warn(
              `⚠️ Block ${event.blockNumber} not found, skipping event`
            );
            continue;
          }

          const eventLog = event as ethers.EventLog;
          const historyItem: NFTHistoryItem = {
            type:
              eventLog.args.from === ethers.ZeroAddress ? "mint" : "transfer",
            from: eventLog.args.from,
            to: eventLog.args.to,
            transactionHash: eventLog.transactionHash,
            blockNumber: eventLog.blockNumber,
            timestamp: block.timestamp,
          };

          historyItems.push(historyItem);

          // Determine creation type
          if (historyItem.type === "mint") {
            originalOwner = historyItem.to;
            // Check if minted to auction contract or directly to user
            if (
              historyItem.to.toLowerCase() ===
              contracts.MooveAuction.address.toLowerCase()
            ) {
              creationType = "auction_won";
            } else {
              creationType = "direct_mint";
            }
          }
        } catch (blockError) {
          console.warn(`⚠️ Failed to get block for event:`, blockError);
          // Continue with other events
        }
      }

      // Sort by timestamp (oldest first)
      historyItems.sort((a, b) => a.timestamp - b.timestamp);

      const nftHistory: NFTHistory = {
        tokenId,
        creationType,
        history: historyItems,
        originalOwner,
        currentOwner,
      };

      console.log(`📊 NFT #${tokenId} history:`, nftHistory);
      setHistory(nftHistory);
    } catch (err) {
      console.error(`❌ Error fetching NFT history for #${tokenId}:`, err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [tokenId, address]);

  useEffect(() => {
    fetchNFTHistory();
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
  const [histories, setHistories] = useState<Map<string, NFTHistory>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastTokenIdsRef = useRef<string>("");

  const fetchAllHistories = useCallback(async () => {
    if (tokenIds.length === 0 || !address) return;

    // Prevent duplicate calls for the same tokenIds
    const tokenIdsKey = tokenIds.sort().join(",");
    if (lastTokenIdsRef.current === tokenIdsKey) {
      console.log(`⏭️ Same tokenIds as last call, skipping: ${tokenIdsKey}`);
      return;
    }

    if (histories.size > 0 && tokenIds.every((id) => histories.has(id))) {
      console.log(
        `⏭️ All histories already fetched for tokens: ${tokenIdsKey}`
      );
      lastTokenIdsRef.current = tokenIdsKey;
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newHistories = new Map<string, NFTHistory>();

      // Check if ethereum is available
      if (!window.ethereum) {
        throw new Error("Ethereum provider not available");
      }

      // Create contract instance
      const provider = new ethers.BrowserProvider(window.ethereum as any);

      // Verify ABI is loaded
      if (!contracts.MooveNFT.abi || !contracts.MooveNFT.abi.length) {
        throw new Error("MooveNFT ABI not loaded");
      }

      console.log(
        "🔧 Creating contract with ABI:",
        contracts.MooveNFT.abi.length,
        "functions"
      );

      const nftContract = new ethers.Contract(
        contracts.MooveNFT.address,
        contracts.MooveNFT.abi,
        provider
      );

      // Verify contract has the required methods
      if (!nftContract.ownerOf || typeof nftContract.ownerOf !== "function") {
        console.error("❌ Contract methods:", Object.keys(nftContract));
        throw new Error("Contract does not have ownerOf function");
      }

      // Test contract connection with a simple call
      try {
        await provider.getNetwork();
        console.log("✅ Provider connected successfully");
      } catch (providerError) {
        console.error("❌ Provider connection failed:", providerError);
        throw new Error("Failed to connect to Ethereum provider");
      }

      for (const tokenId of tokenIds) {
        try {
          // Skip if already processed
          if (histories.has(tokenId)) {
            console.log(`⏭️ NFT #${tokenId} history already exists, skipping`);
            continue;
          }

          console.log(`🔍 Fetching NFT history for token #${tokenId}`);

          // Validate tokenId
          if (!tokenId || tokenId === "0" || tokenId === "") {
            console.warn(`⚠️ Invalid tokenId: ${tokenId}`);
            continue;
          }

          // Get current owner
          const currentOwner = await nftContract.ownerOf(tokenId);
          console.log(`👤 Current owner of NFT #${tokenId}:`, currentOwner);

          // Get Transfer events for this NFT
          if (!nftContract.filters || !nftContract.filters.Transfer) {
            console.warn(
              `⚠️ Contract does not have Transfer filter for NFT #${tokenId}`
            );
            continue;
          }

          const filter = nftContract.filters.Transfer(null, null, tokenId);
          const events = await nftContract.queryFilter(filter);

          console.log(
            `📜 Found ${events.length} transfer events for NFT #${tokenId}`
          );

          const historyItems: NFTHistoryItem[] = [];
          let originalOwner = "";
          let creationType: "direct_mint" | "auction_won" | "transferred" =
            "transferred";

          for (const event of events) {
            try {
              const block = await provider.getBlock(event.blockNumber);
              if (!block) {
                console.warn(
                  `⚠️ Block ${event.blockNumber} not found, skipping event`
                );
                continue;
              }

              const eventLog = event as ethers.EventLog;
              const historyItem: NFTHistoryItem = {
                type:
                  eventLog.args.from === ethers.ZeroAddress
                    ? "mint"
                    : "transfer",
                from: eventLog.args.from,
                to: eventLog.args.to,
                transactionHash: eventLog.transactionHash,
                blockNumber: eventLog.blockNumber,
                timestamp: block.timestamp,
              };

              historyItems.push(historyItem);

              // Determine creation type
              if (historyItem.type === "mint") {
                originalOwner = historyItem.to;
                // Check if minted to auction contract or directly to user
                if (
                  historyItem.to.toLowerCase() ===
                  contracts.MooveAuction.address.toLowerCase()
                ) {
                  creationType = "auction_won";
                } else {
                  creationType = "direct_mint";
                }
              }
            } catch (blockError) {
              console.warn(`⚠️ Failed to get block for event:`, blockError);
              // Continue with other events
            }
          }

          // Sort by timestamp (oldest first)
          historyItems.sort((a, b) => a.timestamp - b.timestamp);

          const nftHistory: NFTHistory = {
            tokenId,
            creationType,
            history: historyItems,
            originalOwner,
            currentOwner,
          };

          console.log(`📊 NFT #${tokenId} history:`, nftHistory);
          newHistories.set(tokenId, nftHistory);
        } catch (err) {
          console.warn(`⚠️ Failed to fetch history for NFT #${tokenId}:`, err);
        }
      }

      setHistories(newHistories);
      lastTokenIdsRef.current = tokenIdsKey;
    } catch (err) {
      console.error("❌ Error fetching multiple NFT histories:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [tokenIds, address, histories]);

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
