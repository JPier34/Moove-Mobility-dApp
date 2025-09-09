import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { useAuctionsEnhanced } from "./enhanced-auction-utils";

export interface WonAuction {
  auctionId: string;
  nftId: string;
  name: string;
  image: string;
  category: string;
  status: number;
  hasImage: boolean;
  hasName: boolean;
  finalBid: number;
  bidders: number;
  isSettled: boolean;
  endTime?: number; // Aggiunto campo endTime
  transactionHash?: string;
}

export interface UseWonAuctionsReturn {
  wonAuctions: WonAuction[];
  unsettledAuctions: WonAuction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useWonAuctions(): UseWonAuctionsReturn {
  const { address } = useAccount();
  const [wonAuctions, setWonAuctions] = useState<WonAuction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usa useAuctionsEnhanced per ottenere tutte le aste
  const {
    auctions,
    isLoading: auctionsLoading,
    refetch: refetchAuctions,
  } = useAuctionsEnhanced();

  const fetchWonAuctions = useCallback(async () => {
    if (!address || auctionsLoading) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`🏆 Fetching won auctions for user: ${address}`);
      console.log(`📊 Total auctions to check: ${auctions.length}`);

      // Filtra le aste dove l'utente ha vinto (sia attive che finite)
      const userWonAuctions = auctions.filter((auction) => {
        const isUserWinner =
          auction.highestBidder &&
          auction.highestBidder.toLowerCase() === address.toLowerCase();

        // Considera l'asta "ended" se status === 2 (ENDED) OPPURE status === 3 (SETTLED) OPPURE se status === 1 ma tempo scaduto
        const isEnded = auction.status === 2;
        const isSettled = auction.status === 3;
        const isTimeExpired =
          auction.status === 1 &&
          auction.endTime &&
          new Date(auction.endTime).getTime() <= Date.now();
        const isAuctionEnded = isEnded || isSettled || isTimeExpired;

        return isUserWinner && isAuctionEnded;
      });

      console.log(
        `🔍 Found ${userWonAuctions.length} auctions where user is highest bidder`
      );

      // Debug: mostra tutte le aste per capire il problema
      console.log(
        `📊 All auctions status:`,
        auctions.map((a) => ({
          id: a.auctionId,
          status: a.status,
          name: a.nftName,
          endTime: a.endTime ? new Date(a.endTime).toISOString() : "undefined",
          highestBidder: a.highestBidder,
        }))
      );

      const wonAuctions: WonAuction[] = [];

      for (const auction of userWonAuctions) {
        // Determina se l'asta è veramente finita (status 2, 3 o tempo scaduto)
        const isEnded = auction.status === 2;
        const isSettled = auction.status === 3;
        const isTimeExpired =
          auction.status === 1 &&
          auction.endTime &&
          new Date(auction.endTime).getTime() <= Date.now();
        const isAuctionEnded = isEnded || isSettled || isTimeExpired;

        console.log(
          `🎉 User won auction ${auction.auctionId} (status: ${auction.status}, ended: ${isAuctionEnded})`
        );

        const wonAuction: WonAuction = {
          auctionId: auction.auctionId,
          nftId: auction.nftId?.toString() || "0",
          name: auction.nftName || `NFT #${auction.nftId}`,
          image: auction.nftImage || "/images/default-nft.png",
          category: auction.nftCategory || "sticker",
          status: isAuctionEnded ? 2 : auction.status, // Forza status 2 se tempo scaduto
          hasImage: !!auction.nftImage,
          hasName: !!auction.nftName,
          finalBid: parseFloat(auction.currentBid) || 0,
          bidders: auction.bidCount || 0,
          isSettled: auction.isSettled || auction.status === 3,
          endTime: auction.endTime
            ? new Date(auction.endTime).getTime()
            : undefined,
          transactionHash: auction.transactionHash,
        };

        wonAuctions.push(wonAuction);
      }

      console.log(`🏆 User won ${wonAuctions.length} auctions`);
      setWonAuctions(wonAuctions);
    } catch (err) {
      console.error("❌ Error fetching won auctions:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [address, auctions, auctionsLoading]);

  useEffect(() => {
    fetchWonAuctions();
  }, [fetchWonAuctions]);

  const unsettledAuctions = wonAuctions.filter((auction) => !auction.isSettled);

  return {
    wonAuctions,
    unsettledAuctions,
    isLoading,
    error,
    refetch: fetchWonAuctions,
  };
}
