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
import { useNFTTransferNotifications } from "@/providers/NFTTransferNotificationsProvider";

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

  // Integration with NFT transfer notification system
  const {
    startTransfer,
    confirmTransfer,
    completeTransfer,
    failTransfer,
    isTransferring,
  } = useNFTTransferNotifications();

  // Hook to verify current NFT ownership - only when we have a valid tokenId
  const {
    data: nftOwner,
    isLoading: isLoadingOwner,
    error: ownerError,
  } = useReadMooveNFT(
    "ownerOf",
    currentTokenId ? [BigInt(currentTokenId)] : [BigInt(1)], // Use tokenId 1 as placeholder when disabled
    { enabled: !!currentTokenId }
  );

  // Hook to verify totalSupply - REMOVED because it doesn't exist in ABI
  // const { data: totalSupply } = useReadMooveNFT("totalSupply", []);

  // Hook to verify if NFT is in an auction (using getAuction)
  const { data: auctionData } = useReadMooveAuction(
    "getAuction",
    currentTokenId ? [BigInt(currentTokenId)] : [BigInt(1)], // Use tokenId 1 as placeholder when disabled
    { enabled: !!currentTokenId }
  );

  // Debug logging for the hook
  console.log("🔍 useReadMooveNFT debug:", {
    currentTokenId,
    nftOwner,
    isLoadingOwner,
    ownerError,
    enabled: !!currentTokenId,
    auctionData: auctionData ? "NFT is in auction" : "NFT not in auction",
  });

  // Address format validation
  const validateAddressFormat = useCallback((address: string): boolean => {
    if (!address) return false;
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }, []);

  // Complete address validation
  const validateRecipientAddress = useCallback(
    async (
      recipientAddress: string
    ): Promise<{
      isValid: boolean;
      error?: string;
    }> => {
      try {
        // 1. Format validation
        if (!validateAddressFormat(recipientAddress)) {
          return {
            isValid: false,
            error:
              "Invalid address format. Must be a valid Ethereum address (0x...)",
          };
        }

        // 2. Cannot be the sender's address
        if (recipientAddress.toLowerCase() === address?.toLowerCase()) {
          return {
            isValid: false,
            error: "Cannot transfer to your own address",
          };
        }

        // 3. Cannot be zero address
        if (recipientAddress === "0x0000000000000000000000000000000000000000") {
          return {
            isValid: false,
            error: "Cannot transfer to zero address",
          };
        }

        // 4. Address existence check (optional - can be expensive)
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

  // Verify NFT ownership
  const verifyNFTOwnership = useCallback(
    async (tokenId: string): Promise<boolean> => {
      try {
        if (!address) return false;

        // Set current tokenId for the hook
        setCurrentTokenId(tokenId);

        // Wait a moment for the hook to update
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
          auctionData: auctionData ? "NFT is in auction" : "NFT not in auction",
        });

        // If there's an error, the NFT might not exist
        if (ownerError) {
          console.error(`❌ NFT ${tokenId} might not exist:`, ownerError);
          return false;
        }

        // If still loading, wait more
        if (isLoadingOwner) {
          console.log(`⏳ Still loading ownership for token ${tokenId}`);
          return false;
        }

        // If NFT is in an auction, it cannot be transferred
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
    [address, nftOwner, isLoadingOwner, ownerError, auctionData]
  );

  // Transfer simulation (dry-run)
  const simulateTransfer = useCallback(
    async (
      tokenId: string,
      recipientAddress: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        // Simulate the call without executing it
        // This is a placeholder - in a real implementation you would use callStatic
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

  // Trasferimento NFT principale - ora integrato con il sistema di notifiche
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

        // 4. Avvia il processo di trasferimento con il sistema di notifiche
        startTransfer(tokenId, recipientAddress);

        // The rest of the process will be handled by the notification system
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
      startTransfer,
      hash,
    ]
  );

  // Reset stato
  const resetTransferState = useCallback(() => {
    setTransferState({ status: "idle" });
    setCurrentTokenId(null);
  }, []);

  // Gestione successo transazione - integrazione con sistema di notifiche
  useEffect(() => {
    if (isSuccess && hash && currentTokenId) {
      console.log(`🔄 NFT transfer successful: ${currentTokenId}`);

      // Completa il trasferimento nel sistema di notifiche
      completeTransfer(hash);

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

      // NO EVENT EMISSION HERE - Events are handled by the provider
      // This prevents duplicate events and recursive calls
    }
  }, [isSuccess, hash, currentTokenId, queryClient, address, completeTransfer]);

  // Gestione errori transazione - integrazione con sistema di notifiche
  useEffect(() => {
    if (error && isTransferring) {
      console.log(`❌ NFT transfer failed:`, error);
      failTransfer(error.message || "Transfer failed");
    }
  }, [error, isTransferring, failTransfer]);

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
    isPending: isPending || isTransferring,
    isSuccess,
    error,
    isTransferring,
  };
}
