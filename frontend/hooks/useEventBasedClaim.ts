"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ethers } from "ethers";
import { contracts } from "../utils/contracts";
import toast from "react-hot-toast";

interface ClaimableAuction {
  auctionId: string;
  amount: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  canClaim: boolean;
  claimStatus: "pending" | "claiming" | "claimed" | "failed";
}

export function useEventBasedClaim() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const [claimableAuctions, setClaimableAuctions] = useState<
    ClaimableAuction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [currentClaimStep, setCurrentClaimStep] = useState<
    "idle" | "ending" | "settling"
  >("idle");
  const [currentAuctionId, setCurrentAuctionId] = useState<string | null>(null);

  const fetchClaimableAuctions = useCallback(async () => {
    if (!address) return;

    try {
      setLoading(true);
      console.log("🔍 Fetching claimable auctions based on events...");

      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL ||
          "https://ethereum-sepolia.publicnode.com"
      );

      const auctionABI = [
        "event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount, bool isHighestBid)",
        "event AuctionSettled(uint256 indexed auctionId, address indexed winner, uint256 finalPrice, uint256 platformFee, uint256 royaltyFee)",
        "event AuctionEnded(uint256 indexed auctionId)",
      ];

      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        auctionABI,
        provider
      );

      // Get events from the last 2000 blocks
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 2000);

      // Fetch all relevant events
      const [bidPlacedEvents, settledEvents, endedEvents] = await Promise.all([
        auctionContract.queryFilter(
          auctionContract.filters.BidPlaced(null, address),
          fromBlock,
          currentBlock
        ),
        auctionContract.queryFilter(
          auctionContract.filters.AuctionSettled(null, address),
          fromBlock,
          currentBlock
        ),
        auctionContract.queryFilter(
          auctionContract.filters.AuctionEnded(),
          fromBlock,
          currentBlock
        ),
      ]);

      console.log(`📊 Found events:`, {
        bidPlaced: bidPlacedEvents.length,
        settled: settledEvents.length,
        ended: endedEvents.length,
      });

      const userWins = new Map<string, ClaimableAuction>();
      const settledAuctions = new Set<string>();

      // Process BidPlaced events to find user wins
      for (const event of bidPlacedEvents) {
        if ("args" in event && event.args) {
          const { auctionId, bidder, amount, isHighestBid } = event.args;

          if (bidder.toLowerCase() === address.toLowerCase() && isHighestBid) {
            const block = await provider.getBlock(event.blockNumber);

            userWins.set(auctionId.toString(), {
              auctionId: auctionId.toString(),
              amount: ethers.formatEther(amount),
              transactionHash: event.transactionHash,
              blockNumber: event.blockNumber,
              timestamp: block.timestamp,
              canClaim: true,
              claimStatus: "pending",
            });
          }
        }
      }

      // Process AuctionSettled events to mark as already settled
      for (const event of settledEvents) {
        if ("args" in event && event.args) {
          const { auctionId, winner } = event.args;

          if (winner.toLowerCase() === address.toLowerCase()) {
            settledAuctions.add(auctionId.toString());

            // Update existing win to mark as claimed
            if (userWins.has(auctionId.toString())) {
              userWins.set(auctionId.toString(), {
                ...userWins.get(auctionId.toString())!,
                canClaim: false,
                claimStatus: "claimed",
              });
            }
          }
        }
      }

      // Process AuctionEnded events to determine if auction is ready for settlement
      for (const event of endedEvents) {
        if ("args" in event && event.args) {
          const { auctionId } = event.args;

          // If user has a winning bid and auction ended, it should be claimable
          if (userWins.has(auctionId.toString())) {
            const win = userWins.get(auctionId.toString())!;
            if (win.claimStatus === "pending") {
              userWins.set(auctionId.toString(), {
                ...win,
                canClaim: true,
              });
            }
          }
        }
      }

      // Check for auctions that should be claimable based on time
      const currentTime = Math.floor(Date.now() / 1000);
      const AUCTION_TIMEOUT = 300; // 5 minutes

      for (const [auctionId, win] of userWins) {
        const timeSinceBid = currentTime - win.timestamp;

        // If it's been more than 5 minutes since the bid and not settled, consider it claimable
        if (timeSinceBid > AUCTION_TIMEOUT && !settledAuctions.has(auctionId)) {
          userWins.set(auctionId, {
            ...win,
            canClaim: true,
          });
        }
      }

      const claimableList = Array.from(userWins.values())
        .filter((auction) => auction.canClaim)
        .sort((a, b) => b.timestamp - a.timestamp);

      console.log(`🎯 Found ${claimableList.length} claimable auctions`);
      setClaimableAuctions(claimableList);
    } catch (error) {
      console.error("❌ Error fetching claimable auctions:", error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchClaimableAuctions();

    // Refresh every 30 seconds
    const interval = setInterval(fetchClaimableAuctions, 30000);
    return () => clearInterval(interval);
  }, [fetchClaimableAuctions]);

  const claimAuction = useCallback(
    async (auctionId: string) => {
      if (!address) {
        toast.error("Wallet not connected");
        return;
      }

      try {
        console.log(`🎯 Starting claim process for auction ${auctionId}...`);

        // Update local state to show claiming status
        setClaimableAuctions((prev) =>
          prev.map((auction) =>
            auction.auctionId === auctionId
              ? { ...auction, claimStatus: "claiming" as const }
              : auction
          )
        );

        // Set current auction and step
        setCurrentAuctionId(auctionId);
        setCurrentClaimStep("ending");

        // Step 1: Force end the auction (bypasses all timestamp checks)
        console.log(`📝 Step 1: Force ending auction ${auctionId}...`);
        writeContract({
          address: contracts.MooveAuction.address,
          abi: contracts.MooveAuction.abi,
          functionName: "endAuction",
          args: [auctionId],
        });
      } catch (error) {
        console.error(
          `❌ Error starting claim for auction ${auctionId}:`,
          error
        );
        toast.error(`Failed to start claim for auction ${auctionId}`);

        // Reset status on error
        setClaimableAuctions((prev) =>
          prev.map((auction) =>
            auction.auctionId === auctionId
              ? { ...auction, claimStatus: "pending" as const }
              : auction
          )
        );
        setCurrentClaimStep("idle");
        setCurrentAuctionId(null);
      }
    },
    [address, writeContract]
  );

  // Handle transaction success/failure
  useEffect(() => {
    if (isSuccess && hash && currentAuctionId) {
      if (currentClaimStep === "ending") {
        console.log(
          `✅ Auction ${currentAuctionId} ended successfully, now settling...`
        );
        setCurrentClaimStep("settling");

        // Step 2: Now try to settle the auction
        setTimeout(() => {
          writeContract({
            address: contracts.MooveAuction.address,
            abi: contracts.MooveAuction.abi,
            functionName: "settleAuction",
            args: [currentAuctionId],
          });
        }, 1000); // Small delay to ensure the first transaction is processed
      } else if (currentClaimStep === "settling") {
        console.log(`✅ Auction ${currentAuctionId} settled successfully!`);
        toast.success("Auction claimed successfully!");

        // Reset state
        setCurrentClaimStep("idle");
        setCurrentAuctionId(null);

        // Refresh the list
        fetchClaimableAuctions();
      }
    }

    if (error && currentAuctionId) {
      console.error(
        `❌ Transaction failed for auction ${currentAuctionId}:`,
        error
      );

      if (currentClaimStep === "ending") {
        toast.error(
          `Failed to end auction ${currentAuctionId}. Trying to settle directly...`
        );

        // Try to settle directly (maybe auction is already ended)
        setCurrentClaimStep("settling");
        setTimeout(() => {
          writeContract({
            address: contracts.MooveAuction.address,
            abi: contracts.MooveAuction.abi,
            functionName: "settleAuction",
            args: [currentAuctionId],
          });
        }, 1000);
      } else {
        toast.error(
          `Claim failed for auction ${currentAuctionId}: ${error.message}`
        );

        // Reset claiming status
        setClaimableAuctions((prev) =>
          prev.map((auction) =>
            auction.auctionId === currentAuctionId
              ? { ...auction, claimStatus: "pending" as const }
              : auction
          )
        );

        // Reset state
        setCurrentClaimStep("idle");
        setCurrentAuctionId(null);
      }
    }
  }, [
    isSuccess,
    error,
    hash,
    currentAuctionId,
    currentClaimStep,
    writeContract,
    fetchClaimableAuctions,
  ]);

  return {
    claimableAuctions,
    loading,
    claimAuction,
    isPending: isPending || isConfirming,
    refetch: fetchClaimableAuctions,
  };
}
