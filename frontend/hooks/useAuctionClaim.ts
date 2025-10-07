"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { useClaimNFT } from "./useAuction";
import { useSettleAuction } from "./useUserCollection";
import { toast } from "react-hot-toast";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

export interface AuctionClaimHandler {
  claimAuction: (auctionId: string) => Promise<boolean>;
  isProcessing: boolean;
  error: string | null;
  step: "idle" | "ending" | "settling" | "claiming" | "success" | "error";
}

export function useAuctionClaim(): AuctionClaimHandler {
  const { address, isConnected } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<
    "idle" | "ending" | "settling" | "claiming" | "success" | "error"
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

      // ✅ RESERVE AUCTION PROTECTION: Check if auction ended below reserve price
      try {
        console.log(
          `🔍 [Reserve Check] Checking auction ${auctionId} for reserve price violation...`
        );

        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const auctionContract = new ethers.Contract(
          contracts.MooveAuction.address,
          contracts.MooveAuction.abi,
          provider
        );

        const auctionData = await auctionContract.getAuction(auctionId);

        // Check if this is a Reserve Auction (type 3)
        if (Number(auctionData.auctionType) === 3) {
          const winningBid = BigInt(auctionData.highestBid);
          const reservePrice = BigInt(auctionData.reservePrice);

          console.log(`🔍 [Reserve Check] Reserve Auction detected:`, {
            auctionId,
            winningBid: ethers.formatEther(winningBid),
            reservePrice: ethers.formatEther(reservePrice),
            isBelowReserve: winningBid < reservePrice,
          });

          if (winningBid < reservePrice) {
            const errorMessage = `🚫 Cannot claim Reserve Auction #${auctionId}: Winning bid (${ethers.formatEther(
              winningBid
            )} ETH) is below reserve price (${ethers.formatEther(
              reservePrice
            )} ETH). This auction should be cancelled and NFT returned to seller.`;

            console.error(`❌ [Reserve Check] ${errorMessage}`);
            setError(errorMessage);
            setStep("error");
            toast.error(errorMessage, { duration: 8000 });

            return false;
          }

          console.log(
            `✅ [Reserve Check] Reserve Auction #${auctionId} passed validation - reserve price met`
          );
        }
      } catch (error) {
        console.warn(
          `⚠️ [Reserve Check] Error checking reserve price for auction ${auctionId}:`,
          error
        );
        // Continue with claim if check fails (don't block legitimate claims)
      }

      // Check if automatic system is active - DISABLED for manual claim
      // const isAutomaticSystemActive =
      //   typeof window !== "undefined" &&
      //   localStorage.getItem("auction-monitoring-active") === "true";

      // if (isAutomaticSystemActive) {
      //   console.log(
      //     `⏭️ Automatic system is active, skipping manual claim for auction ${auctionId}`
      //   );
      //   toast.success(
      //     `Automatic system is processing auction ${auctionId}. Please wait...`
      //   );
      //   return false;
      // }

      if (isProcessing) {
        console.warn("Auction claim already in progress");
        return false;
      }

      setIsProcessing(true);
      setError(null);
      setStep("settling");

      try {
        console.log(`🏆 Starting claim process for auction ${auctionId}`);

        // Step 1: End the auction first if it's still ACTIVE
        console.log("📝 Step 1: Ending auction...");
        setStep("ending");

        // Check auction status first
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const auctionContract = new ethers.Contract(
          contracts.MooveAuction.address,
          contracts.MooveAuction.abi,
          provider
        );

        const auctionData = await auctionContract.getAuction(auctionId);
        const currentStatus = Number(auctionData.status);
        const endTime = Number(auctionData.endTime);
        const now = Math.floor(Date.now() / 1000);

        console.log(`🔍 Auction ${auctionId} status check:`, {
          status: currentStatus,
          endTime: endTime,
          now: now,
          isExpired: now > endTime,
        });

        if (currentStatus === 1 && now > endTime) {
          // Auction is ACTIVE but expired, call endAuction first
          console.log(
            `🔄 Auction ${auctionId} is ACTIVE but expired. Calling endAuction...`
          );

          try {
            // Call endAuction
            const signer = await provider.getSigner();
            const endTx = await (
              auctionContract.connect(signer) as any
            ).endAuction(auctionId);
            console.log(`📝 End auction transaction submitted: ${endTx.hash}`);
            await endTx.wait();
            console.log(`✅ Auction ${auctionId} ended successfully`);

            // Wait for blockchain to update
            await new Promise((resolve) => setTimeout(resolve, 3000));
          } catch (endError) {
            console.error(`❌ Failed to end auction ${auctionId}:`, endError);
            // Continue with settleAuction anyway - the auction might be processable
            console.log(
              `🔄 Continuing with settleAuction despite endAuction failure...`
            );
          }
        }

        // Step 2: Settle the auction
        console.log("📝 Step 2: Settling auction...");
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
