import { useState, useEffect } from "react";
import { useWonAuctionsForClaim } from "./useWonAuctionsForClaim";
import { useSettleAuction } from "./useUserCollection";
import { useStartRevealPhase } from "./useAuction";
import { useAuctionNotificationTriggers } from "./useUnifiedAuctionNotifications";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "../utils/contracts";

// Funzione per verificare lo stato dell'asta direttamente dal contratto
async function checkAuctionStatus(auctionId: string) {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("No ethereum provider available");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const auctionContract = new ethers.Contract(
      contracts.MooveAuction.address,
      contracts.MooveAuction.abi,
      provider
    );

    console.log(
      `🔍 Checking auction ${auctionId} status directly from contract...`
    );

    const auctionData = await auctionContract.getAuction(auctionId);

    // Use contract status directly - no corrections
    const status = Number(auctionData.status);
    const endTime = Number(auctionData.endTime);
    const currentTime = Math.floor(Date.now() / 1000);

    // Safe date formatting for potentially corrupted endTime
    let endTimeFormatted = "Invalid Date";
    let timeDifference = 0;
    let timeExpired = false;

    try {
      if (endTime && endTime > 0 && endTime < 2000000000) {
        // Valid timestamp range
        endTimeFormatted = new Date(endTime * 1000).toISOString();
        timeDifference = (endTime * 1000 - Date.now()) / 1000;
        timeExpired = currentTime >= endTime;
      }
    } catch (dateError) {
      console.warn(`⚠️ Invalid endTime for auction ${auctionId}:`, endTime);
    }

    console.log(`📊 Contract auction data:`, {
      auctionId: auctionData.auctionId.toString(),
      status: status,
      isSettled: auctionData.isSettled,
      highestBidder: auctionData.highestBidder,
      highestBid: ethers.formatEther(auctionData.highestBid),
      endTime: endTimeFormatted,
      endTimeRaw: endTime,
      currentTime: new Date().toISOString(),
      timeDifference: timeDifference,
      timeExpired: timeExpired,
      auctionType: Number(auctionData.auctionType || 0), // 0 = public, 1 = sealed bid
    });

    return {
      status: status, // Use contract status directly
      isSettled: auctionData.isSettled,
      highestBidder: auctionData.highestBidder,
      highestBid: ethers.formatEther(auctionData.highestBid),
      endTime:
        endTime && endTime > 0 && endTime < 2000000000 ? endTime * 1000 : 0,
      auctionType: Number(auctionData.auctionType || 0), // 0 = public, 1 = sealed bid
      seller: auctionData.seller, // Add seller information
      tokenId: auctionData.tokenId.toString(),
    };
  } catch (error) {
    console.error(`❌ Error checking auction ${auctionId} status:`, error);
    throw error;
  }
}

