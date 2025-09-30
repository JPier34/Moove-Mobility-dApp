"use client";

import { useState, useCallback } from "react";

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  properties?: {
    category?: string;
    rarity?: string;
  };
}

export function useIPFSUnified() {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(
    async (uri: string): Promise<NFTMetadata | null> => {
      if (!uri) return null;

      setIsLoading(true);
      setError(null);

      try {
        const IPFS_GATEWAY =
          process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/";
        const httpUrl = uri.startsWith("ipfs://")
          ? `${IPFS_GATEWAY}${uri.slice(7)}`
          : uri;

        const response = await fetch(httpUrl);
        if (!response.ok) {
          console.warn(
            `⚠️ Failed to fetch metadata from IPFS: ${response.statusText}`
          );
          return {
            name: `NFT Metadata`,
            description: `NFT metadata temporarily unavailable`,
            image: "/images/default-nft.svg",
            attributes: [
              { trait_type: "Category", value: "VEHICLE_DECORATION" },
              { trait_type: "Rarity", value: "Common" },
            ],
            properties: { category: "sticker", rarity: "common" },
          };
        }

        const metadata: NFTMetadata = await response.json();
        return metadata;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to fetch metadata");
        setError(error.message);
        return {
          name: `NFT Metadata`,
          description: `NFT metadata temporarily unavailable`,
          image: "/images/default-nft.svg",
          attributes: [
            { trait_type: "Category", value: "VEHICLE_DECORATION" },
            { trait_type: "Rarity", value: "Common" },
          ],
          properties: { category: "sticker", rarity: "common" },
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const uploadToIPFS = useCallback(
    async (metadata: NFTMetadata): Promise<string | null> => {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      try {
        // Simulate upload progress
        setUploadProgress(25);

        // Mock IPFS upload - in production, use a real IPFS service
        const mockHash = `QmMockMetadataHashForTesting${Date.now()}`;

        setUploadProgress(100);

        console.log(`📤 Mock IPFS upload: ${mockHash}`);
        return mockHash;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to upload to IPFS");
        setError(error.message);
        return null;
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    []
  );

  const uploadNFT = useCallback(
    async (metadata: NFTMetadata): Promise<string | null> => {
      return uploadToIPFS(metadata);
    },
    [uploadToIPFS]
  );

  return {
    fetchMetadata,
    uploadToIPFS,
    uploadNFT,
    isLoading,
    isUploading,
    uploadProgress,
    error,
  };
}

// Alias for backward compatibility
export const useIPFSImage = useIPFSUnified;
