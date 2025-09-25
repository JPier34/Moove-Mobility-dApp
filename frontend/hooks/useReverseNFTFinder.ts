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
  const [consecutiveNotFound, setConsecutiveNotFound] = useState(0);

  // Optimized search strategy: start from 200 and work down to 0
  // Based on our testing, we know NFTs exist in range 0-97
  const START_SEARCH_FROM = 200; // Start from 200 as suggested
  const MAX_CONSECUTIVE_NOT_FOUND = 10;

  // Debug logging removed for performance

  // Fetch NFT metadata from IPFS
  const fetchNFTMetadata = useCallback(async (tokenURI: string) => {
    try {
      const response = await fetch(
        `/api/ipfs-proxy?url=${encodeURIComponent(tokenURI)}`
      );
      if (!response.ok) throw new Error("Failed to fetch metadata");
      return await response.json();
    } catch (error) {
      console.warn("Failed to fetch NFT metadata:", error);
      return null;
    }
  }, []);

  // Check if user owns a specific token
  const checkTokenOwnership = useCallback(
    async (tokenId: number): Promise<UserNFT | null> => {
      if (!address) return null;

      console.log(
        `🔍 [useReverseNFTFinder] Checking token ${tokenId} ownership...`
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

        if (cleanOwner.toLowerCase() === address.toLowerCase()) {
          const tokenURIResponse = await fetch("/api/contract-call", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              method: "tokenURI",
              args: [tokenId],
              contract: "nft",
            }),
          });

          if (!tokenURIResponse.ok) return null;

          const tokenURI = await tokenURIResponse.text();
          const cleanTokenURI = tokenURI.replace(/"/g, ""); // Remove quotes

          const metadata = await fetchNFTMetadata(cleanTokenURI);

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
        }
        return null;
      } catch (error) {
        return null;
      }
    },
    [address, fetchNFTMetadata]
  );

  // Main search function - no longer depends on totalSupply
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

    try {
      // Start from 200 and work backwards to 0
      let currentTokenId = START_SEARCH_FROM; // Start from 200 as suggested
      let consecutiveNotFound = 0;
      let checked = 0;
      let found = 0;

      console.log(
        `🔍 [useReverseNFTFinder] Starting optimized search from token ${currentTokenId} for address ${address}`
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
          setUserNFTs((prev) => [...foundNFTs, ...prev]); // Add to beginning to maintain reverse order
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

        // Stop condition: found enough consecutive empty tokens
        // Since we know NFTs exist in range 0-97, we can stop earlier
        if (
          consecutiveNotFound >= MAX_CONSECUTIVE_NOT_FOUND * BATCH_SIZE &&
          checked >= 50 && // Reduced from 100 since we know the range
          currentTokenId < 50 // Stop if we're below 50 and found many consecutive empty
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
            setUserNFTs((prev) => [nft, ...prev]);
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
        `✅ [useReverseNFTFinder] Search completed: found ${found} NFTs, checked ${checked} tokens, range: ${START_SEARCH_FROM} to 0`
      );
    } catch (error) {
      console.error("❌ [useReverseNFTFinder] Error searching NFTs:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [address, isLoading, checkTokenOwnership, isComplete]);

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
        `🔍 [useReverseNFTFinder] Starting optimized search from ${START_SEARCH_FROM} to 0...`
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
  };
}
