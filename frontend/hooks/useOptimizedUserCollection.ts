"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

export interface UserNFT {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  image: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  purchaseDate: Date;
  price: number;
  transactionHash: string;
  auctionWon?: {
    auctionId: string;
    finalBid: number;
    bidders: number;
  };
  // Additional fields for compatibility
  isFromAuction?: boolean;
  status?: string;
}

// Global cache for user NFTs
const userCollectionCache = new Map<string, UserNFT[]>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

// Cache for auction data to avoid repeated queries
const auctionDataCache = new Map<number, any>();
const auctionCacheTimestamps = new Map<number, number>();
const AUCTION_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export function useOptimizedUserCollection() {
  const { address, isConnected } = useAccount();
  const [nfts, setNfts] = useState<UserNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const INITIAL_BATCH_SIZE = 12;
  const SCROLL_BATCH_SIZE = 8; // Display 8 NFTs at a time
  const [allNFTs, setAllNFTs] = useState<UserNFT[]>([]); // Store all NFTs

  // Cache for NFT metadata
  const metadataCache = useRef<Map<number, any>>(new Map());

  const isCacheValid = useCallback((userAddress: string): boolean => {
    const timestamp = cacheTimestamps.get(userAddress);
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_TTL;
  }, []);

  const fetchUserNFTs = useCallback(
    async (loadMore = false) => {
      if (!address || !isConnected) {
        setNfts([]);
        setAllNFTs([]);
        setIsLoading(false);
        return;
      }

      // Check cache first (only for initial load)
      if (!loadMore && isCacheValid(address)) {
        const cachedNFTs = userCollectionCache.get(address);
        if (cachedNFTs) {
          console.log(
            `📦 Using cached collection for ${address}: ${cachedNFTs.length} NFTs`
          );
          setAllNFTs(cachedNFTs);
          // Display first page
          const firstPage = cachedNFTs.slice(0, INITIAL_BATCH_SIZE);
          setNfts(firstPage);
          setIsLoading(false);
          return;
        }
      }

      try {
        if (!loadMore) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }
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

        // Search from the very beginning to get ALL NFTs
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = 0; // Start from genesis block to get ALL NFTs

        console.log(
          `📡 Fetching ALL Transfer events from block ${fromBlock} to ${currentBlock} (${
            currentBlock - fromBlock
          } blocks)`
        );

        // Fetch ALL Transfer events where user received NFTs
        const transferFilter = nftContract.filters.Transfer(null, address);
        const transferEvents = await nftContract.queryFilter(
          transferFilter,
          fromBlock,
          currentBlock
        );

        console.log(
          `📦 Found ${transferEvents.length} Transfer events to user`
        );

        if (transferEvents.length === 0) {
          console.log(`⚠️ No Transfer events found! This could mean:`);
          console.log(`   - User has no NFTs`);
          console.log(`   - RPC provider issues`);
          console.log(`   - Contract address issues`);
          console.log(`   - Block range issues`);
        }

        // Sort events by block number (most recent first)
        transferEvents.sort(
          (a, b) => (b.blockNumber || 0) - (a.blockNumber || 0)
        );

        console.log(`📄 Processing ALL ${transferEvents.length} events`);

        // Pre-fetch all auction events to avoid repeated queries
        console.log("📡 Pre-fetching all auction events...");
        const allSettledFilter = auctionContract.filters.AuctionSettled();
        const allSettledEvents = await auctionContract.queryFilter(
          allSettledFilter,
          fromBlock,
          currentBlock
        );

        const allBidPlacedFilter = auctionContract.filters.BidPlaced();
        const allBidPlacedEvents = await auctionContract.queryFilter(
          allBidPlacedFilter,
          fromBlock,
          currentBlock
        );

        console.log(
          `📊 Pre-fetched ${allSettledEvents.length} settled events and ${allBidPlacedEvents.length} bid events`
        );

        const userNFTs: UserNFT[] = [];
        const processedTokenIds = new Set<number>();
        let displayedCount = 0;

        for (const event of transferEvents) {
          try {
            if ("args" in event && event.args && event.args.tokenId) {
              const tokenId = Number(event.args.tokenId);
              const transactionHash = event.transactionHash;

              // Skip if we already processed this NFT
              if (processedTokenIds.has(tokenId)) {
                continue;
              }

              console.log(
                `🔍 Processing NFT #${tokenId} from transaction ${transactionHash}`
              );

              // Get NFT metadata (with caching)
              let metadata;
              try {
                if (metadataCache.current.has(tokenId)) {
                  metadata = metadataCache.current.get(tokenId);
                  console.log(`📄 Using cached metadata for #${tokenId}`);
                } else {
                  const tokenURI = await nftContract.tokenURI(tokenId);
                  console.log(`📄 Token URI for #${tokenId}:`, tokenURI);

                  // Use fastest IPFS gateway
                  const IPFS_GATEWAYS = [
                    "https://cloudflare-ipfs.com/ipfs/",
                    "https://gateway.pinata.cloud/ipfs/",
                    "https://ipfs.io/ipfs/",
                  ];

                  let httpUrl = tokenURI;
                  if (tokenURI.startsWith("ipfs://")) {
                    const ipfsHash = tokenURI.slice(7);
                    httpUrl = `${IPFS_GATEWAYS[0]}${ipfsHash}`;
                  }

                  // Try multiple gateways if the first one fails
                  let response = await fetch(httpUrl);
                  if (!response.ok && tokenURI.startsWith("ipfs://")) {
                    const ipfsHash = tokenURI.slice(7);
                    for (let i = 1; i < IPFS_GATEWAYS.length; i++) {
                      try {
                        response = await fetch(
                          `${IPFS_GATEWAYS[i]}${ipfsHash}`
                        );
                        if (response.ok) break;
                      } catch (gatewayError) {
                        console.warn(
                          `⚠️ Gateway ${i} failed for #${tokenId}:`,
                          gatewayError
                        );
                      }
                    }
                  }
                  if (response.ok) {
                    metadata = await response.json();
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
                metadataCache.current.set(tokenId, metadata);
              }

              // Try to find auction data for this NFT
              let auctionData = null;

              // Check cache first
              const cachedAuctionData = auctionDataCache.get(tokenId);
              const cacheTimestamp = auctionCacheTimestamps.get(tokenId);
              const isAuctionCacheValid =
                cacheTimestamp &&
                Date.now() - cacheTimestamp < AUCTION_CACHE_TTL;

              if (cachedAuctionData && isAuctionCacheValid) {
                auctionData = cachedAuctionData;
                console.log(
                  `📦 Using cached auction data for #${tokenId}:`,
                  auctionData
                );
              } else {
                try {
                  // Use pre-fetched settled events
                  const relevantSettledEvents = allSettledEvents.filter(
                    (event) => {
                      if ("args" in event && event.args) {
                        return Number(event.args.tokenId) === tokenId;
                      }
                      return false;
                    }
                  );

                  if (relevantSettledEvents.length > 0) {
                    const settledEvent =
                      relevantSettledEvents[relevantSettledEvents.length - 1];
                    if ("args" in settledEvent && settledEvent.args) {
                      auctionData = {
                        auctionId: settledEvent.args.auctionId.toString(),
                        finalBid: parseFloat(
                          ethers.formatEther(settledEvent.args.finalPrice)
                        ),
                        bidders: 1,
                      };
                      console.log(
                        `🏆 Found auction data for #${tokenId}:`,
                        auctionData
                      );
                    }
                  } else {
                    // Use pre-fetched bid events
                    console.log(
                      `🔍 No AuctionSettled found for #${tokenId}, searching BidPlaced events...`
                    );

                    // Find the highest bid for this tokenId from pre-fetched events
                    let highestBid = 0;
                    let auctionId = null;
                    let bidderCount = 0;
                    const bidders = new Set<string>();

                    for (const bidEvent of allBidPlacedEvents) {
                      if ("args" in bidEvent && bidEvent.args) {
                        const eventTokenId = Number(bidEvent.args.tokenId);
                        if (eventTokenId === tokenId) {
                          const bidAmount = parseFloat(
                            ethers.formatEther(bidEvent.args.amount)
                          );
                          if (bidAmount > highestBid) {
                            highestBid = bidAmount;
                            auctionId = bidEvent.args.auctionId.toString();
                          }
                          bidders.add(bidEvent.args.bidder);
                          bidderCount = bidders.size;
                        }
                      }
                    }

                    if (highestBid > 0) {
                      auctionData = {
                        auctionId: auctionId || "unknown",
                        finalBid: highestBid,
                        bidders: bidderCount,
                      };
                      console.log(
                        `🏆 Found bid data for #${tokenId}:`,
                        auctionData
                      );
                    }
                  }

                  // Cache the auction data
                  if (auctionData) {
                    auctionDataCache.set(tokenId, auctionData);
                    auctionCacheTimestamps.set(tokenId, Date.now());
                  }
                } catch (auctionError) {
                  console.warn(
                    `⚠️ Error fetching auction data for #${tokenId}:`,
                    auctionError
                  );
                }
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
                  // Prioritize auction final bid over transaction value
                  if (auctionData?.finalBid) {
                    price = auctionData.finalBid;
                    console.log(
                      `💰 Using auction final bid for #${tokenId}: ${price} ETH`
                    );
                  } else {
                    price = parseFloat(ethers.formatEther(tx.value || 0));
                    console.log(
                      `💰 Using transaction value for #${tokenId}: ${price} ETH`
                    );
                  }
                }
              } catch (txError) {
                console.warn(
                  `⚠️ Error fetching transaction details for ${transactionHash}:`,
                  txError
                );
                // Fallback to auction data if available
                if (auctionData?.finalBid) {
                  price = auctionData.finalBid;
                  console.log(
                    `💰 Using auction fallback price for #${tokenId}: ${price} ETH`
                  );
                }
              }

              // Normalize rarity
              const rawRarity =
                metadata.attributes?.find(
                  (attr: any) => attr.trait_type === "Rarity"
                )?.value || "common";
              const normalizedRarity =
                typeof rawRarity === "string"
                  ? rawRarity.toLowerCase()
                  : "common";

              const userNFT: UserNFT = {
                id: `nft-${tokenId}`,
                tokenId: tokenId.toString(),
                name: metadata.name || `NFT #${tokenId}`,
                description:
                  metadata.description ||
                  `A unique NFT with token ID ${tokenId}`,
                image: metadata.image || "/images/default-nft.svg",
                rarity: normalizedRarity as
                  | "common"
                  | "rare"
                  | "epic"
                  | "legendary",
                purchaseDate: new Date(purchaseDate),
                price,
                transactionHash,
                auctionWon: auctionData,
                isFromAuction: !!auctionData,
                status: auctionData ? auctionData.status || "4" : "3", // Use actual auction status if available
              };

              userNFTs.push(userNFT);
              processedTokenIds.add(tokenId);
              displayedCount++;

              // Show first batch immediately for better UX
              if (displayedCount === INITIAL_BATCH_SIZE) {
                console.log(
                  `🎯 First ${INITIAL_BATCH_SIZE} NFTs ready, displaying immediately`
                );
                setAllNFTs([...userNFTs]);
                const initialBatch = userNFTs.slice(0, INITIAL_BATCH_SIZE);
                setNfts(initialBatch);
                const initialHasMore = userNFTs.length > INITIAL_BATCH_SIZE;
                setHasMore(initialHasMore);
                setIsLoading(false);
                console.log(
                  `🎯 First batch shown, hasMore: ${initialHasMore} (${INITIAL_BATCH_SIZE}/${userNFTs.length})`
                );
              }

              console.log(`✅ Added NFT #${tokenId} to collection:`, userNFT);
            }
          } catch (nftError) {
            console.error(`❌ Error processing NFT from event:`, nftError);
          }
        }

        // Sort NFTs by purchase date (most recent first)
        userNFTs.sort(
          (a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime()
        );

        // Update allNFTs with the complete sorted list
        setAllNFTs(userNFTs);

        // Cache all NFTs
        userCollectionCache.set(address, userNFTs);
        cacheTimestamps.set(address, Date.now());

        // Only update display if we haven't already shown the first batch
        if (displayedCount < INITIAL_BATCH_SIZE) {
          // Display initial batch
          const initialBatch = userNFTs.slice(0, INITIAL_BATCH_SIZE);
          setNfts(initialBatch);
          setHasMore(userNFTs.length > INITIAL_BATCH_SIZE);
          setIsLoading(false);
        } else {
          // Update hasMore status based on current display
          const currentDisplayed = nfts.length;
          const newHasMore = currentDisplayed < userNFTs.length;
          setHasMore(newHasMore);
          console.log(
            `🔄 Updated hasMore: ${newHasMore} (displayed: ${currentDisplayed}/${userNFTs.length})`
          );
        }

        console.log(
          `🎉 Loaded ${userNFTs.length} NFTs total from ${
            transferEvents.length
          } Transfer events, ${
            displayedCount >= INITIAL_BATCH_SIZE
              ? "first batch already shown"
              : "showing initial batch"
          }`
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch user NFTs";
        setError(errorMessage);
        console.error("❌ Error fetching user collection:", err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [address, isConnected, isCacheValid]
  );

  const loadMore = useCallback(async () => {
    console.log(
      `🔄 loadMore called: isLoadingMore=${isLoadingMore}, hasMore=${hasMore}, nfts.length=${nfts.length}, allNFTs.length=${allNFTs.length}`
    );

    if (isLoadingMore || !hasMore) {
      console.log(
        `🛑 loadMore blocked: isLoadingMore=${isLoadingMore}, hasMore=${hasMore}`
      );
      return;
    }

    setIsLoadingMore(true);

    // Simulate loading delay like original
    setTimeout(() => {
      const currentDisplayed = nfts.length;
      const nextBatch = allNFTs.slice(
        currentDisplayed,
        currentDisplayed + SCROLL_BATCH_SIZE
      );

      if (nextBatch.length > 0) {
        setNfts((prev) => [...prev, ...nextBatch]);

        // Check if there are more NFTs to display
        const totalDisplayed = currentDisplayed + nextBatch.length;
        setHasMore(totalDisplayed < allNFTs.length);

        console.log(
          `📄 Loaded ${nextBatch.length} more NFTs (total displayed: ${totalDisplayed}/${allNFTs.length})`,
          `hasMore: ${totalDisplayed < allNFTs.length}`
        );
      } else {
        setHasMore(false);
      }

      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, hasMore, nfts.length, allNFTs]);

  const refresh = useCallback(async () => {
    // Clear cache and reload
    userCollectionCache.delete(address || "");
    cacheTimestamps.delete(address || "");
    metadataCache.current.clear();
    auctionDataCache.clear();
    auctionCacheTimestamps.clear();
    setHasMore(true);
    setAllNFTs([]);
    await fetchUserNFTs(false);
  }, [address, fetchUserNFTs]);

  useEffect(() => {
    if (address && isConnected) {
      fetchUserNFTs(false);
    }
  }, [address, isConnected, fetchUserNFTs]);

  // Listen for NFT claim events to refresh collection
  useEffect(() => {
    const handleNFTClaimed = () => {
      console.log(
        "🔄 NFT claimed event received, refreshing optimized collection..."
      );
      refresh();
    };

    window.addEventListener("nftClaimed", handleNFTClaimed);
    return () => window.removeEventListener("nftClaimed", handleNFTClaimed);
  }, [refresh]);

  // Calculate stats based on all NFTs (like original)
  const totalItems = allNFTs.length;
  const totalValue = allNFTs.reduce((sum, nft) => sum + nft.price, 0);
  const cacheStats = {
    total: allNFTs.length,
    cached: allNFTs.length,
    lastUpdated: Date.now(),
  };

  return {
    displayedNFTs: nfts,
    allNFTs: allNFTs, // All NFTs found
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    totalItems,
    totalValue,
    cacheStats,
    loadMore,
    refresh,
    refetch: refresh,
    userNFTsLoading: isLoading,
    userNFTsError: error,
  };
}
