"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { usePlaceBid } from "./useAuction";
import { parseEther, formatEther } from "viem";
import { useAuctionNotificationTriggers } from "./useUnifiedAuctionNotifications";

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
  buyNow: (auctionId: number, buyNowPrice: string) => Promise<boolean>;
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

  const { placeBid, isPending: isBidding, error: bidError } = usePlaceBid();
  const { notifyReserveWin, notifyAuctionFailed } =
    useAuctionNotificationTriggers();

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
        notifyAuctionFailed(auctionId.toString(), "Wallet not connected");
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
        // Validate bid amount
        const bidAmountWei = parseEther(bidAmount);
        const startPriceWei = parseEther(auctionData.startPrice);
        const currentBidWei = parseEther(auctionData.currentBid);
        const bidIncrementWei = parseEther(auctionData.bidIncrement);
        const reservePriceWei = parseEther(auctionData.reservePrice);

        if (bidAmountWei <= 0n) {
          throw new Error("Bid amount must be greater than 0");
        }

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

        // Check if bid is under reserve price
        const isUnderReservePrice = bidAmountWei < reservePriceWei;
        setIsUnderReserve(isUnderReservePrice);

        if (isUnderReservePrice) {
          console.warn(
            `⚠️ Bid ${bidAmount} ETH is under reserve price ${auctionData.reservePrice} ETH`
          );
          notifyAuctionFailed(
            auctionId.toString(),
            `Bid is under reserve price. Auction may not complete if reserve is not met.`
          );
        }

        console.log(
          `🏆 Placing bid for Reserve auction ${auctionId}: ${bidAmount} ETH (Reserve: ${auctionData.reservePrice} ETH)`
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

        // Success handled by notification system
        if (isUnderReservePrice) {
          console.log(
            `Bid placed! Note: ${bidAmount} ETH is under reserve price ${auctionData.reservePrice} ETH`
          );
        } else {
          console.log(`Bid of ${bidAmount} ETH placed successfully!`);
        }

        return true;
      } catch (error) {
        console.error("❌ Reserve auction bid failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setError(errorMessage);
        setStep("error");

        // Use unified notification system for errors
        notifyAuctionFailed(auctionId.toString(), errorMessage);

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
        notifyAuctionFailed(auctionId.toString(), "Wallet not connected");
        return false;
      }

      if (isProcessing) {
        console.warn("Reserve auction already in progress");
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
          `💰 Buying now for Reserve auction ${auctionId}: ${buyNowPrice} ETH`
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
        // Notifica di vincita per buy now
        notifyReserveWin(auctionId.toString(), parseFloat(buyNowPrice));

        return true;
      } catch (error) {
        console.error("❌ Reserve auction buy now failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setError(errorMessage);
        setStep("error");

        // Use unified notification system for errors
        notifyAuctionFailed(auctionId.toString(), errorMessage);

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
    isUnderReserve,
  };
}
