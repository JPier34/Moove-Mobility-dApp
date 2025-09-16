"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import { useAuctionsEnhanced } from "./enhanced-auction-utils";

interface WonAuction {
  auctionId: string;
  tokenId: string;
  nftName: string;
  nftImage: string;
  nftCategory: string;
  nftRarity: string;
  finalBid: number;
  bidders: number;
  endTime: number;
  isClaimed: boolean;
  transactionHash?: string;
}

interface UserCollectionOptimized {
  wonAuctions: WonAuction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  totalValue: number;
  totalItems: number;
}

// Cache per evitare chiamate duplicate
const collectionCache = new Map<
  string,
  {
    data: WonAuction[];
    timestamp: number;
    ttl: number;
  }
>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minuti

// Generate a mock transaction hash for demo purposes
function generateMockTransactionHash(auctionId: string): string {
  const timestamp = Date.now().toString(16);
  const random = Math.random().toString(16).substring(2, 10);
  return `0x${timestamp}${random}${auctionId.padStart(8, "0")}`;
}

export function useUserCollectionOptimized(): UserCollectionOptimized {
  const { address, isConnected } = useAccount();
  // Use enhanced auctions hook to fetch auction data
  const { auctions, isLoading: auctionsLoading } = useAuctionsEnhanced();

  const [wonAuctions, setWonAuctions] = useState<WonAuction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize cache key
  const cacheKey = useMemo(() => {
    return address ? `collection_${address.toLowerCase()}` : null;
  }, [address]);

  // Check cache first
  const getCachedData = useCallback(() => {
    if (!cacheKey) return null;

    const cached = collectionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log("📦 Using cached collection data");
      return cached.data;
    }
    return null;
  }, [cacheKey]);

  // Save to cache
  const setCachedData = useCallback(
    (data: WonAuction[]) => {
      if (!cacheKey) return;

      collectionCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: CACHE_TTL,
      });
    },
    [cacheKey]
  );

  const fetchWonAuctions = useCallback(async () => {
    if (!address || !isConnected) {
      setWonAuctions([]);
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cachedData = getCachedData();
    if (cachedData) {
      setWonAuctions(cachedData);
      setIsLoading(false);
      return;
    }

    try {
      console.log("🏆 Fetching won auctions for user:", address);
      setIsLoading(true);
      setError(null);

      // Get all auctions to check for winners and settled status
      console.log(
        `🔍 Checking ${auctions.length} total auctions for user collection`
      );
      console.log(
        `📊 All auctions data:`,
        auctions.map((a) => ({
          auctionId: a.auctionId,
          tokenId: a.nftId,
          name: a.nftName,
          status: a.status,
          highestBidder: a.highestBidder,
          isSettled: a.isSettled,
        }))
      );

      const userWonAuctions: WonAuction[] = [];

      for (const auction of auctions) {
        try {
          // Check if user is the winner using highestBidder from auction data
          const winner = auction.highestBidder;
          console.log(
            `🏆 Auction ${auction.auctionId} (tokenId: ${auction.nftId}) winner:`,
            winner
          );

          // Special debug for auction 10 (American Bobtail)
          if (auction.auctionId === "10" || auction.nftId === "45") {
            console.log(`🔍 SPECIAL DEBUG - Auction 10 (American Bobtail):`, {
              auctionId: auction.auctionId,
              tokenId: auction.nftId,
              name: auction.nftName,
              status: auction.status,
              highestBidder: auction.highestBidder,
              isSettled: auction.isSettled,
              userAddress: address,
              isUserWinner:
                winner && winner.toLowerCase() === address.toLowerCase(),
            });
          }

          if (winner && winner.toLowerCase() === address.toLowerCase()) {
            // Check if auction is settled (NFT transferred to winner)
            // Status 4 = SETTLED (NFT trasferito al vincitore)
            // Status 3 = CANCELLED/DESERTA (NFT torna al seller/admin)
            const isWinnerSettled = auction.status === 4; // Solo status 4 per vincitori
            console.log(
              `📦 Auction ${auction.auctionId} winner settled:`,
              isWinnerSettled,
              `(status: ${auction.status}, isSettled: ${auction.isSettled})`
            );

            // Only show settled auctions in My Collection for winners
            if (isWinnerSettled) {
              console.log(
                `✅ User won and settled auction ${auction.auctionId}`
              );

              const wonAuction: WonAuction = {
                auctionId: auction.auctionId,
                tokenId: auction.nftId,
                nftName: auction.nftName || `NFT #${auction.nftId}`,
                nftImage: auction.nftImage || "/images/default-nft.png",
                nftCategory: auction.nftCategory || "sticker",
                nftRarity: auction.attributes?.rarity || "common",
                finalBid: parseFloat(auction.currentBid),
                bidders: auction.bidCount || 0,
                endTime: new Date(auction.endTime).getTime(),
                isClaimed: true, // Se è in My Collection, è già settled/claimed
                transactionHash:
                  auction.transactionHash ||
                  generateMockTransactionHash(auction.auctionId),
              };

              console.log(`🏆 [Auction ${auction.auctionId}] Rarity:`, {
                raw: auction.attributes?.rarity,
                processed: wonAuction.nftRarity,
                attributes: auction.attributes,
              });

              userWonAuctions.push(wonAuction);
            }
          } else {
            // Check if user is the seller/admin and auction went deserted (status 3)
            const isSeller =
              auction.seller &&
              auction.seller.toLowerCase() === address.toLowerCase();
            const isDesertedAuction = auction.status === 3; // CANCELLED/DESERTA

            if (isSeller && isDesertedAuction) {
              console.log(
                `🏠 User is seller of deserted auction ${auction.auctionId} - NFT returned to seller`
              );

              const wonAuction: WonAuction = {
                auctionId: auction.auctionId,
                tokenId: auction.nftId,
                nftName: auction.nftName || `NFT #${auction.nftId}`,
                nftImage: auction.nftImage || "/images/default-nft.png",
                nftCategory: auction.nftCategory || "sticker",
                nftRarity: auction.attributes?.rarity || "common",
                finalBid: parseFloat(auction.currentBid),
                bidders: auction.bidCount || 0,
                endTime: new Date(auction.endTime).getTime(),
                isClaimed: true, // NFT è tornato al seller
                transactionHash:
                  auction.transactionHash ||
                  generateMockTransactionHash(auction.auctionId),
              };

              userWonAuctions.push(wonAuction);
            }
          }
        } catch (auctionError) {
          console.error(
            `❌ Error checking auction ${auction.auctionId}:`,
            auctionError
          );
        }
      }

      console.log(
        `🏆 User won ${userWonAuctions.length} auctions:`,
        userWonAuctions
      );

      // Debug: Check all auctions with status 4
      const settledAuctions = auctions.filter((a) => a.status === 4);
      console.log(
        `🔍 All settled auctions (status 4):`,
        settledAuctions.map((a) => ({
          auctionId: a.auctionId,
          nftId: a.nftId,
          name: a.nftName,
          status: a.status,
          highestBidder: a.highestBidder,
          seller: a.seller,
          userAddress: address,
        }))
      );

      // Debug: Check all auctions where user is winner (any status)
      const userWonAnyStatus = auctions.filter(
        (a) =>
          a.highestBidder &&
          a.highestBidder.toLowerCase() === address.toLowerCase()
      );
      console.log(
        `🏆 All auctions where user is winner (any status):`,
        userWonAnyStatus.map((a) => ({
          auctionId: a.auctionId,
          nftId: a.nftId,
          name: a.nftName,
          status: a.status,
          statusName: [
            "PENDING",
            "ACTIVE",
            "REVEAL",
            "ENDED",
            "SETTLED",
            "CANCELLED",
          ][a.status],
          highestBidder: a.highestBidder,
          isSettled: a.isSettled,
        }))
      );
      setWonAuctions(userWonAuctions);
      setCachedData(userWonAuctions);
    } catch (err) {
      console.error("❌ Error fetching won auctions:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [
    address,
    isConnected,
    auctions,
    auctionsLoading,
    getCachedData,
    setCachedData,
  ]);

  // Fetch won auctions when auctions data is available
  useEffect(() => {
    if (address && isConnected && !auctionsLoading && auctions.length > 0) {
      console.log("🔍 Auctions data available, fetching won auctions");
      fetchWonAuctions();
    } else if (
      address &&
      isConnected &&
      !auctionsLoading &&
      auctions.length === 0
    ) {
      console.log("🔍 No auctions found, setting empty collection");
      setWonAuctions([]);
      setIsLoading(false);
    } else if (!address || !isConnected) {
      setWonAuctions([]);
      setIsLoading(false);
    }
  }, [address, isConnected, auctions, auctionsLoading, fetchWonAuctions]); // Simplified dependencies

  // Calculate stats
  const totalValue = useMemo(() => {
    return wonAuctions.reduce((sum, auction) => sum + auction.finalBid, 0);
  }, [wonAuctions]);

  const totalItems = wonAuctions.length;

  return {
    wonAuctions,
    isLoading: isLoading || auctionsLoading,
    error,
    refetch: fetchWonAuctions,
    totalValue,
    totalItems,
  };
}
