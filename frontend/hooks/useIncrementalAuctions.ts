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
}

interface UseIncrementalAuctionsReturn {
  auctions: AuctionData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  lastFetchedCount: number;
}

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
              const auctionData = await auctionContract.getAuction(i);

              // Check if auction data is valid
              if (!auctionData || auctionData.tokenId === undefined) {
                console.warn(`⚠️ Auction ${i} has invalid data, skipping`);
                continue;
              }

              const auction: AuctionData = {
                auctionId: i.toString(),
                nftId: auctionData.tokenId?.toString() || "0",
                nftName:
                  auctionData.nftName || `NFT #${auctionData.tokenId || i}`,
                nftImage: auctionData.nftImage || "/images/default-nft.svg",
                nftCategory: auctionData.nftCategory || "sticker",
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
                      // Validate endTime - if it's corrupted (year 2033+), use current time
                      if (endTimeUnix > 0 && endTimeUnix < 2000000000) {
                        return new Date(endTimeUnix * 1000).toISOString();
                      } else {
                        console.warn(
                          `⚠️ Auction ${i} has corrupted endTime: ${endTimeUnix}, using current time`
                        );
                        return new Date().toISOString();
                      }
                    })()
                  : new Date().toISOString(),
                bidCount: Number(auctionData.totalBidders || 0),
                auctionType: Number(auctionData.auctionType || 0),
                isSettled: auctionData.isSettled || false,
                startTime: auctionData.startTime
                  ? (() => {
                      const startTimeUnix = Number(auctionData.startTime);
                      // Validate startTime - if it's corrupted (year 2033+), use current time
                      if (startTimeUnix > 0 && startTimeUnix < 2000000000) {
                        return new Date(startTimeUnix * 1000).toISOString();
                      } else {
                        console.warn(
                          `⚠️ Auction ${i} has corrupted startTime: ${startTimeUnix}, using current time`
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
              const auctionData = await auctionContract.getAuction(i);

              // Check if auction data is valid
              if (!auctionData || auctionData.tokenId === undefined) {
                console.warn(`⚠️ Auction ${i} has invalid data, skipping`);
                continue;
              }

              const auction: AuctionData = {
                auctionId: i.toString(),
                nftId: auctionData.tokenId?.toString() || "0",
                nftName:
                  auctionData.nftName || `NFT #${auctionData.tokenId || i}`,
                nftImage: auctionData.nftImage || "/images/default-nft.svg",
                nftCategory: auctionData.nftCategory || "sticker",
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
                      // Validate endTime - if it's corrupted (year 2033+), use current time
                      if (endTimeUnix > 0 && endTimeUnix < 2000000000) {
                        return new Date(endTimeUnix * 1000).toISOString();
                      } else {
                        console.warn(
                          `⚠️ Auction ${i} has corrupted endTime: ${endTimeUnix}, using current time`
                        );
                        return new Date().toISOString();
                      }
                    })()
                  : new Date().toISOString(),
                bidCount: Number(auctionData.totalBidders || 0),
                auctionType: Number(auctionData.auctionType || 0),
                isSettled: auctionData.isSettled || false,
                startTime: auctionData.startTime
                  ? (() => {
                      const startTimeUnix = Number(auctionData.startTime);
                      // Validate startTime - if it's corrupted (year 2033+), use current time
                      if (startTimeUnix > 0 && startTimeUnix < 2000000000) {
                        return new Date(startTimeUnix * 1000).toISOString();
                      } else {
                        console.warn(
                          `⚠️ Auction ${i} has corrupted startTime: ${startTimeUnix}, using current time`
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
