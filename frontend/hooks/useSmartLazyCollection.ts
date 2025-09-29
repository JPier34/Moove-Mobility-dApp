import { useState, useEffect, useMemo } from "react";
import { useReverseNFTFinder } from "./useReverseNFTFinder";
import { useSimpleWonAuctions } from "./useSimpleWonAuctions";
import { useMultipleNFTHistory } from "./useNFTHistory";

export interface SmartLazyCollectionResult {
  displayedNFTs: any[];
  allNFTs: any[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | undefined;
  totalItems: number;
  totalValue: number;
  loadMore: () => void;
  refresh: () => void;
  cacheStats: any;
}

const INITIAL_BATCH_SIZE = 12;
const SCROLL_BATCH_SIZE = 8;

export function useSmartLazyCollection(): SmartLazyCollectionResult {
  const reverseNFTFinder = useReverseNFTFinder();
  const { allWonAuctions, isLoading: auctionsLoading } = useSimpleWonAuctions();

  // Debug logging removed for performance

  const [displayedNFTs, setDisplayedNFTs] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Get NFT histories for all found NFTs
  const tokenIds = useMemo(
    () => reverseNFTFinder.userNFTs.map((nft) => nft.tokenId.toString()),
    [reverseNFTFinder.userNFTs]
  );

  const nftHistories = useMultipleNFTHistory(tokenIds);

  // Update displayed NFTs when new NFTs are found
  useEffect(() => {
    if (reverseNFTFinder.userNFTs.length > 0) {
      const endIndex = Math.min(
        currentPage * INITIAL_BATCH_SIZE,
        reverseNFTFinder.userNFTs.length
      );
      const newDisplayedNFTs = reverseNFTFinder.userNFTs.slice(0, endIndex);
      setDisplayedNFTs(newDisplayedNFTs);
    }
  }, [reverseNFTFinder.userNFTs, currentPage]);

  const loadMore = () => {
    console.log("🔄 [useSmartLazyCollection] loadMore called:", {
      isLoadingMore,
      hasMore,
      displayedCount: displayedNFTs.length,
      totalCount: reverseNFTFinder.userNFTs.length,
      isComplete: reverseNFTFinder.isComplete,
    });

    if (isLoadingMore || !hasMore) {
      console.log("🛑 [useSmartLazyCollection] loadMore blocked:", {
        isLoadingMore,
        hasMore,
      });
      return;
    }

    setIsLoadingMore(true);

    // Simulate loading delay
    setTimeout(() => {
      setCurrentPage((prev) => prev + 1);
      setIsLoadingMore(false);
    }, 300);
  };

  const refresh = () => {
    setCurrentPage(1);
    setDisplayedNFTs([]);
    // The reverseNFTFinder will automatically restart
  };

  const hasMore = displayedNFTs.length < reverseNFTFinder.userNFTs.length;

  console.log("🔍 [useSmartLazyCollection] hasMore calculation:", {
    displayedCount: displayedNFTs.length,
    totalCount: reverseNFTFinder.userNFTs.length,
    isComplete: reverseNFTFinder.isComplete,
    hasMore,
  });

  // Calculate total value from won auctions
  const totalValue = useMemo(() => {
    return allWonAuctions.reduce((total, auction) => {
      return total + Number(auction.finalBid || 0);
    }, 0);
  }, [allWonAuctions]);

  // Create decorative NFTs with auction data
  const decorativeNFTs = useMemo(() => {
    console.log("🔍 [useSmartLazyCollection] Creating decorative NFTs:", {
      displayedCount: displayedNFTs.length,
      wonAuctionsCount: allWonAuctions.length,
      wonAuctions: allWonAuctions.map((a) => ({
        nftId: a.nftId,
        finalBid: a.finalBid,
      })),
    });

    return displayedNFTs.map((nft) => {
      const auction = allWonAuctions.find(
        (auction) => auction.nftId === nft.tokenId.toString()
      );

      console.log(
        `🔍 [useSmartLazyCollection] NFT ${nft.tokenId} auction match:`,
        {
          tokenId: nft.tokenId,
          auction: auction
            ? { nftId: auction.nftId, finalBid: auction.finalBid }
            : null,
        }
      );

      const history = nftHistories.histories.get(nft.tokenId.toString());

      // Extract purchase date and transaction hash from history
      let purchaseDate = new Date();
      let transactionHash = "";

      if (history && history.history.length > 0) {
        const lastTransfer = history.history[history.history.length - 1];
        purchaseDate = new Date(lastTransfer.timestamp * 1000);
        transactionHash = lastTransfer.transactionHash;
      }

      return {
        id: `nft-${nft.tokenId}`,
        tokenId: nft.tokenId.toString(),
        name: nft.name,
        description: nft.description,
        image: nft.image,
        rarity: "common" as const,
        purchaseDate,
        price: auction?.finalBid || 0,
        transactionHash,
        auctionWon: auction
          ? {
              auctionId: auction.auctionId,
              finalBid: auction.finalBid,
              bidders: auction.bidders || 0,
            }
          : undefined,
      };
    });
  }, [displayedNFTs, allWonAuctions, nftHistories]);

  return {
    displayedNFTs: decorativeNFTs,
    allNFTs: reverseNFTFinder.userNFTs,
    isLoading: reverseNFTFinder.isLoading,
    isLoadingMore,
    hasMore,
    error: reverseNFTFinder.error,
    totalItems: reverseNFTFinder.foundCount,
    totalValue,
    loadMore,
    refresh,
    cacheStats: {
      hits: 0,
      misses: 0,
      hitRate: 0,
      evictions: 0,
      totalSize: 0,
    },
  };
}
