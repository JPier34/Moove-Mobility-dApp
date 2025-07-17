import { useState, useCallback } from "react";
import { NFTMetadata } from "@/types/nft";

const IPFS_GATEWAY =
  process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/";

export function useIPFS() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetadata = useCallback(
    async (uri: string): Promise<NFTMetadata | null> => {
      if (!uri) return null;

      setIsLoading(true);
      setError(null);

      try {
        // Convert ipfs:// to HTTP gateway URL
        const httpUrl = uri.startsWith("ipfs://")
          ? `${IPFS_GATEWAY}${uri.slice(7)}`
          : uri;

        const response = await fetch(httpUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.statusText}`);
        }

        const metadata: NFTMetadata = await response.json();

        // Convert image IPFS URL if needed
        if (metadata.image?.startsWith("ipfs://")) {
          metadata.image = `${IPFS_GATEWAY}${metadata.image.slice(7)}`;
        }

        return metadata;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to fetch metadata");
        setError(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getIPFSUrl = useCallback((hash: string) => {
    return `${IPFS_GATEWAY}${hash}`;
  }, []);

  return {
    fetchMetadata,
    getIPFSUrl,
    isLoading,
    error,
  };
}
