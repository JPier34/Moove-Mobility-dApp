"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { usePlaceBid } from "./useAuction";
import { parseEther, formatEther } from "viem";

export interface ReserveAuctionHandler {
  placeBid: (
    auctionId: number,
    bidAmount: string,
    auctionData: {
      startPrice: string;
      currentBid: string;
      bidIncrement: string;
      reservePrice: string;
    }
  ) => Promise<boolean>;
  isProcessing: boolean;
  error: string | null;
  step: "idle" | "bidding" | "buying" | "success" | "error";
  isUnderReserve: boolean;
}

export function useReserveAuction(): ReserveAuctionHandler {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<
    "idle" | "bidding" | "buying" | "success" | "error"
  >("idle");
  const [isUnderReserve, setIsUnderReserve] = useState(false);

  const {
    placeBid,
    isPending: isBidding,
    isSuccess,
    error: bidError,
  } = usePlaceBid();

  const placeBidWithValidation = useCallback(
    async (
      auctionId: number,
      bidAmount: string,
      auctionData: {
        startPrice: string;
        currentBid: string;
        bidIncrement: string;
        reservePrice: string;
      }
    ): Promise<boolean> => {
      if (!isConnected || !address) {
        setError("Wallet not connected");
        setStep("error");
        return false;
      }

      if (isProcessing) {
        console.warn("Reserve auction already in progress");
        return false;
      }

      // Check if user is already the highest bidder
      try {
        const { ethers } = await import("ethers");
        const { contracts } = await import("@/utils/contracts");

        const { getBestProvider } = await import("@/utils/rpcProvider");
        const provider = getBestProvider();
        const auctionContract = new ethers.Contract(
          contracts.MooveAuction.address,
          contracts.MooveAuction.abi,
          provider
        );

        const auctionData = await auctionContract.getAuction(auctionId);
        const currentHighestBidder = auctionData.highestBidder;

        console.log(`🔍 [Reserve Auction] Highest bidder check:`, {
          auctionId,
          currentHighestBidder,
          userAddress: address,
          isAlreadyHighestBidder:
            currentHighestBidder.toLowerCase() === address.toLowerCase(),
        });

        if (currentHighestBidder.toLowerCase() === address.toLowerCase()) {
          const errorMsg =
            "You are already the highest bidder. You cannot outbid yourself.";

          setError(errorMsg);
          setStep("error");
          return false;
        }
      } catch (error) {
        console.warn("⚠️ Could not check highest bidder status:", error);
        // Continue with bid if we can't check (fallback behavior)
      }

      setIsProcessing(true);
      setError(null);
      setStep("bidding");

      try {
        const bidAmountWei = parseEther(bidAmount);
        const reservePriceWei = parseEther(auctionData.reservePrice);

        if (bidAmountWei <= 0n) {
          throw new Error("Bid amount must be greater than 0");
        }

        const isUnderReservePrice = bidAmountWei < reservePriceWei;
        setIsUnderReserve(isUnderReservePrice);

        console.log(
          `🏆 Placing bid for Reserve auction ${auctionId}: ${bidAmount} ETH`
        );

        placeBid(auctionId, bidAmountWei);

        // Wait for success
        if (isSuccess) {
          setStep("success");
          return true;
        }

        return true;
      } catch (error) {
        console.error("❌ Reserve auction bid failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setError(errorMessage);
        setStep("error");
        return false;
      } finally {
        setIsProcessing(false);
        setTimeout(() => {
          setStep("idle");
        }, 3000);
      }
    },
    [isConnected, address, isProcessing, placeBid, isSuccess]
  );

  // Buy now functionality removed - not supported for Reserve auctions

  // ✅ Handle successful bid and invalidate queries
  useEffect(() => {
    if (isSuccess) {
      console.log("✅ Reserve auction bid successful, invalidating queries");

      // Invalidate queries to refresh auction data
      queryClient.invalidateQueries({
        queryKey: ["auctions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["auctionBids"],
      });

      setStep("success");
    }
  }, [isSuccess, queryClient]);

  return {
    placeBid: placeBidWithValidation,
    isProcessing,
    error,
    step,
    isUnderReserve,
  };
}
