import { useState, useEffect } from "react";
import { useWonAuctions } from "./useWonAuctions";
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
  const { unsettledAuctions, isLoading, refetch } = useWonAuctions();
  const {
    settleAuction,
    isPending: isSettling,
    isSuccess,
    error,
  } = useSettleAuction();
  const {
    startRevealPhase,
    isPending: isStartingReveal,
    isSuccess: isRevealStarted,
    error: revealError,
  } = useStartRevealPhase();
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [currentAuction, setCurrentAuction] = useState<any>(null);

  // Mostra modal congratulazioni quando l'utente vince un'asta
  useEffect(() => {
    if (unsettledAuctions.length > 0 && !showCongratulations) {
      // Mostra il modal per la prima asta non settled
      const firstUnsettled = unsettledAuctions[0];
      setCurrentAuction(firstUnsettled);
      setShowCongratulations(true);
    }
  }, [unsettledAuctions, showCongratulations]);

  // Chiudi il modal quando l'asta è stata settled con successo
  useEffect(() => {
    if (isSuccess && showCongratulations) {
      console.log(`🎉 Auction settled successfully! Closing modal...`);
      setShowCongratulations(false);
      setCurrentAuction(null);
      // Refresh dei dati per aggiornare la lista
      refetch();
    }
  }, [isSuccess, showCongratulations, refetch]);

  // Debug per errori di transazione
  useEffect(() => {
    if (error) {
      console.error(`❌ Settle auction error:`, error);
      alert(`Settle auction failed: ${error.message || "Unknown error"}`);
    }
  }, [error]);

  // Debug per errori di reveal phase
  useEffect(() => {
    if (revealError) {
      console.error(`❌ Reveal phase error:`, revealError);
      alert(`Reveal phase failed: ${revealError.message || "Unknown error"}`);
    }
  }, [revealError]);

  const handleSettleAuction = async (auctionId: string) => {
    try {
      console.log(`🏆 Attempting to settle auction ${auctionId}...`);

      // Verifica preventiva: controlla se l'asta è pronta per il settle
      const auction = unsettledAuctions.find((a) => a.auctionId === auctionId);
      if (!auction) {
        console.error(
          `❌ Auction ${auctionId} not found in unsettled auctions`
        );
        return;
      }

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

      // Verifica che l'asta non sia già settled
      if (contractStatus.isSettled) {
        console.error(`❌ Auction ${auctionId} is already settled`);
        alert(`Auction ${auctionId} is already settled`);
        return;
      }

      // Verifica che l'asta abbia un vincitore
      if (
        !contractStatus.highestBid ||
        parseFloat(contractStatus.highestBid) <= 0
      ) {
        console.error(`❌ Auction ${auctionId} has no valid bid`);
        alert(`Auction ${auctionId} has no valid bid`);
        return;
      }

      // Verifica che l'asta sia effettivamente finita nel tempo
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

      // Verifica che l'asta abbia un vincitore valido
      if (
        !contractStatus.highestBidder ||
        contractStatus.highestBidder === ethers.ZeroAddress
      ) {
        console.error(`❌ Auction ${auctionId} has no valid winner`);
        alert(`Auction ${auctionId} has no valid winner. Cannot settle.`);
        return;
      }

      // Se l'asta è finita nel tempo ma ha ancora status ACTIVE, chiama endAuction prima
      if (contractStatus.status === 1) {
        console.log(
          `🔄 Auction ${auctionId} is ACTIVE but time-expired. Calling endAuction first...`
        );
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
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

          // Aspetta un po' per assicurarsi che lo status sia aggiornato
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Verifica che l'asta sia effettivamente terminata
          console.log(
            `🔍 Verifying auction ${auctionId} status after endAuction...`
          );
          const updatedStatus = await checkAuctionStatus(auctionId);
          console.log(`📊 Updated auction status:`, updatedStatus);

          if (updatedStatus.status !== 2) {
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
          `✅ Auction ${auctionId} is already ENDED. Checking auction type...`
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
        } else {
          console.log(`📋 Public auction detected. Skipping reveal phase...`);
        }
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
        minBidders: contractStatus.minBidders,
        totalBidders: contractStatus.totalBidders,
      });

      // Chiama settleAuction (non è async, ma triggera la transazione)
      console.log(`🔨 Calling settleAuction for auction ${auctionId}...`);
      settleAuction(parseInt(auctionId));
      console.log(`✅ Settle auction ${auctionId} transaction initiated`);

      // Verifica lo status dopo un po' per confermare il successo
      setTimeout(async () => {
        try {
          const finalStatus = await checkAuctionStatus(auctionId);
          console.log(
            `🔍 Final verification - Auction ${auctionId} status:`,
            finalStatus
          );
          if (finalStatus.isSettled) {
            console.log(`✅ Auction ${auctionId} successfully settled!`);
          } else {
            console.log(`❌ Auction ${auctionId} settlement failed or pending`);
          }
        } catch (verifyError) {
          console.error(`❌ Error verifying settlement:`, verifyError);
        }
      }, 5000); // Aspetta 5 secondi per la conferma

      // Il modal si chiuderà automaticamente quando isSuccess diventa true
      // Non possiamo await qui perché settleAuction non restituisce una Promise
    } catch (error) {
      console.error("Error settling auction:", error);
      // Mostra errore all'utente
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

  // Chiudi il modal quando l'asta è stata settled con successo
  useEffect(() => {
    if (isSuccess && showCongratulations) {
      setShowCongratulations(false);
      setCurrentAuction(null);
      // Refetch per aggiornare la lista
      refetch();
    }
  }, [isSuccess, showCongratulations, refetch]);

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
