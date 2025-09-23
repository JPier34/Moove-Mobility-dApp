"use client";

import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

// Global cache for all NFTs (not user-specific)
interface GlobalNFTCacheEntry {
  tokenId: number;
  owner: string;
  tokenURI: string;
  metadata?: any;
  timestamp: number;
  lastChecked: number;
}

interface GlobalNFTCache {
  [tokenId: number]: GlobalNFTCacheEntry;
}

// Global cache instance
const globalNFTCache: GlobalNFTCache = {};
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const METADATA_CACHE_TTL = 60 * 60 * 1000; // 1 hour for metadata

// Cache for last valid NFT ID to avoid unnecessary scans
let lastValidNFTId: number | null = null;
const LAST_VALID_ID_CACHE_TTL = 60 * 60 * 1000; // 1 hour
let lastValidIdTimestamp: number = 0;

// Cache for metadata to avoid duplicate IPFS calls
const metadataCache = new Map<string, any>();
const METADATA_CACHE_KEY_TTL = 60 * 60 * 1000; // 1 hour

export function useGlobalNFTCache() {
  const [isLoading, setIsLoading] = useState(false);
  const [cacheStats, setCacheStats] = useState({
    hits: 0,
    misses: 0,
    totalCalls: 0,
    fromCache: 0,
    fromContract: 0,
  });

  // Check if cache entry is valid
  const isCacheEntryValid = useCallback(
    (entry: GlobalNFTCacheEntry): boolean => {
      const now = Date.now();
      return now - entry.lastChecked < CACHE_TTL;
    },
    []
  );

  // Get NFT from global cache
  const getNFTFromCache = useCallback(
    (tokenId: number): GlobalNFTCacheEntry | null => {
      const entry = globalNFTCache[tokenId];
      if (!entry || !isCacheEntryValid(entry)) {
        return null;
      }

      setCacheStats((prev) => ({
        ...prev,
        hits: prev.hits + 1,
        totalCalls: prev.totalCalls + 1,
        fromCache: prev.fromCache + 1,
      }));

      return entry;
    },
    [isCacheEntryValid]
  );

  // Save NFT to global cache
  const saveNFTToCache = useCallback(
    (tokenId: number, owner: string, tokenURI: string, metadata?: any) => {
      const now = Date.now();
      globalNFTCache[tokenId] = {
        tokenId,
        owner,
        tokenURI,
        metadata,
        timestamp: now,
        lastChecked: now,
      };

      setCacheStats((prev) => ({
        ...prev,
        misses: prev.misses + 1,
        totalCalls: prev.totalCalls + 1,
        fromContract: prev.fromContract + 1,
      }));

      console.log(`💾 Cached NFT #${tokenId} globally`);
    },
    []
  );

  // Get metadata from cache or fetch it
  const getMetadata = useCallback(
    async (tokenURI: string): Promise<any | null> => {
      const cacheKey = tokenURI;
      const cached = metadataCache.get(cacheKey);

      if (cached) {
        const now = Date.now();
        if (now - cached.timestamp < METADATA_CACHE_TTL) {
          console.log(`📦 Metadata cache hit for: ${tokenURI}`);
          return cached.data;
        }
      }

      try {
        const response = await fetch(
          `/api/ipfs-proxy?hash=${encodeURIComponent(tokenURI)}`
        );
        if (response.ok) {
          const metadata = await response.json();

          // Cache the metadata
          metadataCache.set(cacheKey, {
            data: metadata,
            timestamp: Date.now(),
          });

          console.log(`📦 Metadata cached for: ${tokenURI}`);
          return metadata;
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fetch metadata for ${tokenURI}:`, error);
      }

      return null;
    },
    []
  );

  // Get all existing NFTs with early exit
  const getAllExistingNFTs = useCallback(async (): Promise<{
    nfts: GlobalNFTCacheEntry[];
    fromCache: number;
    fromContract: number;
  }> => {
    setIsLoading(true);

    try {
      if (!window.ethereum) {
        throw new Error("Ethereum provider not available");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const nftContract = new ethers.Contract(
        contracts.MooveNFT.address,
        contracts.MooveNFT.abi,
        provider
      );

      let maxCheck = 1000;
      const maxConsecutiveMissing = 10;
      let consecutiveMissing = 0;
      let lastFoundTokenId = -1;
      let fromCache = 0;
      let fromContract = 0;

      console.log(`🚀 Scanning all existing NFTs with early exit...`);

      // Check if we have a valid last NFT ID from cache
      const now = Date.now();
      if (
        lastValidNFTId &&
        now - lastValidIdTimestamp < LAST_VALID_ID_CACHE_TTL
      ) {
        console.log(`📊 Using cached last valid NFT ID: ${lastValidNFTId}`);
        maxCheck = lastValidNFTId + 50; // Check a bit more than the last known
      }

      for (let tokenId = 0; tokenId < maxCheck; tokenId++) {
        // Check cache first
        const cachedNFT = getNFTFromCache(tokenId);
        if (cachedNFT) {
          fromCache++;
          consecutiveMissing = 0;
          lastFoundTokenId = tokenId;
          continue;
        }

        try {
          // Check if NFT exists
          const owner = await nftContract.ownerOf(tokenId);
          const tokenURI = await nftContract.tokenURI(tokenId);

          // Get metadata
          const metadata = await getMetadata(tokenURI);

          // Save to cache
          saveNFTToCache(tokenId, owner, tokenURI, metadata);
          fromContract++;

          consecutiveMissing = 0;
          lastFoundTokenId = tokenId;

          // Update last valid NFT ID
          if (tokenId > (lastValidNFTId || 0)) {
            lastValidNFTId = tokenId;
            lastValidIdTimestamp = now;
          }
        } catch (error) {
          // NFT doesn't exist
          consecutiveMissing++;

          if (consecutiveMissing >= maxConsecutiveMissing) {
            console.log(
              `🛑 Early exit: ${maxConsecutiveMissing} consecutive missing NFTs after #${lastFoundTokenId}`
            );
            break;
          }
        }
      }

      // Convert cache to array
      const nfts = Object.values(globalNFTCache).filter(isCacheEntryValid);

      console.log(
        `📊 Global cache scan completed: ${fromCache} from cache, ${fromContract} from contract, ${nfts.length} total NFTs`
      );

      return { nfts, fromCache, fromContract };
    } catch (error) {
      console.error("❌ Error scanning all NFTs:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [getNFTFromCache, saveNFTToCache, getMetadata, isCacheEntryValid]);

  // Check if NFT exists in cache
  const isNFTInCache = useCallback(
    (tokenId: number): boolean => {
      return getNFTFromCache(tokenId) !== null;
    },
    [getNFTFromCache]
  );

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const totalEntries = Object.keys(globalNFTCache).length;
    const validEntries =
      Object.values(globalNFTCache).filter(isCacheEntryValid).length;

    return {
      ...cacheStats,
      totalEntries,
      validEntries,
      lastValidNFTId,
    };
  }, [cacheStats, isCacheEntryValid]);

  // Clear expired entries
  const clearExpiredEntries = useCallback(() => {
    const now = Date.now();
    let cleared = 0;

    Object.keys(globalNFTCache).forEach((tokenId) => {
      const entry = globalNFTCache[parseInt(tokenId)];
      if (entry && now - entry.lastChecked > CACHE_TTL) {
        delete globalNFTCache[parseInt(tokenId)];
        cleared++;
      }
    });

    if (cleared > 0) {
      console.log(`🧹 Cleared ${cleared} expired cache entries`);
    }
  }, []);

  // Auto-clear expired entries every 5 minutes
  useEffect(() => {
    const interval = setInterval(clearExpiredEntries, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [clearExpiredEntries]);

  return {
    getAllExistingNFTs,
    getNFTFromCache,
    isNFTInCache,
    getCacheStats,
    clearExpiredEntries,
    isLoading,
  };
}
