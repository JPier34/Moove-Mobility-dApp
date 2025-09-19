"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useMemo } from "react";

// Types
interface UserNFT {
  tokenId: string; // Changed to string for compatibility
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

// Single optimized scan function
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
      "0x40E455515bf712144C1A5D859F19d64b537754f7", // MooveNFT address
      [
        "function totalSupply() view returns (uint256)",
        "function ownerOf(uint256 tokenId) view returns (address)",
        "function tokenURI(uint256 tokenId) view returns (string)",
      ],
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
              tokenId: tokenId.toString(), // Convert to string
              name: metadata.name || `NFT #${tokenId}`,
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

// Main hook for optimized NFT collection
export function useOptimizedNFTCollection(): NFTCollectionResult {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();

  // Single optimized query that does everything in one scan
  const {
    data: scanResult,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["optimized-nft-collection", address],
    queryFn: async () => {
      if (!address) return { totalCount: 0, userNFTs: [] };

      console.log(`🔍 Starting OPTIMIZED NFT collection scan for: ${address}`);
      return await scanAllNFTs(address);
    },
    enabled: !!address && isConnected,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const nfts = scanResult?.userNFTs || [];
  const totalCount = scanResult?.totalCount || 0;

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

  console.log("🔍 useOptimizedNFTCollection state:", {
    address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null,
    isConnected,
    userNFTs: nfts.length,
    isLoading,
    totalItems: totalCount,
    totalValue,
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
  };
}
