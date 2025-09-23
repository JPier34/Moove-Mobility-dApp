"use client";

import { useCallback } from "react";
import { Auction, AuctionType } from "@/types/auction";
import { useEnglishAuction } from "./useEnglishAuction";
import { useReserveAuction } from "./useReserveAuction";
import { useSealedBidAuction } from "./useSealedBidAuction";
import { useDutchAuction } from "./useDutchAuction";

export interface AuctionHandlerResult {
  success: boolean;
  error?: string;
  step?: string;
}

export interface AuctionHandler {
  handleAuctionAction: (
    auction: Auction,
    action: "bid" | "buyNow",
    amount?: string,
    nonce?: string
  ) => Promise<AuctionHandlerResult>;
  isProcessing: boolean;
  error: string | null;
  step: string;
}

export function useAuctionHandler(): AuctionHandler {
  const englishAuction = useEnglishAuction();
  const reserveAuction = useReserveAuction();
  const sealedBidAuction = useSealedBidAuction();
  const dutchAuction = useDutchAuction();

  const handleAuctionAction = useCallback(
    async (
      auction: Auction,
      action: "bid" | "buyNow",
      amount?: string,
      nonce?: string
    ): Promise<AuctionHandlerResult> => {
      console.log(
        `🎯 Handling ${action} for auction type ${auction.auctionType}:`,
        {
          auctionId: auction.auctionId,
          auctionType: auction.auctionType,
          amount,
          nonce,
        }
      );

      try {
        switch (auction.auctionType) {
          case AuctionType.ENGLISH:
            if (action === "bid" && amount) {
              const endTimeUnix = Math.floor(auction.endTime.getTime() / 1000);
              const currentTimeUnix = Math.floor(Date.now() / 1000);
              const timeUntilEnd = endTimeUnix - currentTimeUnix;

              console.log("🎯 English Auction Extension Debug:", {
                auctionId: auction.auctionId,
                endTime: auction.endTime,
                endTimeUnix,
                currentTimeUnix,
                timeUntilEndSeconds: timeUntilEnd,
                timeUntilEndMinutes: Math.floor(timeUntilEnd / 60),
                extensionThresholdMinutes:
                  auction.extensionThresholdMinutes || 5,
                extensionDurationMinutes:
                  auction.extensionDurationMinutes || 10,
              });

              const auctionData = {
                startPrice: auction.startPrice,
                currentBid: auction.currentBid,
                bidIncrement: auction.bidIncrement,
                endTime: endTimeUnix.toString(), // Convert Date to Unix timestamp string
                // Extension settings (these should come from auction metadata or form)
                extensionThresholdMinutes:
                  auction.extensionThresholdMinutes || 5,
                extensionDurationMinutes:
                  auction.extensionDurationMinutes || 10,
              };
              const success = await englishAuction.placeBid(
                parseInt(auction.auctionId),
                amount,
                auctionData
              );
              return {
                success,
                error: success ? undefined : englishAuction.error || undefined,
                step: englishAuction.step,
              };
            } else if (action === "buyNow" && amount) {
              const success = await englishAuction.buyNow(
                parseInt(auction.auctionId),
                amount
              );
              return {
                success,
                error: success ? undefined : englishAuction.error || undefined,
                step: englishAuction.step,
              };
            }
            break;

          case AuctionType.RESERVE:
            if (action === "bid" && amount && auction.reservePrice) {
              const auctionData = {
                startPrice: auction.startPrice,
                currentBid: auction.currentBid,
                bidIncrement: auction.bidIncrement,
                reservePrice: auction.reservePrice,
              };
              const success = await reserveAuction.placeBid(
                parseInt(auction.auctionId),
                amount,
                auctionData
              );
              return {
                success,
                error: success ? undefined : reserveAuction.error || undefined,
                step: reserveAuction.step,
              };
            } else if (action === "buyNow" && amount) {
              const success = await reserveAuction.buyNow(
                parseInt(auction.auctionId),
                amount
              );
              return {
                success,
                error: success ? undefined : reserveAuction.error || undefined,
                step: reserveAuction.step,
              };
            }
            break;

          case AuctionType.SEALED_BID:
            if (action === "bid" && amount && nonce) {
              const success = await sealedBidAuction.submitSealedBid(
                parseInt(auction.auctionId),
                parseInt(auction.nftId),
                amount,
                nonce
              );
              return {
                success,
                error: success
                  ? undefined
                  : sealedBidAuction.error || undefined,
                step: sealedBidAuction.step,
              };
            } else if (action === "buyNow" && amount && nonce) {
              // For sealed bid, "buyNow" means reveal the bid
              const success = await sealedBidAuction.revealBid(
                parseInt(auction.auctionId),
                parseInt(auction.nftId),
                amount,
                nonce
              );
              return {
                success,
                error: success
                  ? undefined
                  : sealedBidAuction.error || undefined,
                step: sealedBidAuction.step,
              };
            }
            break;

          case AuctionType.DUTCH:
            if (action === "buyNow" && amount) {
              const success = await dutchAuction.handleDutchAuction(
                parseInt(auction.auctionId),
                parseFloat(amount)
              );
              return {
                success,
                error: success ? undefined : dutchAuction.error || undefined,
                step: dutchAuction.step,
              };
            }
            break;

          default:
            throw new Error(`Unsupported auction type: ${auction.auctionType}`);
        }

        throw new Error(
          `Invalid action ${action} for auction type ${auction.auctionType}`
        );
      } catch (error) {
        console.error("❌ Auction action failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          error: errorMessage,
          step: "error",
        };
      }
    },
    [englishAuction, reserveAuction, sealedBidAuction, dutchAuction]
  );

  // Get current processing state from the appropriate handler
  const getCurrentState = () => {
    if (englishAuction.isProcessing) return englishAuction;
    if (reserveAuction.isProcessing) return reserveAuction;
    if (sealedBidAuction.isProcessing) return sealedBidAuction;
    if (dutchAuction.isProcessing) return dutchAuction;

    return {
      isProcessing: false,
      error: null,
      step: "idle",
    };
  };

  const currentState = getCurrentState();

  return {
    handleAuctionAction,
    isProcessing: currentState.isProcessing,
    error: currentState.error,
    step: currentState.step,
  };
}
