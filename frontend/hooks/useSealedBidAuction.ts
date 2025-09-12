"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { parseEther, formatEther } from "viem";
import { ethers } from "ethers";
import { toast } from "react-hot-toast";

export interface SealedBidAuctionHandler {
  submitSealedBid: (
    auctionId: number,
    bidAmount: string,
    nonce: string
  ) => Promise<boolean>;
  revealBid: (
    auctionId: number,
    bidAmount: string,
    nonce: string
  ) => Promise<boolean>;
  isProcessing: boolean;
  error: string | null;
  step: "idle" | "submitting" | "revealing" | "success" | "error";
  bidHash: string | null;
}

export function useSealedBidAuction(): SealedBidAuctionHandler {
  const { address, isConnected } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<
    "idle" | "submitting" | "revealing" | "success" | "error"
  >("idle");
  const [bidHash, setBidHash] = useState<string | null>(null);

  const submitSealedBid = useCallback(
    async (
      auctionId: number,
      bidAmount: string,
      nonce: string
    ): Promise<boolean> => {
      if (!isConnected || !address) {
        setError("Wallet not connected");
        setStep("error");
        toast.error("Connect wallet to submit sealed bid");
        return false;
      }

      if (isProcessing) {
        console.warn("Sealed bid auction already in progress");
        return false;
      }

      setIsProcessing(true);
      setError(null);
      setStep("submitting");

      try {
        // Validate inputs
        const bidAmountWei = parseEther(bidAmount);
        const nonceBigInt = BigInt(nonce);

        if (bidAmountWei <= 0n) {
          throw new Error("Bid amount must be greater than 0");
        }

        if (nonceBigInt <= 0n) {
          throw new Error("Nonce must be greater than 0");
        }

        // Create sealed bid hash
        const bidHash = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [bidAmountWei, nonceBigInt, address]
        );

        setBidHash(bidHash);

        console.log(`🔒 Submitting sealed bid for auction ${auctionId}:`, {
          bidAmount: bidAmount,
          nonce: nonce,
          bidHash: bidHash,
          bidder: address,
        });

        // TODO: Implement actual contract call when available
        // For now, simulate the transaction
        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log("✅ Sealed bid submitted successfully");
        setStep("success");
        toast.success(
          "Sealed bid submitted successfully! Wait for reveal phase."
        );

        return true;
      } catch (error) {
        console.error("❌ Sealed bid submission failed:", error);
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
        } else if (errorMessage.includes("invalid nonce")) {
          toast.error("Invalid nonce - please use a different number");
        } else {
          toast.error(`Sealed bid failed: ${errorMessage}`);
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
    [isConnected, address, isProcessing]
  );

  const revealBid = useCallback(
    async (
      auctionId: number,
      bidAmount: string,
      nonce: string
    ): Promise<boolean> => {
      if (!isConnected || !address) {
        setError("Wallet not connected");
        setStep("error");
        toast.error("Connect wallet to reveal bid");
        return false;
      }

      if (isProcessing) {
        console.warn("Sealed bid auction already in progress");
        return false;
      }

      setIsProcessing(true);
      setError(null);
      setStep("revealing");

      try {
        // Validate inputs
        const bidAmountWei = parseEther(bidAmount);
        const nonceBigInt = BigInt(nonce);

        if (bidAmountWei <= 0n) {
          throw new Error("Bid amount must be greater than 0");
        }

        if (nonceBigInt <= 0n) {
          throw new Error("Nonce must be greater than 0");
        }

        // Verify the bid hash matches
        const expectedBidHash = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [bidAmountWei, nonceBigInt, address]
        );

        if (bidHash && expectedBidHash !== bidHash) {
          throw new Error(
            "Bid hash mismatch - please use the same amount and nonce"
          );
        }

        console.log(`🔓 Revealing sealed bid for auction ${auctionId}:`, {
          bidAmount: bidAmount,
          nonce: nonce,
          bidder: address,
        });

        // TODO: Implement actual contract call when available
        // For now, simulate the transaction
        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log("✅ Sealed bid revealed successfully");
        setStep("success");
        toast.success("Sealed bid revealed successfully!");

        return true;
      } catch (error) {
        console.error("❌ Sealed bid reveal failed:", error);
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
        } else if (errorMessage.includes("hash mismatch")) {
          toast.error(
            "Bid hash mismatch - please use the same amount and nonce"
          );
        } else {
          toast.error(`Bid reveal failed: ${errorMessage}`);
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
    [isConnected, address, isProcessing, bidHash]
  );

  return {
    submitSealedBid,
    revealBid,
    isProcessing,
    error,
    step,
    bidHash,
  };
}

