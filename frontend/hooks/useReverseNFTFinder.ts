import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { useReadMooveNFT } from "@/hooks/useContract";

export interface UserNFT {
  tokenId: number;
  owner: string;
  tokenURI: string;
  name: string;
  description: string;
  image: string;
  metadata?: any;
}

export interface ReverseNFTFinderResult {
  userNFTs: UserNFT[];
  isLoading: boolean;
  isComplete: boolean;
  hasMore: boolean;
  error: string | undefined;
  totalChecked: number;
  lastCheckedTokenId: number;
  foundCount: number;
  totalSupply: number | undefined;
  currentSearchPoint: number;
  hasFoundUpperBound: boolean;
}

const INITIAL_DISPLAY_COUNT = 12;
const BATCH_SIZE = 20;

export function useReverseNFTFinder(): ReverseNFTFinderResult {
  const { address } = useAccount();

  // Debug log to check if address is available
  console.log("🔍 [useReverseNFTFinder] Address check:", {
    address,
    hasAddress: !!address,
  });

  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [totalChecked, setTotalChecked] = useState(0);
  const [lastCheckedTokenId, setLastCheckedTokenId] = useState<number>(-1);
  const [foundCount, setFoundCount] = useState(0);
  const [totalSupply, setTotalSupply] = useState<number | undefined>();
  // Smart dynamic range detection
  const INITIAL_SEARCH_POINT = 50; // Start from 50 instead of 200
  const SEARCH_INCREMENT = 25; // Smaller increments for better detection
  const MAX_CONSECUTIVE_NOT_FOUND = 10;

  const [consecutiveNotFound, setConsecutiveNotFound] = useState(0);
  const [currentSearchPoint, setCurrentSearchPoint] =
    useState(INITIAL_SEARCH_POINT);
  const [hasFoundUpperBound, setHasFoundUpperBound] = useState(false);

  // Debug logging removed for performance

  // Fetch NFT metadata from IPFS
  const fetchNFTMetadata = useCallback(async (tokenURI: string) => {
    try {
      console.log(
        `🔍 [useReverseNFTFinder] Fetching metadata from: ${tokenURI}`
      );
      const response = await fetch(
        `/api/ipfs-proxy?url=${encodeURIComponent(tokenURI)}`
      );
      if (!response.ok) {
        console.warn(
          `❌ [useReverseNFTFinder] Failed to fetch metadata: ${response.status} ${response.statusText}`
        );
        throw new Error("Failed to fetch metadata");
      }
      const metadata = await response.json();
      console.log(`✅ [useReverseNFTFinder] Metadata fetched:`, metadata);
      return metadata;
    } catch (error) {
      console.warn(
        "❌ [useReverseNFTFinder] Failed to fetch NFT metadata:",
        error
      );
      return null;
    }
  }, []);

  // Check if user owns a specific token
  const checkTokenOwnership = useCallback(
    async (tokenId: number): Promise<UserNFT | null> => {
      if (!address) return null;

      console.log(
        `🔍 [useReverseNFTFinder] Checking token ${tokenId} ownership for address ${address}...`
      );

      try {
        // Use fetch to call the contract methods
        const ownerResponse = await fetch("/api/contract-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "ownerOf",
            args: [tokenId],
            contract: "nft",
          }),
        });

        if (!ownerResponse.ok) {
          console.log(
            `❌ [useReverseNFTFinder] Token ${tokenId} ownerOf failed: ${ownerResponse.status}`
          );
          return null;
        }

        const owner = await ownerResponse.text();
        const cleanOwner = owner.replace(/"/g, ""); // Remove quotes

        console.log(
          `🔍 [useReverseNFTFinder] Token ${tokenId} owner: ${cleanOwner}, user: ${address}`
        );

        if (cleanOwner.toLowerCase() === address.toLowerCase()) {
          console.log(
            `✅ [useReverseNFTFinder] User owns token ${tokenId}, fetching metadata...`
          );

          const tokenURIResponse = await fetch("/api/contract-call", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              method: "tokenURI",
              args: [tokenId],
              contract: "nft",
            }),
          });

          if (!tokenURIResponse.ok) {
            console.log(
              `❌ [useReverseNFTFinder] Token ${tokenId} tokenURI failed: ${tokenURIResponse.status}`
            );
            return null;
          }

          const tokenURI = await tokenURIResponse.text();
          const cleanTokenURI = tokenURI.replace(/"/g, ""); // Remove quotes

          console.log(
            `🔍 [useReverseNFTFinder] Token ${tokenId} tokenURI: ${cleanTokenURI}`
          );

          const metadata = await fetchNFTMetadata(cleanTokenURI);

          console.log(`🔍 [useReverseNFTFinder] NFT ${tokenId} metadata:`, {
            tokenId,
            tokenURI: cleanTokenURI,
            metadata,
            name: metadata?.name,
            description: metadata?.description,
            image: metadata?.image,
          });

          return {
            tokenId,
            owner: cleanOwner,
            tokenURI: cleanTokenURI,
            name: metadata?.name || `NFT #${tokenId}`,
            description:
              metadata?.description || "A unique NFT from your collection",
            image: metadata?.image || "/images/default-nft.png",
            metadata,
          };
        } else {
          console.log(
            `❌ [useReverseNFTFinder] Token ${tokenId} not owned by user`
          );
        }
        return null;
      } catch (error) {
        return null;
      }
    },
    [address, fetchNFTMetadata]
  );

  // Smart range detection function - find first non-existent token
  const findUpperBound = useCallback(async (): Promise<number> => {
    let searchPoint = INITIAL_SEARCH_POINT;
    let increment = SEARCH_INCREMENT;

    console.log(
      `🔍 [useReverseNFTFinder] Starting smart range detection from ${searchPoint}`
    );

    while (true) {
      try {
        // Check if token exists at current search point
        const ownerResponse = await fetch("/api/contract-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "ownerOf",
            args: [searchPoint],
            contract: "nft",
          }),
        });

        if (ownerResponse.ok) {
          // Token exists, continue searching higher
          searchPoint += increment;
          increment += SEARCH_INCREMENT; // Progressive increment: +25, +50, +75, etc.
          console.log(
            `🔍 [useReverseNFTFinder] Token ${
              searchPoint - increment
            } exists, trying ${searchPoint}`
          );
        } else {
          // Token doesn't exist, this is our upper bound
          console.log(
            `✅ [useReverseNFTFinder] Found upper bound at token ${searchPoint} (first non-existent)`
          );
          return searchPoint;
        }
      } catch (error) {
        console.warn(
          `⚠️ [useReverseNFTFinder] Error checking token ${searchPoint}:`,
          error
        );
        // On error, assume token doesn't exist
        console.log(
          `✅ [useReverseNFTFinder] Found upper bound at token ${searchPoint} (error case)`
        );
        return searchPoint;
      }

      // Safety limit to prevent infinite loops
      if (searchPoint > 10000) {
        console.log(
          `🛑 [useReverseNFTFinder] Reached safety limit, using ${searchPoint} as upper bound`
        );
        return searchPoint;
      }
    }
  }, []);

  // Main search function with smart range detection
  const searchNFTs = useCallback(async () => {
    if (!address || isLoading) {
      return;
    }
    setIsLoading(true);
    setError(undefined);
    setUserNFTs([]);
    setTotalChecked(0);
    setFoundCount(0);
    setConsecutiveNotFound(0);
    setIsComplete(false);
    setHasFoundUpperBound(false);

    try {
      // First, find the upper bound dynamically
      const upperBound = await findUpperBound();
      setCurrentSearchPoint(upperBound);
      setHasFoundUpperBound(true);

      // Start from upper bound and work backwards to 0
      let currentTokenId = upperBound;
      let consecutiveNotFound = 0;
      let checked = 0;
      let found = 0;

      console.log(
        `🔍 [useReverseNFTFinder] Starting smart search from token ${currentTokenId} to 0 for address ${address}`
      );
      setLastCheckedTokenId(currentTokenId);

      while (currentTokenId >= 0 && !isComplete) {
        const batch: Promise<UserNFT | null>[] = [];

        // Check a batch of tokens
        for (let i = 0; i < BATCH_SIZE && currentTokenId >= 0; i++) {
          batch.push(checkTokenOwnership(currentTokenId));
          currentTokenId--;
        }

        const results = await Promise.all(batch);
        const foundNFTs = results.filter((nft): nft is UserNFT => nft !== null);

        if (foundNFTs.length > 0) {
          console.log(
            `🔍 [useReverseNFTFinder] Found ${foundNFTs.length} NFTs in batch:`,
            foundNFTs.map((nft) => nft.tokenId)
          );
          setUserNFTs((prev) => [...prev, ...foundNFTs]); // Add batch after existing NFTs to maintain descending order (highest token ID first)
          found += foundNFTs.length;
          setFoundCount(found);
          consecutiveNotFound = 0;
          setConsecutiveNotFound(0);
        } else {
          consecutiveNotFound += BATCH_SIZE;
          setConsecutiveNotFound(consecutiveNotFound);
        }

        checked += BATCH_SIZE;
        setTotalChecked(checked);
        setLastCheckedTokenId(currentTokenId);

        // Smart stop condition: found enough consecutive empty tokens
        if (
          consecutiveNotFound >= MAX_CONSECUTIVE_NOT_FOUND * BATCH_SIZE &&
          checked >= 50 && // Minimum checks before stopping
          currentTokenId < 100 // Stop if we're below 100 and found many consecutive empty
        ) {
          console.log(
            `🛑 [useReverseNFTFinder] Stopping search: ${consecutiveNotFound} consecutive not found, ${checked} total checked, currentTokenId: ${currentTokenId}`
          );
          setIsComplete(true);
          break;
        }

        // Small delay to prevent blocking
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // If we haven't reached 0 yet, continue with a more targeted search
      if (currentTokenId > 0) {
        console.log(
          `🔄 [useReverseNFTFinder] Continuing search from ${currentTokenId} to 0...`
        );

        // Continue searching from current position to 0
        while (currentTokenId >= 0) {
          const nft = await checkTokenOwnership(currentTokenId);
          if (nft) {
            console.log(
              `🔍 [useReverseNFTFinder] Found NFT at token ${currentTokenId}`
            );
            setUserNFTs((prev) => [nft, ...prev]); // Add to beginning to maintain reverse order (highest token ID first)
            found++;
            setFoundCount(found);
            consecutiveNotFound = 0;
            setConsecutiveNotFound(0);
          } else {
            consecutiveNotFound++;
            setConsecutiveNotFound(consecutiveNotFound);
          }

          checked++;
          setTotalChecked(checked);
          setLastCheckedTokenId(currentTokenId);
          currentTokenId--;

          // Small delay to prevent blocking
          await new Promise((resolve) => setTimeout(resolve, 5));
        }
      }

      setIsComplete(true);
      console.log(
        `✅ [useReverseNFTFinder] Smart search completed: found ${found} NFTs, checked ${checked} tokens, range: ${upperBound} to 0`
      );
    } catch (error) {
      console.error("❌ [useReverseNFTFinder] Error searching NFTs:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [address, isLoading, checkTokenOwnership, isComplete, findUpperBound]);

  // Start optimized search when address is available
  useEffect(() => {
    console.log("🔍 [useReverseNFTFinder] Effect triggered:", {
      address: !!address,
      isLoading,
      isComplete,
      shouldStart: address && !isLoading && !isComplete,
    });

    if (address && !isLoading && !isComplete) {
      console.log(
        `🔍 [useReverseNFTFinder] Starting smart search with dynamic range detection...`
      );
      searchNFTs();
    }
  }, [address, searchNFTs, isLoading, isComplete]);

  return {
    userNFTs,
    isLoading,
    isComplete,
    hasMore: !isComplete,
    error,
    totalChecked,
    lastCheckedTokenId,
    foundCount,
    totalSupply,
    currentSearchPoint,
    hasFoundUpperBound,
  };
}
