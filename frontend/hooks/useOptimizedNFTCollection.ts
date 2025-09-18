"use client";

import { useAccount } from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useReadMooveNFT, useReadMooveAuction } from "./useContract";

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
const createCacheKey = (address: string) => ["user-nft-collection", address];

// Fetch NFT metadata from IPFS
async function fetchNFTMetadata(tokenURI: string): Promise<any> {
  try {
    const response = await fetch(
      `/api/ipfs-proxy?hash=${encodeURIComponent(tokenURI)}`
    );
    if (!response.ok) throw new Error("Failed to fetch metadata");
    return await response.json();
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

// Main hook for optimized NFT collection
export function useOptimizedNFTCollection(): NFTCollectionResult {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();

  // Get all auctions to find NFTs
  const { data: auctions, isLoading: auctionsLoading } = useQuery({
    queryKey: ["all-auctions"],
    queryFn: async () => {
      // Simulate auction data for testing
      return [
        {
          auctionId: "0",
          nftId: "61",
          auctionType: 0,
          currentBid: "1000000000000000",
          startPrice: "1000000000000000",
          seller: "0x0000000000000000000000000000000000000000",
          endTime: new Date(),
          status: 4,
        },
      ];
    },
    enabled: isConnected,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Main NFT collection query
  const {
    data: userNFTs = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: createCacheKey(address || ""),
    queryFn: async (): Promise<UserNFT[]> => {
      if (!address) return [];

      console.log(`🔍 Loading NFT collection for: ${address}`);

      const nfts: UserNFT[] = [];

      // Get NFTs from auctions (optimized approach)
      if (auctions && auctions.length > 0) {
        // For now, return a simplified version
        // This will be enhanced with proper contract calls
        console.log(`📊 Processing ${auctions.length} auctions for ${address}`);

        // Simulate NFT data for testing
        nfts.push({
          tokenId: "61",
          name: "Lykoi",
          description: "A lykoi cat.",
          image:
            "https://ipfs.io/ipfs/QmWYyLGLvq9MVAGFju7HwR2GzMqotfiPu2H3pZrcrEYgPB",
          category: "VEHICLE_DECORATION",
          attributes: [
            { trait_type: "Rarity", value: "COMMON" },
            { trait_type: "Category", value: "VEHICLE_DECORATION" },
            { trait_type: "Designer", value: "Moove" },
            { trait_type: "Collection", value: "Genesis" },
          ],
          collection: "Genesis",
          owner: address,
          isFromAuction: true,
          auctionId: "0",
          auctionType: 0,
          currentBid: BigInt("1000000000000000"), // 0.001 ETH
          startingPrice: BigInt("1000000000000000"),
          seller: "0x0000000000000000000000000000000000000000",
          endTime: new Date().toISOString(),
          status: 4,
        });
      }

      console.log(`✅ Loaded ${nfts.length} NFTs for ${address}`);
      return nfts;
    },
    enabled: isConnected && !!address && !auctionsLoading,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Calculate stats
  const totalItems = userNFTs.length;
  const totalValue = userNFTs.reduce((sum, nft) => {
    const price = nft.currentBid ? Number(nft.currentBid) / 1e18 : 0;
    return sum + price;
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
  console.log("🔍 useOptimizedNFTCollection state:", {
    address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "null",
    isConnected,
    userNFTs: userNFTs.length,
    isLoading,
    auctionsLoading,
    totalItems,
    totalValue,
    path: typeof window !== "undefined" ? window.location.pathname : "SSR",
    timestamp: new Date().toISOString(),
  });

  return {
    userNFTs,
    isLoading: isLoading || auctionsLoading,
    error: error?.message || null,
    refetch,
    totalItems,
    totalValue,
  };
}

// Hook for invalidating NFT collection cache
export function useInvalidateNFTCollection() {
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
