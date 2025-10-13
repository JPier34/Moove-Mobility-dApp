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
  source: "local" | "api";
}

interface APINFTResponse {
  name: string;
  imageHash: string;
  creator: string;
  timestamp: number;
  tokenId?: number;
}

export function useNFTValidationAPI() {
  const { address } = useAccount();
  const [isValidating, setIsValidating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Local cache with metadata
  const getCachedNFTs = useCallback((): CachedNFT[] => {
    try {
      const cached = localStorage.getItem("moove-nft-cache");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }, []);

  // Add NFT to cache
  const addToCache = useCallback(
    (nft: CachedNFT) => {
      try {
        const cached = getCachedNFTs();
        // Avoid duplicates
        const exists = cached.find(
          (cachedNFT) =>
            cachedNFT.name === nft.name && cachedNFT.imageHash === nft.imageHash
        );

        if (!exists) {
          cached.push(nft);
          localStorage.setItem("moove-nft-cache", JSON.stringify(cached));
        }
      } catch (error) {
        console.warn("Failed to cache NFT:", error);
      }
    },
    [getCachedNFTs]
  );

  // Calculate image hash
  const calculateImageHash = useCallback(
    async (file: File): Promise<string> => {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    },
    []
  );

  // API call to check duplicates
  const checkDuplicatesAPI = useCallback(
    async (
      name: string,
      imageHash: string
    ): Promise<{
      nameDuplicate: boolean;
      imageDuplicate: boolean;
      existingNFTs: APINFTResponse[];
    }> => {
      try {
        const response = await fetch("/api/check-nft-duplicates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            imageHash,
          }),
        });

        if (!response.ok) {
          throw new Error("API call failed");
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.warn("API check failed, using local cache only:", error);
        return {
          nameDuplicate: false,
          imageDuplicate: false,
          existingNFTs: [],
        };
      }
    },
    []
  );

  // Sync local cache with API
  const syncWithAPI = useCallback(async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/sync-nft-cache", {
        method: "GET",
      });

      if (response.ok) {
        const apiNFTs: APINFTResponse[] = await response.json();
        const cachedNFTs = getCachedNFTs();

        // Add NFTs from API that are not in local cache
        apiNFTs.forEach((apiNFT) => {
          const exists = cachedNFTs.find(
            (cached) =>
              cached.name === apiNFT.name &&
              cached.imageHash === apiNFT.imageHash
          );
          if (!exists) {
            addToCache({
              ...apiNFT,
              source: "api",
            });
          }
        });

        toast.success("Cache synchronized with server");
      }
    } catch (error) {
      console.warn("Sync failed:", error);
      toast.error("Synchronization failed");
    } finally {
      setIsSyncing(false);
    }
  }, [getCachedNFTs, addToCache]);

  // Check duplicates (local + API)
  const checkDuplicates = useCallback(
    async (
      name: string,
      image: File
    ): Promise<{
      nameDuplicate: boolean;
      imageDuplicate: boolean;
      existingNFTs: CachedNFT[];
      suggestions: string[];
    }> => {
      const imageHash = await calculateImageHash(image);
      const cached = getCachedNFTs();
      const suggestions: string[] = [];

      // 1. Local cache check (fast)
      const localNameDuplicate = cached.find(
        (nft) => nft.name.toLowerCase().trim() === name.toLowerCase().trim()
      );
      const localImageDuplicate = cached.find(
        (nft) => nft.imageHash === imageHash
      );

      // 2. If not found locally, check API
      let apiResult = {
        nameDuplicate: false,
        imageDuplicate: false,
        existingNFTs: [] as APINFTResponse[],
      };

      if (!localNameDuplicate && !localImageDuplicate) {
        apiResult = await checkDuplicatesAPI(name, imageHash);
      }

      // 3. Combine results
      const nameDuplicate = !!localNameDuplicate || apiResult.nameDuplicate;
      const imageDuplicate = !!localImageDuplicate || apiResult.imageDuplicate;

      // 4. Generate suggestions if duplicate
      if (nameDuplicate) {
        const timestamp = new Date().toISOString().slice(0, 10);
        const randomSuffix = Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase();

        suggestions.push(`${name} V2`);
        suggestions.push(`${name} ${timestamp}`);
        suggestions.push(`${name} ${randomSuffix}`);
        suggestions.push(`${name} Edition`);
        suggestions.push(`${name} Collection`);
      }

      // 5. Combine existing NFTs
      const existingNFTs: CachedNFT[] = [
        ...(localNameDuplicate ? [localNameDuplicate] : []),
        ...(localImageDuplicate ? [localImageDuplicate] : []),
        ...apiResult.existingNFTs.map((nft) => ({
          ...nft,
          source: "api" as const,
        })),
      ];

      return {
        nameDuplicate,
        imageDuplicate,
        existingNFTs,
        suggestions,
      };
    },
    [calculateImageHash, getCachedNFTs, checkDuplicatesAPI]
  );

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

        // 2. Verifica duplicati (locale + API)
        if (!image) {
          result.errors.push("Immagine richiesta per la validazione");
          return result;
        }
        const duplicateCheck = await checkDuplicates(name, image);
        if (duplicateCheck.nameDuplicate) {
          result.errors.push(`Nome "${name}" già utilizzato`);
          result.suggestions.push(...duplicateCheck.suggestions);
          result.isValid = false;
        }

        if (duplicateCheck.imageDuplicate) {
          result.errors.push("Immagine già utilizzata in un NFT esistente");
          const imageHash = await calculateImageHash(image);
          const existingImageNFT = duplicateCheck.existingNFTs.find(
            (nft) => nft.imageHash === imageHash
          );
          if (existingImageNFT) {
            result.warnings.push(
              `Stessa immagine usata in: "${existingImageNFT.name}"`
            );
          }
          result.isValid = false;
        }

        // 3. Other validation checks...
        // (keep the same checks as the previous hook)

        // 4. Check name length
        if (name.length < 3) {
          result.errors.push("Name must be at least 3 characters");
          result.isValid = false;
        } else if (name.length > 50) {
          result.errors.push("Name must be at most 50 characters");
          result.isValid = false;
        }

        // 5. Check description length
        if (description.length < 10) {
          result.errors.push("Description must be at least 10 characters");
          result.isValid = false;
        } else if (description.length > 500) {
          result.errors.push("Description must be at most 500 characters");
          result.isValid = false;
        }

        // 6. Check special characters in name
        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(name)) {
          result.errors.push("Name contains invalid characters");
          result.isValid = false;
        }

        // 7. Check rarity
        const validRarities = [
          "COMMON",
          "UNCOMMON",
          "RARE",
          "EPIC",
          "LEGENDARY",
          "MYTHIC",
        ];
        if (!validRarities.includes(rarity)) {
          result.errors.push("Invalid rarity");
          result.isValid = false;
        }

        // 9. Check image type
        const validTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ];
        if (!validTypes.includes(image.type)) {
          result.errors.push("Unsupported image type");
          result.isValid = false;
        }

        // 10. Improvement suggestions
        if (name.length < 10) {
          result.warnings.push("Short name - consider a more descriptive name");
        }

        if (description.length < 50) {
          result.warnings.push("Short description - consider more details");
        }
      } catch (error) {
        result.errors.push("Error during validation");
        result.isValid = false;
        console.error("NFT validation error:", error);
      } finally {
        setIsValidating(false);
      }

      return result;
    },
    [checkDuplicates, calculateImageHash]
  );

  // Add validated NFT to cache
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
          source: "local",
        };

        addToCache(nft);

        // Sync with API in background
        try {
          await fetch("/api/add-nft", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(nft),
          });
        } catch (error) {
          console.warn("Failed to sync with API:", error);
        }
      } catch (error) {
        console.error("Failed to add validated NFT to cache:", error);
      }
    },
    [calculateImageHash, address, addToCache]
  );

  // Clear cache (for testing)
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

    const sourceStats = cached.reduce((acc, nft) => {
      acc[nft.source] = (acc[nft.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalNFTs: cached.length,
      creatorStats,
      sourceStats,
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
    syncWithAPI,
    isValidating,
    isSyncing,
    getCachedNFTs,
  };
}
