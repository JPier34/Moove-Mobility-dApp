"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useAutomaticRefundHandler } from "@/hooks/useAutomaticRefundHandler";

/**
 * Componente per gestire i refunds automatici
 * Ascolta eventi AuctionSettled e processa automaticamente i refunds
 */
export default function AutomaticRefundHandler() {
  const { address, isConnected } = useAccount();
  const { processRefundsForAuction } = useAutomaticRefundHandler();

  useEffect(() => {
    if (!isConnected || !address) return;

    console.log("💰 Automatic refund handler initialized");

    // Ascolta eventi AuctionSettled per processare automaticamente i refunds
    const handleAuctionSettled = (event: CustomEvent) => {
      const { auctionId, auctionType } = event.detail;

      console.log(`🎉 Auction ${auctionId} settled, processing refunds...`);

      // Solo per aste non-Dutch (Dutch auctions non hanno refunds)
      if (auctionType !== 1) {
        processRefundsForAuction(auctionId);
      } else {
        console.log(`ℹ️ Dutch auction ${auctionId} - no refunds needed`);
      }
    };

    // Ascolta eventi personalizzati
    window.addEventListener(
      "auctionSettled",
      handleAuctionSettled as EventListener
    );

    return () => {
      window.removeEventListener(
        "auctionSettled",
        handleAuctionSettled as EventListener
      );
      console.log("💰 Automatic refund handler cleaned up");
    };
  }, [isConnected, address, processRefundsForAuction]);

  // Questo componente non renderizza nulla
  return null;
}

