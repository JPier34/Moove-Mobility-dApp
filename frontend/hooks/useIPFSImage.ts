"use client";

import { useState } from "react";
import { preloadIPFSImage } from "@/utils/pinata";
import { EUROPEAN_CITIES } from "@/config/cities";

// Re-export from unified hook for backward compatibility
export { useIPFSImage } from "./useIPFSUnified";

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
