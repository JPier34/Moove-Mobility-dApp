"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import { useAuctionsEnhanced } from "./enhanced-auction-utils";

interface WonAuction {
  auctionId: string;
  tokenId: string;
  nftName: string;
  nftImage: string;
  nftCategory: string;
  nftRarity: string;
  finalBid: number;
  bidders: number;
  endTime: number;
  isClaimed: boolean;
  transactionHash?: string;
}

interface UserCollection {
  wonAuctions: WonAuction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUserCollection(): UserCollection {
  const { address, isConnected } = useAccount();
  const { auctions, isLoading: auctionsLoading } = useAuctionsEnhanced();
  const [wonAuctions, setWonAuctions] = useState<WonAuction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWonAuctions = useCallback(async () => {
    if (!address || !isConnected) {
      setWonAuctions([]);
      setIsLoading(false);
      return;
    }

    try {
      console.log("🏆 Fetching won auctions for user:", address);
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

      // Get all ended auctions where user is the winner
      const endedAuctions = auctions.filter((auction) => auction.status === 2); // ENDED
      console.log(`🔍 Found ${endedAuctions.length} ended auctions`);

      const userWonAuctions: WonAuction[] = [];

      for (const auction of endedAuctions) {
        try {
          // Check if user is the winner using highestBidder from auction data
          const winner = auction.highestBidder;
          console.log(`🏆 Auction ${auction.auctionId} winner:`, winner);

          if (winner && winner.toLowerCase() === address.toLowerCase()) {
            console.log(`✅ User won auction ${auction.auctionId}`);

            // For now, assume not claimed (we can add claim checking later)
            const isClaimed = false;
            console.log(`📦 Auction ${auction.auctionId} claimed:`, isClaimed);

            const wonAuction: WonAuction = {
              auctionId: auction.auctionId,
              tokenId: auction.nftId,
              nftName: auction.nftName || `NFT #${auction.nftId}`,
              nftImage: auction.nftImage || "/images/default-nft.png",
              nftCategory: auction.nftCategory || "sticker",
              nftRarity: auction.attributes?.rarity || "common",
              finalBid: parseFloat(auction.currentBid),
              bidders: auction.bidCount || 0,
              endTime: new Date(auction.endTime).getTime(),
              isClaimed: isClaimed,
            };

            console.log(`🏆 [Auction ${auction.auctionId}] Rarity:`, {
              raw: auction.attributes?.rarity,
              processed: wonAuction.nftRarity,
              attributes: auction.attributes
            });

            userWonAuctions.push(wonAuction);
          }
        } catch (auctionError) {
          console.error(
            `❌ Error checking auction ${auction.auctionId}:`,
            auctionError
          );
        }
      }

      console.log(
        `🏆 User won ${userWonAuctions.length} auctions:`,
        userWonAuctions
      );
      setWonAuctions(userWonAuctions);
    } catch (err) {
      console.error("❌ Error fetching won auctions:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected, auctions]);

  useEffect(() => {
    if (!auctionsLoading && auctions.length > 0) {
      fetchWonAuctions();
    }
  }, [auctions, auctionsLoading, fetchWonAuctions]);

  return {
    wonAuctions,
    isLoading: isLoading || auctionsLoading,
    error,
    refetch: fetchWonAuctions,
  };
}

// Hook to claim a won auction
export function useClaimAuction() {
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const claimAuction = useCallback(async (auctionId: string) => {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("No ethereum provider available");
    }

    try {
      setIsClaiming(true);
      setError(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        signer
      );

      console.log(`📦 Claiming auction ${auctionId}...`);
      const tx = await auctionContract.claimAuction(auctionId);
      console.log(`📦 Claim transaction sent:`, tx.hash);

      const receipt = await tx.wait();
      console.log(`✅ Auction ${auctionId} claimed successfully:`, receipt);

      return {
        success: true,
        transactionHash: tx.hash,
        receipt,
      };
    } catch (err) {
      console.error(`❌ Error claiming auction ${auctionId}:`, err);
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    } finally {
      setIsClaiming(false);
    }
  }, []);

  return {
    claimAuction,
    isClaiming,
    error,
  };
}
