import { useEffect } from "react";
import { useReadMooveAuction, useWriteMooveAuction } from "./useContract";
import { Auction, Bid, AuctionType } from "@/types/auction";
import { useMemo } from "react";

export function useActiveAuctions() {
  const {
    data: auctionIds,
    isLoading,
    error,
    refetch,
  } = useReadMooveAuction<number[]>("getActiveAuctions");

  return { auctionIds, isLoading, error, refetch };
}

export function useAuction(auctionId: number) {
  const {
    data: auction,
    isLoading,
    error,
  } = useReadMooveAuction<Auction>("getAuction", [auctionId], {
    enabled: auctionId >= 0,
  });

  return { auction, isLoading, error };
}

export function useAuctionBids(auctionId: number) {
  const {
    data: bids,
    isLoading,
    error,
  } = useReadMooveAuction<Bid[]>("getAuctionBids", [auctionId], {
    enabled: auctionId >= 0,
  });

  return { bids, isLoading, error };
}

export function useCurrentDutchPrice(auctionId: number) {
  const {
    data: price,
    isLoading,
    error,
  } = useReadMooveAuction<bigint>("getCurrentDutchPrice", [auctionId], {
    enabled: auctionId >= 0,
  });

  return { price, isLoading, error };
}

export function useCreateAuction() {
  const { writeMooveAuction, isPending, isConfirming, isSuccess, error, hash } =
    useWriteMooveAuction();

  const createAuction = async (
    nftContract: string, // nftContract comes first
    nftId: number, // tokenId comes second
    auctionType: AuctionType,
    startPrice: bigint,
    reservePrice: bigint,
    buyNowPrice: bigint,
    duration: number,
    bidIncrement: bigint
  ) => {
    console.log("🔧 useCreateAuction: Starting auction creation...");
    console.log("🔧 Parameters:", {
      nftContract, // nftContract comes first
      nftId, // tokenId comes second
      auctionType,
      startPrice: startPrice.toString(),
      reservePrice: reservePrice.toString(),
      buyNowPrice: buyNowPrice.toString(),
      duration,
      bidIncrement: bidIncrement.toString(),
    });

    return new Promise((resolve, reject) => {
      try {
        console.log("🔧 Calling writeMooveAuction...");

        // Call the write function
        writeMooveAuction("createAuction", [
          nftContract, // nftContract comes first
          nftId, // tokenId comes second
          auctionType,
          startPrice,
          reservePrice,
          buyNowPrice,
          duration,
          bidIncrement,
        ]);

        console.log("🔧 writeMooveAuction called successfully");

        // Wait a bit for the transaction to be submitted
        setTimeout(() => {
          console.log("🔧 Checking transaction status after 2 seconds...");
          console.log("🔧 Current status:", {
            hash,
            isPending,
            isConfirming,
            isSuccess,
            error,
          });

          // Return the transaction hash and status
          // Only consider it successful if we have a hash and no error
          const isActuallySuccessful = hash && !error;

          resolve({
            success: isActuallySuccessful,
            hash: hash,
            isPending: isPending,
            isConfirming: isConfirming,
            isSuccess: isSuccess,
            error: error,
          });
        }, 2000); // Wait 2 seconds for transaction to be submitted
      } catch (error) {
        console.error("🔧 Error in writeMooveAuction:", error);
        reject(error);
      }
    });
  };

  // Debug per il risultato della transazione
  useEffect(() => {
    if (hash) {
      console.log("🔗 Auction creation transaction hash:", hash);
    }
    if (isSuccess) {
      console.log("🎉 Auction creation transaction successful!");
    }
    if (error) {
      console.error("❌ Auction creation error:", error);
    }
  }, [hash, isSuccess, error]);

  return {
    createAuction,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function usePlaceBid() {
  const { writeMooveAuction, isPending, isConfirming, isSuccess, error } =
    useWriteMooveAuction();

  const placeBid = (auctionId: number, bidAmount: bigint) => {
    writeMooveAuction("placeBid", [auctionId], bidAmount);
  };

  return {
    placeBid,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useEndAuction() {
  const { writeMooveAuction, isPending, isConfirming, isSuccess, error } =
    useWriteMooveAuction();

  const endAuction = (auctionId: number) => {
    writeMooveAuction("endAuction", [auctionId]);
  };

  return {
    endAuction,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useClaimNFT() {
  const { writeMooveAuction, isPending, isConfirming, isSuccess, error } =
    useWriteMooveAuction();

  const claimNFT = (auctionId: number) => {
    writeMooveAuction("claimNFT", [auctionId]);
  };

  return {
    claimNFT,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// New hooks for Dutch auction commit-reveal functionality
export function useCommitToBuyDutch() {
  const { writeMooveAuction, isPending, isConfirming, isSuccess, error } =
    useWriteMooveAuction();

  const commitToBuyDutch = (auctionId: number, commitment: string) => {
    writeMooveAuction("commitToBuyDutch", [auctionId, commitment]);
  };

  return {
    commitToBuyDutch,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useBuyNowDutch() {
  const { writeMooveAuction, isPending, isConfirming, isSuccess, error } =
    useWriteMooveAuction();

  const buyNowDutch = (auctionId: number, nonce: bigint, value: bigint) => {
    writeMooveAuction("buyNowDutch", [auctionId, nonce], value);
  };

  return {
    buyNowDutch,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook for sealed bid reveal phase management
export function useStartRevealPhase() {
  const { writeMooveAuction, isPending, isConfirming, isSuccess, error } =
    useWriteMooveAuction();

  const startRevealPhase = (auctionId: number) => {
    writeMooveAuction("startRevealPhase", [auctionId]);
  };

  return {
    startRevealPhase,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook for batch refund functionality (admin only)
export function useRefundRemainingBidders() {
  const { writeMooveAuction, isPending, isConfirming, isSuccess, error } =
    useWriteMooveAuction();

  const refundRemainingBidders = (
    auctionId: number,
    startIndex: number,
    batchSize: number
  ) => {
    writeMooveAuction("refundRemainingBidders", [
      auctionId,
      startIndex,
      batchSize,
    ]);
  };

  return {
    refundRemainingBidders,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
