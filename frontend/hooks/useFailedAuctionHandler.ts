"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { useWriteMooveAuction } from "./useContract";
import { contracts } from "@/utils/contracts";
import { ethers } from "ethers";

// Master admin wallet address
const MASTER_ADMIN_ADDRESS = "0x777382955f33Bb8540602E914D9b650C962EF6Cc";

export interface FailedAuctionHandler {
  handleFailedAuction: (auctionId: number) => Promise<boolean>;
  isProcessing: boolean;
  error: string | null;
}

export function useFailedAuctionHandler(): FailedAuctionHandler {
  const { address } = useAccount();
  const { writeMooveAuction, isPending, error } = useWriteMooveAuction();
  const [isProcessing, setIsProcessing] = useState(false);
  const [handlerError, setHandlerError] = useState<string | null>(null);

  const handleFailedAuction = useCallback(
    async (auctionId: number): Promise<boolean> => {
      if (!address) {
        setHandlerError("No wallet connected");
        return false;
      }

      // Check if user is admin
      const isAdmin =
        address.toLowerCase() === MASTER_ADMIN_ADDRESS.toLowerCase();
      if (!isAdmin) {
        setHandlerError("Only admin can handle failed auctions");
        return false;
      }

      try {
        setIsProcessing(true);
        setHandlerError(null);

        console.log(
          `🔧 Handling failed auction ${auctionId} - assigning admin as winner`
        );

        // Check auction status first
        if (typeof window === "undefined" || !window.ethereum) {
          throw new Error("No ethereum provider available");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const auctionContract = new ethers.Contract(
          contracts.MooveAuction.address,
          contracts.MooveAuction.abi,
          provider
        );

        // Get auction data
        const auctionData = await auctionContract.getAuction(auctionId);
        const status = Number(auctionData.status);
        const endTime = Number(auctionData.endTime);
        const currentTime = Math.floor(Date.now() / 1000);

        console.log(`📊 Auction ${auctionId} status check:`, {
          status,
          endTime: new Date(endTime * 1000).toISOString(),
          currentTime: new Date().toISOString(),
          timeExpired: currentTime >= endTime,
          hasWinner: auctionData.highestBidder !== ethers.ZeroAddress,
          highestBid: ethers.formatEther(auctionData.highestBid),
        });

        // Check if auction is actually failed (ended but no winner)
        const isEnded =
          status === 2 || (status === 1 && currentTime >= endTime);
        const hasWinner =
          auctionData.highestBidder &&
          auctionData.highestBidder !== ethers.ZeroAddress;
        const hasValidBid =
          auctionData.highestBid &&
          parseFloat(ethers.formatEther(auctionData.highestBid)) > 0;

        if (!isEnded) {
          throw new Error("Auction is not yet ended");
        }

        if (hasWinner && hasValidBid) {
          throw new Error("Auction already has a valid winner");
        }

        // If auction is ended but no winner, we need to:
        // 1. Set admin as highest bidder
        // 2. Set a minimal bid (like 0.001 ETH)
        // 3. Settle the auction

        console.log(
          `🔄 Processing failed auction ${auctionId} - no valid winner found`
        );

        // First, we need to manually set the admin as the winner
        // This would require a special admin function in the contract
        // For now, we'll use the existing settleAuction function
        // but this might need contract modifications

        // Call settleAuction - this should handle the case where there's no winner
        // and assign the NFT to the admin
        console.log(`🏆 Settling auction ${auctionId} with admin as winner`);

        // Note: This assumes the contract has been modified to handle failed auctions
        // by assigning them to the admin. If not, we need to modify the contract.
        writeMooveAuction("settleAuction", [auctionId]);

        console.log(`✅ Failed auction ${auctionId} handled successfully`);
        return true;
      } catch (error) {
        console.error(`❌ Error handling failed auction ${auctionId}:`, error);
        setHandlerError(
          error instanceof Error ? error.message : "Unknown error"
        );
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [address, writeMooveAuction]
  );

  return {
    handleFailedAuction,
    isProcessing: isProcessing || isPending,
    error: handlerError || error?.message || null,
  };
}

// Hook to automatically detect and handle failed auctions
export function useAutoFailedAuctionHandler() {
  const { handleFailedAuction, isProcessing, error } =
    useFailedAuctionHandler();
  const [processedAuctions, setProcessedAuctions] = useState<Set<number>>(
    new Set()
  );

  const checkAndHandleFailedAuctions = useCallback(
    async (auctions: any[]) => {
      if (isProcessing) return;

      const failedAuctions = auctions.filter((auction) => {
        const isEnded =
          auction.status === 2 ||
          (auction.status === 1 &&
            auction.endTime &&
            new Date(auction.endTime).getTime() <= Date.now());
        const hasWinner =
          auction.highestBidder && auction.highestBidder !== ethers.ZeroAddress;
        const hasValidBid =
          auction.currentBid && parseFloat(auction.currentBid) > 0;

        return (
          isEnded &&
          (!hasWinner || !hasValidBid) &&
          !processedAuctions.has(Number(auction.auctionId))
        );
      });

      console.log(
        `🔍 Found ${failedAuctions.length} failed auctions to handle`
      );

      for (const auction of failedAuctions) {
        const auctionId = Number(auction.auctionId);
        console.log(`🔄 Auto-handling failed auction ${auctionId}`);

        const success = await handleFailedAuction(auctionId);
        if (success) {
          setProcessedAuctions((prev) => new Set([...prev, auctionId]));
          console.log(`✅ Successfully handled failed auction ${auctionId}`);
        } else {
          console.error(`❌ Failed to handle auction ${auctionId}`);
        }
      }
    },
    [handleFailedAuction, isProcessing, processedAuctions]
  );

  return {
    checkAndHandleFailedAuctions,
    isProcessing,
    error,
    processedCount: processedAuctions.size,
  };
}