export function useWonAuctionsManager() {
  const { unsettledAuctions, isLoading, refetch } = useWonAuctionsForClaim();
  const { settleAuction, isSettling, error } = useSettleAuction();
  const { notifyAuctionDeserted } = useAuctionNotificationTriggers();
  const { address } = useAccount();
  const {
    startRevealPhase,
    isPending: isStartingReveal,
    isSuccess: isRevealStarted,
    error: revealError,
  } = useStartRevealPhase();
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [currentAuction, setCurrentAuction] = useState<any>(null);

  // Modal is now shown manually when user clicks on an NFT
  // No automatic modal opening to prevent infinite loops

  // Close the modal when the auction is settled successfully
  useEffect(() => {
    if (!isSettling && showCongratulations) {
      console.log(`🎉 Auction settled successfully! Closing modal...`);
      setShowCongratulations(false);
      setCurrentAuction(null);
      // Refresh the data to update the list
      refetch();
    }
  }, [isSettling, showCongratulations, refetch]);

  // Debug for transaction errors
  useEffect(() => {
    if (error) {
      console.error(`❌ Settle auction error:`, error);
      alert(`Settle auction failed: ${error}`);
    }
  }, [error]);

  // Debug for reveal phase errors
  useEffect(() => {
    if (revealError) {
      console.error(`❌ Reveal phase error:`, revealError);
      alert(`Reveal phase failed: ${revealError.message || "Unknown error"}`);
    }
  }, [revealError]);

  const handleSettleAuction = async (auctionId: string) => {
    try {
      console.log(`🏆 Attempting to settle auction ${auctionId}...`);

      // Preliminary check: check if the auction is ready for settle
      const auction = unsettledAuctions.find((a) => a.auctionId === auctionId);
      if (!auction) {
        console.error(
          `❌ Auction ${auctionId} not found in unsettled auctions`
        );
        return;
      }

      // Don't show the global modal - we're using the 3-phase system
      // setCurrentAuction(auction);
      // setShowCongratulations(true);

      console.log(`📊 Local auction ${auctionId} details:`, {
        status: auction.status,
        isSettled: auction.isSettled,
        finalBid: auction.currentBid,
        bidders: auction.highestBidder,
        endTime: auction.endTime
          ? new Date(auction.endTime).toISOString()
          : "undefined",
        currentTime: new Date().toISOString(),
        timeDifference:
          auction.endTime && typeof auction.endTime === "number"
            ? (auction.endTime - Date.now()) / 1000
            : "undefined",
      });

      // Verifica diretta dal contratto per avere dati aggiornati
      console.log(
        `🔍 Checking auction ${auctionId} status directly from contract...`
      );
      const contractStatus = await checkAuctionStatus(auctionId);

      console.log(`📊 Contract auction ${auctionId} status:`, contractStatus);

      // Check if the auction is already settled
      if (contractStatus.isSettled) {
        console.log(`ℹ️ Auction ${auctionId} is already settled`);

        // Check if it has a valid winner
        if (
          contractStatus.highestBidder &&
          contractStatus.highestBidder !== ethers.ZeroAddress
        ) {
          console.log(
            `✅ Auction ${auctionId} is settled with winner: ${contractStatus.highestBidder}`
          );
          // This auction is properly settled with a winner
          return;
        } else {
          console.log(
            `⚠️ Auction ${auctionId} is settled but has no valid winner - this is a deserted auction`
          );

          // Check if the current user is the admin/seller
          const isAdmin =
            contractStatus.seller &&
            address &&
            contractStatus.seller.toLowerCase() === address.toLowerCase();

          if (isAdmin) {
            console.log(
              `🏠 Admin detected: NFT from deserted auction ${auctionId} should be returned to admin's collection`
            );
            // The NFT should be back in the admin's collection
            // Trigger notification for the admin
            notifyAuctionDeserted(auctionId);
            alert(
              `Auction ${auctionId} was deserted (no valid winner). The NFT has been returned to your collection.`
            );
          } else {
            alert(
              `Auction ${auctionId} is already settled but has no valid winner. This auction cannot be claimed.`
            );
          }

          // IMPORTANT: Refresh the won auctions list to remove this auction
          console.log(
            `🔄 Refreshing won auctions list after deserted auction detection...`
          );
          refetch();
          return;
        }
      }

      // Check if the auction has a winner
      if (
        !contractStatus.highestBid ||
        parseFloat(contractStatus.highestBid) <= 0
      ) {
        console.error(`❌ Auction ${auctionId} has no valid bid`);
        alert(`Auction ${auctionId} has no valid bid`);
        return;
      }

      // Check if the auction has actually ended in time
      const now = Date.now();
      const endTime = contractStatus.endTime;
      if (now < endTime) {
        console.error(
          `❌ Auction ${auctionId} is not yet ended (ends at: ${new Date(
            endTime
          ).toISOString()})`
        );
        alert(
          `Auction ${auctionId} is not yet ended. Please wait until the auction ends.`
        );
        return;
      }

      // Check if the auction has a valid winner
      if (
        !contractStatus.highestBidder ||
        contractStatus.highestBidder === ethers.ZeroAddress
      ) {
        console.error(`❌ Auction ${auctionId} has no valid winner`);
        alert(`Auction ${auctionId} has no valid winner. Cannot settle.`);
        return;
      }

      // If the auction has ended in time but still has status ACTIVE, call endAuction first
      if (contractStatus.status === 1) {
        // ACTIVE
        console.log(
          `🔄 Auction ${auctionId} is ACTIVE but time-expired. Calling endAuction first...`
        );
        try {
          const provider = new ethers.BrowserProvider(window.ethereum as any);
          const signer = await provider.getSigner();
          const auctionContract = new ethers.Contract(
            contracts.MooveAuction.address,
            contracts.MooveAuction.abi,
            signer
          );

          console.log(`🏁 Ending auction ${auctionId}...`);

          // DEBUG: Log all auction data before endAuction
          const auctionDataBefore = await auctionContract.getAuction(auctionId);
          console.log(`🔍 Auction ${auctionId} data BEFORE endAuction:`, {
            status: Number(auctionDataBefore.status),
            endTime: Number(auctionDataBefore.endTime),
            endTimeFormatted: new Date(
              Number(auctionDataBefore.endTime) * 1000
            ).toISOString(),
            currentTime: Math.floor(Date.now() / 1000),
            currentTimeFormatted: new Date().toISOString(),
            timeExpired:
              Math.floor(Date.now() / 1000) >=
              Number(auctionDataBefore.endTime),
            auctionType: Number(auctionDataBefore.auctionType),
            isSettled: auctionDataBefore.isSettled,
          });

          const endTx = await auctionContract.endAuction(auctionId);
          console.log(`🏁 End auction transaction sent:`, endTx.hash);

          const endReceipt = await endTx.wait();
          console.log(
            `✅ Auction ${auctionId} ended successfully:`,
            endReceipt
          );

          // Wait longer to ensure the status is updated on blockchain
          await new Promise((resolve) => setTimeout(resolve, 5000)); // Increased to 5 seconds

          // Check if the auction has actually ended (with retry)
          console.log(
            `🔍 Verifying auction ${auctionId} status after endAuction...`
          );

          let updatedStatus = await checkAuctionStatus(auctionId);
          console.log(
            `📊 Updated auction status (first check):`,
            updatedStatus
          );

          // Retry if status is still not ENDED
          if (updatedStatus.status !== 3) {
            console.log(
              `⏳ Status not ENDED yet, waiting 3 more seconds and retrying...`
            );
            await new Promise((resolve) => setTimeout(resolve, 3000));

            updatedStatus = await checkAuctionStatus(auctionId);
            console.log(
              `📊 Updated auction status (retry check):`,
              updatedStatus
            );
          }

          if (updatedStatus.status !== 3) {
            console.error(
              `❌ Auction ${auctionId} is still not ENDED after endAuction. Status: ${updatedStatus.status}`
            );
            alert(
              `Auction ${auctionId} is still not ready for settlement. Please try again in a few moments.`
            );
            return;
          }

          console.log(
            `✅ Auction ${auctionId} is now ENDED. Proceeding with settleAuction...`
          );
        } catch (endError) {
          console.error(`❌ Error ending auction ${auctionId}:`, endError);

          // DEBUG: Detailed error analysis
          const error = endError as any;
          if (error.message) {
            console.error(`❌ Error message: ${error.message}`);
          }
          if (error.code) {
            console.error(`❌ Error code: ${error.code}`);
          }
          if (error.reason) {
            console.error(`❌ Error reason: ${error.reason}`);
          }

          // Check if it's a contract revert
          if (error.message?.includes("Auction not active")) {
            console.error(
              `❌ Auction ${auctionId} is not ACTIVE - status might be wrong`
            );
          }
          if (error.message?.includes("Auction not ended yet")) {
            console.error(
              `❌ Auction ${auctionId} is not expired yet - timing issue`
            );
          }
          if (error.message?.includes("Auction does not exist")) {
            console.error(`❌ Auction ${auctionId} does not exist`);
          }

          alert(
            `Failed to end auction: ${
              endError instanceof Error ? endError.message : "Unknown error"
            }`
          );
          return;
        }
      } else if (contractStatus.status === 2) {
        // REVEAL
        console.log(
          `🔍 Auction ${auctionId} is in REVEAL phase. Checking auction type...`
        );

        // Check if this is a sealed bid auction (auctionType === 2)
        if (contractStatus.auctionType === 2) {
          console.log(
            `🔍 Sealed bid auction detected. Starting reveal phase...`
          );
          startRevealPhase(parseInt(auctionId));
          console.log(
            `✅ Reveal phase started for sealed bid auction ${auctionId}`
          );

          // Wait for reveal phase to complete
          await new Promise((resolve) => setTimeout(resolve, 3000));

          // After reveal phase, the auction should be ready for settlement
          console.log(
            `✅ Sealed bid auction ${auctionId} reveal phase completed. Ready for settlement.`
          );
        } else {
          console.log(
            `❌ Non-sealed bid auction in REVEAL phase. This shouldn't happen.`
          );
          alert(
            `Auction ${auctionId} is in an invalid state. Please contact support.`
          );
          return;
        }
      } else if (contractStatus.status === 3) {
        // ENDED
        console.log(
          `✅ Auction ${auctionId} is already ENDED. Ready for settlement.`
        );
      } else {
        console.error(
          `❌ Auction ${auctionId} has invalid status: ${contractStatus.status}`
        );
        alert(
          `Auction ${auctionId} has invalid status: ${contractStatus.status}`
        );
        return;
      }

      console.log(
        `✅ All checks passed for auction ${auctionId}. Proceeding with settle...`
      );

      console.log(`🔍 Final contract status before settle:`, {
        auctionId,
        status: contractStatus.status,
        isSettled: contractStatus.isSettled,
        highestBidder: contractStatus.highestBidder,
        highestBid: contractStatus.highestBid,
        endTime: new Date(contractStatus.endTime).toISOString(),
      });

      // Call settleAuction (non-async, triggers transaction)
      console.log(`🔨 Calling settleAuction for auction ${auctionId}...`);
      settleAuction(auctionId);
      console.log(`✅ Settle auction ${auctionId} transaction initiated`);

      // Return a promise that resolves when the transaction is confirmed
      return new Promise((resolve, reject) => {
        // This will be handled by the useWaitForTransactionReceipt hook
        // We'll resolve this in the provider when we get the confirmation
        resolve({ success: true, auctionId });
      });
    } catch (error) {
      console.error("Error settling auction:", error);
      // Show error to the user in a modal
      alert(
        `Failed to settle auction: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleCloseCongratulationsModal = () => {
    setShowCongratulations(false);
    setCurrentAuction(null);
  };

  // Close the modal when the auction is settled successfully
  useEffect(() => {
    if (!isSettling && showCongratulations) {
      setShowCongratulations(false);
      setCurrentAuction(null);
      // Refetch to update the list
      refetch();
    }
  }, [isSettling, showCongratulations, refetch]);

  return {
    unsettledAuctions,
    currentAuction,
    showCongratulations,
    isSettling,
    error,
    isLoading,
    handleSettleAuction,
    handleCloseCongratulationsModal,
    refetch,
  };
}
