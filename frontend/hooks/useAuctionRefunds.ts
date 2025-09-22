import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from "@/lib/contracts";
import toast from "react-hot-toast";

export interface BidRefundInfo {
  auctionId: number;
  bidder: string;
  amount: string; // ETH amount
  timestamp: number;
  isWinning: boolean;
  isRefunded: boolean;
  refundTxHash?: string;
}

export interface RefundStatus {
  canRefund: boolean;
  refundedAmount: string;
  pendingRefunds: BidRefundInfo[];
  totalPendingAmount: string;
}

export function useAuctionRefunds() {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all bids for an auction with refund status
  const getAuctionBids = useCallback(
    async (auctionId: number): Promise<BidRefundInfo[]> => {
      if (!window.ethereum) {
        throw new Error("Ethereum provider not available");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const auctionContract = new ethers.Contract(
        CONTRACT_ADDRESSES.MooveAuction,
        CONTRACT_ABIS.MooveAuction,
        provider
      );

      try {
        const bids = await auctionContract.getAuctionBids(auctionId);

        return bids.map((bid: any) => ({
          auctionId,
          bidder: bid.bidder,
          amount: ethers.formatEther(bid.amount),
          timestamp: Number(bid.timestamp),
          isWinning: bid.isWinning,
          isRefunded: bid.isRefunded,
        }));
      } catch (error) {
        console.error("Error fetching auction bids:", error);
        throw error;
      }
    },
    []
  );

  // Get refund status for current user
  const getRefundStatus = useCallback(
    async (auctionId: number): Promise<RefundStatus> => {
      if (!isConnected || !address) {
        throw new Error("Wallet not connected");
      }

      setIsLoading(true);
      setError(null);

      try {
        const bids = await getAuctionBids(auctionId);

        // Find user's bids
        const userBids = bids.filter(
          (bid) => bid.bidder.toLowerCase() === address.toLowerCase()
        );

        // Calculate refund status
        const pendingRefunds = userBids.filter(
          (bid) => !bid.isWinning && !bid.isRefunded
        );
        const refundedAmount = userBids
          .filter((bid) => bid.isRefunded)
          .reduce((sum, bid) => sum + parseFloat(bid.amount), 0)
          .toString();

        const totalPendingAmount = pendingRefunds
          .reduce((sum, bid) => sum + parseFloat(bid.amount), 0)
          .toString();

        return {
          canRefund: pendingRefunds.length > 0,
          refundedAmount,
          pendingRefunds,
          totalPendingAmount,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, address, getAuctionBids]
  );

  // Request refund for losing bids
  const requestRefund = useCallback(
    async (auctionId: number): Promise<boolean> => {
      if (!isConnected || !address) {
        throw new Error("Wallet not connected");
      }

      setIsLoading(true);
      setError(null);

      try {
        if (!window.ethereum) {
          throw new Error("Ethereum provider not available");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const auctionContract = new ethers.Contract(
          CONTRACT_ADDRESSES.MooveAuction,
          CONTRACT_ABIS.MooveAuction,
          signer
        );

        // Call refundRemainingBidders function
        // This function refunds all losing bidders in batches
        const tx = await auctionContract.refundRemainingBidders(
          auctionId,
          0,
          50
        ); // Start from 0, batch size 50
        console.log(`📝 Refund transaction submitted: ${tx.hash}`);

        await tx.wait();
        console.log(`✅ Refunds processed successfully: ${tx.hash}`);

        toast.success("Refunds processed successfully!");
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("❌ Refund request failed:", errorMessage);
        setError(errorMessage);
        toast.error(`Refund failed: ${errorMessage}`);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, address]
  );

  // Listen for refund events
  const listenForRefunds = useCallback(
    (
      auctionId: number,
      onRefundReceived: (refundInfo: BidRefundInfo) => void
    ) => {
      if (!window.ethereum) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const auctionContract = new ethers.Contract(
        CONTRACT_ADDRESSES.MooveAuction,
        CONTRACT_ABIS.MooveAuction,
        provider
      );

      // Listen for BidRefunded events
      const filter = auctionContract.filters.BidRefunded(auctionId, address);

      auctionContract.on(filter, (auctionId, bidder, amount) => {
        console.log("💰 Refund received:", { auctionId, bidder, amount });

        const refundInfo: BidRefundInfo = {
          auctionId: Number(auctionId),
          bidder,
          amount: ethers.formatEther(amount),
          timestamp: Date.now(),
          isWinning: false,
          isRefunded: true,
        };

        onRefundReceived(refundInfo);
        toast.success(`Refund received: ${ethers.formatEther(amount)} ETH`);
      });

      // Return cleanup function
      return () => {
        auctionContract.removeAllListeners(filter);
      };
    },
    [address]
  );

  return {
    getAuctionBids,
    getRefundStatus,
    requestRefund,
    listenForRefunds,
    isLoading,
    error,
  };
}
