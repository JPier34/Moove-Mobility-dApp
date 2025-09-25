import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { useReadMooveAuction } from "./useContract";

export interface SimpleWonAuction {
  auctionId: string;
  nftId: string;
  name: string;
  image: string;
  category: string;
  status: number;
  finalBid: number;
  bidders: number;
  isSettled: boolean;
  endTime?: number;
  transactionHash?: string;
}

export interface SimpleWonAuctionsResult {
  allWonAuctions: SimpleWonAuction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSimpleWonAuctions(): SimpleWonAuctionsResult {
  const { address } = useAccount();
  const [wonAuctions, setWonAuctions] = useState<SimpleWonAuction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get total auctions count from auction contract
  const { data: totalAuctions } = useReadMooveAuction<bigint>(
    "totalAuctions",
    [],
    {
      enabled: !!address,
    }
  );

  const fetchWonAuctions = useCallback(async () => {
    if (!address || !totalAuctions) return;

    setIsLoading(true);
    setError(null);

    try {
      const auctions: SimpleWonAuction[] = [];
      const totalCount = Number(totalAuctions);

      // Check each auction to see if user won it
      for (let i = 0; i < totalCount; i++) {
        try {
          // Get auction data
          const auctionData = await fetch("/api/contract-call", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              method: "getAuction",
              args: [i],
              contract: "auction",
            }),
          });

          if (auctionData.ok) {
            const auction = await auctionData.json();

            // Check if user is the winner
            if (
              auction.winner &&
              auction.winner.toLowerCase() === address.toLowerCase()
            ) {
              // Get NFT metadata
              const tokenURI = await fetch("/api/contract-call", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  method: "tokenURI",
                  args: [auction.tokenId],
                  contract: "nft",
                }),
              });

              let name = `NFT #${auction.tokenId}`;
              let image = "/images/default-nft.png";

              if (tokenURI.ok) {
                const uri = await tokenURI.text();
                const cleanUri = uri.replace(/"/g, "");

                try {
                  const metadataResponse = await fetch("/api/ipfs-proxy", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: cleanUri }),
                  });

                  if (metadataResponse.ok) {
                    const metadata = await metadataResponse.json();
                    name = metadata.name || name;
                    image = metadata.image || image;
                  }
                } catch (e) {
                  // Use defaults if metadata fetch fails
                }
              }

              auctions.push({
                auctionId: i.toString(),
                nftId: auction.tokenId.toString(),
                name,
                image,
                category: "sticker",
                status: auction.status,
                finalBid: Number(auction.finalBid || 0),
                bidders: Number(auction.bidders || 0),
                isSettled: auction.status === 4,
                endTime: auction.endTime,
              });
            }
          }
        } catch (e) {
          // Skip this auction if it fails
          continue;
        }
      }

      setWonAuctions(auctions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [address, totalAuctions]);

  useEffect(() => {
    if (address && totalAuctions) {
      fetchWonAuctions();
    }
  }, [fetchWonAuctions]);

  return {
    allWonAuctions: wonAuctions,
    isLoading,
    error,
    refetch: fetchWonAuctions,
  };
}
