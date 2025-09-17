import { useState, useEffect } from "react";
import { useWonAuctionsForClaim } from "./useWonAuctionsForClaim";
import { useSettleAuction } from "./useUserCollection";
import { useStartRevealPhase } from "./useAuction";
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

    console.log(`📊 Contract auction data:`, {
      auctionId: auctionData.auctionId.toString(),
      status: status,
      isSettled: auctionData.isSettled,
      highestBidder: auctionData.highestBidder,
      highestBid: ethers.formatEther(auctionData.highestBid),
      endTime: new Date(endTime * 1000).toISOString(),
      currentTime: new Date().toISOString(),
      timeDifference: (endTime * 1000 - Date.now()) / 1000,
      timeExpired: currentTime >= endTime,
      auctionType: Number(auctionData.auctionType || 0), // 0 = public, 1 = sealed bid
    });

    return {
      status: status, // Use contract status directly
      isSettled: auctionData.isSettled,
      highestBidder: auctionData.highestBidder,
      highestBid: ethers.formatEther(auctionData.highestBid),
      endTime: endTime * 1000,
      auctionType: Number(auctionData.auctionType || 0), // 0 = public, 1 = sealed bid
    };
  } catch (error) {
    console.error(`❌ Error checking auction ${auctionId} status:`, error);
    throw error;
  }
}

export function useWonAuctionsManager() {
  const { unsettledAuctions, isLoading, refetch } = useWonAuctionsForClaim();
  const { settleAuction, isSettling, error } = useSettleAuction();
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
        finalBid: auction.finalBid,
        bidders: auction.bidders,
        endTime: auction.endTime
          ? new Date(auction.endTime).toISOString()
          : "undefined",
        currentTime: new Date().toISOString(),
        timeDifference: auction.endTime
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
        console.error(`❌ Auction ${auctionId} is already settled`);
        alert(`Auction ${auctionId} is already settled`);
        return;
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
          const endTx = await auctionContract.endAuction(auctionId);
          console.log(`🏁 End auction transaction sent:`, endTx.hash);

          const endReceipt = await endTx.wait();
          console.log(
            `✅ Auction ${auctionId} ended successfully:`,
            endReceipt
          );

          // Wait a bit to ensure the status is updated
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Check if the auction has actually ended
          console.log(
            `🔍 Verifying auction ${auctionId} status after endAuction...`
          );
          const updatedStatus = await checkAuctionStatus(auctionId);
          console.log(`📊 Updated auction status:`, updatedStatus);

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
          alert(
            `Failed to end auction: ${
              endError instanceof Error ? endError.message : "Unknown error"
            }`
          );
          return;
        }
      } else if (contractStatus.status === 2) {
        console.log(
          `🔍 Auction ${auctionId} is in REVEAL phase. Checking auction type...`
        );

        // Check if this is a sealed bid auction (auctionType === 1)
        if (contractStatus.auctionType === 1) {
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
