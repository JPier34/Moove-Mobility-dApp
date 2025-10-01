"use client";

import { useCallback } from "react";
import { useReadContract } from "wagmi";
import { auctionContractConfig } from "@/utils/contracts";
import { formatEther } from "viem";

export interface AuctionState {
  auctionId: string;
  highestBidder: string;
  highestBid: string;
  status: number;
  isSettled: boolean;
  endTime: number;
  currentPrice: string;
}

export interface AuctionVerificationResult {
  isValid: boolean;
  isCurrentUserHighestBidder: boolean;
  bidAmount: string;
  auctionState: AuctionState;
  error?: string;
}

export function useAuctionStateVerification() {
  const { data: auctionContract } = useReadContract({
    ...auctionContractConfig,
    functionName: "getAuction",
    args: [0n], // Dummy call to get contract instance
  });

  const verifyAuctionState = useCallback(
    async (
      auctionId: number,
      expectedBidder: string,
      expectedBidAmount: bigint
    ): Promise<AuctionVerificationResult> => {
      try {
        console.log("🔍 Verifying auction state:", {
          auctionId,
          expectedBidder,
          expectedBidAmount: formatEther(expectedBidAmount),
        });

        // Use direct contract call for verification
        const { ethers } = await import("ethers");
        const provider = new ethers.JsonRpcProvider(
          process.env.NEXT_PUBLIC_RPC_URL ||
            "https://ethereum-sepolia.publicnode.com"
        );

        const auctionABI = [
          "function getAuction(uint256 auctionId) view returns (tuple(uint256 auctionId, address nftContract, uint256 tokenId, address seller, uint8 auctionType, uint256 startingPrice, uint256 reservePrice, uint256 buyNowPrice, uint256 currentPrice, uint256 startTime, uint256 endTime, uint256 bidIncrement, address highestBidder, uint256 highestBid, uint8 status, bool allowPartialFulfillment, uint256 minBidders, uint256 totalBidders, bool isSettled, uint256 extensionThreshold, uint256 extensionDuration, uint256 revealEndTime, bool revealPhaseStarted))",
        ];

        const auctionContract = new ethers.Contract(
          auctionContractConfig.address,
          auctionABI,
          provider
        );

        const auctionData = await auctionContract.getAuction(auctionId);

        const auctionState: AuctionState = {
          auctionId: auctionData.auctionId.toString(),
          highestBidder: auctionData.highestBidder,
          highestBid: ethers.formatEther(auctionData.highestBid),
          status: auctionData.status,
          isSettled: auctionData.isSettled,
          endTime: Number(auctionData.endTime),
          currentPrice: ethers.formatEther(auctionData.currentPrice),
        };

        const isCurrentUserHighestBidder =
          auctionData.highestBidder.toLowerCase() ===
          expectedBidder.toLowerCase();

        const bidMatches = auctionData.highestBid >= expectedBidAmount;

        const isValid = isCurrentUserHighestBidder && bidMatches;

        console.log("📊 Auction verification result:", {
          isValid,
          isCurrentUserHighestBidder,
          bidMatches,
          auctionState,
          expectedBidder,
          actualBidder: auctionData.highestBidder,
          expectedBid: formatEther(expectedBidAmount),
          actualBid: auctionState.highestBid,
        });

        return {
          isValid,
          isCurrentUserHighestBidder,
          bidAmount: auctionState.highestBid,
          auctionState,
        };
      } catch (error) {
        console.error("❌ Auction verification failed:", error);
        return {
          isValid: false,
          isCurrentUserHighestBidder: false,
          bidAmount: "0",
          auctionState: {
            auctionId: auctionId.toString(),
            highestBidder: "",
            highestBid: "0",
            status: 0,
            isSettled: false,
            endTime: 0,
            currentPrice: "0",
          },
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    []
  );

  const verifyAuctionStateWithRetry = useCallback(
    async (
      auctionId: number,
      expectedBidder: string,
      expectedBidAmount: bigint,
      maxRetries: number = 3,
      retryDelay: number = 2000
    ): Promise<AuctionVerificationResult> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`🔄 Verification attempt ${attempt}/${maxRetries}`);

        const result = await verifyAuctionState(
          auctionId,
          expectedBidder,
          expectedBidAmount
        );

        if (result.isValid) {
          console.log(`✅ Verification successful on attempt ${attempt}`);
          return result;
        }

        if (attempt < maxRetries) {
          console.log(`⏳ Retrying in ${retryDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }

      console.log(`❌ Verification failed after ${maxRetries} attempts`);
      return await verifyAuctionState(
        auctionId,
        expectedBidder,
        expectedBidAmount
      );
    },
    [verifyAuctionState]
  );

  return {
    verifyAuctionState,
    verifyAuctionStateWithRetry,
  };
}


