"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import { Auction, AuctionType, AuctionStatus } from "../types/auction";

interface AuctionData {
  auctionId: string;
  nftId: string;
  nftName: string;
  nftImage: string;
  nftCategory: string;
  status: number;
  startPrice: string;
  currentBid: string;
  highestBidder: string;
  seller: string;
  endTime: string;
  bidCount: number;
  auctionType: number;
  isSettled: boolean;
  startTime: string;
  reservePrice?: string;
  bidIncrement?: string;
  extensionThreshold?: number; // seconds
  extensionDuration?: number; // uint32 from contract
  extensionThresholdMinutes?: number; // minutes
  extensionDurationMinutes?: number; // minutes
  revealEndTime?: string;
  revealPhaseStarted?: boolean;
  minBidders?: number;
  totalBidders?: number;
  allowPartialFulfillment?: boolean;
}

interface UseIncrementalAuctionsReturn {
  auctions: Auction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  lastFetchedCount: number;
}

// Funzione per convertire AuctionData in Auction
const convertAuctionDataToAuction = (data: AuctionData): Auction => {
  return {
    auctionId: data.auctionId,
    nftId: data.nftId,
    nftName: data.nftName,
    nftImage: data.nftImage,
    nftCategory: data.nftCategory,
    seller: data.seller,
    auctionType: data.auctionType as AuctionType,
    status: data.status as AuctionStatus,
    startPrice: data.startPrice,
    reservePrice: data.reservePrice || "0",
    buyNowPrice: null, // Non disponibile in AuctionData
    currentBid: data.currentBid,
    highestBidder: data.highestBidder || null,
    bidCount: data.bidCount,
    startTime: new Date(data.startTime),
    endTime: new Date(data.endTime),
    bidIncrement: data.bidIncrement || "0.00001",
    currency: "ETH",
    isSettled: data.isSettled,
    transactionHash: undefined,
    extensionThresholdMinutes: data.extensionThresholdMinutes,
    extensionDurationMinutes: data.extensionDurationMinutes,
    attributes: {
      rarity: undefined,
      designer: undefined,
      collection: undefined,
      achievement: undefined,
      requirement: undefined,
      holders: undefined,
      effects: undefined,
      compatibility: undefined,
      special: undefined,
      traits: undefined,
      supply: undefined,
      mystery: undefined,
      unlocks: undefined,
      community: undefined,
      edition: undefined,
      range: undefined,
      speed: undefined,
      battery: undefined,
      condition: undefined,
    },
  };
};

// Helper function to parse auction data from contract response
const parseAuctionData = (rawData: any) => {
  // First, let's check if the data is already an object with named fields
  if (rawData && typeof rawData === "object" && !Array.isArray(rawData)) {
    // If it's an object, use the named fields directly
    console.log("📋 Using named fields from contract object");
    return {
      auctionId: rawData.auctionId,
      nftContract: rawData.nftContract,
      tokenId: rawData.tokenId,
      seller: rawData.seller,
      auctionType: rawData.auctionType,
      status: rawData.status,
      allowPartialFulfillment: rawData.allowPartialFulfillment,
      isSettled: rawData.isSettled,
      revealPhaseStarted: rawData.revealPhaseStarted,
      startingPrice: rawData.startingPrice,
      reservePrice: rawData.reservePrice,
      buyNowPrice: rawData.buyNowPrice,
      currentPrice: rawData.currentPrice,
      bidIncrement: rawData.bidIncrement,
      highestBid: rawData.highestBid,
      startTime: rawData.startTime,
      endTime: rawData.endTime,
      extensionThreshold: rawData.extensionThreshold,
      extensionDuration: rawData.extensionDuration,
      revealEndTime: rawData.revealEndTime,
      highestBidder: rawData.highestBidder,
      minBidders: rawData.minBidders,
      totalBidders: rawData.totalBidders,
    };
  }

  // Fallback to array access if it's a tuple
  // Based on the latest contract ABI, there are 23 fields (0-22)
  console.log("📋 Using array index access for contract tuple");
  return {
    auctionId: rawData[0],
    nftContract: rawData[1],
    tokenId: rawData[2],
    seller: rawData[3],
    auctionType: rawData[4],
    status: rawData[5],
    allowPartialFulfillment: rawData[6],
    isSettled: rawData[7],
    revealPhaseStarted: rawData[8],
    startingPrice: rawData[9],
    reservePrice: rawData[10],
    buyNowPrice: rawData[11],
    currentPrice: rawData[12],
    bidIncrement: rawData[13],
    highestBid: rawData[14],
    startTime: rawData[15],
    endTime: rawData[16],
    extensionThreshold: rawData[17],
    extensionDuration: rawData[18],
    revealEndTime: rawData[19],
    highestBidder: rawData[20],
    minBidders: rawData[21],
    totalBidders: rawData[22],
  };
};

