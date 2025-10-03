"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

/**
 * Hook dedicato per gestire i refunds automatici
 * Chiama refundRemainingBidders quando un'asta è settled
 */
export function useAutomaticRefundHandler() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [processedRefunds, setProcessedRefunds] = useState<Set<number>>(
    new Set()
  );

  const processRefundsForAuction = useCallback(
    async (auctionId: number) => {
      if (!isConnected || !address) return;

      // Evita di processare lo stesso auction più volte
      if (processedRefunds.has(auctionId)) {
        console.log(`💰 Refunds already processed for auction ${auctionId}`);
        return;
      }

      try {
        console.log(`💰 Processing refunds for auction ${auctionId}...`);

        // Chiama refundRemainingBidders con batch processing
        const refundTx = await writeContractAsync({
          address: contracts.MooveAuction.address as `0x${string}`,
          abi: contracts.MooveAuction.abi,
          functionName: "refundRemainingBidders",
          args: [auctionId, 0, 50], // auctionId, startIndex, batchSize
        });

        console.log(`📝 Refund transaction submitted: ${refundTx}`);

        // Marca come processato
        setProcessedRefunds((prev) => new Set([...prev, auctionId]));

        console.log(
          `✅ Refunds processed successfully for auction ${auctionId}`
        );
      } catch (refundError) {
        console.warn(
          `⚠️ Refund processing failed for auction ${auctionId}:`,
          refundError
        );
        // Non marcare come processato in caso di errore
      }
    },
    [isConnected, address, writeContractAsync]
  );

  // Funzione per processare refunds quando viene chiamata esternamente
  const handleRefundRequest = useCallback(
    (auctionId: number) => {
      processRefundsForAuction(auctionId);
    },
    [processRefundsForAuction]
  );

  return {
    processRefundsForAuction,
    handleRefundRequest,
    processedRefunds: Array.from(processedRefunds),
  };
}

