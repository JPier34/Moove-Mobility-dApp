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
  const { writeMooveAuction, isPending, isConfirming, isSuccess, error } =
    useWriteMooveAuction();

  const createAuction = (
    nftId: number,
    nftContract: string,
    auctionType: AuctionType,
    startPrice: bigint,
    reservePrice: bigint,
    buyNowPrice: bigint,
    duration: number,
    bidIncrement: bigint
  ) => {
    writeMooveAuction("createAuction", [
      nftId,
      nftContract,
      auctionType,
      startPrice,
      reservePrice,
      buyNowPrice,
      duration,
      bidIncrement,
    ]);
  };

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
