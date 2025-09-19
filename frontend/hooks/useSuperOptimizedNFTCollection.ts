"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useMemo } from "react";
import { useNFTCache } from "./useNFTCache";

// Types
interface UserNFT {
  tokenId: string;
  name: string;
  description: string;
  image: string;
  attributes: any[];
  category: string;
  rarity: string;
  currentBid: bigint;
  startingPrice: bigint;
  isFromAuction: boolean;
  auctionEndTime: number;
  purchaseDate: string;
  transactionHash: string;
  // Additional properties for compatibility
  endTime?: number;
  auctionId?: string;
  status?: string;
}

interface NFTCollectionResult {
  nfts: UserNFT[];
  userNFTs: UserNFT[]; // Alias for compatibility
  isLoading: boolean;
  error: any;
  totalItems: number;
  totalValue: number;
  refetch: () => void; // For compatibility
  cacheStats: {
    hits: number;
    misses: number;
    totalCalls: number;
    hitRate: string;
    totalEntries: number;
  };
}

// IPFS Gateways with Pinata as primary
const IPFS_GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://dweb.link/ipfs/",
];

// Fetch NFT metadata with robust fallback
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

// Main hook for super optimized NFT collection with preventive cache
export function useSuperOptimizedNFTCollection(): NFTCollectionResult {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const { getUserNFTs, getCacheStats } = useNFTCache();

  // Single optimized query that uses preventive cache
  const {
    data: scanResult,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["super-optimized-nft-collection", address],
    queryFn: async () => {
      if (!address)
        return {
          totalCount: 0,
          userNFTs: [],
          cacheStats: {
            hits: 0,
            misses: 0,
            totalCalls: 0,
            fromCache: 0,
            fromContract: 0,
          },
        };

      console.log(
        `🚀 Starting SUPER OPTIMIZED NFT collection scan for: ${address}`
      );

      // Usa la cache preventiva per ottenere tutti gli NFT
      const { nfts, fromCache, fromContract } = await getUserNFTs(
        address,
        1000
      );

      console.log(
        `📊 Cache performance: ${fromCache} from cache, ${fromContract} from contract`
      );

      // Processa gli NFT per ottenere metadata
      const userNFTs: UserNFT[] = [];

      for (const nft of nfts) {
        try {
          // Fetch metadata solo se non già in cache
          const metadata = await fetchNFTMetadata(nft.tokenURI);

          const userNFT: UserNFT = {
            tokenId: nft.tokenId.toString(),
            name: metadata.name || `NFT #${nft.tokenId}`,
            description: metadata.description || "No description available",
            image: metadata.image || "/images/default-nft.svg",
            attributes: metadata.attributes || [],
            category: metadata.category || "Unknown",
            rarity: metadata.rarity || "COMMON",
            currentBid: BigInt(Math.floor(0.001 * 1e18)), // Default price
            startingPrice: BigInt(Math.floor(0.001 * 1e18)), // Default price
            isFromAuction: false,
            auctionEndTime: 0,
            purchaseDate: new Date().toISOString().split("T")[0],
            transactionHash: "",
            // Additional properties for compatibility
            endTime: 0,
            auctionId: "",
            status: "owned",
          };

          userNFTs.push(userNFT);
        } catch (metadataError) {
          console.warn(
            `⚠️ Failed to get metadata for NFT #${nft.tokenId}:`,
            metadataError
          );
        }
      }

      return {
        totalCount: nfts.length,
        userNFTs,
        cacheStats: {
          hits: fromCache,
          misses: fromContract,
          totalCalls: fromCache + fromContract,
          fromCache,
          fromContract,
        },
      };
    },
    enabled: !!address && isConnected,
    staleTime: 10 * 60 * 1000, // 10 minutes (più lungo grazie alla cache)
  });

  const nfts = scanResult?.userNFTs || [];
  const totalCount = scanResult?.totalCount || 0;
  const cacheStats = getCacheStats();

  // Calculate total value
  const totalValue = useMemo(() => {
    return nfts.reduce((sum, nft) => {
      const price = nft.currentBid
        ? Number(nft.currentBid) / 1e18
        : nft.startingPrice
        ? Number(nft.startingPrice) / 1e18
        : 0.001;

      // Remove trailing zeros
      const formattedPrice = Number(price.toString().replace(/\.?0+$/, ""));

      return sum + formattedPrice;
    }, 0);
  }, [nfts]);

  console.log("🚀 useSuperOptimizedNFTCollection state:", {
    address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null,
    isConnected,
    userNFTs: nfts.length,
    isLoading,
    totalItems: totalCount,
    totalValue,
    cacheStats,
    error: error ? error.message : null,
  });

  return {
    nfts,
    userNFTs: nfts, // Alias for compatibility
    isLoading,
    error,
    totalItems: totalCount,
    totalValue,
    refetch: () => {}, // Placeholder for compatibility
    cacheStats,
  };
}
