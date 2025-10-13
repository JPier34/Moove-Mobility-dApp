"use client";

import { useCallback } from "react";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

export interface SealedBidWinner {
  auctionId: number;
  actualWinner: string;
  actualWinningBid: number;
  totalBids: number;
  isExpired: boolean;
  status: number;
}

export function useSealedBidWinnerDetection() {
  const detectSealedBidWinner = useCallback(
    async (auctionId: number): Promise<SealedBidWinner | null> => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const auctionContract = new ethers.Contract(
          contracts.MooveAuction.address,
          contracts.MooveAuction.abi,
          provider
        );

        // Get auction data
        const auction = await auctionContract.getAuction(auctionId);
        const auctionType = Number(auction.auctionType);
        const status = Number(auction.status);
        const endTime = Number(auction.endTime);
        const now = Math.floor(Date.now() / 1000);

        // Only process Sealed Bid auctions
        if (auctionType !== 2) {
          return null;
        }

        const isExpired = now > endTime;

        // For Sealed Bid, determine winner from bids
        let actualWinner = auction.highestBidder;
        let actualWinningBid = 0;
        let totalBids = 0;

        if (isExpired && status === 1) {
          try {
            // Get all bids for this auction
            const bids = await auctionContract.getAuctionBids(auctionId);
            totalBids = bids.length;

            // Find the highest bid
            for (let i = 0; i < bids.length; i++) {
              const bidAmount = Number(bids[i].amount);
              if (bidAmount > actualWinningBid) {
                actualWinningBid = bidAmount;
                actualWinner = bids[i].bidder;
              }
            }
          } catch (error) {
            console.warn(`Could not get bids for auction ${auctionId}:`, error);
            return null;
          }
        }

        return {
          auctionId,
          actualWinner,
          actualWinningBid: actualWinningBid / 1e18, // Convert to ETH
          totalBids,
          isExpired,
          status,
        };
      } catch (error) {
        console.error(
          `Error detecting sealed bid winner for auction ${auctionId}:`,
          error
        );
        return null;
      }
    },
    []
  );

  const detectAllSealedBidWinners = useCallback(
    async (auctionIds: number[]): Promise<SealedBidWinner[]> => {
      const winners: SealedBidWinner[] = [];

      for (const auctionId of auctionIds) {
        const winner = await detectSealedBidWinner(auctionId);
        if (winner) {
          winners.push(winner);
        }
      }

      return winners;
    },
    [detectSealedBidWinner]
  );

  return {
    detectSealedBidWinner,
    detectAllSealedBidWinners,
  };
}
