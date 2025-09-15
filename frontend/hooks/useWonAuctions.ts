import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { useAuctionsEnhanced } from "./enhanced-auction-utils";
import { useTransactionTracker } from "./useTransactionTracker";

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

  // Usa il transaction tracker per ottenere gli hash delle transazioni
  const { getTransactionHash, isAuctionCompleted } = useTransactionTracker();

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

        // Considera l'asta "ended" se status === 3 (ENDED) OPPURE status === 4 (SETTLED) OPPURE se status === 1 ma tempo scaduto
        const isEnded = auction.status === 3;
        const isSettled = auction.status === 4; // Solo status 4 è settled per vincitori
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

      // Debug: mostra le aste filtrate
      console.log(
        `🔍 User won auctions:`,
        userWonAuctions.map((a) => ({
          id: a.auctionId,
          status: a.status,
          name: a.nftName,
          highestBidder: a.highestBidder,
          seller: a.seller,
        }))
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

      // Debug specifico per aste #12 e #13
      const auction12 = auctions.find((a) => a.auctionId === "12");
      const auction13 = auctions.find((a) => a.auctionId === "13");

      if (auction12) {
        console.log(`🔍 Auction #12 details:`, {
          id: auction12.auctionId,
          status: auction12.status,
          name: auction12.nftName,
          seller: auction12.seller,
          highestBidder: auction12.highestBidder,
          userAddress: address,
          isUserWinner:
            auction12.highestBidder &&
            auction12.highestBidder.toLowerCase() === address.toLowerCase(),
          isUserSeller:
            auction12.seller &&
            auction12.seller.toLowerCase() === address.toLowerCase(),
          endTime: auction12.endTime
            ? new Date(auction12.endTime).toISOString()
            : "undefined",
        });
      }

      if (auction13) {
        console.log(`🔍 Auction #13 details:`, {
          id: auction13.auctionId,
          status: auction13.status,
          name: auction13.nftName,
          seller: auction13.seller,
          highestBidder: auction13.highestBidder,
          userAddress: address,
          isUserWinner:
            auction13.highestBidder &&
            auction13.highestBidder.toLowerCase() === address.toLowerCase(),
          isUserSeller:
            auction13.seller &&
            auction13.seller.toLowerCase() === address.toLowerCase(),
          endTime: auction13.endTime
            ? new Date(auction13.endTime).toISOString()
            : "undefined",
        });
      }

      const wonAuctions: WonAuction[] = [];

      for (const auction of userWonAuctions) {
        // Determina se l'asta è veramente finita (status 3, 4 o tempo scaduto)
        const isEnded = auction.status === 3;
        const isSettled = auction.status === 4; // Solo status 4 è settled per vincitori
        const isTimeExpired =
          auction.status === 1 &&
          auction.endTime &&
          new Date(auction.endTime).getTime() <= Date.now();
        const isAuctionEnded = isEnded || isSettled || isTimeExpired;

        console.log(
          `🎉 User won auction ${auction.auctionId} (status: ${auction.status}, ended: ${isAuctionEnded})`
        );

        // Get transaction hash from transaction tracker
        const transactionHash = getTransactionHash(auction.auctionId);
        const isCompleted = isAuctionCompleted(auction.auctionId);

        const wonAuction: WonAuction = {
          auctionId: auction.auctionId,
          nftId: auction.nftId?.toString() || "0",
          name: auction.nftName || `NFT #${auction.nftId}`,
          image: auction.nftImage || "/images/default-nft.png",
          category: auction.nftCategory || "sticker",
          status: isAuctionEnded ? 3 : auction.status, // Forza status 3 se tempo scaduto
          hasImage: !!auction.nftImage,
          hasName: !!auction.nftName,
          finalBid: parseFloat(auction.currentBid) || 0,
          bidders: auction.bidCount || 0,
          isSettled: auction.isSettled || auction.status === 4 || isCompleted, // Solo status 4 è settled per vincitori
          endTime: auction.endTime
            ? new Date(auction.endTime).getTime()
            : undefined,
          transactionHash: transactionHash || auction.transactionHash,
        };

        wonAuctions.push(wonAuction);
      }

      // Filter to show auctions ready for settlement
      // Status 3 = ENDED (pronto per settlement)
      // Status 4 = SETTLED (già completato)
      const confirmedAuctions = wonAuctions.filter(
        (auction) =>
          auction.status === 3 || // Asta ENDED, pronta per settlement
          auction.status === 4 || // Asta già SETTLED
          (auction.transactionHash && isAuctionCompleted(auction.auctionId))
      );

      console.log(`🏆 User won ${wonAuctions.length} auctions`);
      console.log(`📊 All won auctions:`, wonAuctions);
      console.log(`✅ Confirmed auctions:`, confirmedAuctions);

      // Debug transaction tracking
      console.log(`🔍 Transaction tracking debug:`);
      wonAuctions.forEach((auction) => {
        const transactionHash = getTransactionHash(auction.auctionId);
        const isCompleted = isAuctionCompleted(auction.auctionId);
        console.log(`  Auction ${auction.auctionId}:`, {
          transactionHash,
          isCompleted,
          status: auction.status,
          isSettled: auction.isSettled,
        });
      });
      setWonAuctions(confirmedAuctions);
    } catch (err) {
      console.error("❌ Error fetching won auctions:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [
    address,
    auctions,
    auctionsLoading,
    getTransactionHash,
    isAuctionCompleted,
  ]);

  useEffect(() => {
    fetchWonAuctions();
  }, [fetchWonAuctions]); // Use fetchWonAuctions as dependency since it's now properly memoized

  const unsettledAuctions = wonAuctions.filter((auction) => !auction.isSettled);

  return {
    wonAuctions,
    unsettledAuctions,
    isLoading,
    error,
    refetch: fetchWonAuctions,
  };
}
