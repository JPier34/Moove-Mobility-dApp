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

      console.log(
        `🔍 [useSimpleWonAuctions] Checking ${totalCount} auctions for address ${address}`
      );

      // Debug: show first few auctions to understand structure
      if (totalCount > 0) {
        console.log(
          `🔍 [useSimpleWonAuctions] Sample auction data for debugging:`
        );
        // Note: We can't easily debug individual auctions here without contract instance
        // This debug section is commented out to avoid build errors
        console.log(
          `🔍 [useSimpleWonAuctions] Total auctions to check: ${totalCount}`
        );
      }

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
            console.log(`🔍 [useSimpleWonAuctions] Auction ${i} data:`, {
              auctionId: i,
              tokenId: auction.tokenId,
              winner: auction.winner,
              highestBidder: auction.highestBidder,
              userAddress: address,
              isWinner:
                auction.winner &&
                auction.winner.toLowerCase() === address.toLowerCase(),
              isHighestBidder:
                auction.highestBidder &&
                auction.highestBidder.toLowerCase() === address.toLowerCase(),
              status: auction.status,
              finalBid: auction.finalBid,
            });

            if (
              auction.winner &&
              auction.winner.toLowerCase() === address.toLowerCase()
            ) {
              console.log(
                `✅ [useSimpleWonAuctions] User won auction ${i} for NFT ${auction.tokenId}`
              );
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
                isSettled: auction.status === 4, // SETTLED (corrected to match contract)
                endTime: auction.endTime,
              });

              console.log(
                `🔍 [useSimpleWonAuctions] Added auction ${i} for NFT ${auction.tokenId}:`,
                {
                  auctionId: i.toString(),
                  nftId: auction.tokenId.toString(),
                  finalBid: auction.finalBid,
                  finalBidType: typeof auction.finalBid,
                  finalBidNumber: Number(auction.finalBid || 0),
                  status: auction.status,
                  isSettled: auction.status === 4, // SETTLED (corrected to match contract)
                }
              );
            }
          }
        } catch (e) {
          // Skip this auction if it fails
          continue;
        }
      }

      console.log(
        `🔍 [useSimpleWonAuctions] Found ${auctions.length} won auctions:`,
        auctions.map((a) => ({ nftId: a.nftId, finalBid: a.finalBid }))
      );
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
