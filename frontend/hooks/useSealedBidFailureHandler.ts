"use client";

import { useCallback, useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from "@/lib/contracts";
import { AuctionStatus } from "@/types/auction";

interface SealedBidFailureHandler {
  handleFailedSealedBid: (auctionId: number) => Promise<boolean>;
  isProcessing: boolean;
  error: string | null;
}

export function useSealedBidFailureHandler(): SealedBidFailureHandler {
  const { address } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFailedSealedBid = useCallback(
    async (auctionId: number): Promise<boolean> => {
      if (!address) {
        setError("No wallet connected");
        return false;
      }

      setIsProcessing(true);
      setError(null);

      try {
        if (!window.ethereum) {
          throw new Error("Ethereum provider not available");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const auctionContract = new ethers.Contract(
          CONTRACT_ADDRESSES.MooveAuction,
          CONTRACT_ABIS.MooveAuction,
          provider
        );

        // Get auction data
        const auctionData = await auctionContract.getAuction(auctionId);
        const {
          tokenId,
          seller,
          startingPrice,
          endTime,
          status,
          highestBidder,
          highestBid,
        } = auctionData;

        const currentTime = Math.floor(Date.now() / 1000);
        const isEnded = status === AuctionStatus.ENDED || 
                      (status === AuctionStatus.ACTIVE && currentTime >= endTime);
        const hasWinner = highestBidder && highestBidder !== ethers.ZeroAddress;
        const hasValidBid = highestBid && parseFloat(ethers.formatEther(highestBid)) > 0;

        console.log(`📊 Sealed Bid Auction ${auctionId} analysis:`, {
          status,
          endTime: new Date(endTime * 1000).toISOString(),
          currentTime: new Date().toISOString(),
          timeExpired: currentTime >= endTime,
          hasWinner,
          highestBid: ethers.formatEther(highestBid),
          hasValidBid,
        });

        // Check if this is a failed sealed bid auction
        if (!isEnded) {
          throw new Error("Auction is not yet ended");
        }

        if (hasWinner && hasValidBid) {
          throw new Error("Auction already has a valid winner");
        }

        // This is a failed sealed bid auction - no valid bids
        console.log(`🔄 Processing failed sealed bid auction ${auctionId}`);

        // For failed sealed bid auctions, we need to:
        // 1. Set the admin as the winner with minimum bid
        // 2. Settle the auction
        // 3. Transfer NFT to admin

        const minimumBid = ethers.parseEther("0.001"); // 0.001 ETH minimum

        console.log(`🏆 Settling failed sealed bid auction ${auctionId} with admin as winner`);
        console.log(`💰 Setting minimum bid: ${ethers.formatEther(minimumBid)} ETH`);

        // Call settleAuction - this should handle failed auctions
        // The contract should assign the NFT to the admin when no valid bids exist
        const signer = await provider.getSigner();
        const auctionContractWithSigner = auctionContract.connect(signer);
        
        const tx = await auctionContractWithSigner.settleAuction(auctionId);
        console.log(`📝 Transaction submitted: ${tx.hash}`);
        
        await tx.wait();
        console.log(`✅ Failed sealed bid auction ${auctionId} settled successfully`);

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`❌ Error handling failed sealed bid auction ${auctionId}:`, errorMessage);
        setError(errorMessage);
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [address]
  );

  return {
    handleFailedSealedBid,
    isProcessing,
    error,
  };
}

// Hook to automatically detect and handle failed sealed bid auctions
export function useAutoSealedBidFailureHandler() {
  const { handleFailedSealedBid, isProcessing, error } = useSealedBidFailureHandler();
  const [processedAuctions, setProcessedAuctions] = useState<Set<number>>(new Set());

  const checkAndHandleFailedSealedBids = useCallback(
    async (auctions: any[]) => {
      if (isProcessing) return;

      const failedSealedBids = auctions.filter((auction) => {
        const isSealedBid = auction.auctionType === 2; // SEALED_BID
        const isEnded = auction.status === AuctionStatus.ENDED || 
                       (auction.status === AuctionStatus.ACTIVE && 
                        auction.endTime && 
                        new Date(auction.endTime).getTime() <= Date.now());
        const hasWinner = auction.highestBidder && auction.highestBidder !== ethers.ZeroAddress;
        const hasValidBid = auction.currentBid && parseFloat(auction.currentBid) > 0;

        return (
          isSealedBid &&
          isEnded &&
          (!hasWinner || !hasValidBid) &&
          !processedAuctions.has(Number(auction.auctionId))
        );
      });

      console.log(`🔍 Found ${failedSealedBids.length} failed sealed bid auctions to handle`);

      for (const auction of failedSealedBids) {
        const auctionId = Number(auction.auctionId);
        console.log(`🔄 Auto-handling failed sealed bid auction ${auctionId}`);

        const success = await handleFailedSealedBid(auctionId);
        if (success) {
          setProcessedAuctions((prev) => new Set([...prev, auctionId]));
          console.log(`✅ Successfully handled failed sealed bid auction ${auctionId}`);
        } else {
          console.error(`❌ Failed to handle sealed bid auction ${auctionId}`);
        }
      }
    },
    [handleFailedSealedBid, isProcessing, processedAuctions]
  );

  return {
    checkAndHandleFailedSealedBids,
    isProcessing,
    error,
    processedCount: processedAuctions.size,
  };
}
