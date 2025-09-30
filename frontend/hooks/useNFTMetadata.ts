"use client";

import { useState, useEffect, useCallback } from "react";
import { useReadContract } from "wagmi";
import { contracts } from "@/utils/contracts";

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties?: Record<string, any>;
  collection?: {
    name: string;
    description: string;
  };
}

export function useNFTMetadata(tokenId: number) {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use Wagmi to read tokenURI from contract
  const { data: tokenURI, isLoading: uriLoading } = useReadContract({
    address: contracts.MooveNFT.address,
    abi: contracts.MooveNFT.abi,
    functionName: "tokenURI",
    args: [BigInt(tokenId)],
    query: {
      enabled: tokenId > 0,
    },
  });

  // Fetch metadata from IPFS
  const fetchMetadataFromIPFS = useCallback(
    async (uri: string): Promise<NFTMetadata | null> => {
      if (!uri) return null;

      try {
        // Convert ipfs:// to HTTP gateway URL
        const IPFS_GATEWAY =
          process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/";
        const httpUrl = uri.startsWith("ipfs://")
          ? `${IPFS_GATEWAY}${uri.slice(7)}`
          : uri;

        const response = await fetch(httpUrl);
        if (!response.ok) {
          console.warn(
            `⚠️ Failed to fetch metadata from IPFS: ${response.statusText}`
          );
          // Return fallback metadata instead of throwing error
          return {
            name: `NFT #${tokenId}`,
            description: `A unique NFT with token ID ${tokenId}`,
            image: "/images/default-nft.svg",
            attributes: [
              {
                trait_type: "Category",
                value: "VEHICLE_DECORATION",
              },
              {
                trait_type: "Rarity",
                value: "Common",
              },
            ],
            properties: {
              category: "sticker",
              rarity: "common",
            },
          };
        }

        const ipfsMetadata = await response.json();

        // Convert image IPFS URL if needed
        let imageUrl = ipfsMetadata.image || "/images/default-nft.svg";
        if (imageUrl.startsWith("ipfs://")) {
          imageUrl = `${IPFS_GATEWAY}${imageUrl.slice(7)}`;
        }

        return {
          name: ipfsMetadata.name || `NFT #${tokenId}`,
          description:
            ipfsMetadata.description || `A unique NFT with token ID ${tokenId}`,
          image: imageUrl,
          attributes: ipfsMetadata.attributes || [
            {
              trait_type: "Token ID",
              value: tokenId.toString(),
            },
            {
              trait_type: "Type",
              value: "Genesis Collection",
            },
          ],
          properties: ipfsMetadata.properties || {
            tokenId: tokenId.toString(),
            collection: "Genesis",
          },
          collection: ipfsMetadata.collection || {
            name: "Genesis Collection",
            description: "The original collection of Moove NFTs",
          },
        };
      } catch (err) {
        console.error(`❌ Failed to fetch metadata for NFT #${tokenId}:`, err);
        // Return fallback metadata instead of null
        return {
          name: `NFT #${tokenId}`,
          description: `A unique NFT with token ID ${tokenId}`,
          image: "/images/default-nft.svg",
          attributes: [
            {
              trait_type: "Category",
              value: "VEHICLE_DECORATION",
            },
            {
              trait_type: "Rarity",
              value: "Common",
            },
          ],
          properties: {
            category: "sticker",
            rarity: "common",
          },
        };
      }
    },
    [tokenId]
  );

  // Effect to fetch metadata when tokenURI is available
  useEffect(() => {
    if (!tokenURI || uriLoading) return;

    const fetchMetadata = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const fetchedMetadata = await fetchMetadataFromIPFS(
          tokenURI as unknown as string
        );

        if (fetchedMetadata) {
          setMetadata(fetchedMetadata);
        } else {
          // Fallback metadata if IPFS fetch fails
          setMetadata({
            name: `NFT #${tokenId}`,
            description: `A unique NFT with token ID ${tokenId}`,
            image: "/images/default-nft.svg",
            attributes: [
              {
                trait_type: "Token ID",
                value: tokenId.toString(),
              },
              {
                trait_type: "Type",
                value: "Genesis Collection",
              },
            ],
            properties: {
              tokenId: tokenId.toString(),
              collection: "Genesis",
            },
            collection: {
              name: "Genesis Collection",
              description: "The original collection of Moove NFTs",
            },
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch metadata";
        setError(errorMessage);
        console.error(`❌ Error fetching metadata for NFT #${tokenId}:`, err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [tokenURI, uriLoading, fetchMetadataFromIPFS]);

  return {
    metadata,
    isLoading: isLoading || uriLoading,
    error,
    tokenURI,
  };
}
