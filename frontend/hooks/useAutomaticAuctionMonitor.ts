import { useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

/**
 * Hook per monitoraggio automatico delle aste sealed bid
 * Chiama automaticamente endAuction() quando l'asta scade
 */
export function useAutomaticAuctionMonitor() {
  const { address, isConnected } = useAccount();

  const checkAndEndExpiredAuctions = useCallback(async () => {
    if (!isConnected || !address) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      // Get total auctions
      const totalAuctions = await auctionContract.totalAuctions();
      const currentTime = Math.floor(Date.now() / 1000);

      console.log(`🔍 Checking ${totalAuctions} auctions for expiration...`);

      for (let i = 0; i < totalAuctions; i++) {
        try {
          const auction = await auctionContract.getAuction(i);
          const auctionType = Number(auction.auctionType);
          const status = Number(auction.status);
          const endTime = Number(auction.endTime);

          // Check if it's a sealed bid auction that should be ended
          if (auctionType === 2 && status === 1 && currentTime >= endTime) {
            console.log(`⏰ Auction ${i} expired, calling endAuction()...`);

            // Call endAuction() to automatically determine winner and settle
            const signer = await provider.getSigner();
            const auctionContractWithSigner = auctionContract.connect(signer);

            const tx = await (auctionContractWithSigner as any).endAuction(i);
            console.log(`📝 End auction transaction submitted: ${tx.hash}`);

            await tx.wait();
            console.log(`✅ Auction ${i} ended and settled automatically`);

            // Emit custom event for frontend notification
            window.dispatchEvent(
              new CustomEvent("auctionEnded", {
                detail: { auctionId: i, tokenId: Number(auction.tokenId) },
              })
            );
          }
        } catch (error) {
          console.error(`❌ Error checking auction ${i}:`, error);
        }
      }
    } catch (error) {
      console.error("❌ Error in auction monitoring:", error);
    }
  }, [isConnected, address]);

  // Monitor every 30 seconds
  useEffect(() => {
    if (!isConnected) return;

    console.log("🔄 Starting automatic auction monitoring...");

    // Check immediately
    checkAndEndExpiredAuctions();

    // Then check every 30 seconds
    const interval = setInterval(checkAndEndExpiredAuctions, 30000);

    return () => {
      console.log("🛑 Stopping automatic auction monitoring...");
      clearInterval(interval);
    };
  }, [isConnected, checkAndEndExpiredAuctions]);

  return {
    checkAndEndExpiredAuctions,
  };
}
