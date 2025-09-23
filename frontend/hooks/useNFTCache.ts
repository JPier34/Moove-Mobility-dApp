"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { contracts } from "@/utils/contracts";

// Cache per NFT ownership e metadata
interface NFTCacheEntry {
  tokenId: number;
  owner: string;
  tokenURI: string;
  metadata?: any;
  timestamp: number;
  lastChecked: number;
}

interface NFTOwnershipCache {
  [tokenId: number]: NFTCacheEntry;
}

// Cache globale per evitare chiamate duplicate
const nftCache = new Map<string, NFTOwnershipCache>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minuti
const METADATA_CACHE_TTL = 30 * 60 * 1000; // 30 minuti per metadata

// Cache globale per l'ultimo NFT ID valido (per evitare scansioni inutili)
const lastValidNFTIdCache = new Map<string, number>();
const LAST_VALID_ID_CACHE_TTL = 30 * 60 * 1000; // 30 minuti

// Hook per gestire la cache NFT
export function useNFTCache() {
  const { address } = useAccount();
  const [cacheStats, setCacheStats] = useState({
    hits: 0,
    misses: 0,
    totalCalls: 0,
  });

  // Ottieni cache per un utente specifico
  const getUserCache = useCallback((userAddress: string): NFTOwnershipCache => {
    if (!nftCache.has(userAddress)) {
      nftCache.set(userAddress, {});
    }
    return nftCache.get(userAddress)!;
  }, []);

  // Ottieni l'ultimo NFT ID valido dalla cache
  const getLastValidNFTId = useCallback(
    (userAddress: string): number | null => {
      const cached = lastValidNFTIdCache.get(userAddress);
      if (!cached) return null;

      const now = Date.now();
      const isExpired = now - cached > LAST_VALID_ID_CACHE_TTL;

      if (isExpired) {
        lastValidNFTIdCache.delete(userAddress);
        return null;
      }

      return cached;
    },
    []
  );

  // Salva l'ultimo NFT ID valido nella cache
  const setLastValidNFTId = useCallback(
    (userAddress: string, tokenId: number) => {
      lastValidNFTIdCache.set(userAddress, tokenId);
      console.log(
        `💾 Cached last valid NFT ID #${tokenId} for ${userAddress.slice(
          0,
          6
        )}...`
      );
    },
    []
  );

  // Controlla se un NFT è in cache e valido
  const isNFTInCache = useCallback(
    (userAddress: string, tokenId: number): boolean => {
      const userCache = getUserCache(userAddress);
      const entry = userCache[tokenId];

      if (!entry) return false;

      const now = Date.now();
      const isExpired = now - entry.lastChecked > CACHE_TTL;

      if (isExpired) {
        delete userCache[tokenId];
        return false;
      }

      return true;
    },
    [getUserCache]
  );

  // Ottieni NFT dalla cache
  const getNFTFromCache = useCallback(
    (userAddress: string, tokenId: number): NFTCacheEntry | null => {
      const userCache = getUserCache(userAddress);
      const entry = userCache[tokenId];

      if (!entry) return null;

      const now = Date.now();
      const isExpired = now - entry.lastChecked > CACHE_TTL;

      if (isExpired) {
        delete userCache[tokenId];
        return null;
      }

      // Aggiorna statistiche cache hit
      setCacheStats((prev) => ({
        ...prev,
        hits: prev.hits + 1,
        totalCalls: prev.totalCalls + 1,
      }));

      return entry;
    },
    [getUserCache]
  );

  // Salva NFT nella cache
  const saveNFTToCache = useCallback(
    (
      userAddress: string,
      tokenId: number,
      owner: string,
      tokenURI: string,
      metadata?: any
    ) => {
      const userCache = getUserCache(userAddress);
      const now = Date.now();

      userCache[tokenId] = {
        tokenId,
        owner,
        tokenURI,
        metadata,
        timestamp: now,
        lastChecked: now,
      };

      // Aggiorna statistiche cache miss
      setCacheStats((prev) => ({
        ...prev,
        misses: prev.misses + 1,
        totalCalls: prev.totalCalls + 1,
      }));

      console.log(
        `💾 Cached NFT #${tokenId} for ${userAddress.slice(0, 6)}...`
      );
    },
    [getUserCache]
  );

  // Controlla se l'utente possiede un NFT (con cache)
  const checkNFTOwnership = useCallback(
    async (
      userAddress: string,
      tokenId: number
    ): Promise<{
      owns: boolean;
      fromCache: boolean;
      owner?: string;
      tokenURI?: string;
      metadata?: any;
    }> => {
      // Controlla cache prima
      const cached = getNFTFromCache(userAddress, tokenId);
      if (cached) {
        const owns = cached.owner.toLowerCase() === userAddress.toLowerCase();
        return {
          owns,
          fromCache: true,
          owner: cached.owner,
          tokenURI: cached.tokenURI,
          metadata: cached.metadata,
        };
      }

      // Se non in cache, chiama il contratto
      if (!window.ethereum) {
        return { owns: false, fromCache: false };
      }

      try {
        const provider = new (await import("ethers")).BrowserProvider(
          window.ethereum
        );
        const nftContract = new (await import("ethers")).Contract(
          contracts.MooveNFT.address,
          contracts.MooveNFT.abi,
          provider
        );

        const owner = await nftContract.ownerOf(tokenId);
        const tokenURI = await nftContract.tokenURI(tokenId);

        const owns = owner.toLowerCase() === userAddress.toLowerCase();

        // Salva in cache
        saveNFTToCache(userAddress, tokenId, owner, tokenURI);

        return {
          owns,
          fromCache: false,
          owner,
          tokenURI,
        };
      } catch (error) {
        console.warn(`Failed to check ownership for NFT #${tokenId}:`, error);
        return { owns: false, fromCache: false };
      }
    },
    [getNFTFromCache, saveNFTToCache]
  );

  // Ottieni tutti gli NFT posseduti dall'utente (con cache intelligente + early exit)
  const getUserNFTs = useCallback(
    async (
      userAddress: string,
      maxCheck: number = 1000
    ): Promise<{
      nfts: Array<{
        tokenId: number;
        owner: string;
        tokenURI: string;
        metadata?: any;
      }>;
      fromCache: number;
      fromContract: number;
    }> => {
      const userCache = getUserCache(userAddress);
      const nfts: Array<{
        tokenId: number;
        owner: string;
        tokenURI: string;
        metadata?: any;
      }> = [];

      let fromCache = 0;
      let fromContract = 0;
      let consecutiveMissing = 0;
      const maxConsecutiveMissing = 10; // Aumentiamo a 10 per essere più permissivi

      // Prima controlla la cache per NFT noti
      for (const [tokenIdStr, entry] of Object.entries(userCache)) {
        const tokenId = parseInt(tokenIdStr);
        if (tokenId >= maxCheck) continue;

        const now = Date.now();
        const isExpired = now - entry.lastChecked > CACHE_TTL;

        if (
          !isExpired &&
          entry.owner.toLowerCase() === userAddress.toLowerCase()
        ) {
          nfts.push({
            tokenId: entry.tokenId,
            owner: entry.owner,
            tokenURI: entry.tokenURI,
            metadata: entry.metadata,
          });
          fromCache++;
        }
      }

      // Ottieni l'ultimo NFT ID valido dalla cache
      const lastValidId = getLastValidNFTId(userAddress);
      let startFrom = 0;
      let endAt = maxCheck;

      if (lastValidId !== null) {
        // Se abbiamo un ultimo ID valido, controlla solo da lì in poi
        startFrom = lastValidId + 1;
        endAt = Math.min(startFrom + 20, maxCheck); // Controlla solo i prossimi 20 NFT
        console.log(
          `🎯 Using cached last valid ID #${lastValidId}, checking from #${startFrom} to #${endAt}`
        );
      } else {
        // Se non abbiamo un ultimo ID valido, controlla i primi NFT
        endAt = Math.min(100, maxCheck); // Controlla i primi 100 NFT
        console.log(`🔍 No cached last ID, checking first ${endAt} NFTs...`);

        // DEBUG: Controlla anche l'NFT #61 specifico che sappiamo esistere
        console.log(`🔍 DEBUG: Checking specific NFT #61...`);
        const debugResult = await checkNFTOwnership(userAddress, 61);
        console.log(`🔍 DEBUG: NFT #61 ownership result:`, debugResult);
      }

      // Controlla i tokenId mancanti con early exit intelligente
      const checkedTokenIds = new Set(nfts.map((nft) => nft.tokenId));
      let lastFoundTokenId = -1;

      for (let tokenId = startFrom; tokenId < endAt; tokenId++) {
        if (checkedTokenIds.has(tokenId)) continue;

        const result = await checkNFTOwnership(userAddress, tokenId);

        if (result.owns) {
          nfts.push({
            tokenId,
            owner: result.owner!,
            tokenURI: result.tokenURI!,
            metadata: result.metadata,
          });
          consecutiveMissing = 0; // Reset counter
          lastFoundTokenId = tokenId;

          // Aggiorna l'ultimo NFT ID valido
          setLastValidNFTId(userAddress, tokenId);
          console.log(`✅ Found NFT #${tokenId} owned by user`);
        } else {
          // Solo se l'NFT non esiste affatto (errore nel contratto), incrementa il counter
          // Se l'NFT esiste ma non è dell'utente, NON incrementare il counter
          if (result.fromCache === false && !result.owner) {
            consecutiveMissing++;
            console.log(
              `❌ NFT #${tokenId} does not exist (${consecutiveMissing}/${maxConsecutiveMissing})`
            );
          } else {
            console.log(
              `❌ NFT #${tokenId} exists but not owned by user (owner: ${result.owner})`
            );
            consecutiveMissing = 0; // Reset counter se l'NFT esiste
          }

          // Early exit solo se troppi NFT consecutivi NON esistono
          if (consecutiveMissing >= maxConsecutiveMissing) {
            console.log(
              `🛑 Early exit: ${consecutiveMissing} consecutive non-existing NFTs after #${tokenId}`
            );
            break;
          }
        }

        if (result.fromCache) {
          fromCache++;
        } else {
          fromContract++;
        }
      }

      console.log(
        `📊 Cache stats: ${fromCache} from cache, ${fromContract} from contract, last valid ID: ${lastFoundTokenId}`
      );

      return { nfts, fromCache, fromContract };
    },
    [getUserCache, checkNFTOwnership, getLastValidNFTId, setLastValidNFTId]
  );

  // Pulisci cache scaduta
  const cleanExpiredCache = useCallback(() => {
    const now = Date.now();
    let cleaned = 0;

    // Pulisci cache NFT
    for (const [userAddress, userCache] of nftCache.entries()) {
      for (const [tokenIdStr, entry] of Object.entries(userCache)) {
        if (now - entry.lastChecked > CACHE_TTL) {
          delete userCache[parseInt(tokenIdStr)];
          cleaned++;
        }
      }
    }

    // Pulisci cache ultimo NFT ID
    for (const [userAddress, timestamp] of lastValidNFTIdCache.entries()) {
      if (now - timestamp > LAST_VALID_ID_CACHE_TTL) {
        lastValidNFTIdCache.delete(userAddress);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }, []);

  // Pulisci cache ogni 5 minuti
  useEffect(() => {
    const interval = setInterval(cleanExpiredCache, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [cleanExpiredCache]);

  // Ottieni statistiche cache
  const getCacheStats = useCallback(() => {
    const totalEntries = Array.from(nftCache.values()).reduce(
      (sum, userCache) => sum + Object.keys(userCache).length,
      0
    );

    const hitRate =
      cacheStats.totalCalls > 0
        ? ((cacheStats.hits / cacheStats.totalCalls) * 100).toFixed(1)
        : "0";

    return {
      ...cacheStats,
      totalEntries,
      hitRate: `${hitRate}%`,
    };
  }, [cacheStats]);

  return {
    checkNFTOwnership,
    getUserNFTs,
    isNFTInCache,
    getNFTFromCache,
    saveNFTToCache,
    cleanExpiredCache,
    getCacheStats,
  };
}
