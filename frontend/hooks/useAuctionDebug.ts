/**
 * Hook for debugging auction and claim status
 */

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  analyzeAllAuctionsForUser,
  analyzeAuctionForClaim,
  checkNFTOwnership,
} from "../utils/auctionDebug";

export interface AuctionDebugResult {
  auctionId: number;
  contractData: {
    auctionId: string;
    seller: string;
    highestBidder: string;
    status: number;
    isSettled: boolean;
    endTime: number;
    auctionType: number;
    tokenId: string;
  };
  analysis: {
    isEnded: boolean;
    isSettled: boolean;
    isTimeExpired: boolean;
    hasValidWinner: boolean;
    canBeClaimed: boolean;
    claimRequirements: string[];
  };
}

export function useAuctionDebug() {
  const [debugResults, setDebugResults] = useState<AuctionDebugResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address, isConnected } = useAccount();

  const analyzeAllAuctions = useCallback(async () => {
    if (!isConnected || !address) {
      setError("Wallet not connected");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("🔍 Starting comprehensive auction analysis...");

      const results = await analyzeAllAuctionsForUser(address);
      setDebugResults(results);

      // Log summary
      const claimableAuctions = results.filter((r) => r.analysis.canBeClaimed);
      const wonAuctions = results.filter((r) => r.analysis.hasValidWinner);

      console.log("📊 Analysis Summary:", {
        totalAuctions: results.length,
        wonAuctions: wonAuctions.length,
        claimableAuctions: claimableAuctions.length,
        claimableAuctionIds: claimableAuctions.map((a) => a.auctionId),
      });

      if (claimableAuctions.length > 0) {
        console.log(
          "🎯 Claimable Auctions:",
          claimableAuctions.map((a) => ({
            auctionId: a.auctionId,
            status: a.contractData.status,
            isSettled: a.contractData.isSettled,
            tokenId: a.contractData.tokenId,
          }))
        );
      } else {
        console.log("❌ No claimable auctions found");
        console.log(
          "🔍 Won auctions:",
          wonAuctions.map((a) => ({
            auctionId: a.auctionId,
            status: a.contractData.status,
            isSettled: a.contractData.isSettled,
            requirements: a.analysis.claimRequirements,
          }))
        );
      }
    } catch (error) {
      console.error("❌ Auction analysis failed:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address]);

  const analyzeSingleAuction = useCallback(
    async (auctionId: number) => {
      if (!isConnected || !address) {
        setError("Wallet not connected");
        return;
      }

      try {
        console.log(`🔍 Analyzing auction ${auctionId}...`);

        const result = await analyzeAuctionForClaim(auctionId, address);

        console.log(`📊 Auction ${auctionId} Analysis:`, {
          contractData: result.contractData,
          analysis: result.analysis,
        });

        return result;
      } catch (error) {
        console.error(`❌ Error analyzing auction ${auctionId}:`, error);
        throw error;
      }
    },
    [isConnected, address]
  );

  const checkNFTOwnershipForToken = useCallback(
    async (tokenId: string) => {
      if (!isConnected || !address) {
        setError("Wallet not connected");
        return false;
      }

      try {
        console.log(`🔍 Checking NFT ownership for token ${tokenId}...`);

        const isOwner = await checkNFTOwnership(tokenId, address);

        console.log(`📊 NFT ${tokenId} ownership:`, {
          tokenId,
          userAddress: address,
          isOwner,
        });

        return isOwner;
      } catch (error) {
        console.error(
          `❌ Error checking NFT ownership for token ${tokenId}:`,
          error
        );
        return false;
      }
    },
    [isConnected, address]
  );

  return {
    debugResults,
    isLoading,
    error,
    analyzeAllAuctions,
    analyzeSingleAuction,
    checkNFTOwnershipForToken,
  };
}



