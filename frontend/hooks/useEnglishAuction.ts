"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { useQueryClient } from "@tanstack/react-query";
import { useWriteMooveAuction } from "./useContract";
import { useAuctionEventListening } from "./useAuctionEventListening";
import { useAuctionStateVerification } from "./useAuctionStateVerification";
import { useUnifiedAuctionNotifications } from "./useUnifiedAuctionNotifications";
import { contracts } from "@/utils/contracts";

interface PendingBid {
  auctionId: number;
  bidder: string;
  amount: string;
  timestamp: number;
  timeoutRef: { current: NodeJS.Timeout | null };
}

export function useEnglishAuction(auctionId?: number) {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const { writeMooveAuction } = useWriteMooveAuction();
  const { verifyAuctionStateWithRetry } = useAuctionStateVerification();
  const { notifyAuctionFailed, notifyAuctionSuccess, notifyEnglishWin } =
    useUnifiedAuctionNotifications();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<
    "idle" | "bidding" | "confirming" | "buying"
  >("idle");

  // Track pending bids to avoid duplicate processing
  const pendingBids = useRef<Map<number, PendingBid>>(new Map());

  // Handle bid placement with validation
  const placeBidWithValidation = useCallback(
    async (auctionId: number, bidAmount: string) => {
      if (!isConnected || !address) {
        setError("Please connect your wallet");
        return false;
      }

      if (isProcessing) {
        setError("Transaction already in progress");
        return false;
      }

      // Check if user is already the highest bidder
      try {
        const { getBestProvider } = await import("@/utils/rpcProvider");
        const provider = getBestProvider();
        const auctionContract = new ethers.Contract(
          contracts.MooveAuction.address,
          contracts.MooveAuction.abi,
          provider
        );

        const auctionData = await auctionContract.getAuction(auctionId);
        const currentHighestBidder = auctionData.highestBidder;

        console.log(`🔍 [English Auction] Highest bidder check:`, {
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
          return false;
        }
      } catch (error) {
        console.warn("⚠️ Could not check highest bidder status:", error);
        // Continue with bid if we can't check (fallback behavior)
      }

      // Check if user has already bid recently (within 5 minutes)
      const existingBid = pendingBids.current.get(auctionId);
      if (existingBid && existingBid.bidder === address) {
        const timeSinceLastBid = Date.now() - existingBid.timestamp;
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

        console.log(`🔍 [English Auction] Bid interval check:`, {
          auctionId,
          bidder: address,
          lastBidTime: existingBid.timestamp,
          lastBidAmount: existingBid.amount,
          timeSinceLastBid,
          fiveMinutes,
          canBid: timeSinceLastBid >= fiveMinutes,
        });

        if (timeSinceLastBid < fiveMinutes) {
          const remainingTime = Math.ceil(
            (fiveMinutes - timeSinceLastBid) / 1000
          );
          const errorMsg = `Please wait ${remainingTime} seconds before placing another bid`;

          setError(errorMsg);
          return false;
        }
      }

      setIsProcessing(true);
      setError(null);
      setStep("bidding");

      try {
        console.log(
          `🎯 Starting bid for auction ${auctionId} with amount ${bidAmount} ETH`
        );

        // Track this bid
        const timeoutRef = { current: null as NodeJS.Timeout | null };
        pendingBids.current.set(auctionId, {
          auctionId,
          bidder: address,
          amount: bidAmount,
          timestamp: Date.now(),
          timeoutRef,
        });

        // Call the placeBid function using writeMooveAuction
        // Convert ETH amount to wei using parseEther
        const bidAmountWei = ethers.parseEther(bidAmount);

        console.log(`🔍 [English Auction] Bid attempt details:`, {
          auctionId,
          bidAmount,
          bidAmountWei: bidAmountWei.toString(),
          bidder: address,
          timestamp: Date.now(),
          lastBidTime: pendingBids.current.get(auctionId)?.timestamp,
          timeSinceLastBid: pendingBids.current.get(auctionId)
            ? Date.now() - pendingBids.current.get(auctionId)!.timestamp
            : "N/A",
          contractAddress: contracts.MooveAuction.address,
          functionName: "placeBid",
          args: [BigInt(auctionId)],
          value: bidAmountWei.toString(),
        });

        writeMooveAuction("placeBid", [auctionId], bidAmountWei);
        setStep("confirming");

        console.log(
          `✅ [English Auction] Bid transaction sent successfully for auction ${auctionId}`
        );

        // Wait for confirmation with timeout
        const timeout = setTimeout(async () => {
          console.log(
            `⏰ Bid timeout reached for auction ${auctionId}, verifying state...`
          );

          try {
            const verified = await verifyAuctionStateWithRetry(
              auctionId,
              address || "",
              BigInt(0),
              3,
              2000
            );
            if (verified) {
              console.log(`✅ Bid verified for auction ${auctionId}`);

              // ✅ Invalidate queries to refresh auction data
              queryClient.invalidateQueries({
                queryKey: ["auction", auctionId.toString()],
              });
              queryClient.invalidateQueries({
                queryKey: ["auctions"],
              });
              queryClient.invalidateQueries({
                queryKey: ["auctionBids", auctionId.toString()],
              });

              notifyAuctionSuccess(
                auctionId.toString(),
                `Bid of ${bidAmount} ETH placed successfully!`
              );
            } else {
              console.log(
                `❌ Bid verification failed for auction ${auctionId}`
              );
              notifyAuctionFailed(
                auctionId.toString(),
                "Bid completed but verification failed"
              );
            }
          } catch (error) {
            console.error(
              `❌ Bid verification error for auction ${auctionId}:`,
              error
            );
            notifyAuctionFailed(
              auctionId.toString(),
              "Bid completed but verification failed"
            );
          }
        }, 45000); // 45 second timeout

        timeoutRef.current = timeout;

        return true;
      } catch (error: any) {
        console.error(`❌ Bid failed for auction ${auctionId}:`, error);

        // Detailed error logging
        const errorDetails = {
          auctionId,
          bidAmount,
          bidder: address,
          timestamp: Date.now(),
          error: error?.message || "Unknown error",
          errorStack: error?.stack,
          errorCode: error?.code,
          errorReason: error?.reason,
          errorData: error?.data,
          errorInfo: error?.info,
          errorBody: error?.body,
          errorStatus: error?.status,
        };

        console.log(
          "🔍 [English Auction] Detailed error information:",
          errorDetails
        );

        const errorMessage = error?.message || "Bid failed";
        setError(errorMessage);

        // Clean up pending bid
        const pendingBid = pendingBids.current.get(auctionId);
        if (pendingBid) {
          if (pendingBid.timeoutRef.current) {
            clearTimeout(pendingBid.timeoutRef.current);
          }
          pendingBids.current.delete(auctionId);
        }

        // Use unified notification system for errors
        notifyAuctionFailed(auctionId.toString(), errorMessage);

        return false;
      } finally {
        setIsProcessing(false);
        // Reset step after a delay
        setTimeout(() => {
          setStep("idle");
        }, 2000);
      }
    },
    [
      isConnected,
      address,
      isProcessing,
      verifyAuctionStateWithRetry,
      notifyAuctionFailed,
      notifyAuctionSuccess,
    ]
  );

  // Buy now functionality removed - not supported for English auctions

  // Listen for BidPlaced events to confirm successful bids
  useAuctionEventListening({
    onBidPlaced: useCallback(
      (event: any) => {
        const {
          auctionId: eventAuctionId,
          bidder,
          amount,
          isHighestBid,
        } = event;

        console.log(`🎯 BidPlaced event received:`, {
          auctionId: eventAuctionId,
          bidder,
          amount: ethers.formatEther(amount),
          isHighestBid,
        });

        // Check if this is a bid we're waiting for
        const pendingBid = pendingBids.current.get(Number(eventAuctionId));
        if (
          pendingBid &&
          pendingBid.bidder.toLowerCase() === bidder.toLowerCase()
        ) {
          console.log(`✅ Bid confirmed for auction ${eventAuctionId}`);

          // Clear the timeout since we got confirmation
          if (pendingBid.timeoutRef.current) {
            clearTimeout(pendingBid.timeoutRef.current);
          }
          pendingBids.current.delete(Number(eventAuctionId));

          // ✅ Invalidate queries to refresh auction data
          queryClient.invalidateQueries({
            queryKey: ["auction", eventAuctionId.toString()],
          });
          queryClient.invalidateQueries({
            queryKey: ["auctions"],
          });
          queryClient.invalidateQueries({
            queryKey: ["auctionBids", eventAuctionId.toString()],
          });

          // Show success notification
          notifyAuctionSuccess(
            eventAuctionId.toString(),
            `Bid of ${ethers.formatEther(amount)} ETH placed successfully!`
          );
        }
      },
      [notifyAuctionSuccess, queryClient]
    ),
  });

  // Cleanup pending bids on unmount
  useEffect(() => {
    return () => {
      pendingBids.current.forEach((pendingBid) => {
        if (pendingBid.timeoutRef.current) {
          clearTimeout(pendingBid.timeoutRef.current);
        }
      });
      pendingBids.current.clear();
    };
  }, []);

  return {
    placeBid: placeBidWithValidation,
    isProcessing,
    error,
    step,
  };
}
