"use client";

import React, { useEffect, useRef } from "react";
import { useNFTTransferNotifications } from "@/providers/NFTTransferNotificationsProvider";
import { useWriteMooveNFT } from "@/hooks/useContract";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";

export default function TransferConfirmationHandler() {
  const { address } = useAccount();
  const {
    isTransferConfirmed,
    transferTokenId,
    transferRecipient,
    confirmTransfer,
    completeTransfer,
    failTransfer,
  } = useNFTTransferNotifications();

  const {
    writeMooveNFT,
    isPending,
    error,
    isSuccess,
    hash: transactionHash,
  } = useWriteMooveNFT();

  // ✅ Hook per aspettare la conferma della transazione
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: transactionHash,
    });

  // Ref per tracciare se il trasferimento è già stato eseguito
  const hasExecutedTransfer = useRef(false);
  const lastTransferKey = useRef<string | null>(null);
  const executionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Gestisce la conferma del trasferimento
  useEffect(() => {
    if (
      isTransferConfirmed &&
      transferTokenId &&
      transferRecipient &&
      !isPending
    ) {
      // Crea una chiave unica per questo trasferimento
      const transferKey = `${transferTokenId}-${transferRecipient}`;

      // Se è lo stesso trasferimento già eseguito, non fare nulla
      if (
        hasExecutedTransfer.current &&
        lastTransferKey.current === transferKey
      ) {
        console.log(
          `⏭️ Transfer already executed for ${transferKey}, skipping`
        );
        return;
      }

      // Se è un nuovo trasferimento, resetta il flag
      if (lastTransferKey.current !== transferKey) {
        hasExecutedTransfer.current = false;
        lastTransferKey.current = transferKey;
      }

      // Se non è già stato eseguito, procedi
      if (!hasExecutedTransfer.current) {
        console.log(
          `🔄 Executing transfer: NFT #${transferTokenId} to ${transferRecipient}`
        );

        // Marca come eseguito per prevenire chiamate multiple
        hasExecutedTransfer.current = true;

        // Cancella eventuali timeout precedenti
        if (executionTimeoutRef.current) {
          clearTimeout(executionTimeoutRef.current);
        }

        // Aggiungi un piccolo debounce per essere sicuri
        executionTimeoutRef.current = setTimeout(() => {
          // Esegui il trasferimento
          if (!address) {
            console.error("❌ No address available for transfer");
            failTransfer("No wallet address available");
            return;
          }

          writeMooveNFT("transferFrom", [
            address, // from - indirizzo del proprietario corrente
            transferRecipient, // to
            BigInt(transferTokenId), // tokenId
          ]);
        }, 100); // 100ms di debounce
      }
    }
  }, [
    isTransferConfirmed,
    transferTokenId,
    transferRecipient,
    address,
    writeMooveNFT,
    isPending,
    failTransfer,
  ]);

  // ✅ Gestisce la conferma della transazione (non solo l'invio)
  useEffect(() => {
    if (isConfirmed && transactionHash) {
      console.log(`✅ Transfer transaction confirmed: ${transactionHash}`);

      // Always complete the transfer to show success modal
      // The recursive prevention is only for the contract call, not the completion
      completeTransfer(transactionHash);

      // Reset del flag per permettere nuovi trasferimenti
      hasExecutedTransfer.current = false;
      lastTransferKey.current = null;
    }
  }, [isConfirmed, transactionHash, completeTransfer]);

  // Gestisce gli errori della transazione
  useEffect(() => {
    if (error) {
      console.log(`❌ Transfer transaction failed:`, error);
      failTransfer(error.message || "Transaction failed");
      // Reset del flag per permettere nuovi trasferimenti
      hasExecutedTransfer.current = false;
    }
  }, [error, failTransfer]);

  // Reset del flag quando il trasferimento viene cancellato
  useEffect(() => {
    if (!isTransferConfirmed) {
      hasExecutedTransfer.current = false;
      lastTransferKey.current = null;
    }
  }, [isTransferConfirmed]);

  // Cleanup del timeout quando il componente viene smontato
  useEffect(() => {
    return () => {
      if (executionTimeoutRef.current) {
        clearTimeout(executionTimeoutRef.current);
      }
    };
  }, []);

  return null; // Questo componente non renderizza nulla
}
