"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount, useWatchContractEvent } from "wagmi";
import { useAuctionsEnhanced } from "./enhanced-auction-utils";
import { contracts } from "../utils/contracts";
import { useReadMooveNFT } from "./useContract";

export interface WonAuction {
  auctionId: string;
  nftId: string;
  name: string;
  description?: string;
  image: string;
  category: string;
  rarity?: string;
  collection?: { name: string; description: string };
  attributes?: any[];
  finalBid: number;
  endTime?: number;
  status: number;
  transactionHash?: string;
  bidders: number;
  // Dati aggiuntivi per il modal
  auctionType?: number;
  currentBid?: number;
  startingPrice?: number;
  highestBidder?: string;
  seller?: string;
  // Proprietà aggiuntive per compatibilità
  hasImage: boolean;
  hasName: boolean;
  isSettled: boolean;
}

export interface UseWonAuctionsReturn {
  unsettledAuctions: WonAuction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useWonAuctionsForClaim(): UseWonAuctionsReturn {
  const { address } = useAccount();
  const [wonAuctions, setWonAuctions] = useState<WonAuction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const {
    auctions,
    isLoading: auctionsLoading,
    error: auctionsError,
  } = useAuctionsEnhanced();

  // Function to load the won auctions that need to be claimed
  const loadWonAuctions = useCallback(async () => {
    if (!address) {
      setWonAuctions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`🔍 Loading won auctions for claim for user: ${address}`);

      // Filter the auctions where the user has won (active and finished)
      const userWonAuctions = auctions.filter((auction) => {
        const isUserWinner =
          auction.highestBidder &&
          auction.highestBidder.toLowerCase() === address.toLowerCase();

        // Consider the auction "ended" if status === 3 (ENDED) OR status === 4 (SETTLED) OR if status === 1 but time expired
        const isEnded = auction.status === 3;
        const isSettled = auction.status === 4;
        const isTimeExpired =
          auction.status === 1 &&
          auction.endTime &&
          new Date(auction.endTime).getTime() <= Date.now();
        const isAuctionEnded = isEnded || isSettled || isTimeExpired;

        return isUserWinner && isAuctionEnded;
      });

      console.log(`🔍 Found ${userWonAuctions.length} won auctions for user`);

      // convert auctions to WonAuction format
      const wonAuctionsData = await Promise.all(
        userWonAuctions.map(async (auction) => {
          try {
            // Get NFT metadata
            let metadata = {
              name: `NFT #${auction.nftId}`,
              description: "NFT metadata not available",
              image: "/images/default-nft.svg",
              attributes: [],
            };

            if (auction.nftId) {
              try {
                // Use the hook to get the metadata
                const { data: tokenURI } = useReadMooveNFT("tokenURI", [
                  BigInt(auction.nftId),
                ]);

                if (tokenURI) {
                  const response = await fetch(tokenURI as string);
                  if (response.ok) {
                    metadata = await response.json();
                  }
                }
              } catch (error) {
                console.warn(
                  `⚠️ Could not fetch metadata for token ${auction.nftId}:`,
                  error
                );
              }
            }

            return {
              auctionId: auction.auctionId,
              nftId: auction.nftId,
              name: metadata.name || `NFT #${auction.nftId}`,
              description: metadata.description || "No description available",
              image: metadata.image || "/images/default-nft.svg",
              category: (metadata as any).category || "Unknown",
              rarity: (metadata as any).rarity || "common",
              collection: {
                name: (metadata as any).collection || "Moove Collection",
                description: "NFT Collection",
              },
              attributes: metadata.attributes || [],
              finalBid: auction.currentBid
                ? Number(auction.currentBid) / 1e18
                : 0,
              endTime: auction.endTime ? auction.endTime.getTime() : 0,
              status: auction.status,
              bidders: auction.bidCount || 0,
              // Additional data for the modal
              auctionType: auction.auctionType,
              currentBid: auction.currentBid
                ? Number(auction.currentBid) / 1e18
                : undefined,
              startingPrice: auction.startPrice
                ? Number(auction.startPrice) / 1e18
                : undefined,
              highestBidder: auction.highestBidder || undefined,
              seller: auction.seller || undefined,
              // Additional properties for compatibility
              hasImage: !!(
                metadata.image && metadata.image !== "/images/default-nft.svg"
              ),
              hasName: !!(
                metadata.name && metadata.name !== `NFT #${auction.nftId}`
              ),
              isSettled: auction.status === 4,
            };
          } catch (error) {
            console.error(
              `❌ Error processing auction ${auction.auctionId}:`,
              error
            );
            return null;
          }
        })
      );

      // Filter out null results
      const validWonAuctions = wonAuctionsData.filter(
        (auction) => auction !== null
      ) as WonAuction[];

      // Filter only the auctions that need to be claimed (status === 3, ENDED)
      const unsettledAuctions = validWonAuctions.filter(
        (auction) => auction.status === 3 && !auction.transactionHash
      );

      console.log(
        `✅ Loaded ${unsettledAuctions.length} unsettled auctions for claim`
      );
      setWonAuctions(unsettledAuctions);
      setHasLoaded(true);
    } catch (err) {
      console.error("❌ Error loading won auctions for claim:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load won auctions"
      );
    } finally {
      setIsLoading(false);
    }
  }, [address, auctions]);

  // Load auctions when the address or auctions change
  useEffect(() => {
    if (address && !auctionsLoading && hasLoaded === false) {
      loadWonAuctions();
    }
  }, [address, auctionsLoading, loadWonAuctions, hasLoaded]);

  // Listen for settlement events to update the auctions
  useWatchContractEvent({
    address: contracts.MooveAuction.address as `0x${string}`,
    abi: contracts.MooveAuction.abi,
    eventName: "AuctionSettled",
    onLogs: (logs) => {
      console.log(
        "🔄 AuctionSettled event detected, refreshing won auctions..."
      );
      // Reload the auctions after a short delay
      setTimeout(() => {
        loadWonAuctions();
      }, 2000);
    },
  });

  // Function to manually reload
  const refetch = useCallback(() => {
    setHasLoaded(false);
    loadWonAuctions();
  }, [loadWonAuctions]);

  return {
    unsettledAuctions: wonAuctions,
    isLoading: isLoading || auctionsLoading,
    error: error || auctionsError,
    refetch,
  };
}
