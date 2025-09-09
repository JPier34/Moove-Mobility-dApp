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
  const { auctions, isLoading: auctionsLoading } = useAuctionsEnhanced(true); // Disable auto-refresh for collection
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

      // Get all ended auctions where user is the winner
      const endedAuctions = auctions.filter((auction) => auction.status === 2); // ENDED
      console.log(`🔍 Found ${endedAuctions.length} ended auctions`);

      const userWonAuctions: WonAuction[] = [];

      for (const auction of endedAuctions) {
        try {
          // Check if user is the winner using highestBidder from auction data
          const winner = auction.highestBidder;
          console.log(`🏆 Auction ${auction.auctionId} winner:`, winner);

          if (winner && winner.toLowerCase() === address.toLowerCase()) {
            console.log(`✅ User won auction ${auction.auctionId}`);

            // For now, assume not claimed (we can add claim checking later)
            const isClaimed = false;
            console.log(`📦 Auction ${auction.auctionId} claimed:`, isClaimed);

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
              isClaimed: isClaimed,
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
      setWonAuctions(userWonAuctions);
      setCachedData(userWonAuctions);
    } catch (err) {
      console.error("❌ Error fetching won auctions:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected, auctions, getCachedData, setCachedData]);

  // Only fetch when connected and address changes
  useEffect(() => {
    if (!auctionsLoading && auctions.length > 0) {
      fetchWonAuctions();
    }
  }, [auctions, auctionsLoading, fetchWonAuctions]);

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
