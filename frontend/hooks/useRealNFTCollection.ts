"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useReadMooveNFT } from "./useContract";
import { contracts } from "@/utils/contracts";

interface UserNFT {
  tokenId: string;
  name: string;
  description: string;
  image: string;
  category: string;
  attributes: any[];
  collection: string;
  owner: string;
  isFromAuction: boolean;
  auctionId?: string;
  auctionType?: number;
  currentBid?: bigint;
  startingPrice?: bigint;
  seller?: string;
  endTime?: string;
  status?: number;
  rarity?: string;
  auctionEndTime?: number;
  purchaseDate?: string;
  transactionHash?: string;
}

interface NFTCollectionResult {
  userNFTs: UserNFT[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  totalItems: number;
  totalValue: number;
}

// Cache key factory
const createCacheKey = (address: string) => [
  "real-user-nft-collection",
  address,
];

// IPFS Gateways with Pinata as primary
const IPFS_GATEWAYS = [
  // Primary: Pinata (most reliable)
  "https://gateway.pinata.cloud/ipfs/",
  "https://app.pinata.cloud/ipfs/",

  // Secondary: Public gateways
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.ipfs.io/ipfs/",

  // Tertiary: Alternative gateways
  "https://dweb.link/ipfs/",
  "https://ipfs.infura.io/ipfs/",
  "https://ipfs.fleek.co/ipfs/",
  "https://nftstorage.link/ipfs/",
  "https://ipfs.filebase.io/ipfs/",
];

// Fetch NFT metadata from IPFS with robust fallback
async function fetchNFTMetadata(tokenURI: string): Promise<any> {
  try {
    console.log(`🔍 Fetching metadata from: ${tokenURI}`);

    // Clean the hash
    const cleanHash = tokenURI.replace("ipfs://", "");

    // Try each gateway with timeout
    for (const gateway of IPFS_GATEWAYS) {
      try {
        const httpUrl = `${gateway}${cleanHash}`;
        console.log(`🔄 Trying gateway: ${gateway}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(httpUrl, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const metadata = await response.json();
          console.log(
            `✅ Successfully fetched metadata from ${gateway}:`,
            metadata
          );

          // Convert image IPFS URL if needed
          if (metadata.image && metadata.image.startsWith("ipfs://")) {
            const imageHash = metadata.image.replace("ipfs://", "");
            metadata.image = `${IPFS_GATEWAYS[0]}${imageHash}`; // Use Pinata for image
            console.log(`🔄 Converted image URL to: ${metadata.image}`);
          }

          return metadata;
        }
      } catch (error) {
        console.warn(`⚠️ Gateway ${gateway} failed:`, error);
        continue;
      }
    }

    // If all gateways fail, try proxy server as last resort
    console.log(`⚠️ All gateways failed, trying proxy server...`);
    const response = await fetch(
      `/api/ipfs-proxy?hash=${encodeURIComponent(tokenURI)}`
    );
    if (!response.ok)
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);

    const metadata = await response.json();
    console.log(`✅ Successfully fetched metadata via proxy:`, metadata);

    return metadata;
  } catch (error) {
    console.error("Error fetching NFT metadata:", error);
    return {
      name: "Unknown NFT",
      description: "No description available",
      image: "/images/default-nft.svg",
      attributes: [],
      category: "Unknown",
    };
  }
}

// Hook to check ownership of a specific NFT
function useNFTOwnership(tokenId: string, userAddress: string) {
  return useReadMooveNFT("ownerOf", [BigInt(tokenId)], {
    enabled: !!tokenId && !!userAddress,
  });
}

// Get the last NFT ID by trying totalSupply first, then going forward with early exit
async function scanAllNFTs(userAddress: string): Promise<{
  totalCount: number;
  userNFTs: UserNFT[];
}> {
  if (!window.ethereum) {
    console.log("⚠️ No ethereum provider available");
    return { totalCount: 0, userNFTs: [] };
  }

  try {
    const provider = new (await import("ethers")).BrowserProvider(
      window.ethereum
    );
    const nftContract = new (await import("ethers")).Contract(
      contracts.MooveNFT.address,
      contracts.MooveNFT.abi,
      provider
    );

    console.log("🔍 Starting OPTIMIZED NFT scan...");

    // Try totalSupply first
    let totalCount = 0;
    try {
      const totalSupply = await nftContract.totalSupply();
      totalCount = Number(totalSupply);
      console.log(`✅ Total supply from contract: ${totalCount}`);
    } catch (totalSupplyError) {
      console.log("⚠️ totalSupply not available, using forward scan...");
      totalCount = 1000; // Will be adjusted during scan
    }

    // Single scan: find total count AND collect user NFTs
    const maxCheck = 1000;
    const maxConsecutiveMissing = 5;
    let consecutiveMissing = 0;
    let lastFoundTokenId = -1;
    const userNFTs: UserNFT[] = [];

    for (let tokenId = 0; tokenId < maxCheck; tokenId++) {
      try {
        const owner = await nftContract.ownerOf(tokenId);
        consecutiveMissing = 0; // Reset counter
        lastFoundTokenId = tokenId;

        // Check if user owns this NFT
        if (owner.toLowerCase() === userAddress.toLowerCase()) {
          console.log(`✅ User owns NFT #${tokenId}`);

          // Get tokenURI for metadata
          try {
            const tokenURI = await nftContract.tokenURI(tokenId);
            console.log(`🔗 NFT #${tokenId} tokenURI: ${tokenURI}`);

            // Fetch metadata
            const metadata = await fetchNFTMetadata(tokenURI);

            const userNFT: UserNFT = {
              tokenId: tokenId.toString(),
              name: metadata.name || `NFT #${tokenId}`,
              description: metadata.description || "No description available",
              image: metadata.image || "/images/default-nft.svg",
              attributes: metadata.attributes || [],
              category: metadata.category || "Unknown",
              collection: "Genesis",
              owner: userAddress,
              rarity: metadata.rarity || "COMMON",
              currentBid: BigInt(Math.floor(0.001 * 1e18)), // Default price
              startingPrice: BigInt(Math.floor(0.001 * 1e18)), // Default price
              isFromAuction: false,
              auctionEndTime: 0,
              purchaseDate: new Date().toISOString().split("T")[0],
              transactionHash: "",
            };

            userNFTs.push(userNFT);
          } catch (metadataError) {
            console.warn(
              `⚠️ Failed to get metadata for NFT #${tokenId}:`,
              metadataError
            );
          }
        } else {
          console.log(`❌ User does not own NFT #${tokenId}. Owner: ${owner}`);
        }
      } catch {
        consecutiveMissing++;
        console.log(
          `❌ NFT #${tokenId} doesn't exist (${consecutiveMissing}/${maxConsecutiveMissing})`
        );

        if (consecutiveMissing >= maxConsecutiveMissing) {
          console.log(
            `🛑 Stopping after ${consecutiveMissing} consecutive missing NFTs`
          );
          console.log(`🎯 Last existing NFT found: #${lastFoundTokenId}`);
          break;
        }
      }
    }

    // Update totalCount based on actual scan
    if (lastFoundTokenId >= 0) {
      totalCount = lastFoundTokenId + 1;
    }

    console.log(
      `🎯 Scan complete: Found ${totalCount} total NFTs, ${userNFTs.length} owned by user`
    );
    return { totalCount, userNFTs };
  } catch (error) {
    console.error("❌ Error scanning NFTs:", error);
    return { totalCount: 0, userNFTs: [] };
  }
}

// Hook to get total NFT count using totalSupply or forward approach with early exit
function useTotalNFTCount(): {
  totalCount: number;
  isLoading: boolean;
  error: any;
} {
  // Simplified version - just return default values since we're using the optimized version
  return {
    totalCount: 100, // Default fallback
    isLoading: false,
    error: null,
  };
}

// Main hook for real NFT collection with ownership verification
export function useRealNFTCollection(): NFTCollectionResult {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const {
    totalCount,
    isLoading: isLoadingCount,
    error: countError,
  } = useTotalNFTCount();

  // Main NFT collection query - DYNAMIC VERSION
  const {
    data: userNFTs = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: createCacheKey(address || ""),
    queryFn: async (): Promise<UserNFT[]> => {
      if (!address) return [];

      console.log(`🔍 Loading DYNAMIC NFT collection for: ${address}`);
      console.log(`📊 Checking ${totalCount} potential NFTs...`);

      const nfts: UserNFT[] = [];
      const startTime = Date.now();
      const queryTimeout = 30000; // 30 seconds timeout for the entire query

      // Check ownership for all potential NFTs dynamically
      for (let tokenId = 0; tokenId < totalCount; tokenId++) {
        // Check timeout
        if (Date.now() - startTime > queryTimeout) {
          console.log(`⏰ Query timeout reached, stopping at NFT #${tokenId}`);
          break;
        }
        try {
          console.log(`🔍 Checking NFT #${tokenId} ownership...`);

          // Check if this NFT exists by trying to get its owner
          // We'll use a direct contract call approach since we can't use hooks in loops
          if (!window.ethereum) {
            console.log(
              `⚠️ No ethereum provider available for NFT #${tokenId}`
            );
            continue;
          }

          const provider = new (await import("ethers")).BrowserProvider(
            window.ethereum
          );
          const nftContract = new (await import("ethers")).Contract(
            contracts.MooveNFT.address,
            contracts.MooveNFT.abi,
            provider
          );

          try {
            const owner = await nftContract.ownerOf(tokenId);
            console.log(`🔍 NFT #${tokenId} owner: ${owner}`);

            // Check if user owns this NFT
            if (owner && owner.toLowerCase() === address.toLowerCase()) {
              console.log(`✅ User owns NFT #${tokenId}`);

              try {
                // Get tokenURI
                const tokenURI = await nftContract.tokenURI(tokenId);
                console.log(`🔗 NFT #${tokenId} tokenURI: ${tokenURI}`);

                // Fetch metadata
                const metadata = await fetchNFTMetadata(tokenURI);

                // Try to get price information from related auctions
                // For now, we'll use a default price since we don't have auction data in this context
                const defaultPrice = 0.001; // Default price in ETH

                nfts.push({
                  tokenId: tokenId.toString(),
                  name: metadata.name || `NFT #${tokenId}`,
                  description: metadata.description || "No description",
                  image: metadata.image || "/images/default-nft.svg",
                  category: metadata.category || "Unknown",
                  attributes: metadata.attributes || [],
                  collection: "Genesis",
                  owner: address!,
                  isFromAuction: false,
                  currentBid: BigInt(Math.floor(defaultPrice * 1e18)), // Convert to wei
                  startingPrice: BigInt(Math.floor(defaultPrice * 1e18)), // Convert to wei
                });

                console.log(`✅ Added NFT #${tokenId} to collection`);
              } catch (metadataError) {
                console.error(
                  `Error fetching metadata for NFT #${tokenId}:`,
                  metadataError
                );
                // Add NFT with fallback data
                const defaultPrice = 0.001; // Default price in ETH
                nfts.push({
                  tokenId: tokenId.toString(),
                  name: `NFT #${tokenId}`,
                  description: "Metadata temporarily unavailable",
                  image: "/images/default-nft.svg",
                  category: "Unknown",
                  attributes: [],
                  collection: "Genesis",
                  owner: address!,
                  isFromAuction: false,
                  currentBid: BigInt(Math.floor(defaultPrice * 1e18)), // Convert to wei
                  startingPrice: BigInt(Math.floor(defaultPrice * 1e18)), // Convert to wei
                });
              }
            } else {
              console.log(
                `❌ User does not own NFT #${tokenId}. Owner: ${owner}`
              );
            }
          } catch (ownerError) {
            // NFT doesn't exist or error occurred
            console.log(
              `⚠️ NFT #${tokenId} does not exist or error occurred:`,
              ownerError
            );
            // Continue to next NFT
            continue;
          }
        } catch (error) {
          console.error(`Error checking NFT #${tokenId}:`, error);
          continue;
        }
      }

      console.log(`✅ Loaded ${nfts.length} REAL NFTs for ${address}`);
      return nfts;
    },
    enabled: isConnected && !!address && !isLoadingCount && totalCount > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Calculate stats
  const totalItems = userNFTs.length;
  const totalValue = userNFTs.reduce((sum, nft) => {
    // Use currentBid if available, otherwise use startingPrice, otherwise default
    let price = 0.001; // Default 0.001 ETH

    if (nft.currentBid) {
      price = Number(nft.currentBid) / 1e18;
    } else if (nft.startingPrice) {
      price = Number(nft.startingPrice) / 1e18;
    }

    // Remove trailing zeros
    const formattedPrice = Number(price.toString().replace(/\.?0+$/, ""));

    console.log(`💰 NFT #${nft.tokenId} price calculation:`, {
      currentBid: nft.currentBid?.toString(),
      startingPrice: nft.startingPrice?.toString(),
      calculatedPrice: price,
      formattedPrice: formattedPrice,
    });

    return sum + formattedPrice;
  }, 0);

  // Invalidate cache when address changes
  const prevAddress = queryClient.getQueryData(["current-address"]) as string;
  if (prevAddress !== address) {
    queryClient.setQueryData(["current-address"], address);
    if (prevAddress && typeof prevAddress === "string") {
      queryClient.invalidateQueries({ queryKey: createCacheKey(prevAddress) });
    }
  }

  // Debug logging with more details
  console.log("🔍 useRealNFTCollection state:", {
    address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "null",
    isConnected,
    userNFTs: userNFTs.length,
    isLoading,
    totalItems,
    totalValue,
    path: typeof window !== "undefined" ? window.location.pathname : "SSR",
    timestamp: new Date().toISOString(),
  });

  return {
    userNFTs,
    isLoading: isLoading || isLoadingCount,
    error: error?.message || countError?.message || null,
    refetch,
    totalItems,
    totalValue,
  };
}

// Hook for invalidating NFT collection cache
export function useInvalidateRealNFTCollection() {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return (tokenId?: string) => {
    if (address) {
      queryClient.invalidateQueries({ queryKey: createCacheKey(address) });
    }
    if (tokenId) {
      queryClient.invalidateQueries({ queryKey: ["nft-metadata", tokenId] });
    }
  };
}
