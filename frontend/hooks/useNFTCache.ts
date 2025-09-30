"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { contracts } from "@/utils/contracts";
import { ethers } from "ethers";

// Cache interfaces
interface NFTCacheEntry {
  tokenId: number;
  metadata: any;
  owner: string;
  timestamp: number;
}

interface MetadataCacheEntry {
  uri: string;
  metadata: any;
  timestamp: number;
}

// Cache storage
const nftCache: Record<number, NFTCacheEntry> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const METADATA_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Last valid NFT ID cache
const lastValidNFTIdCache: Record<string, { id: number; timestamp: number }> =
  {};
const LAST_VALID_ID_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export function useNFTCache() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCachedNFT = useCallback((tokenId: number): NFTCacheEntry | null => {
    const entry = nftCache[tokenId];
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > CACHE_TTL;
    if (isExpired) {
      delete nftCache[tokenId];
      return null;
    }

    return entry;
  }, []);

  const setCachedNFT = useCallback(
    (tokenId: number, metadata: any, owner: string) => {
      nftCache[tokenId] = {
        tokenId,
        metadata,
        owner,
        timestamp: Date.now(),
      };
    },
    []
  );

  const getCachedMetadata = useCallback((uri: string): any | null => {
    const cacheKey = `metadata_${uri}`;
    const entry = (nftCache as any)[cacheKey] as MetadataCacheEntry;
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > METADATA_CACHE_TTL;
    if (isExpired) {
      delete (nftCache as any)[cacheKey];
      return null;
    }

    return entry.metadata;
  }, []);

  const setCachedMetadata = useCallback((uri: string, metadata: any) => {
    const cacheKey = `metadata_${uri}`;
    (nftCache as any)[cacheKey] = {
      uri,
      metadata,
      timestamp: Date.now(),
    };
  }, []);

  const getLastValidNFTId = useCallback(
    (userAddress: string): number | null => {
      const entry = lastValidNFTIdCache[userAddress];
      if (!entry) return null;

      const isExpired = Date.now() - entry.timestamp > LAST_VALID_ID_CACHE_TTL;
      if (isExpired) {
        delete lastValidNFTIdCache[userAddress];
        return null;
      }

      return entry.id;
    },
    []
  );

  const setLastValidNFTId = useCallback(
    (userAddress: string, tokenId: number) => {
      lastValidNFTIdCache[userAddress] = {
        id: tokenId,
        timestamp: Date.now(),
      };
    },
    []
  );

  const fetchNFTMetadata = useCallback(
    async (tokenId: number): Promise<any> => {
      // Check cache first
      const cached = getCachedNFT(tokenId);
      if (cached) {
        return cached.metadata;
      }

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

        // Get token URI
        const tokenURI = await nftContract.tokenURI(tokenId);

        // Check metadata cache
        const cachedMetadata = getCachedMetadata(tokenURI);
        if (cachedMetadata) {
          return cachedMetadata;
        }

        // Fetch metadata from IPFS
        const IPFS_GATEWAY =
          process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/";
        const httpUrl = tokenURI.startsWith("ipfs://")
          ? `${IPFS_GATEWAY}${tokenURI.slice(7)}`
          : tokenURI;

        const response = await fetch(httpUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.statusText}`);
        }

        const metadata = await response.json();

        // Cache the metadata
        setCachedMetadata(tokenURI, metadata);

        return metadata;
      } catch (err) {
        console.error(
          `❌ Error fetching NFT metadata for token ${tokenId}:`,
          err
        );
        return {
          name: `NFT #${tokenId}`,
          description: "NFT metadata temporarily unavailable",
          image: "/images/default-nft.svg",
          attributes: [
            { trait_type: "Category", value: "VEHICLE_DECORATION" },
            { trait_type: "Rarity", value: "Common" },
          ],
        };
      }
    },
    [getCachedNFT, getCachedMetadata, setCachedMetadata]
  );

  const fetchNFT = useCallback(
    async (tokenId: number): Promise<any> => {
      // Check cache first
      const cached = getCachedNFT(tokenId);
      if (cached) {
        return cached;
      }

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

        // Get owner
        const owner = await nftContract.ownerOf(tokenId);

        // Get metadata
        const metadata = await fetchNFTMetadata(tokenId);

        const nftData = {
          tokenId,
          metadata,
          owner,
          timestamp: Date.now(),
        };

        // Cache the NFT data
        setCachedNFT(tokenId, metadata, owner);

        return nftData;
      } catch (err) {
        console.error(`❌ Error fetching NFT ${tokenId}:`, err);
        throw err;
      }
    },
    [getCachedNFT, setCachedNFT, fetchNFTMetadata]
  );

  const clearCache = useCallback(() => {
    Object.keys(nftCache).forEach((key) => {
      delete nftCache[parseInt(key)];
    });
    Object.keys(lastValidNFTIdCache).forEach((key) => {
      delete lastValidNFTIdCache[key];
    });
  }, []);

  const getCacheStats = useCallback(() => {
    const now = Date.now();
    const validNFTs = Object.values(nftCache).filter(
      (entry) => now - entry.timestamp <= CACHE_TTL
    ).length;

    const validMetadata = Object.keys(nftCache).filter(
      (key) =>
        key.startsWith("metadata_") &&
        now - (nftCache as any)[key].timestamp <= METADATA_CACHE_TTL
    ).length;

    return {
      total: Object.keys(nftCache).length,
      validNFTs,
      validMetadata,
      lastValidIds: Object.keys(lastValidNFTIdCache).length,
    };
  }, []);

  return {
    getCachedNFT,
    setCachedNFT,
    getCachedMetadata,
    setCachedMetadata,
    getLastValidNFTId,
    setLastValidNFTId,
    fetchNFTMetadata,
    fetchNFT,
    clearCache,
    getCacheStats,
    isLoading,
    error,
  };
}
