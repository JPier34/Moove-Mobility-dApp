"use client";

import { useState, useEffect } from "react";

interface UseIPFSImageOptions {
  fallbackUrl?: string;
  enableFallback?: boolean;
}

export const useIPFSImage = (
  ipfsHash: string,
  options: UseIPFSImageOptions = {}
) => {
  const { fallbackUrl = "/placeholder-nft.png", enableFallback = true } =
    options;
  const [imageUrl, setImageUrl] = useState<string>(fallbackUrl);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Multiple IPFS gateways for fallback
  const IPFS_GATEWAYS = [
    process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/",
    "https://gateway.pinata.cloud/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://dweb.link/ipfs/",
  ];

  useEffect(() => {
    if (!ipfsHash) {
      setImageUrl(fallbackUrl);
      setIsLoading(false);
      return;
    }

    const loadImage = async () => {
      setIsLoading(true);
      setError(null);

      // Clean IPFS hash
      const cleanHash = ipfsHash.replace("ipfs://", "");

      if (!enableFallback) {
        const url = `${IPFS_GATEWAYS[0]}${cleanHash}`;
        setImageUrl(url);
        setIsLoading(false);
        return;
      }

      // Try multiple gateways
      for (const gateway of IPFS_GATEWAYS) {
        try {
          const url = `${gateway}${cleanHash}`;

          // Test if image loads
          await new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => reject();
            img.src = url;
          });

          setImageUrl(url);
          setIsLoading(false);
          return;
        } catch (err) {
          console.warn(`IPFS gateway ${gateway} failed for hash ${cleanHash}`);
        }
      }

      // All gateways failed
      setError("Failed to load image from IPFS");
      setImageUrl(fallbackUrl);
      setIsLoading(false);
    };

    loadImage();
  }, [ipfsHash, fallbackUrl, enableFallback]);

  return { imageUrl, isLoading, error };
};
