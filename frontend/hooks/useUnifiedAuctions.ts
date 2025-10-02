/**
 * Hook Unificato per Gestione Aste
 * Risolve tutti i problemi di compatibilità dati
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import {
  ContractAuctionData,
  FrontendAuction,
  CollectionNFT,
  AuctionId,
  TokenId,
  parseContractAuctionData,
  convertContractToFrontend,
  isContractAuctionData,
  isFrontendAuction,
  isCollectionNFT,
} from "@/types/auction-unified";

// ============= INTERFACCE =============

export interface UseUnifiedAuctionReturn {
  // Dati aste
  auctions: FrontendAuction[];
  isLoading: boolean;
  error: string | null;

  // Funzioni
  fetchAuctions: () => Promise<void>;
  fetchAuctionById: (auctionId: AuctionId) => Promise<FrontendAuction | null>;
  refreshAuctions: () => Promise<void>;

  // Cache e performance
  cacheStats: {
    totalAuctions: number;
    lastFetch: Date | null;
    cacheHitRate: number;
  };
}

export interface UseUnifiedCollectionReturn {
  // Dati collezione
  nfts: CollectionNFT[];
  isLoading: boolean;
  error: string | null;

  // Statistiche
  totalItems: number;
  totalValue: number;

  // Funzioni
  fetchCollection: () => Promise<void>;
  refreshCollection: () => Promise<void>;
  loadMore: () => Promise<void>;

  // Infinite scroll
  hasMore: boolean;
  isLoadingMore: boolean;
}

// ============= CACHE GLOBALE =============

const auctionCache = new Map<AuctionId, FrontendAuction>();
const collectionCache = new Map<string, CollectionNFT[]>();
const cacheTimestamps = new Map<string, number>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti

// ============= HOOK ASTE UNIFICATO =============

export function useUnifiedAuctions(): UseUnifiedAuctionReturn {
  const { address, isConnected } = useAccount();
  const [auctions, setAuctions] = useState<FrontendAuction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheHits = useRef(0);
  const totalRequests = useRef(0);

  // Verifica validità cache
  const isCacheValid = useCallback((cacheKey: string): boolean => {
    const timestamp = cacheTimestamps.get(cacheKey);
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_DURATION;
  }, []);

  // Fetch aste dal contratto
  const fetchAuctions = useCallback(async () => {
    if (!isConnected || !address) {
      setAuctions([]);
      setIsLoading(false);
      return;
    }

    const cacheKey = `auctions_${address}`;

    // Controlla cache
    if (isCacheValid(cacheKey)) {
      const cachedAuctions = Array.from(auctionCache.values());
      if (cachedAuctions.length > 0) {
        console.log(`📦 Using cached auctions: ${cachedAuctions.length} items`);
        setAuctions(cachedAuctions);
        setIsLoading(false);
        cacheHits.current++;
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);
      totalRequests.current++;

      console.log("🔍 Fetching auctions from contract...");

      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No ethereum provider available");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      // Ottieni numero totale di aste
      const totalCount = await auctionContract.getTotalAuctions();
      console.log(`📊 Total auctions: ${totalCount}`);

      const fetchedAuctions: FrontendAuction[] = [];

      // Fetch tutte le aste
      for (let i = 0; i < Number(totalCount); i++) {
        try {
          const rawAuctionData = await auctionContract.getAuction(i);

          // Parse dati contratto
          const contractData = parseContractAuctionData(rawAuctionData);

          // Converti in formato frontend
          const frontendAuction = convertContractToFrontend(contractData);

          // Aggiungi metadati NFT se disponibili
          try {
            const nftContract = new ethers.Contract(
              contracts.MooveNFT.address,
              contracts.MooveNFT.abi,
              provider
            );

            const tokenURI = await nftContract.tokenURI(
              frontendAuction.tokenId
            );
            if (tokenURI) {
              const response = await fetch(tokenURI);
              if (response.ok) {
                const metadata = await response.json();
                frontendAuction.nftName = metadata.name;
                frontendAuction.nftImage = metadata.image;
                frontendAuction.nftCategory = metadata.category;

                // Aggiungi attributi
                if (metadata.attributes) {
                  frontendAuction.attributes = metadata.attributes;
                }
              }
            }
          } catch (metadataError) {
            console.warn(
              `⚠️ Could not fetch metadata for token ${frontendAuction.tokenId}:`,
              metadataError
            );
          }

          fetchedAuctions.push(frontendAuction);

          // Aggiorna cache
          auctionCache.set(frontendAuction.auctionId, frontendAuction);
        } catch (auctionError) {
          console.warn(`⚠️ Error fetching auction ${i}:`, auctionError);
        }
      }

      console.log(`✅ Fetched ${fetchedAuctions.length} auctions`);

      // Aggiorna cache timestamp
      cacheTimestamps.set(cacheKey, Date.now());

      setAuctions(fetchedAuctions);
    } catch (err) {
      console.error("❌ Error fetching auctions:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected, isCacheValid]);

  // Fetch singola asta
  const fetchAuctionById = useCallback(
    async (auctionId: AuctionId): Promise<FrontendAuction | null> => {
      // Controlla cache
      const cached = auctionCache.get(auctionId);
      if (cached) {
        console.log(`📦 Using cached auction ${auctionId}`);
        cacheHits.current++;
        return cached;
      }

      try {
        if (typeof window === "undefined" || !window.ethereum) {
          throw new Error("No ethereum provider available");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const auctionContract = new ethers.Contract(
          contracts.MooveAuction.address,
          contracts.MooveAuction.abi,
          provider
        );

        const rawAuctionData = await auctionContract.getAuction(auctionId);
        const contractData = parseContractAuctionData(rawAuctionData);
        const frontendAuction = convertContractToFrontend(contractData);

        // Aggiorna cache
        auctionCache.set(auctionId, frontendAuction);

        return frontendAuction;
      } catch (err) {
        console.error(`❌ Error fetching auction ${auctionId}:`, err);
        return null;
      }
    },
    []
  );

  // Refresh aste
  const refreshAuctions = useCallback(async () => {
    // Pulisci cache
    auctionCache.clear();
    cacheTimestamps.clear();

    await fetchAuctions();
  }, [fetchAuctions]);

  // Cache stats
  const cacheStats = {
    totalAuctions: auctionCache.size,
    lastFetch: cacheTimestamps.get(`auctions_${address}`)
      ? new Date(cacheTimestamps.get(`auctions_${address}`)!)
      : null,
    cacheHitRate:
      totalRequests.current > 0
        ? (cacheHits.current / totalRequests.current) * 100
        : 0,
  };

  // Auto-fetch on mount
  useEffect(() => {
    if (isConnected && address) {
      fetchAuctions();
    }
  }, [isConnected, address, fetchAuctions]);

  return {
    auctions,
    isLoading,
    error,
    fetchAuctions,
    fetchAuctionById,
    refreshAuctions,
    cacheStats,
  };
}

// ============= HOOK COLLEZIONE UNIFICATO =============

export function useUnifiedCollection(): UseUnifiedCollectionReturn {
  const { address, isConnected } = useAccount();
  const [nfts, setNfts] = useState<CollectionNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const currentPage = useRef(0);
  const pageSize = 20;

  // Fetch collezione utente
  const fetchCollection = useCallback(
    async (loadMore = false) => {
      if (!isConnected || !address) {
        setNfts([]);
        setIsLoading(false);
        return;
      }

      const cacheKey = `collection_${address}`;

      // Controlla cache per load iniziale
      if (!loadMore && isCacheValid(cacheKey)) {
        const cachedNFTs = collectionCache.get(address);
        if (cachedNFTs) {
          console.log(`📦 Using cached collection: ${cachedNFTs.length} NFTs`);
          setNfts(cachedNFTs);
          setIsLoading(false);
          return;
        }
      }

      try {
        if (!loadMore) {
          setIsLoading(true);
          currentPage.current = 0;
        } else {
          setIsLoadingMore(true);
        }

        setError(null);

        console.log("🔍 Fetching user collection...");

        if (typeof window === "undefined" || !window.ethereum) {
          throw new Error("No ethereum provider available");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const nftContract = new ethers.Contract(
          contracts.MooveNFT.address,
          contracts.MooveNFT.abi,
          provider
        );

        // Fetch Transfer events per questo utente
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 50000);

        const transferFilter = nftContract.filters.Transfer(null, address);
        const transferEvents = await nftContract.queryFilter(
          transferFilter,
          fromBlock,
          currentBlock
        );

        console.log(`📦 Found ${transferEvents.length} transfer events`);

        const userNFTs: CollectionNFT[] = [];
        const processedTokenIds = new Set<string>();

        for (const event of transferEvents) {
          try {
            const tokenId = (event as any).args.tokenId.toString();

            // Evita duplicati
            if (processedTokenIds.has(tokenId)) continue;
            processedTokenIds.add(tokenId);

            // Verifica ownership corrente
            const owner = await nftContract.ownerOf(tokenId);
            if (owner.toLowerCase() !== address.toLowerCase()) continue;

            // Fetch metadati NFT
            let metadata: any = {};
            try {
              const tokenURI = await nftContract.tokenURI(tokenId);
              if (tokenURI) {
                const response = await fetch(tokenURI);
                if (response.ok) {
                  metadata = await response.json();
                }
              }
            } catch (metadataError) {
              console.warn(
                `⚠️ Could not fetch metadata for token ${tokenId}:`,
                metadataError
              );
            }

            // Calcola prezzo da transazione
            let price = 0;
            let priceSource: CollectionNFT["priceSource"] = "fallback";

            try {
              const tx = await provider.getTransaction(event.transactionHash);
              if (tx && tx.value > 0) {
                price = parseFloat(ethers.formatEther(tx.value));
                priceSource = "transaction";
              } else {
                priceSource = "deserted_auction";
              }
            } catch (txError) {
              console.warn(`⚠️ Could not get transaction details:`, txError);
            }

            // Crea NFT object
            const nft: CollectionNFT = {
              id: `nft_${tokenId}`,
              tokenId,
              name: metadata.name || `NFT #${tokenId}`,
              description: metadata.description || "Moove Mobility NFT",
              image: metadata.image || "/images/placeholder-nft.png",
              rarity: metadata.attributes?.rarity || "common",
              purchaseDate: new Date(event.blockNumber * 1000), // Approssimativo
              price,
              priceSource,
              transactionHash: event.transactionHash,
              owner: address,
              isDesertedAuction: priceSource === "deserted_auction",
            };

            userNFTs.push(nft);
          } catch (nftError) {
            console.warn(`⚠️ Error processing NFT:`, nftError);
          }
        }

        console.log(`✅ Processed ${userNFTs.length} NFTs`);

        // Aggiorna stato
        if (loadMore) {
          setNfts((prev) => [...prev, ...userNFTs]);
        } else {
          setNfts(userNFTs);
          // Aggiorna cache
          collectionCache.set(address, userNFTs);
          cacheTimestamps.set(cacheKey, Date.now());
        }

        setHasMore(userNFTs.length === pageSize);
      } catch (err) {
        console.error("❌ Error fetching collection:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [address, isConnected, isCacheValid]
  );

  // Load more
  const loadMore = useCallback(async () => {
    if (!isLoadingMore && hasMore) {
      currentPage.current++;
      await fetchCollection(true);
    }
  }, [fetchCollection, isLoadingMore, hasMore]);

  // Refresh collezione
  const refreshCollection = useCallback(async () => {
    // Pulisci cache
    collectionCache.delete(address!);
    cacheTimestamps.delete(`collection_${address}`);

    await fetchCollection();
  }, [address, fetchCollection]);

  // Statistiche
  const totalItems = nfts.length;
  const totalValue = nfts.reduce((sum, nft) => sum + nft.price, 0);

  // Auto-fetch on mount
  useEffect(() => {
    if (isConnected && address) {
      fetchCollection();
    }
  }, [isConnected, address, fetchCollection]);

  return {
    nfts,
    isLoading,
    error,
    totalItems,
    totalValue,
    fetchCollection,
    refreshCollection,
    loadMore,
    hasMore,
    isLoadingMore,
  };
}

// ============= UTILITY FUNCTIONS =============

/**
 * Verifica validità cache
 */
function isCacheValid(cacheKey: string): boolean {
  const timestamp = cacheTimestamps.get(cacheKey);
  if (!timestamp) return false;
  return Date.now() - timestamp < CACHE_DURATION;
}

/**
 * Pulisce cache globale
 */
export function clearUnifiedCache(): void {
  auctionCache.clear();
  collectionCache.clear();
  cacheTimestamps.clear();
  console.log("🧹 Unified cache cleared");
}
