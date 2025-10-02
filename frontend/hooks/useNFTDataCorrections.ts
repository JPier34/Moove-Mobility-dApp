"use client";

import { useMemo } from "react";

/**
 * Hook per correggere dati specifici di NFT che hanno problemi nei metadata IPFS
 * Questo è una soluzione temporanea fino a quando i metadata IPFS non vengono corretti
 */
export function useNFTDataCorrections() {
  const corrections = useMemo(() => {
    return {
      // NFT 114 - Correzione immagine e altri dati
      114: {
        image: "/images/default-nft.svg", // Usa immagine placeholder per ora
        // Altri dati che potrebbero essere corretti
        correctedImage: true,
        note: "Image corrected from test hash to placeholder image",
      },
      // Aggiungi altre correzioni qui se necessario
    };
  }, []);

  /**
   * Applica le correzioni ai metadata di un NFT
   */
  const applyCorrections = (tokenId: number, metadata: any) => {
    const correction = corrections[tokenId as keyof typeof corrections];
    if (!correction) return metadata;

    return {
      ...metadata,
      image: correction.image,
      _corrections: {
        applied: true,
        tokenId,
        corrections: correction,
      },
    };
  };

  /**
   * Controlla se un NFT ha correzioni disponibili
   */
  const hasCorrections = (tokenId: number) => {
    return tokenId in corrections;
  };

  /**
   * Ottiene le correzioni per un NFT specifico
   */
  const getCorrections = (tokenId: number) => {
    return corrections[tokenId as keyof typeof corrections] || null;
  };

  return {
    corrections,
    applyCorrections,
    hasCorrections,
    getCorrections,
  };
}
