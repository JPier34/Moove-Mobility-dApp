"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";

interface LazyLoadingOptions {
  enabled?: boolean;
  batchSize?: number;
  delay?: number;
}

// Hook for lazy loading NFTs with pagination
export function useLazyNFTLoading(options: LazyLoadingOptions = {}) {
  const { enabled = true, batchSize = 10, delay = 100 } = options;
  const { address, isConnected } = useAccount();

  const [currentBatch, setCurrentBatch] = useState(0);
  const [loadedNFTs, setLoadedNFTs] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Query for NFT batch
  const {
    data: nftBatch,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["nft-batch", address, currentBatch, batchSize],
    queryFn: async () => {
      if (!address) return [];

      // Simulate batch loading
      const startIndex = currentBatch * batchSize;
      const endIndex = startIndex + batchSize;

      // This would be replaced with actual contract calls
      const batch = [];
      for (let i = startIndex; i < endIndex; i++) {
        // Simulate NFT data
        batch.push({
          tokenId: i.toString(),
          name: `NFT #${i}`,
          image: "/images/default-nft.svg",
          // ... other properties
        });
      }

      return batch;
    },
    enabled: enabled && isConnected && !!address,
    staleTime: 5 * 60 * 1000,
  });

  // Load more NFTs
  const loadMore = useCallback(async () => {
    if (isLoadingMore || isLoading) return;

    setIsLoadingMore(true);

    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, delay));

    setCurrentBatch((prev) => prev + 1);
    setIsLoadingMore(false);
  }, [isLoadingMore, isLoading, delay]);

  // Update loaded NFTs when batch changes
  useEffect(() => {
    if (nftBatch) {
      setLoadedNFTs((prev) => [...prev, ...nftBatch]);
    }
  }, [nftBatch]);

  // Reset when address changes
  useEffect(() => {
    if (address) {
      setCurrentBatch(0);
      setLoadedNFTs([]);
    }
  }, [address]);

  return {
    loadedNFTs,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    hasMore: true, // This would be determined by actual data
    currentBatch,
  };
}

// Hook for infinite scroll
export function useInfiniteNFTScroll(options: LazyLoadingOptions = {}) {
  const lazyLoading = useLazyNFTLoading(options);

  const handleScroll = useCallback(() => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

    if (isNearBottom && !lazyLoading.isLoadingMore && lazyLoading.hasMore) {
      lazyLoading.loadMore();
    }
  }, [lazyLoading]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return lazyLoading;
}


