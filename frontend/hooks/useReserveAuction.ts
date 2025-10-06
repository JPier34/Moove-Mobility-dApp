"use client";

import { useState, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
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

  return {
    placeBid: placeBidWithValidation,
    isProcessing,
    error,
    step,
    isUnderReserve,
  };
}
