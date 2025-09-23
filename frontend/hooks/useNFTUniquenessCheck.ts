"use client";

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { contracts } from "@/utils/contracts";
import { useGlobalNFTCache } from "./useGlobalNFTCache";

interface UniquenessCheckResult {
  isNameUnique: boolean;
  isImageUnique: boolean;
  nameError: string | null;
  imageError: string | null;
  isLoading: boolean;
  error: string | null;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: any[];
}

export function useNFTUniquenessCheck() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAllExistingNFTs, getNFTFromCache, isNFTInCache } =
    useGlobalNFTCache();

  const checkUniqueness = useCallback(
    async (
      name: string,
      imageFile: File | null,
      imageHash?: string,
      userAddress?: string
    ): Promise<UniquenessCheckResult> => {
      setIsLoading(true);
      setError(null);

      const result: UniquenessCheckResult = {
        isNameUnique: true,
        isImageUnique: true,
        nameError: null,
        imageError: null,
        isLoading: false,
        error: null,
      };

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

        console.log(
          `🔍 Checking uniqueness against all existing NFTs using global cache...`
        );

        // Get all existing NFTs from global cache (super fast!)
        console.log(`🚀 Getting all existing NFTs from global cache...`);
        const {
          nfts: allNFTs,
          fromCache,
          fromContract,
        } = await getAllExistingNFTs();
        console.log(
          `📊 Found ${allNFTs.length} NFTs in global cache (${fromCache} from cache, ${fromContract} from contract)`
        );

        // Create a map of tokenId -> metadata for quick lookup
        const nftMetadataMap = new Map<number, NFTMetadata>();

        // Process all NFTs to get their metadata (already cached!)
        for (const nft of allNFTs) {
          if (nft.metadata) {
            nftMetadataMap.set(nft.tokenId, nft.metadata);
          }
        }

        // Check name uniqueness using cached data first
        if (name.trim()) {
          console.log(`🔍 Checking name uniqueness: "${name}"`);

          // Check all cached NFTs for name uniqueness (super fast!)
          for (const [tokenId, metadata] of nftMetadataMap) {
            if (
              metadata.name &&
              metadata.name.toLowerCase().trim() === name.toLowerCase().trim()
            ) {
              result.isNameUnique = false;
              result.nameError = `Name "${name}" already exists (NFT #${tokenId})`;
              console.log(
                `❌ Name "${name}" already exists in NFT #${tokenId}`
              );
              break;
            }
          }
        }

        // Check image uniqueness using cached data first
        if (imageFile || imageHash) {
          console.log(`🔍 Checking image uniqueness`);

          let imageToCheck: string;

          if (imageFile) {
            // Convert file to base64 for comparison
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
            });
            reader.readAsDataURL(imageFile);
            imageToCheck = await base64Promise;
          } else if (imageHash) {
            // Use the provided hash
            imageToCheck = imageHash;
          } else {
            throw new Error("No image provided for uniqueness check");
          }

          // Check all cached NFTs for image uniqueness (super fast!)
          for (const [tokenId, metadata] of nftMetadataMap) {
            if (metadata.image) {
              // For file comparison, we'd need to fetch the actual image and compare
              // For now, we'll do a simple string comparison
              if (
                imageFile &&
                metadata.image.includes(imageToCheck.split(",")[1])
              ) {
                result.isImageUnique = false;
                result.imageError = `Image already exists (NFT #${tokenId})`;
                console.log(`❌ Image already exists in NFT #${tokenId}`);
                break;
              } else if (imageHash && metadata.image.includes(imageHash)) {
                result.isImageUnique = false;
                result.imageError = `Image already exists (NFT #${tokenId})`;
                console.log(`❌ Image already exists in NFT #${tokenId}`);
                break;
              }
            }
          }
        }

        console.log(`✅ Uniqueness check completed:`, {
          nameUnique: result.isNameUnique,
          imageUnique: result.isImageUnique,
          nameError: result.nameError,
          imageError: result.imageError,
        });

        console.log(`🔍 Returning result:`, result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error("❌ Error checking NFT uniqueness:", errorMessage);
        setError(errorMessage);

        return {
          ...result,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    checkUniqueness,
    isLoading,
    error,
  };
}