export function useIncrementalAuctions(): UseIncrementalAuctionsReturn {
  const { address, isConnected } = useAccount();
  const [auctions, setAuctions] = useState<AuctionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedCount, setLastFetchedCount] = useState(0);

  // Track last fetch time to avoid unnecessary calls
  const lastFetchTime = useRef<number>(0);
  const fetchInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchAuctions = useCallback(
    async (forceRefresh = false) => {
      if (!isConnected || !address) {
        setAuctions([]);
        setIsLoading(false);
        return;
      }

      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime.current;

      // Only fetch if forced or if it's been more than 30 seconds since last fetch
      if (!forceRefresh && timeSinceLastFetch < 30000) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        if (typeof window === "undefined" || !window.ethereum) {
          throw new Error("No ethereum provider available");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const { contracts } = await import("@/utils/contracts");
        const auctionContract = new ethers.Contract(
          contracts.MooveAuction.address,
          contracts.MooveAuction.abi,
          provider
        );

        // Get total auction count from auction contract
        const totalAuctions = await auctionContract.totalAuctions();
        const totalCount = Number(totalAuctions);

        console.log(
          `📊 Total auctions: ${totalCount}, Last fetched: ${lastFetchedCount}`
        );

        // If count hasn't changed and not forced, skip fetch
        if (
          !forceRefresh &&
          totalCount === lastFetchedCount &&
          auctions.length > 0
        ) {
          console.log("⏭️ Skipping fetch - no new auctions");
          setIsLoading(false);
          return;
        }

        // Fetch only new auctions if we have existing data
        let auctionsToFetch: AuctionData[] = [];

        if (auctions.length === 0 || forceRefresh) {
          // First load or forced refresh - fetch all valid auctions (starting from ID 24)
          console.log("🔄 Fetching all valid auctions (starting from ID 24)");
          for (let i = 24; i < totalCount; i++) {
            try {
              const rawAuctionData = await auctionContract.getAuction(i);
              const auctionData = parseAuctionData(rawAuctionData);
              
              // Log extension data for debugging
              console.log(`🔍 [Auction ${i}] Extension data:`, {
                extensionThreshold: auctionData.extensionThreshold,
                extensionDuration: auctionData.extensionDuration,
                extensionThresholdMinutes: auctionData.extensionThreshold 
                  ? Math.floor(Number(auctionData.extensionThreshold) / 60) 
                  : 5,
                extensionDurationMinutes: auctionData.extensionDuration 
                  ? Math.floor(Number(auctionData.extensionDuration) / 60) 
                  : 10,
              });

              // Check if auction data is valid
              if (!auctionData || auctionData.tokenId === undefined) {
                console.warn(`⚠️ Auction ${i} has invalid data, skipping`);
                continue;
              }

              console.log(`🔍 Auction ${i} RAW data:`, rawAuctionData);
              console.log(`🔍 Auction ${i} parsed data:`, {
                startTime: auctionData.startTime,
                endTime: auctionData.endTime,
                startingPrice: auctionData.startingPrice,
                currentPrice: auctionData.currentPrice,
                highestBid: auctionData.highestBid,
                tokenId: auctionData.tokenId,
                status: auctionData.status,
                isSettled: auctionData.isSettled,
                totalBidders: auctionData.totalBidders,
              });

              // Check if auction is expired but still ACTIVE - needs to be ended
              const currentTime = Math.floor(Date.now() / 1000);
              const endTime = auctionData.endTime; // Already uint32
              const isExpired = currentTime >= endTime;
              const isActive = auctionData.status === 1; // ACTIVE (Already uint8)

              if (isExpired && isActive) {
                console.log(
                  `⚠️ Auction ${i} is expired but still ACTIVE. Should call endAuction.`,
                  {
                    auctionId: i,
                    currentTime,
                    endTime,
                    status: auctionData.status,
                    timeExpired: isExpired,
                    isActive,
                  }
                );
              }

              // Fetch NFT metadata
              let nftMetadata = {
                name: `NFT #${auctionData.tokenId || i}`,
                image: "/images/default-nft.svg",
                category: "sticker",
              };

              console.log(
                `🔍 [Auction ${i}] Starting metadata fetch for NFT ${auctionData.tokenId}`
              );

              try {
                if (auctionData.tokenId) {
                  console.log(
                    `🔍 [Auction ${i}] Creating NFT contract for token ${auctionData.tokenId}`
                  );
                  console.log(
                    `🔍 [Auction ${i}] NFT contract address:`,
                    contracts.MooveNFT.address
                  );

                  const nftContract = new ethers.Contract(
                    contracts.MooveNFT.address,
                    contracts.MooveNFT.abi,
                    provider
                  );

                  console.log(
                    `🔍 [Auction ${i}] Calling tokenURI for NFT ${auctionData.tokenId}`
                  );
                  const tokenURI = await nftContract.tokenURI(
                    auctionData.tokenId
                  );
                  console.log(`🔍 [Auction ${i}] Raw tokenURI:`, tokenURI);

                  if (tokenURI) {
                    let cleanTokenURI = tokenURI.replace(/"/g, "");
                    // Convert ipfs:// to https://ipfs.io/ipfs/ for browser compatibility
                    if (cleanTokenURI.startsWith("ipfs://")) {
                      cleanTokenURI = cleanTokenURI.replace(
                        "ipfs://",
                        "https://ipfs.io/ipfs/"
                      );
                    }
                    console.log(
                      `🔍 [Auction ${i}] Clean tokenURI: ${cleanTokenURI}`
                    );

                    // Check if this is a mock hash before attempting fetch
                    if (
                      cleanTokenURI.includes("QmMockMetadataHashForTesting")
                    ) {
                      console.log(
                        `🎭 [Auction ${i}] Mock hash detected, using fallback metadata`
                      );
                      nftMetadata = {
                        name: `NFT #${auctionData.tokenId}`,
                        image: "/images/default-nft.svg",
                        category: "sticker",
                      };
                    } else {
                      console.log(
                        `🔍 [Auction ${i}] Fetching metadata from: ${cleanTokenURI}`
                      );

                      try {
                        const response = await fetch(cleanTokenURI);
                        console.log(
                          `🔍 [Auction ${i}] Fetch response status:`,
                          response.status,
                          response.statusText
                        );

                        if (response.ok) {
                          const metadata = await response.json();
                          console.log(
                            `🔍 [Auction ${i}] Raw metadata:`,
                            metadata
                          );

                          nftMetadata = {
                            name:
                              metadata.name || `NFT #${auctionData.tokenId}`,
                            image: metadata.image?.startsWith(
                              "QmMockMetadataHashForTesting"
                            )
                              ? "/images/default-nft.svg" // Fallback per mock hash
                              : metadata.image?.startsWith("Qm")
                              ? `https://ipfs.io/ipfs/${metadata.image}` // Hash IPFS reale
                              : metadata.image || "/images/default-nft.svg", // URL completo o fallback
                            category:
                              metadata.properties?.category ||
                              metadata.category ||
                              "sticker",
                          };
                          console.log(
                            `✅ [Auction ${i}] Final metadata for NFT ${auctionData.tokenId}:`,
                            nftMetadata
                          );
                        } else {
                          console.warn(
                            `⚠️ [Auction ${i}] Failed to fetch metadata for NFT ${auctionData.tokenId}: ${response.statusText}`
                          );
                        }
                      } catch (fetchError) {
                        console.warn(
                          `⚠️ [Auction ${i}] Error fetching metadata for NFT ${auctionData.tokenId}:`,
                          fetchError
                        );
                      }
                    }
                  } else {
                    console.warn(
                      `⚠️ [Auction ${i}] No tokenURI returned for NFT ${auctionData.tokenId}`
                    );
                  }
                } else {
                  console.warn(
                    `⚠️ [Auction ${i}] No tokenId available for metadata fetch`
                  );
                }
              } catch (metadataError) {
                console.error(
                  `❌ [Auction ${i}] Error fetching metadata for NFT ${auctionData.tokenId}:`,
                  metadataError
                );
              }

              const auction: AuctionData = {
                auctionId: i.toString(),
                nftId: auctionData.tokenId?.toString() || "0",
                nftName: nftMetadata.name,
                nftImage: nftMetadata.image,
                nftCategory: nftMetadata.category,
                status: auctionData.status || 0, // Already uint8
                startPrice: auctionData.startingPrice
                  ? ethers.formatEther(auctionData.startingPrice)
                  : "0",
                currentBid: (() => {
                  // For English auctions, if currentPrice is 0 but there's a highestBidder,
                  // use highestBid instead
                  const currentPrice = auctionData.currentPrice;
                  const highestBid = auctionData.highestBid;
                  const hasBidder =
                    auctionData.highestBidder &&
                    auctionData.highestBidder !==
                      "0x0000000000000000000000000000000000000000";

                  if (currentPrice && currentPrice > 0) {
                    return ethers.formatEther(currentPrice);
                  } else if (highestBid && highestBid > 0 && hasBidder) {
                    console.log(
                      `🔄 [Auction ${i}] Using highestBid as currentBid (currentPrice was 0):`,
                      {
                        currentPrice: currentPrice?.toString(),
                        highestBid: highestBid?.toString(),
                        highestBidder: auctionData.highestBidder,
                      }
                    );
                    return ethers.formatEther(highestBid);
                  } else {
                    return "0";
                  }
                })(),
                highestBidder:
                  auctionData.highestBidder ||
                  "0x0000000000000000000000000000000000000000",
                seller:
                  auctionData.seller ||
                  "0x0000000000000000000000000000000000000000",
                endTime: auctionData.endTime
                  ? (() => {
                      const endTimeUnix = auctionData.endTime; // Already uint32
                      // Enhanced validation for endTime
                      const now = Math.floor(Date.now() / 1000);
                      const maxReasonableTime = now + 365 * 24 * 60 * 60; // 1 year from now

                      if (endTimeUnix > 0 && endTimeUnix < maxReasonableTime) {
                        return new Date(
                          Number(endTimeUnix) * 1000
                        ).toISOString();
                      } else {
                        console.warn(
                          `⚠️ Auction ${i} has corrupted endTime: ${endTimeUnix} (now: ${now}), using current time + 5min`
                        );
                        // Use current time + 5 minutes as fallback (typical auction duration)
                        return new Date((now + 300) * 1000).toISOString();
                      }
                    })()
                  : new Date(Date.now() + 300000).toISOString(), // Default: now + 5min
                bidCount: (() => {
                  const totalBidders = auctionData.totalBidders || 0; // Already uint32
                  // Only use totalBidders if it's a reasonable number (< 100)
                  // Otherwise, it might be corrupted data
                  return totalBidders < 100 ? totalBidders : 0;
                })(),
                auctionType: auctionData.auctionType || 0, // Already uint8
                isSettled: auctionData.isSettled || false,
                startTime: auctionData.startTime
                  ? (() => {
                      const startTimeUnix = auctionData.startTime; // Already uint32
                      // Enhanced validation for startTime
                      const now = Math.floor(Date.now() / 1000);
                      const maxReasonableTime = now + 365 * 24 * 60 * 60; // 1 year from now

                      if (
                        startTimeUnix > 0 &&
                        startTimeUnix < maxReasonableTime
                      ) {
                        return new Date(
                          Number(startTimeUnix) * 1000
                        ).toISOString();
                      } else {
                        console.warn(
                          `⚠️ Auction ${i} has corrupted startTime: ${startTimeUnix} (now: ${now}), using current time`
                        );
                        return new Date().toISOString();
                      }
                    })()
                  : new Date().toISOString(),
                reservePrice: auctionData.reservePrice
                  ? ethers.formatEther(auctionData.reservePrice)
                  : undefined,
                bidIncrement: auctionData.bidIncrement
                  ? ethers.formatEther(auctionData.bidIncrement)
                  : undefined,
                extensionThreshold: auctionData.extensionThreshold, // Already uint32 from contract
                extensionDuration: auctionData.extensionDuration, // Already uint32 from contract
                extensionThresholdMinutes: auctionData.extensionThreshold
                  ? Math.floor(Number(auctionData.extensionThreshold) / 60)
                  : 5, // Convert seconds to minutes, default 5
                extensionDurationMinutes: auctionData.extensionDuration
                  ? Math.floor(Number(auctionData.extensionDuration) / 60)
                  : 10, // Convert seconds to minutes, default 10
                revealEndTime: auctionData.revealEndTime
                  ? new Date(
                      Number(auctionData.revealEndTime) * 1000 // Already uint32
                    ).toISOString()
                  : undefined,
                revealPhaseStarted: auctionData.revealPhaseStarted || false,
                minBidders: auctionData.minBidders || 0, // Already uint32
                totalBidders: auctionData.totalBidders || 0, // Already uint32
                allowPartialFulfillment:
                  auctionData.allowPartialFulfillment || false,
              };

              console.log(
                `🔍 [Auction ${i}] Final auction object (all auctions):`,
                {
                  auctionId: auction.auctionId,
                  nftId: auction.nftId,
                  nftName: auction.nftName,
                  nftImage: auction.nftImage,
                  nftCategory: auction.nftCategory,
                  status: auction.status,
                  startPrice: auction.startPrice,
                  currentBid: auction.currentBid,
                  highestBidder: auction.highestBidder,
                }
              );

              auctionsToFetch.push(auction);
            } catch (err) {
              console.warn(`⚠️ Failed to fetch auction ${i}:`, err);
            }
          }
        } else {
          // Incremental fetch - only fetch new auctions (starting from ID 24)
          const startIndex = Math.max(lastFetchedCount, 24);
          console.log(
            `🔄 Fetching new auctions from ${startIndex} to ${totalCount - 1}`
          );
          for (let i = startIndex; i < totalCount; i++) {
            try {
              const rawAuctionData = await auctionContract.getAuction(i);
              const auctionData = parseAuctionData(rawAuctionData);

              // Check if auction data is valid
              if (!auctionData || auctionData.tokenId === undefined) {
                console.warn(`⚠️ Auction ${i} has invalid data, skipping`);
                continue;
              }

              console.log(
                `🔍 Auction ${i} RAW data (incremental):`,
                rawAuctionData
              );
              console.log(`🔍 Auction ${i} parsed data (incremental):`, {
                startTime: auctionData.startTime,
                endTime: auctionData.endTime,
                startingPrice: auctionData.startingPrice,
                tokenId: auctionData.tokenId,
              });

              // Fetch NFT metadata
              let nftMetadata = {
                name: `NFT #${auctionData.tokenId || i}`,
                image: "/images/default-nft.svg",
                category: "sticker",
              };

              console.log(
                `🔍 [Auction ${i}] Starting metadata fetch for NFT ${auctionData.tokenId}`
              );

              try {
                if (auctionData.tokenId) {
                  console.log(
                    `🔍 [Auction ${i}] Creating NFT contract for token ${auctionData.tokenId}`
                  );
                  console.log(
                    `🔍 [Auction ${i}] NFT contract address:`,
                    contracts.MooveNFT.address
                  );

                  const nftContract = new ethers.Contract(
                    contracts.MooveNFT.address,
                    contracts.MooveNFT.abi,
                    provider
                  );

                  console.log(
                    `🔍 [Auction ${i}] Calling tokenURI for NFT ${auctionData.tokenId}`
                  );
                  const tokenURI = await nftContract.tokenURI(
                    auctionData.tokenId
                  );
                  console.log(`🔍 [Auction ${i}] Raw tokenURI:`, tokenURI);

                  if (tokenURI) {
                    let cleanTokenURI = tokenURI.replace(/"/g, "");
                    // Convert ipfs:// to https://ipfs.io/ipfs/ for browser compatibility
                    if (cleanTokenURI.startsWith("ipfs://")) {
                      cleanTokenURI = cleanTokenURI.replace(
                        "ipfs://",
                        "https://ipfs.io/ipfs/"
                      );
                    }
                    console.log(
                      `🔍 [Auction ${i}] Clean tokenURI: ${cleanTokenURI}`
                    );

                    // Check if this is a mock hash before attempting fetch
                    if (
                      cleanTokenURI.includes("QmMockMetadataHashForTesting")
                    ) {
                      console.log(
                        `🎭 [Auction ${i}] Mock hash detected, using fallback metadata`
                      );
                      nftMetadata = {
                        name: `NFT #${auctionData.tokenId}`,
                        image: "/images/default-nft.svg",
                        category: "sticker",
                      };
                    } else {
                      console.log(
                        `🔍 [Auction ${i}] Fetching metadata from: ${cleanTokenURI}`
                      );

                      try {
                        const response = await fetch(cleanTokenURI);
                        console.log(
                          `🔍 [Auction ${i}] Fetch response status:`,
                          response.status,
                          response.statusText
                        );

                        if (response.ok) {
                          const metadata = await response.json();
                          console.log(
                            `🔍 [Auction ${i}] Raw metadata:`,
                            metadata
                          );

                          nftMetadata = {
                            name:
                              metadata.name || `NFT #${auctionData.tokenId}`,
                            image: metadata.image?.startsWith(
                              "QmMockMetadataHashForTesting"
                            )
                              ? "/images/default-nft.svg" // Fallback per mock hash
                              : metadata.image?.startsWith("Qm")
                              ? `https://ipfs.io/ipfs/${metadata.image}` // Hash IPFS reale
                              : metadata.image || "/images/default-nft.svg", // URL completo o fallback
                            category:
                              metadata.properties?.category ||
                              metadata.category ||
                              "sticker",
                          };
                          console.log(
                            `✅ [Auction ${i}] Final metadata for NFT ${auctionData.tokenId}:`,
                            nftMetadata
                          );
                        } else {
                          console.warn(
                            `⚠️ [Auction ${i}] Failed to fetch metadata for NFT ${auctionData.tokenId}: ${response.statusText}`
                          );
                        }
                      } catch (fetchError) {
                        console.warn(
                          `⚠️ [Auction ${i}] Error fetching metadata for NFT ${auctionData.tokenId}:`,
                          fetchError
                        );
                      }
                    }
                  } else {
                    console.warn(
                      `⚠️ [Auction ${i}] No tokenURI returned for NFT ${auctionData.tokenId}`
                    );
                  }
                } else {
                  console.warn(
                    `⚠️ [Auction ${i}] No tokenId available for metadata fetch`
                  );
                }
              } catch (metadataError) {
                console.error(
                  `❌ [Auction ${i}] Error fetching metadata for NFT ${auctionData.tokenId}:`,
                  metadataError
                );
              }

              const auction: AuctionData = {
                auctionId: i.toString(),
                nftId: auctionData.tokenId?.toString() || "0",
                nftName: nftMetadata.name,
                nftImage: nftMetadata.image,
                nftCategory: nftMetadata.category,
                status: auctionData.status || 0, // Already uint8
                startPrice: auctionData.startingPrice
                  ? ethers.formatEther(auctionData.startingPrice)
                  : "0",
                currentBid: (() => {
                  // For English auctions, if currentPrice is 0 but there's a highestBidder,
                  // use highestBid instead
                  const currentPrice = auctionData.currentPrice;
                  const highestBid = auctionData.highestBid;
                  const hasBidder =
                    auctionData.highestBidder &&
                    auctionData.highestBidder !==
                      "0x0000000000000000000000000000000000000000";

                  if (currentPrice && currentPrice > 0) {
                    return ethers.formatEther(currentPrice);
                  } else if (highestBid && highestBid > 0 && hasBidder) {
                    console.log(
                      `🔄 [Auction ${i}] Using highestBid as currentBid (currentPrice was 0):`,
                      {
                        currentPrice: currentPrice?.toString(),
                        highestBid: highestBid?.toString(),
                        highestBidder: auctionData.highestBidder,
                      }
                    );
                    return ethers.formatEther(highestBid);
                  } else {
                    return "0";
                  }
                })(),
                highestBidder:
                  auctionData.highestBidder ||
                  "0x0000000000000000000000000000000000000000",
                seller:
                  auctionData.seller ||
                  "0x0000000000000000000000000000000000000000",
                endTime: auctionData.endTime
                  ? (() => {
                      const endTimeUnix = auctionData.endTime; // Already uint32
                      // Enhanced validation for endTime
                      const now = Math.floor(Date.now() / 1000);
                      const maxReasonableTime = now + 365 * 24 * 60 * 60; // 1 year from now

                      if (endTimeUnix > 0 && endTimeUnix < maxReasonableTime) {
                        return new Date(
                          Number(endTimeUnix) * 1000
                        ).toISOString();
                      } else {
                        console.warn(
                          `⚠️ Auction ${i} has corrupted endTime: ${endTimeUnix} (now: ${now}), using current time + 5min`
                        );
                        // Use current time + 5 minutes as fallback (typical auction duration)
                        return new Date((now + 300) * 1000).toISOString();
                      }
                    })()
                  : new Date(Date.now() + 300000).toISOString(), // Default: now + 5min
                bidCount: (() => {
                  const totalBidders = auctionData.totalBidders || 0; // Already uint32
                  // Only use totalBidders if it's a reasonable number (< 100)
                  // Otherwise, it might be corrupted data
                  return totalBidders < 100 ? totalBidders : 0;
                })(),
                auctionType: auctionData.auctionType || 0, // Already uint8
                isSettled: auctionData.isSettled || false,
                startTime: auctionData.startTime
                  ? (() => {
                      const startTimeUnix = auctionData.startTime; // Already uint32
                      // Enhanced validation for startTime
                      const now = Math.floor(Date.now() / 1000);
                      const maxReasonableTime = now + 365 * 24 * 60 * 60; // 1 year from now

                      if (
                        startTimeUnix > 0 &&
                        startTimeUnix < maxReasonableTime
                      ) {
                        return new Date(
                          Number(startTimeUnix) * 1000
                        ).toISOString();
                      } else {
                        console.warn(
                          `⚠️ Auction ${i} has corrupted startTime: ${startTimeUnix} (now: ${now}), using current time`
                        );
                        return new Date().toISOString();
                      }
                    })()
                  : new Date().toISOString(),
                reservePrice: auctionData.reservePrice
                  ? ethers.formatEther(auctionData.reservePrice)
                  : undefined,
                bidIncrement: auctionData.bidIncrement
                  ? ethers.formatEther(auctionData.bidIncrement)
                  : undefined,
                extensionThreshold: auctionData.extensionThreshold, // Already uint32 from contract
                extensionDuration: auctionData.extensionDuration, // Already uint32 from contract
                extensionThresholdMinutes: auctionData.extensionThreshold
                  ? Math.floor(Number(auctionData.extensionThreshold) / 60)
                  : 5, // Convert seconds to minutes, default 5
                extensionDurationMinutes: auctionData.extensionDuration
                  ? Math.floor(Number(auctionData.extensionDuration) / 60)
                  : 10, // Convert seconds to minutes, default 10
                revealEndTime: auctionData.revealEndTime
                  ? new Date(
                      Number(auctionData.revealEndTime) * 1000 // Already uint32
                    ).toISOString()
                  : undefined,
                revealPhaseStarted: auctionData.revealPhaseStarted || false,
                minBidders: auctionData.minBidders || 0, // Already uint32
                totalBidders: auctionData.totalBidders || 0, // Already uint32
                allowPartialFulfillment:
                  auctionData.allowPartialFulfillment || false,
              };

              console.log(`🔍 [Auction ${i}] Final auction object:`, {
                auctionId: auction.auctionId,
                nftId: auction.nftId,
                nftName: auction.nftName,
                nftImage: auction.nftImage,
                nftCategory: auction.nftCategory,
                status: auction.status,
              });

              auctionsToFetch.push(auction);
            } catch (err) {
              console.warn(`⚠️ Failed to fetch auction ${i}:`, err);
            }
          }
        }

        // Update auctions state
        if (auctionsToFetch.length > 0) {
          if (auctions.length === 0 || forceRefresh) {
            setAuctions(auctionsToFetch);
          } else {
            setAuctions((prev) => [...prev, ...auctionsToFetch]);
          }
          setLastFetchedCount(totalCount);
          lastFetchTime.current = now;
          console.log(
            `✅ Fetched ${auctionsToFetch.length} auctions (total: ${totalCount})`
          );
        }
      } catch (err) {
        console.error("❌ Error fetching auctions:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    },
    [address, isConnected, auctions.length, lastFetchedCount]
  );

  // Initial fetch
  useEffect(() => {
    fetchAuctions(true);
  }, [address, isConnected]);

  // Set up periodic check for new auctions (every 2 minutes)
  useEffect(() => {
    if (isConnected && address) {
      fetchInterval.current = setInterval(() => {
        fetchAuctions(false);
      }, 120000); // 2 minutes

      return () => {
        if (fetchInterval.current) {
          clearInterval(fetchInterval.current);
        }
      };
    }
  }, [isConnected, address, fetchAuctions]);

  const refetch = useCallback(() => {
    fetchAuctions(true);
  }, [fetchAuctions]);

  return {
    auctions: auctions.map(convertAuctionDataToAuction),
    isLoading,
    error,
    refetch,
    lastFetchedCount,
  };
}
