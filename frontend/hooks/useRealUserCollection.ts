"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

export interface UserNFT {
  tokenId: number;
  name: string;
  description: string;
  image: string;
  rarity: string;
  purchaseDate: number;
  price: number;
  transactionHash: string;
  auctionWon?: {
    auctionId: string;
    finalBid: number;
    bidders: number;
  };
}

export function useRealUserCollection() {
  const { address, isConnected } = useAccount();
  const [nfts, setNfts] = useState<UserNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache for NFT metadata to avoid refetching
  const metadataCache = useRef<Map<number, any>>(new Map());

  const fetchUserNFTs = useCallback(async () => {
    if (!address || !isConnected) {
      setNfts([]);
      setIsLoading(false);
      return;
    }

    try {
      console.log("🔍 Fetching real user NFTs for:", address);
      setIsLoading(true);
      setError(null);

      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No ethereum provider available");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      const nftContract = new ethers.Contract(
        contracts.MooveNFT.address,
        contracts.MooveNFT.abi,
        provider
      );

      // Get all Transfer events where user is the recipient
      const currentBlock = await provider.getBlockNumber();
      // Use a more reasonable range to avoid timeout (last 50k blocks ~1 week)
      const fromBlock = Math.max(0, currentBlock - 50000);

      console.log(
        `📡 Fetching ALL Transfer events from block ${fromBlock} to ${currentBlock}`
      );

      // Fetch Transfer events where user received NFTs
      const transferFilter = nftContract.filters.Transfer(null, address);
      const transferEvents = await nftContract.queryFilter(
        transferFilter,
        fromBlock,
        currentBlock
      );

      console.log(`📦 Found ${transferEvents.length} Transfer events to user`);

      const userNFTs: UserNFT[] = [];
      const processedTokenIds = new Set<number>(); // Track processed NFTs to avoid duplicates

      for (const event of transferEvents) {
        try {
          if ("args" in event && event.args && event.args.tokenId) {
            const tokenId = Number(event.args.tokenId);
            const transactionHash = event.transactionHash;

            // Skip if we already processed this NFT (avoid duplicates)
            if (processedTokenIds.has(tokenId)) {
              console.log(`⏭️ Skipping duplicate NFT #${tokenId}`);
              continue;
            }

            console.log(
              `🔍 Processing NFT #${tokenId} from transaction ${transactionHash}`
            );

            // Get NFT metadata (with caching)
            let metadata;
            try {
              // Check cache first
              if (metadataCache.current.has(tokenId)) {
                metadata = metadataCache.current.get(tokenId);
                console.log(`📄 Using cached metadata for #${tokenId}`);
              } else {
                const tokenURI = await nftContract.tokenURI(tokenId);
                console.log(`📄 Token URI for #${tokenId}:`, tokenURI);

                // Fetch metadata from IPFS using faster CDN
                const IPFS_GATEWAYS = [
                  "https://cloudflare-ipfs.com/ipfs/", // Fastest
                  "https://gateway.pinata.cloud/ipfs/", // Pinata CDN
                  "https://ipfs.io/ipfs/", // Fallback
                ];

                let httpUrl = tokenURI;
                if (tokenURI.startsWith("ipfs://")) {
                  const ipfsHash = tokenURI.slice(7);
                  httpUrl = `${IPFS_GATEWAYS[0]}${ipfsHash}`;
                }

                const response = await fetch(httpUrl);
                if (response.ok) {
                  metadata = await response.json();
                  // Cache the metadata
                  metadataCache.current.set(tokenId, metadata);
                  console.log(`✅ Metadata for #${tokenId}:`, metadata);
                } else {
                  console.warn(
                    `⚠️ Failed to fetch metadata for #${tokenId}: ${response.statusText}`
                  );
                  metadata = {
                    name: `NFT #${tokenId}`,
                    description: `A unique NFT with token ID ${tokenId}`,
                    image: "/images/default-nft.svg",
                    attributes: [
                      { trait_type: "Token ID", value: tokenId.toString() },
                      { trait_type: "Type", value: "Genesis Collection" },
                    ],
                  };
                  // Cache fallback metadata too
                  metadataCache.current.set(tokenId, metadata);
                }
              }
            } catch (metadataError) {
              console.warn(
                `⚠️ Error fetching metadata for #${tokenId}:`,
                metadataError
              );
              metadata = {
                name: `NFT #${tokenId}`,
                description: `A unique NFT with token ID ${tokenId}`,
                image: "/images/default-nft.svg",
                attributes: [
                  { trait_type: "Token ID", value: tokenId.toString() },
                  { trait_type: "Type", value: "Genesis Collection" },
                ],
              };
              // Cache fallback metadata too
              metadataCache.current.set(tokenId, metadata);
            }

            // Try to find auction data for this NFT
            let auctionData = null;
            try {
              // Look for AuctionSettled events with this tokenId
              const settledFilter = auctionContract.filters.AuctionSettled(
                null,
                null,
                tokenId
              );
              const settledEvents = await auctionContract.queryFilter(
                settledFilter,
                fromBlock,
                currentBlock
              );

              if (settledEvents.length > 0) {
                const settledEvent = settledEvents[settledEvents.length - 1]; // Get the latest
                if ("args" in settledEvent && settledEvent.args) {
                  auctionData = {
                    auctionId: settledEvent.args.auctionId.toString(),
                    finalBid: parseFloat(
                      ethers.formatEther(settledEvent.args.finalPrice)
                    ),
                    bidders: 1, // We don't have bidder count in the event
                  };
                  console.log(
                    `🏆 Found auction data for #${tokenId}:`,
                    auctionData
                  );
                }
              }
            } catch (auctionError) {
              console.warn(
                `⚠️ Error fetching auction data for #${tokenId}:`,
                auctionError
              );
            }

            // Get transaction details for purchase date and price
            let purchaseDate = Date.now();
            let price = 0;
            try {
              const tx = await provider.getTransaction(transactionHash);
              if (tx) {
                // Get timestamp from block instead of transaction
                try {
                  const block = await provider.getBlock(tx.blockNumber || 0);
                  purchaseDate = block ? block.timestamp * 1000 : Date.now();
                } catch (blockError) {
                  console.warn(
                    `⚠️ Could not get block timestamp for ${transactionHash}`
                  );
                  purchaseDate = Date.now();
                }
                price =
                  auctionData?.finalBid ||
                  parseFloat(ethers.formatEther(tx.value || 0));
              }
            } catch (txError) {
              console.warn(
                `⚠️ Error fetching transaction details for ${transactionHash}:`,
                txError
              );
            }

            // Normalize rarity to lowercase
            const rawRarity =
              metadata.attributes?.find(
                (attr: any) => attr.trait_type === "Rarity"
              )?.value || "common";
            const normalizedRarity =
              typeof rawRarity === "string"
                ? rawRarity.toLowerCase()
                : "common";

            const userNFT: UserNFT = {
              tokenId,
              name: metadata.name || `NFT #${tokenId}`,
              description:
                metadata.description || `A unique NFT with token ID ${tokenId}`,
              image: metadata.image || "/images/default-nft.svg",
              rarity: normalizedRarity,
              purchaseDate,
              price,
              transactionHash,
              auctionWon: auctionData || undefined,
            };

            userNFTs.push(userNFT);
            processedTokenIds.add(tokenId); // Mark as processed
            console.log(`✅ Added NFT #${tokenId} to collection:`, userNFT);
          }
        } catch (nftError) {
          console.error(`❌ Error processing NFT from event:`, nftError);
        }
      }

      // Sort NFTs by purchase date (most recent first)
      userNFTs.sort((a, b) => b.purchaseDate - a.purchaseDate);

      console.log(
        `🎉 Found ${userNFTs.length} NFTs in user collection (sorted by date)`
      );
      setNfts(userNFTs);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch user NFTs";
      setError(errorMessage);
      console.error("❌ Error fetching user collection:", err);
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  useEffect(() => {
    fetchUserNFTs();
  }, [fetchUserNFTs]);

  // Listen for NFT claim events to refresh collection
  useEffect(() => {
    const handleNFTClaimed = () => {
      console.log(
        "🔄 NFT claimed event received, refreshing real collection..."
      );
      fetchUserNFTs();
    };

    window.addEventListener("nftClaimed", handleNFTClaimed);
    return () => window.removeEventListener("nftClaimed", handleNFTClaimed);
  }, [fetchUserNFTs]);

  // Calculate stats
  const totalItems = nfts.length;
  const totalValue = nfts.reduce((sum, nft) => sum + nft.price, 0);
  const cacheStats = {
    total: nfts.length,
    cached: nfts.length,
    lastUpdated: Date.now(),
  };

  return {
    displayedNFTs: nfts,
    allNFTs: nfts,
    isLoading,
    isLoadingMore: false,
    hasMore: false,
    error,
    totalItems,
    totalValue,
    totalValueString: totalValue.toString(),
    totalValueType: "number" as const,
    cacheStats,
    loadMore: () => Promise.resolve(),
    refresh: fetchUserNFTs,
    refetch: fetchUserNFTs,
    userNFTsLoading: isLoading,
    userNFTsError: error,
  };
}
