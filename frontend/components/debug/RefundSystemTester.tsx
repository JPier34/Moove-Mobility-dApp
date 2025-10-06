"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import Button from "../ui/Button";

interface RefundTestData {
  auctionId: string;
  highestBidder: string;
  highestBid: string;
  status: number;
  totalBids: number;
  unrefundedBids: Array<{
    bidder: string;
    amount: string;
    isRefunded: boolean;
  }>;
}

export default function RefundSystemTester() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refundData, setRefundData] = useState<RefundTestData[]>([]);
  const [refundEvents, setRefundEvents] = useState<any[]>([]);

  const testRefundSystem = async () => {
    if (!isConnected) {
      setError("Please connect your wallet");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || "https://1rpc.io/sepolia"
      );
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      console.log("🧪 Testing refund system...");

      // 1. Get recent BidRefunded events
      console.log("📡 Checking for BidRefunded events...");
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(currentBlock - 1000, 0);

      const refundFilter = auctionContract.filters.BidRefunded();
      const events = await auctionContract.queryFilter(
        refundFilter,
        fromBlock,
        currentBlock
      );

      console.log(`🔍 Found ${events.length} BidRefunded events`);
      setRefundEvents(
        events.map((event) => ({
          auctionId: event.args.auctionId.toString(),
          bidder: event.args.bidder,
          amount: ethers.formatEther(event.args.amount),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
        }))
      );

      // 2. Check recent auctions for refund status
      console.log("🏆 Checking auction refund status...");
      const totalAuctions = await auctionContract.totalAuctions();
      const startAuction = Math.max(Number(totalAuctions) - 10, 0);

      const auctionData: RefundTestData[] = [];

      for (let i = startAuction; i < Number(totalAuctions); i++) {
        try {
          const auction = await auctionContract.getAuction(i);
          const bids = await auctionContract.getAuctionBids(i);

          const unrefundedBids = bids
            .filter(
              (bid) => !bid.isRefunded && bid.bidder !== auction.highestBidder
            )
            .map((bid) => ({
              bidder: bid.bidder,
              amount: ethers.formatEther(bid.amount),
              isRefunded: bid.isRefunded,
            }));

          auctionData.push({
            auctionId: i.toString(),
            highestBidder: auction.highestBidder,
            highestBid: ethers.formatEther(auction.highestBid),
            status: Number(auction.status),
            totalBids: bids.length,
            unrefundedBids,
          });
        } catch (error) {
          console.log(`❌ Error checking auction ${i}:`, error);
        }
      }

      setRefundData(auctionData);
      console.log("✅ Refund system test completed!");
    } catch (error) {
      console.error("❌ Test failed:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const simulateRefundNotification = (event: any) => {
    if (event.bidder.toLowerCase() === address?.toLowerCase()) {
      console.log("🔔 Simulating refund notification:", {
        message: `You received a refund of ${event.amount} ETH from auction #${event.auctionId}`,
        auctionId: event.auctionId,
        amount: event.amount,
        transactionHash: event.transactionHash,
      });

      // Qui potresti triggerare una notifica reale
      alert(
        `🔔 Refund Notification: You received ${event.amount} ETH from auction #${event.auctionId}`
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        🧪 Refund System Tester
      </h2>

      <div className="mb-6">
        <Button
          onClick={testRefundSystem}
          disabled={loading || !isConnected}
          className="w-full"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Testing Refund System...
            </>
          ) : (
            "Test Refund System"
          )}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">❌ Error: {error}</p>
        </div>
      )}

      {/* Recent Refund Events */}
      {refundEvents.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            📡 Recent BidRefunded Events ({refundEvents.length})
          </h3>
          <div className="space-y-2">
            {refundEvents.map((event, index) => (
              <div
                key={index}
                className={`p-3 rounded-md border ${
                  event.bidder.toLowerCase() === address?.toLowerCase()
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      Auction #{event.auctionId} - {event.amount} ETH
                    </p>
                    <p className="text-sm text-gray-600">
                      Bidder: {event.bidder}
                    </p>
                    <p className="text-xs text-gray-500">
                      Block: {event.blockNumber} | TX:{" "}
                      {event.transactionHash.slice(0, 10)}...
                    </p>
                  </div>
                  {event.bidder.toLowerCase() === address?.toLowerCase() && (
                    <Button
                      onClick={() => simulateRefundNotification(event)}
                      size="sm"
                      variant="secondary"
                    >
                      🔔 Test Notification
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auction Refund Status */}
      {refundData.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            🏆 Auction Refund Status
          </h3>
          <div className="space-y-3">
            {refundData.map((auction) => (
              <div key={auction.auctionId} className="p-4 border rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Auction #{auction.auctionId}</h4>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      auction.status === 1
                        ? "bg-green-100 text-green-800"
                        : auction.status === 3
                        ? "bg-yellow-100 text-yellow-800"
                        : auction.status === 4
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {auction.status === 1
                      ? "ACTIVE"
                      : auction.status === 3
                      ? "ENDED"
                      : auction.status === 4
                      ? "SETTLED"
                      : "UNKNOWN"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>
                      <strong>Highest Bidder:</strong> {auction.highestBidder}
                    </p>
                    <p>
                      <strong>Highest Bid:</strong> {auction.highestBid} ETH
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Total Bids:</strong> {auction.totalBids}
                    </p>
                    <p>
                      <strong>Unrefunded:</strong>{" "}
                      {auction.unrefundedBids.length}
                    </p>
                  </div>
                </div>

                {auction.unrefundedBids.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-orange-800 mb-2">
                      ⚠️ Unrefunded Bids:
                    </p>
                    <div className="space-y-1">
                      {auction.unrefundedBids.map((bid, index) => (
                        <div
                          key={index}
                          className="text-xs bg-orange-50 p-2 rounded"
                        >
                          <p>
                            <strong>Bidder:</strong> {bid.bidder}
                          </p>
                          <p>
                            <strong>Amount:</strong> {bid.amount} ETH
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {refundData.length === 0 && refundEvents.length === 0 && !loading && (
        <div className="text-center text-gray-500 py-8">
          <p>No refund data found. Click "Test Refund System" to check.</p>
        </div>
      )}
    </div>
  );
}
