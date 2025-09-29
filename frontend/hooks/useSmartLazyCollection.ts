import { useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { useReverseNFTFinder } from "./useReverseNFTFinder";
import { useSimpleWonAuctions } from "./useSimpleWonAuctions";
import { useMultipleNFTHistory } from "./useNFTHistory";
import { useMultipleAuctionHistory } from "./useAuctionHistory";

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
  const { address } = useAccount();
  const reverseNFTFinder = useReverseNFTFinder();
  const { allWonAuctions, isLoading: auctionsLoading } = useSimpleWonAuctions();

  // Debug logging removed for performance

  const [displayedNFTs, setDisplayedNFTs] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Reset collection when wallet address changes
  useEffect(() => {
    console.log(
      "🔄 [useSmartLazyCollection] Address changed, resetting collection:",
      {
        newAddress: address,
        previousDisplayedCount: displayedNFTs.length,
      }
    );

    // Reset all state when address changes
    setDisplayedNFTs([]);
    setCurrentPage(1);
    setIsLoadingMore(false);
  }, [address]);

  // Get NFT histories for all found NFTs
  const tokenIds = useMemo(
    () => reverseNFTFinder.userNFTs.map((nft) => nft.tokenId.toString()),
    [reverseNFTFinder.userNFTs]
  );

  const nftHistories = useMultipleNFTHistory(tokenIds);
  const auctionHistories = useMultipleAuctionHistory(tokenIds);

  // Debug auction histories
  console.log("🔍 [useSmartLazyCollection] auctionHistories result:", {
    histories: auctionHistories.histories,
    historiesSize: auctionHistories.histories.size,
    isLoading: auctionHistories.isLoading,
    error: auctionHistories.error,
  });

  // Update displayed NFTs when new NFTs are found
  useEffect(() => {
    console.log("🔍 [useSmartLazyCollection] useEffect triggered:", {
      userNFTsLength: reverseNFTFinder.userNFTs.length,
      currentPage,
      endIndex: Math.min(
        currentPage * INITIAL_BATCH_SIZE,
        reverseNFTFinder.userNFTs.length
      ),
      displayedNFTsLength: displayedNFTs.length,
      userNFTsSample: reverseNFTFinder.userNFTs
        .slice(0, 3)
        .map((nft) => ({ tokenId: nft.tokenId, name: nft.name })),
      reverseNFTFinderState: {
        isLoading: reverseNFTFinder.isLoading,
        isComplete: reverseNFTFinder.isComplete,
        error: reverseNFTFinder.error,
      },
    });

    if (reverseNFTFinder.userNFTs.length > 0) {
      const endIndex = Math.min(
        currentPage * INITIAL_BATCH_SIZE,
        reverseNFTFinder.userNFTs.length
      );
      const newDisplayedNFTs = reverseNFTFinder.userNFTs.slice(0, endIndex);
      console.log("🔍 [useSmartLazyCollection] Setting displayed NFTs:", {
        newDisplayedNFTsLength: newDisplayedNFTs.length,
        firstFewNFTs: newDisplayedNFTs
          .slice(0, 3)
          .map((nft) => ({ tokenId: nft.tokenId, name: nft.name })),
      });
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
    console.log(
      "🔄 [useSmartLazyCollection] Manual refresh triggered - reloading page"
    );
    window.location.reload();
  };

  const hasMore = displayedNFTs.length < reverseNFTFinder.userNFTs.length;

  console.log("🔍 [useSmartLazyCollection] hasMore calculation:", {
    displayedCount: displayedNFTs.length,
    totalCount: reverseNFTFinder.userNFTs.length,
    isComplete: reverseNFTFinder.isComplete,
    hasMore,
  });

  // Calculate total value from owned NFTs auction prices
  const totalValue = useMemo(() => {
    console.log(
      "🔍 [useSmartLazyCollection] Calculating total value from owned NFTs:",
      {
        displayedNFTsCount: displayedNFTs.length,
        auctionHistoriesSize: auctionHistories.histories.size,
      }
    );

    const calculatedTotal = displayedNFTs.reduce((total, nft) => {
      const auctionHistory = auctionHistories.histories.get(
        nft.tokenId.toString()
      );
      // Convert from wei to ETH (1 ETH = 10^18 wei)
      let auctionPrice = 0;
      if (auctionHistory?.finalPrice) {
        const weiValue = parseFloat(auctionHistory.finalPrice);
        auctionPrice = weiValue / Math.pow(10, 18); // Convert wei to ETH
      }

      console.log(`🔍 [useSmartLazyCollection] NFT ${nft.tokenId}:`, {
        auctionHistory: !!auctionHistory,
        finalPriceWei: auctionHistory?.finalPrice,
        finalPriceETH: auctionPrice,
        totalSoFar: total,
      });

      return total + auctionPrice;
    }, 0);

    console.log(
      "🔍 [useSmartLazyCollection] Total value calculated from owned NFTs:",
      calculatedTotal
    );
    return calculatedTotal;
  }, [displayedNFTs, auctionHistories]);

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
      const auctionHistory = auctionHistories.histories.get(
        nft.tokenId.toString()
      );

      // Extract purchase date, transaction hash, and price from auction history
      let purchaseDate = new Date();
      let transactionHash = "";
      let price = 0;

      // Prioritize auction history for price extraction
      console.log(
        `🔍 [useSmartLazyCollection] NFT ${nft.tokenId} auction history check:`,
        {
          hasAuctionHistory: !!auctionHistory,
          finalPrice: auctionHistory?.finalPrice,
          historyLength: auctionHistory?.history?.length || 0,
          auctionHistory: auctionHistory, // Mostra tutto l'oggetto
        }
      );

      if (auctionHistory && auctionHistory.finalPrice) {
        price = parseFloat(ethers.formatEther(auctionHistory.finalPrice));
        purchaseDate = new Date();
        transactionHash = "";

        // Find the auction settled event for timestamp and transaction hash
        const settledEvent = auctionHistory.history.find(
          (h) => h.type === "auction_settled"
        );
        if (settledEvent) {
          purchaseDate = new Date(settledEvent.timestamp * 1000);
          transactionHash = settledEvent.transactionHash;
        }

        console.log(
          `💰 [useSmartLazyCollection] NFT ${nft.tokenId} price from auction: ${price} ETH`,
          {
            tokenId: nft.tokenId,
            finalPrice: auctionHistory.finalPrice,
            finalPriceETH: ethers.formatEther(auctionHistory.finalPrice),
            winner: auctionHistory.winner,
            auctionId: auctionHistory.auctionId,
            purchaseDate: purchaseDate.toISOString(),
            transactionHash,
          }
        );
      } else if (history && history.history.length > 0) {
        // Fallback to transfer history if no auction data
        const lastTransfer = history.history[history.history.length - 1];
        purchaseDate = new Date(lastTransfer.timestamp * 1000);
        transactionHash = lastTransfer.transactionHash;

        console.log(
          `🔍 [useSmartLazyCollection] NFT ${nft.tokenId} no auction data, checking transfer history:`,
          {
            tokenId: nft.tokenId,
            lastTransferValue: lastTransfer.value,
            lastTransferValueETH: lastTransfer.value
              ? ethers.formatEther(lastTransfer.value)
              : "0",
            lastTransferType: lastTransfer.type,
            lastTransferFrom: lastTransfer.from,
            lastTransferTo: lastTransfer.to,
            transactionHash: lastTransfer.transactionHash,
          }
        );

        // Extract price from transaction value (convert from wei to ETH)
        if (lastTransfer.value && lastTransfer.value !== "0") {
          price = parseFloat(ethers.formatEther(lastTransfer.value));
          console.log(
            `💰 [useSmartLazyCollection] NFT ${nft.tokenId} price from transfer: ${price} ETH`
          );
        } else {
          console.log(
            `❌ [useSmartLazyCollection] NFT ${nft.tokenId} no price found in transfer`
          );
        }
      } else {
        console.log(
          `❌ [useSmartLazyCollection] NFT ${nft.tokenId} no history found`
        );
      }

      return {
        id: `nft-${nft.tokenId}`,
        tokenId: nft.tokenId.toString(),
        name: nft.name,
        description: nft.description,
        image: nft.image,
        rarity: "common" as const,
        purchaseDate,
        price: price || auction?.finalBid || 0,
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
  }, [displayedNFTs, allWonAuctions, nftHistories, auctionHistories]);

  console.log(
    `🔍 [useSmartLazyCollection] Final decorative NFTs:`,
    decorativeNFTs.map((nft) => ({
      tokenId: nft.tokenId,
      name: nft.name,
      price: nft.price,
      hasAuction: !!nft.auctionWon,
    }))
  );

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
