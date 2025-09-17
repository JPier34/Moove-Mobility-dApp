"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import {
  useWriteMooveNFT,
  useReadMooveNFT,
  useReadMooveAuction,
} from "./useContract";
import { contracts } from "@/utils/contracts";
import { ethers } from "ethers";
import { nftEvents } from "@/utils/nftEvents";

export interface TransferState {
  status: "idle" | "validating" | "pending" | "success" | "error";
  error?: string;
  transactionHash?: string;
}

export interface TransferResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export function useNFTTransfer() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { writeMooveNFT, isPending, error, hash, isSuccess } =
    useWriteMooveNFT();
  const [transferState, setTransferState] = useState<TransferState>({
    status: "idle",
  });
  const [currentTokenId, setCurrentTokenId] = useState<string | null>(null);

  // Hook per verificare ownership dell'NFT corrente
  const {
    data: nftOwner,
    isLoading: isLoadingOwner,
    error: ownerError,
  } = useReadMooveNFT(
    "ownerOf",
    currentTokenId ? [BigInt(currentTokenId)] : undefined,
    { enabled: !!currentTokenId }
  );

  // Hook per verificare il totalSupply
  const { data: totalSupply } = useReadMooveNFT("totalSupply", []);

  // Hook per verificare se l'NFT è in un'asta (usando getAuction)
  const { data: auctionData } = useReadMooveAuction(
    "getAuction",
    currentTokenId ? [BigInt(currentTokenId)] : undefined,
    { enabled: !!currentTokenId }
  );

  // Debug logging per il hook
  console.log("🔍 useReadMooveNFT debug:", {
    currentTokenId,
    nftOwner,
    isLoadingOwner,
    ownerError,
    enabled: !!currentTokenId,
    totalSupply: totalSupply?.toString(),
    auctionData: auctionData ? "NFT is in auction" : "NFT not in auction",
  });

  // Validazione formato indirizzo
  const validateAddressFormat = useCallback((address: string): boolean => {
    if (!address) return false;
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }, []);

  // Validazione completa indirizzo
  const validateRecipientAddress = useCallback(
    async (
      recipientAddress: string
    ): Promise<{
      isValid: boolean;
      error?: string;
    }> => {
      try {
        // 1. Validazione formato
        if (!validateAddressFormat(recipientAddress)) {
          return {
            isValid: false,
            error:
              "Invalid address format. Must be a valid Ethereum address (0x...)",
          };
        }

        // 2. Non può essere l'indirizzo del mittente
        if (recipientAddress.toLowerCase() === address?.toLowerCase()) {
          return {
            isValid: false,
            error: "Cannot transfer to your own address",
          };
        }

        // 3. Non può essere zero address
        if (recipientAddress === "0x0000000000000000000000000000000000000000") {
          return {
            isValid: false,
            error: "Cannot transfer to zero address",
          };
        }

        // 4. Controllo esistenza indirizzo (opzionale - può essere costoso)
        // const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
        // const code = await provider.getCode(recipientAddress);
        // if (code === "0x") {
        //   return { isValid: false, error: "Address does not exist" };
        // }

        return { isValid: true };
      } catch (error) {
        console.error("Address validation error:", error);
        return {
          isValid: false,
          error: "Failed to validate address",
        };
      }
    },
    [address, validateAddressFormat]
  );

  // Verifica ownership NFT
  const verifyNFTOwnership = useCallback(
    async (tokenId: string): Promise<boolean> => {
      try {
        if (!address) return false;

        // Imposta il tokenId corrente per il hook
        setCurrentTokenId(tokenId);

        // Aspetta un momento per il hook di aggiornarsi
        await new Promise((resolve) => setTimeout(resolve, 500));

        const ownerAddress = nftOwner as string | undefined;
        const isOwner = ownerAddress?.toLowerCase() === address.toLowerCase();

        console.log(`🔍 Checking ownership of token ${tokenId}:`, {
          currentUser: address,
          actualOwner: ownerAddress,
          isOwner,
          isLoadingOwner,
          ownerError,
          tokenIdBigInt: BigInt(tokenId),
          totalSupply: totalSupply?.toString(),
          auctionData: auctionData ? "NFT is in auction" : "NFT not in auction",
        });

        // Verifica se il tokenId è valido rispetto al totalSupply
        if (totalSupply && BigInt(tokenId) >= BigInt(totalSupply.toString())) {
          console.error(
            `❌ Token ${tokenId} doesn't exist. Total supply: ${totalSupply}`
          );
          return false;
        }

        // Se c'è un errore, l'NFT potrebbe non esistere
        if (ownerError) {
          console.error(`❌ NFT ${tokenId} might not exist:`, ownerError);
          return false;
        }

        // Se è ancora in loading, aspetta di più
        if (isLoadingOwner) {
          console.log(`⏳ Still loading ownership for token ${tokenId}`);
          return false;
        }

        // Se l'NFT è in un'asta, non può essere trasferito
        if (auctionData) {
          console.log(
            `⚠️ Token ${tokenId} is currently in an auction and cannot be transferred`
          );
          return false;
        }

        return !!isOwner;
      } catch (error) {
        console.error("NFT ownership verification error:", error);
        return false;
      }
    },
    [address, nftOwner, isLoadingOwner, ownerError, totalSupply, auctionData]
  );

  // Simulazione trasferimento (dry-run)
  const simulateTransfer = useCallback(
    async (
      tokenId: string,
      recipientAddress: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        // Simula la chiamata senza eseguirla
        // Questo è un placeholder - in un'implementazione reale useresti callStatic
        console.log(
          `Simulating transfer of token ${tokenId} to ${recipientAddress}`
        );

        // Per ora assumiamo che la simulazione sia sempre riuscita
        // In un'implementazione reale, faresti:
        // await nftContract.callStatic.transferFrom(address, recipientAddress, tokenId);

        return { success: true };
      } catch (error) {
        console.error("Transfer simulation failed:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Transfer simulation failed",
        };
      }
    },
    [address]
  );

  // Trasferimento NFT principale
  const transferNFT = useCallback(
    async (
      tokenId: string,
      recipientAddress: string
    ): Promise<TransferResult> => {
      try {
        setTransferState({ status: "validating" });

        // 1. Validazione indirizzo destinatario
        const addressValidation = await validateRecipientAddress(
          recipientAddress
        );
        if (!addressValidation.isValid) {
          setTransferState({
            status: "error",
            error: addressValidation.error,
          });
          return {
            success: false,
            error: addressValidation.error,
          };
        }

        // 2. Verifica ownership NFT
        const isOwner = await verifyNFTOwnership(tokenId);
        if (!isOwner) {
          const errorMsg = "You don't own this NFT";
          setTransferState({
            status: "error",
            error: errorMsg,
          });
          return {
            success: false,
            error: errorMsg,
          };
        }

        // 3. Simulazione trasferimento
        const simulation = await simulateTransfer(tokenId, recipientAddress);
        if (!simulation.success) {
          setTransferState({
            status: "error",
            error: simulation.error,
          });
          return {
            success: false,
            error: simulation.error,
          };
        }

        // 4. Esecuzione trasferimento
        setTransferState({ status: "pending" });

        console.log(`🔄 Transferring NFT ${tokenId} to ${recipientAddress}`);
        console.log(`📋 Transfer parameters:`, {
          from: address,
          to: recipientAddress,
          tokenId: BigInt(tokenId),
          tokenIdString: tokenId,
        });

        // Chiamata al contratto
        writeMooveNFT("transferFrom", [
          address, // from
          recipientAddress, // to
          BigInt(tokenId), // tokenId - convert to BigInt
        ]);

        // Il risultato sarà gestito dagli hook di Wagmi
        return {
          success: true,
          transactionHash: hash,
        };
      } catch (error) {
        console.error("NFT transfer error:", error);
        const errorMsg =
          error instanceof Error ? error.message : "Transfer failed";

        setTransferState({
          status: "error",
          error: errorMsg,
        });

        return {
          success: false,
          error: errorMsg,
        };
      }
    },
    [
      address,
      validateRecipientAddress,
      verifyNFTOwnership,
      simulateTransfer,
      writeMooveNFT,
      hash,
    ]
  );

  // Reset stato
  const resetTransferState = useCallback(() => {
    setTransferState({ status: "idle" });
    setCurrentTokenId(null);
  }, []);

  // Invalidazione cache quando il trasferimento ha successo
  useEffect(() => {
    if (isSuccess && hash && currentTokenId) {
      console.log(`🔄 Invalidating cache for NFT transfer: ${currentTokenId}`);

      // Invalida tutte le query relative agli NFT dell'utente
      queryClient.invalidateQueries({
        queryKey: ["userCollection", address],
      });

      // Invalida le query specifiche per questo NFT
      queryClient.invalidateQueries({
        queryKey: ["nftOwner", currentTokenId],
      });

      // Invalida le query di ownership
      queryClient.invalidateQueries({
        queryKey: ["ownerOf", currentTokenId],
      });

      // Invalida le query di auction per questo NFT
      queryClient.invalidateQueries({
        queryKey: ["getAuction", currentTokenId],
      });

      // Invalida le query generali degli NFT
      queryClient.invalidateQueries({
        queryKey: ["nftMetadata"],
      });

      console.log(`✅ Cache invalidated for NFT ${currentTokenId}`);

      // Emetti evento di trasferimento per notificare altri componenti
      if (address) {
        nftEvents.emitTransfer(currentTokenId, address, "unknown", hash);
      }
    }
  }, [isSuccess, hash, currentTokenId, queryClient, address]);

  // Aggiorna stato basato su Wagmi
  const currentState = isPending
    ? "pending"
    : isSuccess
    ? "success"
    : error
    ? "error"
    : transferState.status;

  return {
    transferNFT,
    validateRecipientAddress,
    transferState: {
      ...transferState,
      status: currentState,
      transactionHash: hash,
      error: error?.message || transferState.error,
    },
    resetTransferState,
    isPending,
    isSuccess,
    error,
  };
}
