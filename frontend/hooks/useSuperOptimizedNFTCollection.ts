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
  bidCount?: number; // Number of bidders in the auction
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

    // Extract IPFS hash from various formats
    let cleanHash = tokenURI;

    // Handle ipfs:// format
    if (tokenURI.startsWith("ipfs://")) {
      cleanHash = tokenURI.replace("ipfs://", "");
    }
    // Handle https://ipfs.io/ipfs/ format
    else if (tokenURI.includes("/ipfs/")) {
      cleanHash = tokenURI.split("/ipfs/")[1];
    }

    console.log(`🧹 Cleaned hash: ${cleanHash}`);

    // Use proxy server as primary solution (more reliable)
    console.log(`🚀 Using proxy server as primary solution...`);
    try {
      const response = await fetch(
        `/api/ipfs-proxy?hash=${encodeURIComponent(tokenURI)}`
      );

      if (!response.ok)
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);

      const metadata = await response.json();
      console.log(`✅ Successfully fetched metadata via proxy:`, metadata);

      // Convert image IPFS URL if needed - use proxy server for images too
      if (metadata.image && metadata.image.startsWith("ipfs://")) {
        metadata.image = `/api/ipfs-proxy?hash=${encodeURIComponent(
          metadata.image
        )}`;
        console.log(`🔄 Converted image URL to proxy: ${metadata.image}`);
      }

      return metadata;
    } catch (proxyError) {
      console.warn(`⚠️ Proxy server failed:`, proxyError);

      // Fallback to direct gateway access
      console.log(`🔄 Falling back to direct gateway access...`);
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

            // Convert image IPFS URL if needed - use proxy server for images too
            if (metadata.image && metadata.image.startsWith("ipfs://")) {
              metadata.image = `/api/ipfs-proxy?hash=${encodeURIComponent(
                metadata.image
              )}`;
              console.log(`🔄 Converted image URL to proxy: ${metadata.image}`);
            }

            return metadata;
          }
        } catch (error) {
          console.warn(`⚠️ Gateway ${gateway} failed:`, error);
          continue;
        }
      }

      // If all methods fail, return mock data
      console.error("❌ All methods failed, returning mock data");
      return {
        name: "Unknown NFT",
        description: "No description available",
        image: "/images/default-nft.svg",
        attributes: [],
        category: "Unknown",
      };
    }
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

          // Try to get auction data for this NFT
          let auctionData = null;
          try {
            // Check if this NFT has auction data
            const { getAuctionDataForNFT } = await import(
              "../utils/auction-utils"
            );
            auctionData = await getAuctionDataForNFT(nft.tokenId, address);
          } catch (auctionError) {
            console.log(`ℹ️ No auction data found for NFT #${nft.tokenId}`);
          }

          const userNFT: UserNFT = {
            tokenId: nft.tokenId.toString(),
            name: metadata.name || `NFT #${nft.tokenId}`,
            description: metadata.description || "No description available",
            image: metadata.image || "/images/default-nft.svg",
            attributes: metadata.attributes || [],
            category: metadata.category || "Unknown",
            rarity: metadata.rarity || "COMMON",
            currentBid:
              auctionData?.highestBid ||
              auctionData?.currentPrice ||
              BigInt(Math.floor(0.001 * 1e18)),
            startingPrice:
              auctionData?.startingPrice || BigInt(Math.floor(0.001 * 1e18)),
            isFromAuction: !!auctionData,
            auctionEndTime: auctionData?.endTime || 0,
            purchaseDate: new Date().toISOString().split("T")[0],
            transactionHash: "",
            // Additional properties for compatibility
            endTime: auctionData?.endTime || 0,
            auctionId: auctionData?.auctionId?.toString() || "",
            status: auctionData ? "auctioned" : "owned",
            bidCount: auctionData?.bidCount || 0, // Number of bidders in the auction
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
