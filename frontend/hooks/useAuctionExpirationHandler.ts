import { useCallback, useEffect, useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/utils/contracts";
import { AuctionStatus } from "@/types/auction";
import MooveAuctionArtifact from "@/src/abis/MooveAuction.json";
import { ethers } from "ethers";
import toast from "react-hot-toast";

interface ExpiredAuction {
  auctionId: number;
  endTime: number;
  status: number;
}

export function useAuctionExpirationHandler() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [processedAuctions, setProcessedAuctions] = useState<Set<number>>(
    new Set()
  );

  // Automatically end expired auctions
  const processExpiredAuctions = useCallback(async () => {
    if (!isConnected || !address) return;

    try {
      // Check auctions from 20 onwards (as requested)
      const auctionIdsToCheck = Array.from({ length: 50 }, (_, i) => i + 20);

      for (const auctionId of auctionIdsToCheck) {
        // Skip if already processed
        if (processedAuctions.has(auctionId)) continue;

        try {
          // Get auction data using the same approach as useIncrementalAuctions
          const provider = new ethers.JsonRpcProvider(
            process.env.NEXT_PUBLIC_RPC_URL ||
              "https://sepolia.infura.io/v3/YOUR_PROJECT_ID"
          );
          const contract = new ethers.Contract(
            CONTRACT_ADDRESSES.MooveAuction,
            MooveAuctionArtifact.abi,
            provider
          );

          const rawAuctionData = await contract.getAuction(auctionId);

          if (rawAuctionData) {
            const currentTime = Math.floor(Date.now() / 1000);
            const endTime = Number(rawAuctionData[16]); // endTime is at index 16
            const status = Number(rawAuctionData[5]); // status is at index 5

            console.log(`🔍 Checking auction ${auctionId}:`, {
              currentTime,
              endTime: new Date(endTime * 1000).toISOString(),
              status,
              isExpired: currentTime >= endTime,
              isActive: status === AuctionStatus.ACTIVE,
              timeRemaining: endTime - currentTime,
            });

            // Check if auction is expired but still ACTIVE
            if (currentTime >= endTime && status === AuctionStatus.ACTIVE) {
              console.log(
                `🔄 Automatically ending expired auction ${auctionId}...`
              );

              try {
                await writeContractAsync({
                  address: CONTRACT_ADDRESSES.MooveAuction as `0x${string}`,
                  abi: MooveAuctionArtifact.abi,
                  functionName: "endAuction",
                  args: [auctionId],
                });

                console.log(`✅ Successfully ended auction ${auctionId}`);

                // Mark as processed
                setProcessedAuctions((prev) => new Set([...prev, auctionId]));

                // Show success notification
                toast.success(`Auction #${auctionId} ended automatically`);
              } catch (endError) {
                console.error(
                  `❌ Failed to end auction ${auctionId}:`,
                  endError
                );
                // Don't mark as processed if it failed, so we can retry
              }
            } else if (status !== AuctionStatus.ACTIVE) {
              // Auction is not ACTIVE, mark as processed
              setProcessedAuctions((prev) => new Set([...prev, auctionId]));
            }
          }
        } catch (error) {
          console.log(`Auction ${auctionId} not found or error:`, error);
          // Auction doesn't exist or other error - mark as processed to avoid retrying
          setProcessedAuctions((prev) => new Set([...prev, auctionId]));
        }
      }

      console.log(
        `📊 Expiration check complete for auctions 20-69. Processed: ${
          Array.from(processedAuctions).length
        }`
      );
    } catch (error) {
      console.error("Error processing expired auctions:", error);
    }
  }, [isConnected, address, writeContractAsync, processedAuctions]);

  // Process expired auctions automatically every 30 seconds
  useEffect(() => {
    if (isConnected) {
      // Process immediately
      processExpiredAuctions();

      // Then process every 30 seconds
      const interval = setInterval(processExpiredAuctions, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, processExpiredAuctions]);

  return {
    processedAuctions: Array.from(processedAuctions),
    processExpiredAuctions,
  };
}
