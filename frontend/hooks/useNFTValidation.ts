"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";

interface NFTValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface CachedNFT {
  name: string;
  imageHash: string;
  creator: string;
  timestamp: number;
  tokenId?: number;
}

export function useNFTValidation() {
  const { address } = useAccount();
  const [isValidating, setIsValidating] = useState(false);

  // Cache locale per NFT creati
  const getCachedNFTs = useCallback((): CachedNFT[] => {
    try {
      const cached = localStorage.getItem("moove-nft-cache");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }, []);

  // Aggiungi NFT alla cache
  const addToCache = useCallback(
    (nft: CachedNFT) => {
      try {
        const cached = getCachedNFTs();
        cached.push(nft);
        localStorage.setItem("moove-nft-cache", JSON.stringify(cached));
      } catch (error) {
        console.warn("Failed to cache NFT:", error);
      }
    },
    [getCachedNFTs]
  );

  // Calcola hash dell'immagine
  const calculateImageHash = useCallback(
    async (file: File): Promise<string> => {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    },
    []
  );

  // Verifica duplicati nome
  const checkNameDuplicates = useCallback(
    (name: string): { isDuplicate: boolean; existingNFT?: CachedNFT } => {
      const cached = getCachedNFTs();
      const existing = cached.find(
        (nft) => nft.name.toLowerCase().trim() === name.toLowerCase().trim()
      );

      return {
        isDuplicate: !!existing,
        existingNFT: existing,
      };
    },
    [getCachedNFTs]
  );

  // Verifica duplicati immagine
  const checkImageDuplicates = useCallback(
    async (
      file: File
    ): Promise<{ isDuplicate: boolean; existingNFT?: CachedNFT }> => {
      const imageHash = await calculateImageHash(file);
      const cached = getCachedNFTs();
      const existing = cached.find((nft) => nft.imageHash === imageHash);

      return {
        isDuplicate: !!existing,
        existingNFT: existing,
      };
    },
    [calculateImageHash, getCachedNFTs]
  );

  // Genera suggerimenti nome
  const generateNameSuggestions = useCallback((baseName: string): string[] => {
    const suggestions: string[] = [];
    const timestamp = new Date().toISOString().slice(0, 10);
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();

    suggestions.push(`${baseName} V2`);
    suggestions.push(`${baseName} ${timestamp}`);
    suggestions.push(`${baseName} ${randomSuffix}`);
    suggestions.push(`${baseName} Edition`);
    suggestions.push(`${baseName} Collection`);

    return suggestions;
  }, []);

  // Validazione completa NFT
  const validateNFT = useCallback(
    async (
      name: string,
      description: string,
      image: File | null,
      rarity: string
    ): Promise<NFTValidationResult> => {
      setIsValidating(true);
      const result: NFTValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: [],
      };

      try {
        // 1. Verifica campi obbligatori
        if (!name.trim()) {
          result.errors.push("Nome NFT è obbligatorio");
          result.isValid = false;
        }

        if (!description.trim()) {
          result.errors.push("Descrizione NFT è obbligatoria");
          result.isValid = false;
        }

        if (!image) {
          result.errors.push("Immagine NFT è obbligatoria");
          result.isValid = false;
        }

        if (!result.isValid) {
          return result;
        }

        // 2. Verifica duplicati nome
        const nameCheck = checkNameDuplicates(name);
        if (nameCheck.isDuplicate) {
          result.errors.push(`Nome "${name}" già utilizzato`);
          result.suggestions.push(...generateNameSuggestions(name));
          result.isValid = false;
        }

        // 3. Verifica duplicati immagine
        const imageCheck = await checkImageDuplicates(image);
        if (imageCheck.isDuplicate) {
          result.errors.push("Immagine già utilizzata in un NFT esistente");
          if (imageCheck.existingNFT) {
            result.warnings.push(
              `Stessa immagine usata in: "${imageCheck.existingNFT.name}"`
            );
          }
          result.isValid = false;
        }

        // 4. Verifica lunghezza nome
        if (name.length < 3) {
          result.errors.push("Nome deve essere di almeno 3 caratteri");
          result.isValid = false;
        } else if (name.length > 50) {
          result.errors.push("Nome deve essere di massimo 50 caratteri");
          result.isValid = false;
        }

        // 5. Verifica lunghezza descrizione
        if (description.length < 10) {
          result.errors.push("Descrizione deve essere di almeno 10 caratteri");
          result.isValid = false;
        } else if (description.length > 500) {
          result.errors.push(
            "Descrizione deve essere di massimo 500 caratteri"
          );
          result.isValid = false;
        }

        // 6. Verifica caratteri speciali nel nome
        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(name)) {
          result.errors.push("Nome contiene caratteri non validi");
          result.isValid = false;
        }

        // 7. Verifica rarità
        const validRarities = [
          "COMMON",
          "UNCOMMON",
          "RARE",
          "EPIC",
          "LEGENDARY",
          "MYTHIC",
        ];
        if (!validRarities.includes(rarity)) {
          result.errors.push("Rarità non valida");
          result.isValid = false;
        }

        // 8. Verifica dimensione immagine
        if (image.size > 10 * 1024 * 1024) {
          result.errors.push("Immagine troppo grande (max 10MB)");
          result.isValid = false;
        }

        // 9. Verifica tipo immagine
        const validTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ];
        if (!validTypes.includes(image.type)) {
          result.errors.push("Tipo immagine non supportato");
          result.isValid = false;
        }

        // 10. Suggerimenti per miglioramenti
        if (name.length < 10) {
          result.warnings.push(
            "Nome breve - considera un nome più descrittivo"
          );
        }

        if (description.length < 50) {
          result.warnings.push("Descrizione breve - considera più dettagli");
        }

        if (image.size < 100 * 1024) {
          result.warnings.push(
            "Immagine molto piccola - potrebbe apparire sfocata"
          );
        }
      } catch (error) {
        result.errors.push("Errore durante la validazione");
        result.isValid = false;
        console.error("NFT validation error:", error);
      } finally {
        setIsValidating(false);
      }

      return result;
    },
    [checkNameDuplicates, checkImageDuplicates, generateNameSuggestions]
  );

  // Aggiungi NFT validato alla cache
  const addValidatedNFT = useCallback(
    async (name: string, image: File, tokenId?: number) => {
      try {
        const imageHash = await calculateImageHash(image);
        const nft: CachedNFT = {
          name: name.trim(),
          imageHash,
          creator: address || "unknown",
          timestamp: Date.now(),
          tokenId,
        };
        addToCache(nft);
      } catch (error) {
        console.error("Failed to add validated NFT to cache:", error);
      }
    },
    [calculateImageHash, address, addToCache]
  );

  // Pulisci cache (per testing)
  const clearCache = useCallback(() => {
    localStorage.removeItem("moove-nft-cache");
    toast.success("Cache NFT pulita");
  }, []);

  // Ottieni statistiche cache
  const getCacheStats = useCallback(() => {
    const cached = getCachedNFTs();
    const creatorStats = cached.reduce((acc, nft) => {
      acc[nft.creator] = (acc[nft.creator] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalNFTs: cached.length,
      creatorStats,
      oldestNFT:
        cached.length > 0 ? Math.min(...cached.map((n) => n.timestamp)) : null,
      newestNFT:
        cached.length > 0 ? Math.max(...cached.map((n) => n.timestamp)) : null,
    };
  }, [getCachedNFTs]);

  return {
    validateNFT,
    addValidatedNFT,
    clearCache,
    getCacheStats,
    isValidating,
    getCachedNFTs,
  };
}
