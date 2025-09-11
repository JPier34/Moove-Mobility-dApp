"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { usePlaceBid } from "./useAuction";
import { parseEther, formatEther } from "viem";
import { toast } from "react-hot-toast";

export interface EnglishAuctionHandler {
  placeBid: (
    auctionId: number,
    bidAmount: string,
    auctionData?: {
      startPrice: string;
      currentBid: string;
      bidIncrement: string;
    }
  ) => Promise<boolean>;
  buyNow: (auctionId: number, buyNowPrice: string) => Promise<boolean>;
  isProcessing: boolean;
  error: string | null;
  step: "idle" | "bidding" | "buying" | "success" | "error";
}

export function useEnglishAuction(): EnglishAuctionHandler {
  const { address, isConnected } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<
    "idle" | "bidding" | "buying" | "success" | "error"
  >("idle");

  const { placeBid, isPending: isBidding, error: bidError } = usePlaceBid();

  const placeBidWithValidation = useCallback(
    async (
      auctionId: number,
      bidAmount: string,
      auctionData?: {
        startPrice: string;
        currentBid: string;
        bidIncrement: string;
      }
    ): Promise<boolean> => {
      if (!isConnected || !address) {
        setError("Wallet not connected");
        setStep("error");
        toast.error("Connect wallet to place bid");
        return false;
      }

      if (isProcessing) {
        console.warn("English auction already in progress");
        return false;
      }

      setIsProcessing(true);
      setError(null);
      setStep("bidding");

      try {
        // Validate bid amount
        const bidAmountWei = parseEther(bidAmount);
        if (bidAmountWei <= 0n) {
          throw new Error("Bid amount must be greater than 0");
        }

        // Additional validation if auction data is provided
        if (auctionData) {
          const startPriceWei = parseEther(auctionData.startPrice);
          const currentBidWei = parseEther(auctionData.currentBid);
          const bidIncrementWei = parseEther(auctionData.bidIncrement);

          // Check if bid is at least the start price (for first bid)
          if (currentBidWei === 0n && bidAmountWei < startPriceWei) {
            throw new Error(
              `Bid must be at least the start price of ${auctionData.startPrice} ETH`
            );
          }

          // Check if bid is higher than current bid (for subsequent bids)
          if (currentBidWei > 0n) {
            if (bidAmountWei <= currentBidWei) {
              throw new Error(
                `Bid must be higher than current bid of ${formatEther(
                  currentBidWei
                )} ETH`
              );
            }
          }
        }

        console.log(
          `🏆 Placing bid for English auction ${auctionId}: ${bidAmount} ETH`
        );

        // Place the bid
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Bid transaction timeout"));
          }, 30000); // 30 second timeout

          placeBid(auctionId, bidAmountWei);

          // Listen for success/error
          const checkStatus = () => {
            if (bidError) {
              clearTimeout(timeout);
              reject(new Error(`Bid failed: ${bidError}`));
            } else if (!isBidding) {
              clearTimeout(timeout);
              resolve();
            } else {
              setTimeout(checkStatus, 1000);
            }
          };

          setTimeout(checkStatus, 1000);
        });

        console.log("✅ Bid placed successfully");
        setStep("success");
        toast.success(`Bid of ${bidAmount} ETH placed successfully!`);

        return true;
      } catch (error) {
        console.error("❌ English auction bid failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setError(errorMessage);
        setStep("error");

        // Show specific error messages
        if (errorMessage.includes("timeout")) {
          toast.error("Transaction timeout - please try again");
        } else if (errorMessage.includes("insufficient funds")) {
          toast.error("Insufficient funds for this bid");
        } else if (errorMessage.includes("user rejected")) {
          toast.error("Transaction rejected by user");
        } else if (errorMessage.includes("bid too low")) {
          toast.error("Bid amount is too low");
        } else {
          toast.error(`Bid failed: ${errorMessage}`);
        }

        return false;
      } finally {
        setIsProcessing(false);
        // Reset step after a delay
        setTimeout(() => {
          setStep("idle");
        }, 3000);
      }
    },
    [isConnected, address, isProcessing, placeBid, isBidding, bidError]
  );

  const buyNow = useCallback(
    async (auctionId: number, buyNowPrice: string): Promise<boolean> => {
      if (!isConnected || !address) {
        setError("Wallet not connected");
        setStep("error");
        toast.error("Connect wallet to buy now");
        return false;
      }

      if (isProcessing) {
        console.warn("English auction already in progress");
        return false;
      }

      setIsProcessing(true);
      setError(null);
      setStep("buying");

      try {
        // Validate buy now price
        const buyNowPriceWei = parseEther(buyNowPrice);
        if (buyNowPriceWei <= 0n) {
          throw new Error("Buy now price must be greater than 0");
        }

        console.log(
          `💰 Buying now for English auction ${auctionId}: ${buyNowPrice} ETH`
        );

        // Place the buy now bid
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Buy now transaction timeout"));
          }, 30000); // 30 second timeout

          placeBid(auctionId, buyNowPriceWei);

          // Listen for success/error
          const checkStatus = () => {
            if (bidError) {
              clearTimeout(timeout);
              reject(new Error(`Buy now failed: ${bidError}`));
            } else if (!isBidding) {
              clearTimeout(timeout);
              resolve();
            } else {
              setTimeout(checkStatus, 1000);
            }
          };

          setTimeout(checkStatus, 1000);
        });

        console.log("✅ Buy now successful");
        setStep("success");
        toast.success(`Successfully bought for ${buyNowPrice} ETH!`);

        return true;
      } catch (error) {
        console.error("❌ English auction buy now failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setError(errorMessage);
        setStep("error");

        // Show specific error messages
        if (errorMessage.includes("timeout")) {
          toast.error("Transaction timeout - please try again");
        } else if (errorMessage.includes("insufficient funds")) {
          toast.error("Insufficient funds for buy now");
        } else if (errorMessage.includes("user rejected")) {
          toast.error("Transaction rejected by user");
        } else {
          toast.error(`Buy now failed: ${errorMessage}`);
        }

        return false;
      } finally {
        setIsProcessing(false);
        // Reset step after a delay
        setTimeout(() => {
          setStep("idle");
        }, 3000);
      }
    },
    [isConnected, address, isProcessing, placeBid, isBidding, bidError]
  );

  return {
    placeBid: placeBidWithValidation,
    buyNow,
    isProcessing,
    error,
    step,
  };
}
