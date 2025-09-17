"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useReadMooveNFT } from "./useContract";

/**
 * Hook per verificare l'ownership attuale di un NFT
 * Utile per verificare se un utente è ancora il proprietario dopo un trasferimento
 */
export function useNFTOwnershipCheck(tokenId: string | null) {
  const { address } = useAccount();
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hook per verificare ownership
  const {
    data: owner,
    isLoading: isLoadingOwner,
    error: ownerError,
  } = useReadMooveNFT("ownerOf", tokenId ? [BigInt(tokenId)] : undefined, {
    enabled: !!tokenId && !!address,
  });

  useEffect(() => {
    if (!tokenId || !address) {
      setIsOwner(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(isLoadingOwner);

    if (ownerError) {
      setError(ownerError.message || "Failed to check ownership");
      setIsOwner(false);
      return;
    }

    if (owner) {
      const currentOwner = (owner as string).toLowerCase();
      const userAddress = address.toLowerCase();
      const ownershipResult = currentOwner === userAddress;

      setIsOwner(ownershipResult);
      setError(null);

      console.log(`🔍 Ownership check for token ${tokenId}:`, {
        tokenId,
        currentUser: address,
        actualOwner: owner,
        isOwner: ownershipResult,
      });
    }
  }, [tokenId, address, owner, isLoadingOwner, ownerError]);

  return {
    isOwner,
    isLoading,
    error,
    owner: owner as string | undefined,
  };
}

/**
 * Hook per verificare l'ownership di multiple NFT contemporaneamente
 */
export function useMultipleNFTOwnershipCheck(tokenIds: string[]) {
  const { address } = useAccount();
  const [ownershipResults, setOwnershipResults] = useState<
    Record<string, boolean>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || tokenIds.length === 0) {
      setOwnershipResults({});
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Verifica ownership per ogni token
    const checkOwnership = async () => {
      const results: Record<string, boolean> = {};

      for (const tokenId of tokenIds) {
        try {
          // Qui potresti usare un hook o una chiamata diretta al contratto
          // Per ora, assumiamo che tutti gli NFT siano ancora dell'utente
          // Questo dovrebbe essere implementato con una chiamata batch al contratto
          results[tokenId] = true; // Placeholder
        } catch (error) {
          console.error(
            `Error checking ownership for token ${tokenId}:`,
            error
          );
          results[tokenId] = false;
        }
      }

      setOwnershipResults(results);
      setIsLoading(false);
    };

    checkOwnership();
  }, [address, tokenIds]);

  return {
    ownershipResults,
    isLoading,
    error,
  };
}
