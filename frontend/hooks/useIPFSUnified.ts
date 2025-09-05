"use client";

import { useState, useCallback, useEffect } from "react";
import {
  uploadToPinata,
  uploadJSONToPinata,
  getIPFSImageUrl,
} from "@/utils/pinata";
import { NFTMetadata } from "@/types/nft";
import { toast } from "react-hot-toast";

// Unified IPFS interface
export interface IPFSUploadResult {
  hash: string;
  url: string;
}

export interface IPFSImageOptions {
  fallbackUrl?: string;
  enableFallback?: boolean;
  useCache?: boolean;
  timeout?: number;
  preload?: boolean;
}

export interface NFTUploadData {
  name: string;
  description: string;
  rarity: string;
  isLimitedEdition: boolean;
  editionSize?: number;
  editionNumber?: number;
  customizationOptions: {
    allowColorChange: boolean;
    allowTextChange: boolean;
    allowSizeChange: boolean;
    allowEffectsChange: boolean;
    availableColors: string[];
    maxTextLength: number;
  };
  creator: string;
}

export function useIPFSUnified() {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Check if Pinata is configured
  const isPinataConfigured = useCallback(() => {
    // Try both NEXT_PUBLIC_ prefixed and non-prefixed versions
    const apiKey =
      process.env.NEXT_PUBLIC_PINATA_API_KEY || process.env.PINATA_API_KEY;
    const secretKey =
      process.env.NEXT_PUBLIC_PINATA_SECRET_KEY ||
      process.env.PINATA_SECRET_KEY;

    return !!(
      apiKey &&
      secretKey &&
      apiKey !== "your_pinata_api_key_here" &&
      secretKey !== "your_pinata_secret_key_here"
    );
  }, []);

  // No fallback - return error if IPFS fails
  const handleIPFSError = useCallback((error: any) => {
    console.error("IPFS upload failed:", error);
    toast.error("IPFS upload failed. Please check your configuration.");
    throw error;
  }, []);

  // Upload file to IPFS
  const uploadFile = useCallback(
    async (file: File): Promise<string> => {
      try {
        setError(null);
        setUploadProgress(10);

        // Validate file
        if (!file) {
          throw new Error("No file provided");
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("File size too large. Maximum 10MB allowed.");
        }

        // Check file type for images
        if (file.type.startsWith("image/")) {
          const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
          ];
          if (!allowedTypes.includes(file.type)) {
            throw new Error(
              "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."
            );
          }
        }

        setUploadProgress(30);

        // Upload to IPFS (Pinata client-side, API route, or fallback)
        let hash: string;
        if (isPinataConfigured()) {
          // Try client-side first
          hash = await uploadToPinata(file);
        } else {
          // Try server-side API route
          try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", "image");

            const response = await fetch("/api/upload-ipfs", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "Upload failed");
            }

            const result = await response.json();
            hash = result.hash;
          } catch (apiError) {
            // No fallback - throw error
            console.error("API route failed:", apiError);
            handleIPFSError(apiError);
            throw apiError; // Re-throw to prevent undefined hash
          }
        }

        if (!hash) {
          throw new Error("Failed to upload file to IPFS");
        }

        setUploadProgress(70);
        return hash;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to upload file";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [isPinataConfigured]
  );

  // Upload JSON metadata to IPFS
  const uploadMetadata = useCallback(
    async (metadata: NFTMetadata): Promise<string> => {
      try {
        setError(null);
        setUploadProgress(80);

        // Validate metadata
        if (!metadata.name || !metadata.description || !metadata.image) {
          throw new Error("Missing required metadata fields");
        }

        // Upload metadata to IPFS (Pinata client-side, API route, or fallback)
        let hash: string;
        if (isPinataConfigured()) {
          // Try client-side first
          hash = await uploadJSONToPinata(metadata);
        } else {
          // Try server-side API route
          try {
            const response = await fetch("/api/upload-ipfs", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ metadata }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "Upload failed");
            }

            const result = await response.json();
            hash = result.hash;
          } catch (apiError) {
            // No fallback - throw error
            console.error("API route failed:", apiError);
            handleIPFSError(apiError);
            throw apiError; // Re-throw to prevent undefined hash
          }
        }

        if (!hash) {
          throw new Error("Failed to upload metadata to IPFS");
        }

        setUploadProgress(100);
        return hash;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to upload metadata";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [isPinataConfigured]
  );

  // Upload complete NFT (image + metadata)
  const uploadNFT = useCallback(
    async (
      file: File,
      nftData: NFTUploadData
    ): Promise<{
      imageHash: string;
      metadataHash: string;
      imageUrl: string;
      metadataUrl: string;
    }> => {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      try {
        // Step 1: Upload image
        toast.loading("Uploading image to IPFS...", { id: "nft-upload" });
        const imageHash = await uploadFile(file);
        const imageUrl = `ipfs://${imageHash}`;

        // Step 2: Create metadata
        const metadata: NFTMetadata = {
          name: nftData.name,
          description: nftData.description,
          image: imageUrl,
          external_url: `https://app.pinata.cloud/ipfs/groups/877735d8-cf1e-408a-9ed5-a0330d004ead`,
          // Additional fields for better compatibility
          title: nftData.name,
          symbol: "MOOVE",
          collection: {
            name: "Moove Vehicle Stickers",
            family: "Moove Mobility",
          },
          attributes: [
            {
              trait_type: "Rarity",
              value: nftData.rarity,
            },
            {
              trait_type: "Category",
              value: "Vehicle Decoration",
            },
            {
              trait_type: "Creator",
              value: nftData.creator,
            },
            {
              trait_type: "Creation Date",
              value: new Date().toISOString(),
              display_type: "date",
            },
          ],
          properties: {
            category: "Vehicle Decoration",
            rarity: nftData.rarity,
            isLimitedEdition: nftData.isLimitedEdition,
            creator: nftData.creator,
            creationDate: new Date().toISOString(),
            customization: nftData.customizationOptions,
          },
        };

        // Add limited edition attributes if applicable
        if (
          nftData.isLimitedEdition &&
          nftData.editionSize &&
          nftData.editionNumber
        ) {
          metadata.attributes.push(
            {
              trait_type: "Edition Size",
              value: nftData.editionSize,
              display_type: "number",
            },
            {
              trait_type: "Edition Number",
              value: nftData.editionNumber,
              display_type: "number",
            }
          );
        }

        // Add customization attributes
        if (nftData.customizationOptions.allowColorChange) {
          metadata.attributes.push({
            trait_type: "Customizable Colors",
            value: nftData.customizationOptions.availableColors.length,
            display_type: "number",
          });
        }

        if (nftData.customizationOptions.allowTextChange) {
          metadata.attributes.push({
            trait_type: "Max Text Length",
            value: nftData.customizationOptions.maxTextLength,
            display_type: "number",
          });
        }

        // Step 3: Upload metadata
        toast.loading("Uploading metadata to IPFS...", { id: "nft-upload" });
        const metadataHash = await uploadMetadata(metadata);
        const metadataUrl = `ipfs://${metadataHash}`;

        // Success
        toast.success("NFT uploaded to IPFS successfully!", {
          id: "nft-upload",
        });

        return {
          imageHash,
          metadataHash,
          imageUrl,
          metadataUrl,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to upload NFT";
        setError(errorMessage);
        toast.error(`Upload failed: ${errorMessage}`, { id: "nft-upload" });
        throw err;
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [uploadFile, uploadMetadata]
  );

  // Fetch metadata from IPFS
  const fetchMetadata = useCallback(
    async (uri: string): Promise<NFTMetadata | null> => {
      if (!uri) return null;

      setIsLoading(true);
      setError(null);

      try {
        // Convert ipfs:// to HTTP gateway URL
        const IPFS_GATEWAY =
          process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/";
        const httpUrl = uri.startsWith("ipfs://")
          ? `${IPFS_GATEWAY}${uri.slice(7)}`
          : uri;

        const response = await fetch(httpUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.statusText}`);
        }

        const metadata: NFTMetadata = await response.json();

        // Convert image IPFS URL if needed
        if (metadata.image?.startsWith("ipfs://")) {
          metadata.image = `${IPFS_GATEWAY}${metadata.image.slice(7)}`;
        }

        return metadata;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to fetch metadata");
        setError(error.message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Get IPFS URL from hash
  const getIPFSUrl = useCallback((hash: string) => {
    const IPFS_GATEWAY =
      process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/";
    return `${IPFS_GATEWAY}${hash}`;
  }, []);

  return {
    // Upload functions
    uploadFile,
    uploadMetadata,
    uploadNFT,

    // Fetch functions
    fetchMetadata,
    getIPFSUrl,

    // State
    isUploading,
    isLoading,
    uploadProgress,
    error,
    isPinataConfigured: isPinataConfigured(),
  };
}

// Hook for IPFS images with fallback
export function useIPFSImage(ipfsHash: string, options: IPFSImageOptions = {}) {
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
          const { getCityImageUrl } = await import("@/utils/pinata");
          const url = getCityImageUrl(ipfsHash);
          setImageUrl(url);
          setIsLoading(false);

          // Preload the image if requested
          if (preload) {
            const { preloadIPFSImage } = await import("@/utils/pinata");
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
}
