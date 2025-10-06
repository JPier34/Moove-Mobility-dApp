"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";

interface GraphNFT {
  id: string;
  tokenId: string;
  owner: string;
  tokenURI: string;
  createdAt: string;
  transactionHash: string;
  blockNumber: string;
}

interface GraphUserCollection {
  id: string;
  user: string;
  tokenId: string;
  nft: GraphNFT;
  acquiredAt: string;
  acquisitionMethod: string;
  auctionId?: string;
  price?: string;
  transactionHash: string;
  blockNumber: string;
}

interface GraphCollectionResult {
  userCollections: GraphUserCollection[];
}

/**
 * Hook per utilizzare il subgraph per la my-collection
 * Questo sostituisce il polling diretto degli eventi del contratto
 */
export function useGraphUserCollection() {
  const { address, isConnected } = useAccount();
  const [nfts, setNfts] = useState<GraphUserCollection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserCollection = useCallback(async () => {
    if (!address || !isConnected) {
      setNfts([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log("🔍 Fetching user collection from subgraph for:", address);

      // Query GraphQL per ottenere la collezione dell'utente
      const query = `
        query GetUserCollection($user: Bytes!) {
          userCollections(
            where: { user: $user }
            orderBy: acquiredAt
            orderDirection: desc
            first: 100
          ) {
            id
            user
            tokenId
            acquiredAt
            acquisitionMethod
            auctionId
            price
            transactionHash
            blockNumber
            nft {
              id
              tokenId
              owner
              tokenURI
              createdAt
              transactionHash
              blockNumber
            }
          }
        }
      `;

      // TODO: Sostituire con l'URL del subgraph deployato
      const SUBGRAPH_URL =
        process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
        "https://api.thegraph.com/subgraphs/name/your-username/moove-auction";

      const response = await fetch(SUBGRAPH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables: {
            user: address.toLowerCase(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: { data: GraphCollectionResult } = await response.json();

      if (result.data?.userCollections) {
        console.log(
          `✅ Found ${result.data.userCollections.length} NFTs in subgraph`
        );
        setNfts(result.data.userCollections);
      } else {
        console.log("📭 No NFTs found in subgraph");
        setNfts([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error(
        "❌ Error fetching user collection from subgraph:",
        errorMessage
      );
      setError(errorMessage);
      setNfts([]);
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  // Fetch on mount and when address changes
  useEffect(() => {
    fetchUserCollection();
  }, [fetchUserCollection]);

  // Refresh function
  const refresh = useCallback(() => {
    fetchUserCollection();
  }, [fetchUserCollection]);

  return {
    nfts,
    isLoading,
    error,
    refresh,
    // Helper functions
    getNFTCount: () => nfts.length,
    getNFTsByMethod: (method: string) =>
      nfts.filter((nft) => nft.acquisitionMethod === method),
    getNFTsFromAuctions: () =>
      nfts.filter((nft) => nft.acquisitionMethod === "auction"),
  };
}



