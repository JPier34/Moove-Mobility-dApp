import { useCallback } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from "@/lib/contracts";

/**
 * Hook to automatically start reveal phase for newly created sealed bid auctions
 * This should be called immediately after creating a sealed bid auction
 */
export function useSealedBidAutoReveal() {
  const { address, isConnected } = useAccount();

  const startRevealPhaseForNewAuction = useCallback(
    async (auctionId: number): Promise<boolean> => {
      if (!isConnected || !address) {
        console.log(`⏭️ Cannot start reveal phase - wallet not connected`);
        toast.error("Wallet not connected");
        return false;
      }

      try {
        console.log(
          `🚀 Starting reveal phase for newly created sealed bid auction ${auctionId}`
        );

        if (!window.ethereum) {
          throw new Error("Ethereum provider not available");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const auctionContract = new ethers.Contract(
          CONTRACT_ADDRESSES.MooveAuction,
          CONTRACT_ABIS.MooveAuction,
          signer
        );

        // Call startRevealPhase
        const tx = await auctionContract.startRevealPhase(auctionId);
        console.log(`📝 Start reveal phase transaction submitted: ${tx.hash}`);

        await tx.wait();
        console.log(
          `✅ Reveal phase started successfully for auction ${auctionId}`
        );

        // Show notification
        toast.success(`🔓 Reveal phase started for auction #${auctionId}`);

        return true;
      } catch (error) {
        console.error(
          `❌ Error starting reveal phase for auction ${auctionId}:`,
          error
        );
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to start reveal phase: ${errorMessage}`);
        return false;
      }
    },
    [isConnected, address]
  );

  return {
    startRevealPhaseForNewAuction,
  };
}
