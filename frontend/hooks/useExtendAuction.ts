"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { useWriteContract } from "wagmi";
import { toast } from "react-hot-toast";
import { CONTRACT_ADDRESSES } from "../lib/contracts";
import MooveAuctionABI from "../src/abis/MooveAuction.json";
import { useHasRole } from "./useContract"; // Import role check hook

const AUCTION_MANAGER_ROLE =
  "0x2e1a7d4d13322e7b96f9a57413e1525c250fb7a9021cf91d1540d5b69f16a49f";

export interface ExtendAuctionHandler {
  extendAuction: (
    auctionId: number,
    additionalTimeMinutes: number
  ) => Promise<boolean>;
  isExtending: boolean;
  error: string | null;
  hasAuctionManagerRole: boolean;
  isCheckingRole: boolean;
}

export function useExtendAuction(): ExtendAuctionHandler {
  const { address, isConnected } = useAccount();
  const [isExtending, setIsExtending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has AUCTION_MANAGER_ROLE
  const { data: hasAuctionManagerRole, isLoading: isCheckingRole } = useHasRole(
    AUCTION_MANAGER_ROLE,
    address
  );

  const { writeContractAsync } = useWriteContract();

  const extendAuction = useCallback(
    async (
      auctionId: number,
      additionalTimeMinutes: number
    ): Promise<boolean> => {
      if (!isConnected || !address) {
        setError("Wallet not connected");
        toast.error("Connect wallet to extend auction");
        return false;
      }

      // Check if user has permission to extend auctions
      if (!hasAuctionManagerRole) {
        const errorMsg =
          "Insufficient permissions: AUCTION_MANAGER_ROLE required to extend auctions";
        setError(errorMsg);
        console.error("❌ Permission denied:", errorMsg);
        toast.error(
          "Permission denied: Cannot extend auctions with current wallet"
        );
        return false;
      }

      if (isExtending) {
        console.warn("Extension already in progress");
        return false;
      }

      setIsExtending(true);
      setError(null);

      try {
        const additionalTimeSeconds = additionalTimeMinutes * 60; // Convert to seconds

        console.log(
          `⏰ Extending auction ${auctionId} by ${additionalTimeMinutes} minutes (${additionalTimeSeconds} seconds)`
        );

        // Call the extendAuction function on the smart contract
        const result = await writeContractAsync({
          address: CONTRACT_ADDRESSES.MooveAuction,
          abi: MooveAuctionABI.abi,
          functionName: "extendAuction",
          args: [auctionId, additionalTimeSeconds],
        });

        console.log("✅ Auction extended successfully:", result);

        // Don't show toast here - let the calling function handle user feedback
        // since extension should be transparent to the user during bidding

        return true;
      } catch (error) {
        console.error("❌ Auction extension failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setError(errorMessage);

        // Only show error toast, not success
        if (errorMessage.includes("timeout")) {
          toast.error("Extension timeout - auction may still be extended");
        } else if (errorMessage.includes("user rejected")) {
          // User rejected - this shouldn't happen in auto-extension
          console.warn("User rejected auction extension transaction");
        } else {
          toast.error(`Failed to extend auction: ${errorMessage}`);
        }

        return false;
      } finally {
        setIsExtending(false);
      }
    },
    [
      address,
      isConnected,
      writeContractAsync,
      isExtending,
      hasAuctionManagerRole,
    ]
  );

  return {
    extendAuction,
    isExtending,
    error,
    hasAuctionManagerRole: Boolean(hasAuctionManagerRole),
    isCheckingRole: Boolean(isCheckingRole),
  };
}
