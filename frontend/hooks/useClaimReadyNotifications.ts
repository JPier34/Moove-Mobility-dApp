"use client";

import { useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import { useAuctionNotificationTriggers } from "./useUnifiedAuctionNotifications";

interface AuctionStatus {
  auctionId: number;
  status: number;
  auctionType: number;
  endTime: number;
  highestBidder: string;
  currentUser: string;
}

export function useClaimReadyNotifications() {
  const { address, isConnected } = useAccount();
  const { notifyClaimReady } = useAuctionNotificationTriggers();

  // Controlla se un'asta è finita e l'NFT è pronto al claim
  const checkAuctionClaimStatus = useCallback(
    async (auctionId: number, auctionContract: ethers.Contract) => {
      if (!address || !isConnected) return;

      try {
        const auction = await auctionContract.getAuction(auctionId);
        const auctionType = Number(auction.auctionType);
        const status = Number(auction.status);
        const endTime = Number(auction.endTime);
        const highestBidder = auction.highestBidder;
        const currentTime = Math.floor(Date.now() / 1000);

        // Solo per aste finite (status = 3) e dove l'utente corrente è il vincitore
        if (
          status === 3 && // ENDED
          highestBidder.toLowerCase() === address.toLowerCase() &&
          currentTime >= endTime
        ) {
          // Determina il tipo di asta per il messaggio
          let auctionTypeName = "";
          switch (auctionType) {
            case 0:
              auctionTypeName = "English";
              break;
            case 1:
              auctionTypeName = "Dutch";
              break;
            case 2:
              auctionTypeName = "Sealed Bid";
              break;
            case 3:
              auctionTypeName = "Reserve";
              break;
            default:
              auctionTypeName = "Unknown";
          }

          console.log(
            `🎁 [Claim Ready] User ${address} won ${auctionTypeName} auction ${auctionId} - NFT ready to claim`
          );

          // Notifica che l'NFT è pronto al claim
          notifyClaimReady(
            auctionId.toString(),
            `${auctionTypeName} Auction NFT`
          );
        }
      } catch (error) {
        console.error(
          `❌ Error checking claim status for auction ${auctionId}:`,
          error
        );
      }
    },
    [address, isConnected, notifyClaimReady]
  );

  // Monitora tutte le aste per controllare lo stato di claim
  const monitorAuctionsForClaim = useCallback(async () => {
    if (!isConnected || !address) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      // Check if contract is deployed
      const code = await provider.getCode(contracts.MooveAuction.address);
      if (code === "0x") {
        console.warn(
          "Auction contract not deployed at address:",
          contracts.MooveAuction.address
        );
        return;
      }

      const totalAuctions = await auctionContract.totalAuctions();

      // Controlla le ultime 50 aste (più efficiente)
      const startIndex = Math.max(0, Number(totalAuctions) - 50);

      for (let i = startIndex; i < Number(totalAuctions); i++) {
        await checkAuctionClaimStatus(i, auctionContract);
      }
    } catch (error) {
      console.error("❌ Error in claim monitoring:", error);
    }
  }, [isConnected, address, checkAuctionClaimStatus]);

  // Avvia il monitoraggio quando l'utente si connette
  useEffect(() => {
    if (!isConnected || !address) return;

    console.log("🎁 Starting claim ready notifications monitoring...");

    // Controlla immediatamente
    monitorAuctionsForClaim();

    // Poi controlla ogni 2 minuti
    const interval = setInterval(monitorAuctionsForClaim, 2 * 60 * 1000);

    return () => {
      console.log("🛑 Stopping claim ready notifications monitoring...");
      clearInterval(interval);
    };
  }, [isConnected, address, monitorAuctionsForClaim]);

  return {
    checkAuctionClaimStatus,
    monitorAuctionsForClaim,
  };
}
