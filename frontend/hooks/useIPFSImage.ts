"use client";

import { useState, useEffect } from "react";
import {
  getIPFSImageUrl,
  getCityImageUrl,
  preloadIPFSImage,
} from "@/utils/pinata";
import { EUROPEAN_CITIES } from "@/config/cities";

interface UseIPFSImageOptions {
  fallbackUrl?: string;
  enableFallback?: boolean;
  useCache?: boolean;
  timeout?: number;
  preload?: boolean;
}

export const useIPFSImage = (
  ipfsHash: string,
  options: UseIPFSImageOptions = {}
) => {
  const {
    fallbackUrl = "/images/default-city.svg",
    enableFallback = true,
    useCache = true,
    timeout = 5000,
    preload = true,
  } = options;

  const [imageUrl, setImageUrl] = useState<string>(fallbackUrl);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ipfsHash) {
      setImageUrl(fallbackUrl);
      setIsLoading(false);
      return;
    }

    const loadImage = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // For city images, use the optimized function
        if (ipfsHash.includes("bafkrei")) {
          const url = getCityImageUrl(ipfsHash);
          setImageUrl(url);
          setIsLoading(false);

          // Preload the image if requested
          if (preload) {
            preloadIPFSImage(ipfsHash).catch(console.warn);
          }
          return;
        }

        // For other images, use the full IPFS gateway fallback
        const url = await getIPFSImageUrl(ipfsHash, {
          useCache,
          timeout,
          preferredGateway: "https://ipfs.io/ipfs/",
        });

        setImageUrl(url);
        setIsLoading(false);
      } catch (err) {
        console.warn(`Failed to load IPFS image ${ipfsHash}:`, err);
        setError(err instanceof Error ? err.message : "Failed to load image");

        if (enableFallback) {
          setImageUrl(fallbackUrl);
        }
        setIsLoading(false);
      }
    };

    loadImage();
  }, [ipfsHash, fallbackUrl, enableFallback, useCache, timeout, preload]);

  return { imageUrl, isLoading, error };
};

/**
 * Hook to preload all city images for better performance
 */
export const usePreloadCityImages = () => {
  const [preloadedCount, setPreloadedCount] = useState(0);
  const [isPreloading, setIsPreloading] = useState(false);

  const preloadAllCityImages = async () => {
    setIsPreloading(true);
    const cityImages = EUROPEAN_CITIES.filter(
      (city) => city.heroImage?.ipfsHash
    )
      .map((city) => city.heroImage!.ipfsHash)
      .filter((hash): hash is string => hash !== undefined);

    let loaded = 0;
    const promises = cityImages.map(async (hash) => {
      try {
        await preloadIPFSImage(hash);
        loaded++;
        setPreloadedCount(loaded);
      } catch (error) {
        console.warn(`Failed to preload city image ${hash}:`, error);
      }
    });

    await Promise.allSettled(promises);
    setIsPreloading(false);
  };

  return {
    preloadAllCityImages,
    preloadedCount,
    isPreloading,
    totalCityImages: EUROPEAN_CITIES.filter((city) => city.heroImage?.ipfsHash)
      .length,
  };
};
