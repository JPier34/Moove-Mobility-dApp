"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount } from "wagmi";

// Unified cache interface
interface UnifiedCacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
}

// Cache types with different TTLs
const CACHE_CONFIGS = {
  nft_ownership: { ttl: 2 * 60 * 60 * 1000, maxSize: 1000 }, // 2 hours
  nft_metadata: { ttl: 4 * 60 * 60 * 1000, maxSize: 500 }, // 4 hours
  auction_data: { ttl: 30 * 60 * 1000, maxSize: 200 }, // 30 minutes
  ipfs_data: { ttl: 60 * 60 * 1000, maxSize: 300 }, // 1 hour
  user_collection: { ttl: 10 * 60 * 1000, maxSize: 50 }, // 10 minutes
} as const;

type CacheType = keyof typeof CACHE_CONFIGS;

// Global unified cache
const unifiedCache = new Map<string, UnifiedCacheEntry>();

// Cache statistics
interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalSize: number;
  hitRate: number;
}

export function useOptimizedCache() {
  const { address } = useAccount();
  const [stats, setStats] = useState<CacheStats>({
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
    hitRate: 0,
  });

  // Generate cache key with user context
  const generateKey = useCallback(
    (type: CacheType, key: string, userAddress?: string): string => {
      const context = userAddress || address || "anonymous";
      return `${type}:${context}:${key}`;
    },
    [address]
  );

  // Check if cache entry is valid
  const isEntryValid = useCallback((entry: UnifiedCacheEntry): boolean => {
    const now = Date.now();
    return now - entry.timestamp < entry.ttl;
  }, []);

  // LRU eviction when cache is full
  const evictLRU = useCallback((type: CacheType) => {
    const config = CACHE_CONFIGS[type];
    const entries = Array.from(unifiedCache.entries())
      .filter(([key]) => key.startsWith(`${type}:`))
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    // Remove oldest entries if over limit
    const toRemove = entries.slice(0, entries.length - config.maxSize + 1);
    toRemove.forEach(([key]) => {
      unifiedCache.delete(key);
    });

    if (toRemove.length > 0) {
      setStats((prev) => ({
        ...prev,
        evictions: prev.evictions + toRemove.length,
      }));
    }
  }, []);

  // Get data from cache
  const get = useCallback(
    (type: CacheType, key: string, userAddress?: string): any => {
      const cacheKey = generateKey(type, key, userAddress);
      const entry = unifiedCache.get(cacheKey);

      if (!entry || !isEntryValid(entry)) {
        if (entry) {
          unifiedCache.delete(cacheKey);
        }
        setStats((prev) => ({
          ...prev,
          misses: prev.misses + 1,
          totalSize: unifiedCache.size,
          hitRate: prev.hits / (prev.hits + prev.misses + 1),
        }));
        return null;
      }

      // Update access time and hit count
      entry.lastAccessed = Date.now();
      entry.hits += 1;

      setStats((prev) => ({
        ...prev,
        hits: prev.hits + 1,
        totalSize: unifiedCache.size,
        hitRate: (prev.hits + 1) / (prev.hits + prev.misses + 1),
      }));

      return entry.data;
    },
    [generateKey, isEntryValid]
  );

  // Set data in cache
  const set = useCallback(
    (
      type: CacheType,
      key: string,
      data: any,
      userAddress?: string,
      customTTL?: number
    ): void => {
      const cacheKey = generateKey(type, key, userAddress);
      const config = CACHE_CONFIGS[type];
      const ttl = customTTL || config.ttl;

      // Check if we need to evict
      const existingEntries = Array.from(unifiedCache.keys()).filter((k) =>
        k.startsWith(`${type}:`)
      );
      if (existingEntries.length >= config.maxSize) {
        evictLRU(type);
      }

      const now = Date.now();
      unifiedCache.set(cacheKey, {
        data,
        timestamp: now,
        ttl,
        hits: 0,
        lastAccessed: now,
      });

      setStats((prev) => ({
        ...prev,
        totalSize: unifiedCache.size,
      }));
    },
    [generateKey, evictLRU]
  );

  // Clear cache by type or all
  const clear = useCallback((type?: CacheType, userAddress?: string): void => {
    if (!type) {
      unifiedCache.clear();
      setStats({
        hits: 0,
        misses: 0,
        evictions: 0,
        totalSize: 0,
        hitRate: 0,
      });
      return;
    }

    const prefix = userAddress ? `${type}:${userAddress}:` : `${type}:`;

    const keysToDelete = Array.from(unifiedCache.keys()).filter((key) =>
      key.startsWith(prefix)
    );

    keysToDelete.forEach((key) => unifiedCache.delete(key));

    setStats((prev) => ({
      ...prev,
      totalSize: unifiedCache.size,
    }));
  }, []);

  // Preload data with background refresh
  const preload = useCallback(
    async (
      type: CacheType,
      key: string,
      fetchFn: () => Promise<any>,
      userAddress?: string
    ): Promise<any> => {
      // Try to get from cache first
      const cached = get(type, key, userAddress);
      if (cached) {
        return cached;
      }

      // Fetch new data
      try {
        const data = await fetchFn();
        set(type, key, data, userAddress);
        return data;
      } catch (error) {
        console.error(`Failed to preload ${type}:${key}:`, error);
        throw error;
      }
    },
    [get, set]
  );

  // Batch operations for better performance
  const batchGet = useCallback(
    (
      requests: Array<{ type: CacheType; key: string; userAddress?: string }>
    ) => {
      return requests.map(({ type, key, userAddress }) =>
        get(type, key, userAddress)
      );
    },
    [get]
  );

  const batchSet = useCallback(
    (
      entries: Array<{
        type: CacheType;
        key: string;
        data: any;
        userAddress?: string;
        customTTL?: number;
      }>
    ) => {
      entries.forEach(({ type, key, data, userAddress, customTTL }) =>
        set(type, key, data, userAddress, customTTL)
      );
    },
    [set]
  );

  // Cleanup expired entries periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      const expiredKeys: string[] = [];

      unifiedCache.forEach((entry, key) => {
        if (now - entry.timestamp > entry.ttl) {
          expiredKeys.push(key);
        }
      });

      expiredKeys.forEach((key) => unifiedCache.delete(key));

      if (expiredKeys.length > 0) {
        setStats((prev) => ({
          ...prev,
          totalSize: unifiedCache.size,
        }));
      }
    }, 5 * 60 * 1000); // Cleanup every 5 minutes

    return () => clearInterval(cleanup);
  }, []);

  // Clear cache when user changes
  useEffect(() => {
    if (address) {
      // Clear user-specific cache when address changes
      Object.keys(CACHE_CONFIGS).forEach((type) => {
        clear(type as CacheType, address);
      });
    }
  }, [address, clear]);

  return {
    get,
    set,
    clear,
    preload,
    batchGet,
    batchSet,
    stats,
    // Convenience methods for common cache types
    getNFT: (tokenId: number, userAddress?: string) =>
      get("nft_ownership", tokenId.toString(), userAddress),
    setNFT: (tokenId: number, data: any, userAddress?: string) =>
      set("nft_ownership", tokenId.toString(), data, userAddress),
    getMetadata: (tokenURI: string) => get("nft_metadata", tokenURI),
    setMetadata: (tokenURI: string, data: any) =>
      set("nft_metadata", tokenURI, data),
    getAuction: (auctionId: number) =>
      get("auction_data", auctionId.toString()),
    setAuction: (auctionId: number, data: any) =>
      set("auction_data", auctionId.toString(), data),
    getIPFS: (hash: string) => get("ipfs_data", hash),
    setIPFS: (hash: string, data: any) => set("ipfs_data", hash, data),
    getUserCollection: (userAddress: string) =>
      get("user_collection", "all", userAddress),
    setUserCollection: (userAddress: string, data: any) =>
      set("user_collection", "all", data, userAddress),
  };
}
