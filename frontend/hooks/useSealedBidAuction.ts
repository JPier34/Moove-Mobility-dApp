"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { parseEther, formatEther } from "viem";
import { ethers } from "ethers";
import { toast } from "react-hot-toast";
import {
  generateSealedBidNonce,
  generateSealedBidCommit,
  saveSealedBidData,
  validateSealedBidAmount,
} from "@/utils/sealedBidUtils";

export interface SealedBidAuctionHandler {
  submitSealedBid: (
    auctionId: number,
    tokenId: number,
    bidAmount: string,
    minimumPrice?: string
  ) => Promise<boolean>;
  revealBid: (
    auctionId: number,
    tokenId: number,
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
      tokenId: number,
      bidAmount: string,
      minimumPrice?: string
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
        // Validate bid amount against minimum price
        // Always validate - use minimumPrice if provided, otherwise use 0.001 ETH as default
        const validationPrice = minimumPrice || "0.001";
        const validation = validateSealedBidAmount(bidAmount, validationPrice);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        // Generate nonce automatically
        const nonce = generateSealedBidNonce();
        console.log(
          "🎲 Generated nonce for sealed bid:",
          nonce.slice(0, 10) + "..."
        );

        // Validate inputs
        const bidAmountWei = parseEther(bidAmount);

        if (bidAmountWei <= 0n) {
          throw new Error("Bid amount must be greater than 0");
        }

        // Create sealed bid hash using the utility function
        const bidHash = generateSealedBidCommit(bidAmount, nonce, address);

        setBidHash(bidHash);

        console.log(`🔒 Submitting sealed bid for auction ${auctionId}:`, {
          bidAmount: bidAmount,
          nonce: nonce,
          bidHash: bidHash,
          bidder: address,
        });

        // Implement actual contract call
        if (!window.ethereum) {
          throw new Error("Ethereum provider not available");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // Import contract addresses and ABIs
        const { CONTRACT_ADDRESSES, CONTRACT_ABIS } = await import(
          "@/lib/contracts"
        );

        const auctionContract = new ethers.Contract(
          CONTRACT_ADDRESSES.MooveAuction,
          CONTRACT_ABIS.MooveAuction,
          signer
        );

        // Call submitSealedBid function with ETH value
        // The contract expects ETH to be sent with the transaction for validation
        const tx = await auctionContract.submitSealedBid(auctionId, bidHash, {
          value: bidAmountWei, // Send ETH with the transaction
        });
        console.log(`📝 Submit sealed bid transaction submitted: ${tx.hash}`);

        await tx.wait();
        console.log(`✅ Sealed bid submitted successfully: ${tx.hash}`);

        // Save bid data for reveal phase
        saveSealedBidData(
          auctionId.toString(),
          tokenId.toString(),
          address,
          bidAmount,
          nonce,
          bidHash
        );

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
      tokenId: number,
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

        // Implement actual contract call
        if (!window.ethereum) {
          throw new Error("Ethereum provider not available");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // Import contract addresses and ABIs
        const { CONTRACT_ADDRESSES, CONTRACT_ABIS } = await import(
          "@/lib/contracts"
        );

        const auctionContract = new ethers.Contract(
          CONTRACT_ADDRESSES.MooveAuction,
          CONTRACT_ABIS.MooveAuction,
          signer
        );

        // Call revealSealedBid function
        const tx = await auctionContract.revealSealedBid(
          auctionId,
          bidAmountWei,
          nonceBigInt
        );
        console.log(`📝 Reveal sealed bid transaction submitted: ${tx.hash}`);

        await tx.wait();
        console.log(`✅ Sealed bid revealed successfully: ${tx.hash}`);

        // Update bid status in localStorage
        const { updateSealedBidStatus } = await import(
          "@/utils/sealedBidUtils"
        );
        updateSealedBidStatus(tokenId.toString(), address, "revealed");

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
