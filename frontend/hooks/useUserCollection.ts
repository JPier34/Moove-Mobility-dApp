"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useAuctionsEnhanced } from "./enhanced-auction-utils";
import { ethers } from "ethers";

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
      const { contracts } = await import("@/utils/contracts");
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      // Get all ended auctions where user is the winner
      const endedAuctions = auctions.filter((auction) => auction.status === 3); // ENDED (corrected to match contract)
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
              attributes: auction.attributes,
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

// Hook to settle a won auction using Wagmi
export function useSettleAuction() {
  const [isSettling, setIsSettling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [currentAuctionId, setCurrentAuctionId] = useState<string | null>(null);

  const {
    writeContract,
    data: hash,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: transactionHash as `0x${string}`,
    });

  // Handle transaction hash when it's available
  useEffect(() => {
    if (hash) {
      console.log(`🏆 Settle transaction sent:`, hash);
      setTransactionHash(hash);

      // Emit event for the provider
      const auctionId = (window as any).currentSettlingAuctionId;
      const event = new CustomEvent("settleAuctionEvent", {
        detail: { type: "transaction_sent", hash, auctionId },
      });
      window.dispatchEvent(event);
    }
  }, [hash]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      console.error(`❌ Error sending settle transaction:`, writeError);
      setError(writeError.message || "Failed to send transaction");
      setIsSettling(false);
    }
  }, [writeError]);

  const settleAuction = useCallback(
    async (auctionId: string) => {
      // Prevent multiple calls for the same auction
      if (isSettling || currentAuctionId === auctionId) {
        console.log(
          `⏭️ Skipping settle call for auction ${auctionId} - already processing`
        );
        return;
      }

      try {
        setIsSettling(true);
        setError(null);
        setTransactionHash(null);
        setCurrentAuctionId(auctionId);

        console.log(`🏆 Settling auction ${auctionId} using Wagmi...`);

        // Store auctionId for events
        (window as any).currentSettlingAuctionId = auctionId;

        // Write the contract (non-async)
        const { contracts } = await import("@/utils/contracts");
        writeContract({
          address: contracts.MooveAuction.address,
          abi: contracts.MooveAuction.abi,
          functionName: "settleAuction" as any,
          args: [BigInt(auctionId)],
        });
      } catch (err) {
        console.error(`❌ Error settling auction ${auctionId}:`, err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsSettling(false);
        setCurrentAuctionId(null);
        throw err;
      }
    },
    [writeContract, isSettling, currentAuctionId]
  );

  // Handle transaction confirmation
  useEffect(() => {
    if (transactionHash && isConfirmed) {
      console.log(`✅ Auction settled successfully! Hash:`, transactionHash);
      setIsSettling(false);

      // Emit event for the provider
      const auctionId = (window as any).currentSettlingAuctionId;
      const event = new CustomEvent("settleAuctionEvent", {
        detail: {
          type: "transaction_confirmed",
          hash: transactionHash,
          auctionId,
        },
      });
      window.dispatchEvent(event);
    }
  }, [transactionHash, isConfirmed]);

  // Handle confirmation errors
  useEffect(() => {
    if (transactionHash && !isConfirming && !isConfirmed) {
      console.error(
        `❌ Transaction confirmation failed for hash:`,
        transactionHash
      );
      setError("Transaction confirmation failed");
      setIsSettling(false);
    }
  }, [transactionHash, isConfirming, isConfirmed]);

  return {
    settleAuction,
    isSettling: isSettling || isWriting || isConfirming,
    error,
    transactionHash,
    isConfirmed,
  };
}
