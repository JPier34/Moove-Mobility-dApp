"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";

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
  extensionThreshold?: string;
  extensionDuration?: string;
  revealEndTime?: string;
  revealPhaseStarted?: boolean;
  minBidders?: number;
  totalBidders?: number;
  allowPartialFulfillment?: boolean;
}

interface UseIncrementalAuctionsReturn {
  auctions: AuctionData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  lastFetchedCount: number;
}

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
          // First load or forced refresh - fetch all
          console.log("🔄 Fetching all auctions");
          for (let i = 0; i < totalCount; i++) {
            try {
              const rawAuctionData = await auctionContract.getAuction(i);
              const auctionData = parseAuctionData(rawAuctionData);

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
          tokenId: auctionData.tokenId,
          status: auctionData.status,
          isSettled: auctionData.isSettled,
          totalBidders: auctionData.totalBidders,
        });

        // Check if auction is expired but still ACTIVE - needs to be ended
        const currentTime = Math.floor(Date.now() / 1000);
        const endTime = Number(auctionData.endTime);
        const isExpired = currentTime >= endTime;
        const isActive = Number(auctionData.status) === 1; // ACTIVE
        
        if (isExpired && isActive) {
          console.log(`⚠️ Auction ${i} is expired but still ACTIVE. Should call endAuction.`, {
            auctionId: i,
            currentTime,
            endTime,
            status: auctionData.status,
            timeExpired: isExpired,
            isActive,
          });
        }

              const auction: AuctionData = {
                auctionId: i.toString(),
                nftId: auctionData.tokenId?.toString() || "0",
                nftName: `NFT #${auctionData.tokenId || i}`,
                nftImage: "/images/default-nft.svg",
                nftCategory: "sticker",
                status: Number(auctionData.status || 0),
                startPrice: auctionData.startingPrice
                  ? ethers.formatEther(auctionData.startingPrice)
                  : "0",
                currentBid: auctionData.highestBid
                  ? ethers.formatEther(auctionData.highestBid)
                  : "0",
                highestBidder:
                  auctionData.highestBidder ||
                  "0x0000000000000000000000000000000000000000",
                seller:
                  auctionData.seller ||
                  "0x0000000000000000000000000000000000000000",
                endTime: auctionData.endTime
                  ? (() => {
                      const endTimeUnix = Number(auctionData.endTime);
                      // Enhanced validation for endTime
                      const now = Math.floor(Date.now() / 1000);
                      const maxReasonableTime = now + 365 * 24 * 60 * 60; // 1 year from now

                      if (endTimeUnix > 0 && endTimeUnix < maxReasonableTime) {
                        return new Date(endTimeUnix * 1000).toISOString();
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
                  const totalBidders = Number(auctionData.totalBidders || 0);
                  // Only use totalBidders if it's a reasonable number (< 100)
                  // Otherwise, it might be corrupted data
                  return totalBidders < 100 ? totalBidders : 0;
                })(),
                auctionType: Number(auctionData.auctionType || 0),
                isSettled: auctionData.isSettled || false,
                startTime: auctionData.startTime
                  ? (() => {
                      const startTimeUnix = Number(auctionData.startTime);
                      // Enhanced validation for startTime
                      const now = Math.floor(Date.now() / 1000);
                      const maxReasonableTime = now + 365 * 24 * 60 * 60; // 1 year from now

                      if (
                        startTimeUnix > 0 &&
                        startTimeUnix < maxReasonableTime
                      ) {
                        return new Date(startTimeUnix * 1000).toISOString();
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
                extensionThreshold: auctionData.extensionThreshold
                  ? ethers.formatEther(auctionData.extensionThreshold)
                  : undefined,
                extensionDuration: auctionData.extensionDuration
                  ? auctionData.extensionDuration.toString()
                  : undefined,
                revealEndTime: auctionData.revealEndTime
                  ? new Date(
                      Number(auctionData.revealEndTime) * 1000
                    ).toISOString()
                  : undefined,
                revealPhaseStarted: auctionData.revealPhaseStarted || false,
                minBidders: Number(auctionData.minBidders || 0),
                totalBidders: Number(auctionData.totalBidders || 0),
                allowPartialFulfillment:
                  auctionData.allowPartialFulfillment || false,
              };
              auctionsToFetch.push(auction);
            } catch (err) {
              console.warn(`⚠️ Failed to fetch auction ${i}:`, err);
            }
          }
        } else {
          // Incremental fetch - only get new auctions
          console.log(
            `🔄 Fetching new auctions from ${lastFetchedCount} to ${totalCount}`
          );
          for (let i = lastFetchedCount; i < totalCount; i++) {
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

              const auction: AuctionData = {
                auctionId: i.toString(),
                nftId: auctionData.tokenId?.toString() || "0",
                nftName: `NFT #${auctionData.tokenId || i}`,
                nftImage: "/images/default-nft.svg",
                nftCategory: "sticker",
                status: Number(auctionData.status || 0),
                startPrice: auctionData.startingPrice
                  ? ethers.formatEther(auctionData.startingPrice)
                  : "0",
                currentBid: auctionData.highestBid
                  ? ethers.formatEther(auctionData.highestBid)
                  : "0",
                highestBidder:
                  auctionData.highestBidder ||
                  "0x0000000000000000000000000000000000000000",
                seller:
                  auctionData.seller ||
                  "0x0000000000000000000000000000000000000000",
                endTime: auctionData.endTime
                  ? (() => {
                      const endTimeUnix = Number(auctionData.endTime);
                      // Enhanced validation for endTime
                      const now = Math.floor(Date.now() / 1000);
                      const maxReasonableTime = now + 365 * 24 * 60 * 60; // 1 year from now

                      if (endTimeUnix > 0 && endTimeUnix < maxReasonableTime) {
                        return new Date(endTimeUnix * 1000).toISOString();
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
                  const totalBidders = Number(auctionData.totalBidders || 0);
                  // Only use totalBidders if it's a reasonable number (< 100)
                  // Otherwise, it might be corrupted data
                  return totalBidders < 100 ? totalBidders : 0;
                })(),
                auctionType: Number(auctionData.auctionType || 0),
                isSettled: auctionData.isSettled || false,
                startTime: auctionData.startTime
                  ? (() => {
                      const startTimeUnix = Number(auctionData.startTime);
                      // Enhanced validation for startTime
                      const now = Math.floor(Date.now() / 1000);
                      const maxReasonableTime = now + 365 * 24 * 60 * 60; // 1 year from now

                      if (
                        startTimeUnix > 0 &&
                        startTimeUnix < maxReasonableTime
                      ) {
                        return new Date(startTimeUnix * 1000).toISOString();
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
                extensionThreshold: auctionData.extensionThreshold
                  ? ethers.formatEther(auctionData.extensionThreshold)
                  : undefined,
                extensionDuration: auctionData.extensionDuration
                  ? auctionData.extensionDuration.toString()
                  : undefined,
                revealEndTime: auctionData.revealEndTime
                  ? new Date(
                      Number(auctionData.revealEndTime) * 1000
                    ).toISOString()
                  : undefined,
                revealPhaseStarted: auctionData.revealPhaseStarted || false,
                minBidders: Number(auctionData.minBidders || 0),
                totalBidders: Number(auctionData.totalBidders || 0),
                allowPartialFulfillment:
                  auctionData.allowPartialFulfillment || false,
              };
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
    auctions,
    isLoading,
    error,
    refetch,
    lastFetchedCount,
  };
}
