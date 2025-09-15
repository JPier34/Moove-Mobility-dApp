"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { usePlaceBid } from "./useAuction";
import { parseEther, formatEther } from "viem";
import { toast } from "react-hot-toast";
import { useExtendAuction } from "./useExtendAuction";

export interface EnglishAuctionHandler {
  placeBid: (
    auctionId: number,
    bidAmount: string,
    auctionData?: {
      startPrice: string;
      currentBid: string;
      bidIncrement: string;
      endTime?: string; // Add endTime for extension logic
      extensionThresholdMinutes?: number; // Configurable threshold
      extensionDurationMinutes?: number; // Configurable duration
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
  // Removed manual extension - let smart contract handle auto-extension
  // const { extendAuction, isExtending } = useExtendAuction();

  // Default extension settings (can be overridden)
  const DEFAULT_EXTENSION_THRESHOLD_MINUTES = 5;
  const DEFAULT_EXTENSION_DURATION_MINUTES = 10;

  const placeBidWithValidation = useCallback(
    async (
      auctionId: number,
      bidAmount: string,
      auctionData?: {
        startPrice: string;
        currentBid: string;
        bidIncrement: string;
        endTime?: string;
        extensionThresholdMinutes?: number;
        extensionDurationMinutes?: number;
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

        // Check if we need to extend the auction (English auction specific)
        let shouldExtend = false;
        const extensionThreshold =
          auctionData?.extensionThresholdMinutes ||
          DEFAULT_EXTENSION_THRESHOLD_MINUTES;
        const extensionDuration =
          auctionData?.extensionDurationMinutes ||
          DEFAULT_EXTENSION_DURATION_MINUTES;

        if (auctionData?.endTime) {
          const currentTime = Math.floor(Date.now() / 1000);
          const endTime = parseInt(auctionData.endTime);
          const timeUntilEnd = endTime - currentTime;
          const thresholdSeconds = extensionThreshold * 60;

          if (timeUntilEnd > 0 && timeUntilEnd <= thresholdSeconds) {
            shouldExtend = true;
            console.log(
              `⏰ Bid placed in last ${extensionThreshold} minutes (${Math.floor(
                timeUntilEnd / 60
              )}m ${
                timeUntilEnd % 60
              }s remaining) - will extend auction by ${extensionDuration} minutes`
            );
          }
        }

        // Place the bid first
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

        // Show success message - let the smart contract handle auto-extension
        if (shouldExtend) {
          console.log(
            `⏰ Bid placed in last ${extensionThreshold} minutes - smart contract should auto-extend`
          );
          toast.success(
            `Bid placed! Auction will auto-extend by ${extensionDuration} minutes due to late bid`
          );
        } else {
          toast.success(`Bid of ${bidAmount} ETH placed successfully!`);
        }

        setStep("success");
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
    [
      isConnected,
      address,
      isProcessing,
      placeBid,
      isBidding,
      bidError,
      // Removed extendAuction dependency
      DEFAULT_EXTENSION_THRESHOLD_MINUTES,
      DEFAULT_EXTENSION_DURATION_MINUTES,
    ]
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
    [
      isConnected,
      address,
      isProcessing,
      placeBid,
      isBidding,
      bidError,
      // Removed extendAuction dependency
      DEFAULT_EXTENSION_THRESHOLD_MINUTES,
      DEFAULT_EXTENSION_DURATION_MINUTES,
    ]
  );

  return {
    placeBid: placeBidWithValidation,
    buyNow,
    isProcessing,
    error,
    step,
  };
}
