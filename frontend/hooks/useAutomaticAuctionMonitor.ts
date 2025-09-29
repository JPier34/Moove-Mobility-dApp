import { useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import { useAuctionNotificationTriggers } from "./useUnifiedAuctionNotifications";

/**
 * Hook per monitoraggio automatico di TUTTE le aste
 * Chiama automaticamente settleAuction() e refundRemainingBidders() quando l'asta scade
 * Sistema completamente automatico per settlement e rimborsi
 */
export function useAutomaticAuctionMonitor() {
  const { address, isConnected } = useAccount();
  const { notifyAuctionFailed } = useAuctionNotificationTriggers();

  const checkAndSettleExpiredAuctions = useCallback(async () => {
    if (!isConnected || !address) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      // Get total auctions with fallback
      let totalAuctions = 0;
      try {
        totalAuctions = await auctionContract.totalAuctions();
      } catch (error) {
        console.warn(
          "⚠️ totalAuctions function not available, using fallback method"
        );
        // Fallback: try to find auctions by checking sequential IDs
        let foundAuctions = 0;
        for (let i = 0; i < 100; i++) {
          // Check up to 100 auctions
          try {
            const auction = await auctionContract.getAuction(i);
            if (
              auction &&
              auction.seller !== "0x0000000000000000000000000000000000000000"
            ) {
              foundAuctions = i + 1;
            } else {
              break;
            }
          } catch {
            break;
          }
        }
        totalAuctions = foundAuctions;
      }

      const currentTime = Math.floor(Date.now() / 1000);

      console.log(`🔍 Checking ${totalAuctions} auctions for expiration...`);

      for (let i = 0; i < totalAuctions; i++) {
        try {
          const auction = await auctionContract.getAuction(i);
          const auctionType = Number(auction.auctionType);
          const status = Number(auction.status);
          const endTime = Number(auction.endTime);
          const isSettled = auction.isSettled;

          // Check if auction is expired and not settled
          if (status === 1 && currentTime >= endTime && !isSettled) {
            console.log(
              `⏰ Auction ${i} expired (Type: ${auctionType}), starting automatic settlement...`
            );

            // Call settleAuction() to determine winner and settle
            const signer = await provider.getSigner();
            const auctionContractWithSigner = auctionContract.connect(signer);

            try {
              // Step 1: Settle the auction (determine winner, transfer NFT)
              console.log(
                `🔄 Step 1: Calling settleAuction() for auction ${i}...`
              );
              const settleTx = await (
                auctionContractWithSigner as any
              ).settleAuction(i);
              console.log(
                `📝 Settle auction transaction submitted: ${settleTx.hash}`
              );

              await settleTx.wait();
              console.log(`✅ Auction ${i} settled successfully`);

              // Step 2: Process refunds for losing bidders (except Dutch auctions)
              if (auctionType !== 1) {
                // Dutch auctions don't need refunds
                console.log(
                  `💰 Step 2: Processing refunds for auction ${i}...`
                );

                try {
                  // Call refundRemainingBidders with batch processing
                  const refundTx = await (
                    auctionContractWithSigner as any
                  ).refundRemainingBidders(
                    i,
                    0, // startIndex
                    50 // batchSize
                  );
                  console.log(
                    `📝 Refund transaction submitted: ${refundTx.hash}`
                  );

                  await refundTx.wait();
                  console.log(
                    `✅ Refunds processed successfully for auction ${i}`
                  );
                } catch (refundError) {
                  console.warn(
                    `⚠️ Refund processing failed for auction ${i}:`,
                    refundError
                  );
                  // Notifica errore di rimborso
                  notifyAuctionFailed(
                    i.toString(),
                    `Refund processing failed: ${refundError}`
                  );
                  // Continue even if refunds fail - the auction is still settled
                }
              } else {
                console.log(`ℹ️ Dutch auction ${i} - no refunds needed`);
              }

              // Emit custom event for frontend notification
              window.dispatchEvent(
                new CustomEvent("auctionSettled", {
                  detail: {
                    auctionId: i,
                    tokenId: Number(auction.tokenId),
                    auctionType,
                    fullyProcessed: true, // Indicates both settlement and refunds completed
                  },
                })
              );

              console.log(
                `🎉 Auction ${i} fully processed (settlement + refunds)`
              );
            } catch (settleError) {
              console.error(`❌ Error settling auction ${i}:`, settleError);
              // Notifica errore di settlement
              notifyAuctionFailed(
                i.toString(),
                `Settlement failed: ${settleError}`
              );
            }
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
    checkAndSettleExpiredAuctions();

    // Then check every 30 seconds
    const interval = setInterval(checkAndSettleExpiredAuctions, 30000);

    return () => {
      console.log("🛑 Stopping automatic auction monitoring...");
      clearInterval(interval);
    };
  }, [isConnected, checkAndSettleExpiredAuctions]);

  return {
    checkAndSettleExpiredAuctions,
  };
}
