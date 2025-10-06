import { useEffect, useCallback, useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import { useAuctionNotificationTriggers } from "./useUnifiedAuctionNotifications";
// Removed contract data validation - contract works correctly

/**
 * Hook per monitoraggio automatico di TUTTE le aste
 * Chiama automaticamente settleAuction() e refundRemainingBidders() quando l'asta scade
 * Sistema completamente automatico per settlement e rimborsi
 */
export function useAutomaticAuctionMonitor() {
  const { address, isConnected } = useAccount();
  const { notifyAuctionFailed, notifyAuctionDeserted } =
    useAuctionNotificationTriggers();

  // Track processed auctions to prevent multiple calls
  const [processedAuctions, setProcessedAuctions] = useState<Set<number>>(
    new Set()
  );

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
        for (let i = 24; i < 100; i++) {
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

      // Check auctions from 24 onwards (skip problematic auctions 0-23)
      for (let i = 24; i < totalAuctions; i++) {
        try {
          const auction = await auctionContract.getAuction(i);

          const auctionType = Number(auction.auctionType);
          const status = Number(auction.status);
          const endTime = Number(auction.endTime);
          const isSettled = auction.isSettled;

          // Check if auction is expired and not settled
          // Also handle auctions with invalid endTime (like test values in year 2286)
          const isInvalidEndTime = endTime > 2000000000; // Year 2033+ is suspicious
          const isExpired =
            (status === 1 || status === 2) && currentTime >= endTime; // ACTIVE or REVEAL but time expired
          const shouldForceSettle =
            isInvalidEndTime && !isSettled && status === 0; // Force settle invalid auctions with PENDING status

          // Skip if already processed or already settled
          if (processedAuctions.has(i) || isSettled) {
            if (isSettled) {
              console.log(`⏭️ Auction ${i} already settled, skipping`);
            }
            continue;
          }

          if ((isExpired || shouldForceSettle) && !isSettled) {
            if (shouldForceSettle) {
              console.log(
                `🔧 Auction ${i} has invalid endTime (${new Date(
                  endTime * 1000
                ).toISOString()}), forcing settlement...`
              );
            } else {
              console.log(
                `⏰ Auction ${i} expired (Type: ${auctionType}), starting automatic settlement...`
              );
            }

            // Handle different auction types and statuses
            const signer = await provider.getSigner();
            const auctionContractWithSigner = auctionContract.connect(signer);

            try {
              // Mark as processed to prevent multiple calls
              setProcessedAuctions((prev) => new Set([...prev, i]));

              // Step 1: End the auction based on status and type
              if (status === 1) {
                // ACTIVE - can call endAuction
                console.log(
                  `🔄 Step 1: Calling endAuction() for ACTIVE auction ${i}...`
                );
                const endTx = await (
                  auctionContractWithSigner as any
                ).endAuction(i);
                console.log(
                  `📝 End auction transaction submitted: ${endTx.hash}`
                );

                await endTx.wait();
                console.log(`✅ Auction ${i} ended successfully`);

                // Wait longer for status to update on blockchain
                await new Promise((resolve) => setTimeout(resolve, 5000));
              } else if (status === 2 && auctionType === 2) {
                // REVEAL status for Sealed Bid auction - skip endAuction, go directly to settle
                console.log(
                  `🔄 Step 1: Sealed Bid auction ${i} in REVEAL phase, skipping endAuction...`
                );
              } else {
                console.log(
                  `⚠️ Auction ${i} has status ${status}, cannot call endAuction. Skipping automatic processing.`
                );
                continue;
              }

              // Step 2: Settle the auction (determine winner, transfer NFT)
              console.log(
                `🔄 Step 2: Calling settleAuction() for auction ${i}...`
              );
              const settleTx = await (
                auctionContractWithSigner as any
              ).settleAuction(i);
              console.log(
                `📝 Settle auction transaction submitted: ${settleTx.hash}`
              );

              await settleTx.wait();
              console.log(`✅ Auction ${i} settled successfully`);

              // Check if the auction was deserted (no valid winner)
              const settledAuction = await auctionContract.getAuction(i);
              const hasValidWinner =
                settledAuction.highestBidder &&
                settledAuction.highestBidder !==
                  "0x0000000000000000000000000000000000000000" &&
                settledAuction.highestBidder !==
                  "0x000000000000000000000000000000E8D4A51000" &&
                settledAuction.highestBidder !==
                  "0x0000000000000000000000000000000000000001";

              if (!hasValidWinner) {
                console.log(`🏠 Auction ${i} was deserted - no valid winner`);
                // Notify the seller/admin that their NFT was returned
                const seller = settledAuction.seller;
                if (seller && seller.toLowerCase() === address.toLowerCase()) {
                  notifyAuctionDeserted(i.toString());
                }
              }

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
  }, [isConnected, address, notifyAuctionFailed, processedAuctions]);

  // DISABLED: Monitor every 30 seconds - causing recursive calls
  // useEffect(() => {
  //   if (!isConnected) return;

  //   console.log("🔄 Starting automatic auction monitoring...");

  //   // Check immediately
  //   checkAndSettleExpiredAuctions();

  //   // Then check every 30 seconds
  //   const interval = setInterval(checkAndSettleExpiredAuctions, 30000);

  //   return () => {
  //     console.log("🛑 Stopping automatic auction monitoring...");
  //     clearInterval(interval);
  //   };
  // }, [isConnected, checkAndSettleExpiredAuctions]);

  return {
    checkAndSettleExpiredAuctions,
  };
}
