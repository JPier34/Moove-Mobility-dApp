"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { useClaimNFT } from "./useAuction";
import { useSettleAuction } from "./useUserCollection";
import { toast } from "react-hot-toast";

export interface AuctionClaimHandler {
  claimAuction: (auctionId: string) => Promise<boolean>;
  isProcessing: boolean;
  error: string | null;
  step: "idle" | "settling" | "claiming" | "success" | "error";
}

export function useAuctionClaim(): AuctionClaimHandler {
  const { address, isConnected } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<
    "idle" | "settling" | "claiming" | "success" | "error"
  >("idle");

  const { claimNFT, isPending: isClaiming, error: claimError } = useClaimNFT();
  const { settleAuction, isSettling, error: settleError } = useSettleAuction();

  const claimAuction = useCallback(
    async (auctionId: string): Promise<boolean> => {
      if (!isConnected || !address) {
        setError("Wallet not connected");
        setStep("error");
        toast.error("Connect wallet to claim auction");
        return false;
      }

      if (isProcessing) {
        console.warn("Auction claim already in progress");
        return false;
      }

      setIsProcessing(true);
      setError(null);
      setStep("settling");

      try {
        console.log(`🏆 Starting claim process for auction ${auctionId}`);

        // Step 1: Settle the auction first (if not already settled)
        console.log("📝 Step 1: Settling auction...");
        setStep("settling");

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Settle transaction timeout"));
          }, 30000); // 30 second timeout

          settleAuction(auctionId);

          // Listen for success/error
          const checkStatus = () => {
            if (settleError) {
              clearTimeout(timeout);
              reject(new Error(`Settle failed: ${settleError}`));
            } else if (!isSettling) {
              clearTimeout(timeout);
              resolve();
            } else {
              setTimeout(checkStatus, 1000);
            }
          };

          setTimeout(checkStatus, 1000);
        });

        console.log("✅ Step 1 completed: Auction settled");

        // Wait a moment for the settlement to be processed on-chain
        console.log("⏳ Waiting for settlement to be processed...");
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Step 2: Claim the NFT
        console.log("💰 Step 2: Claiming NFT...");
        setStep("claiming");

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Claim transaction timeout"));
          }, 30000); // 30 second timeout

          claimNFT(parseInt(auctionId));

          // Listen for success/error
          const checkStatus = () => {
            if (claimError) {
              clearTimeout(timeout);
              reject(new Error(`Claim failed: ${claimError}`));
            } else if (!isClaiming) {
              clearTimeout(timeout);
              resolve();
            } else {
              setTimeout(checkStatus, 1000);
            }
          };

          setTimeout(checkStatus, 1000);
        });

        console.log("✅ Step 2 completed: NFT claimed successfully");
        setStep("success");
        toast.success(`Successfully claimed NFT from auction ${auctionId}!`);

        return true;
      } catch (error) {
        console.error("❌ Auction claim failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setError(errorMessage);
        setStep("error");

        // Show specific error messages
        if (errorMessage.includes("timeout")) {
          toast.error("Transaction timeout - please try again");
        } else if (errorMessage.includes("insufficient funds")) {
          toast.error("Insufficient funds for this transaction");
        } else if (errorMessage.includes("user rejected")) {
          toast.error("Transaction rejected by user");
        } else {
          toast.error(`Auction claim failed: ${errorMessage}`);
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
      settleAuction,
      claimNFT,
      isSettling,
      isClaiming,
      settleError,
      claimError,
    ]
  );

  return {
    claimAuction,
    isProcessing,
    error,
    step,
  };
}











