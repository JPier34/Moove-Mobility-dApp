"use client";


import React, { useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import Button from "../ui/Button";

interface BidDetail {
  bidder: string;
  amount: string;
  timestamp: number;
  isWinning: boolean;
  isRefunded: boolean;
}

export default function Auction30Debugger() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auctionData, setAuctionData] = useState<any>(null);
  const [bids, setBids] = useState<BidDetail[]>([]);
  const [refundEvents, setRefundEvents] = useState<any[]>([]);

  const debugAuction30 = async () => {
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

      console.log("🔍 Debugging Auction #30...");

      // 1. Get auction data
      const auction = await auctionContract.getAuction(30);
      console.log("🏆 Auction #30 data:", auction);

      const auctionInfo = {
        auctionId: "30",
        status: Number(auction.status),
        highestBidder: auction.highestBidder,
        highestBid: ethers.formatEther(auction.highestBid),
        startTime: Number(auction.startTime),
        endTime: Number(auction.endTime),
        auctionType: Number(auction.auctionType),
        isSettled: auction.isSettled,
      };

      setAuctionData(auctionInfo);

      // 2. Get all bids for auction #30
      const auctionBids = await auctionContract.getAuctionBids(30);
      console.log("💰 Auction #30 bids:", auctionBids);

      const bidDetails: BidDetail[] = auctionBids.map(
        (bid: any, index: number) => ({
          bidder: bid.bidder,
          amount: ethers.formatEther(bid.amount),
          timestamp: Number(bid.timestamp),
          isWinning: bid.isWinning,
          isRefunded: bid.isRefunded,
        })
      );

      setBids(bidDetails);

      // 3. Get BidRefunded events for auction #30
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(currentBlock - 1000, 0);

      const refundFilter = auctionContract.filters.BidRefunded(30);
      const events = await auctionContract.queryFilter(
        refundFilter,
        fromBlock,
        currentBlock
      );

      console.log("📡 BidRefunded events for auction #30:", events);

      const refundDetails = events.map((event) => ({
        auctionId: event.args.auctionId.toString(),
        bidder: event.args.bidder,
        amount: ethers.formatEther(event.args.amount),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      }));

      setRefundEvents(refundDetails);

      // 4. Analyze the problem
      console.log("🔍 Analysis:");
      console.log("- Total bids:", bidDetails.length);
      console.log("- Highest bidder:", auctionInfo.highestBidder);
      console.log("- Refunded events:", refundDetails.length);

      const losingBids = bidDetails.filter(
        (bid) =>
          bid.bidder.toLowerCase() !== auctionInfo.highestBidder.toLowerCase()
      );
      console.log("- Losing bids:", losingBids);

      const unrefundedLosingBids = losingBids.filter((bid) => !bid.isRefunded);
      console.log("- Unrefunded losing bids:", unrefundedLosingBids);

      if (unrefundedLosingBids.length > 0) {
        console.log("❌ PROBLEM FOUND: There are unrefunded losing bids!");
        console.log("Unrefunded bids:", unrefundedLosingBids);
      } else {
        console.log("✅ All losing bids have been refunded");
      }
    } catch (error) {
      console.error("❌ Debug failed:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        🔍 Auction #30 Debugger
      </h2>

      <div className="mb-6">
        <Button
          onClick={debugAuction30}
          disabled={loading || !isConnected}
          className="w-full"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Debugging Auction #30...
            </>
          ) : (
            "Debug Auction #30"
          )}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">❌ Error: {error}</p>
        </div>
      )}

      {/* Auction Data */}
      {auctionData && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            🏆 Auction #30 Data
          </h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p>
                  <strong>Status:</strong>{" "}
                  {auctionData.status === 1 ? "ACTIVE" : "UNKNOWN"}
                </p>
                <p>
                  <strong>Highest Bidder:</strong> {auctionData.highestBidder}
                </p>
                <p>
                  <strong>Highest Bid:</strong> {auctionData.highestBid} ETH
                </p>
              </div>
              <div>
                <p>
                  <strong>Start Time:</strong>{" "}
                  {new Date(auctionData.startTime * 1000).toLocaleString()}
                </p>
                <p>
                  <strong>End Time:</strong>{" "}
                  {new Date(auctionData.endTime * 1000).toLocaleString()}
                </p>
                <p>
                  <strong>Auction Type:</strong> {auctionData.auctionType}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bids */}
      {bids.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            💰 All Bids ({bids.length})
          </h3>
          <div className="space-y-2">
            {bids.map((bid, index) => (
              <div
                key={index}
                className={`p-3 rounded-md border ${
                  bid.isWinning
                    ? "bg-green-50 border-green-200"
                    : bid.isRefunded
                    ? "bg-blue-50 border-blue-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      Bid #{index + 1} - {bid.amount} ETH
                    </p>
                    <p className="text-sm text-gray-600">
                      Bidder: {bid.bidder}
                    </p>
                    <p className="text-xs text-gray-500">
                      Time: {new Date(bid.timestamp * 1000).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`px-2 py-1 rounded text-xs ${
                        bid.isWinning
                          ? "bg-green-100 text-green-800"
                          : bid.isRefunded
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {bid.isWinning
                        ? "WINNING"
                        : bid.isRefunded
                        ? "REFUNDED"
                        : "UNREFUNDED"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refund Events */}
      {refundEvents.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            📡 BidRefunded Events ({refundEvents.length})
          </h3>
          <div className="space-y-2">
            {refundEvents.map((event, index) => (
              <div
                key={index}
                className="p-3 rounded-md border bg-green-50 border-green-200"
              >
                <div>
                  <p className="font-medium">
                    Refund #{index + 1} - {event.amount} ETH
                  </p>
                  <p className="text-sm text-gray-600">
                    Bidder: {event.bidder}
                  </p>
                  <p className="text-xs text-gray-500">
                    Block: {event.blockNumber} | TX:{" "}
                    {event.transactionHash.slice(0, 10)}...
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis */}
      {bids.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            🔍 Analysis
          </h3>
          <div className="bg-gray-50 p-4 rounded-md">
            {(() => {
              const losingBids = bids.filter(
                (bid) =>
                  bid.bidder.toLowerCase() !==
                  auctionData?.highestBidder.toLowerCase()
              );
              const unrefundedLosingBids = losingBids.filter(
                (bid) => !bid.isRefunded
              );

              return (
                <div className="text-sm">
                  <p>
                    <strong>Total Bids:</strong> {bids.length}
                  </p>
                  <p>
                    <strong>Losing Bids:</strong> {losingBids.length}
                  </p>
                  <p>
                    <strong>Unrefunded Losing Bids:</strong>{" "}
                    {unrefundedLosingBids.length}
                  </p>
                  <p>
                    <strong>Refund Events:</strong> {refundEvents.length}
                  </p>

                  {unrefundedLosingBids.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-red-800 font-medium">
                        ❌ PROBLEM FOUND!
                      </p>
                      <p className="text-red-700">
                        There are {unrefundedLosingBids.length} unrefunded
                        losing bids.
                      </p>
                      <p className="text-red-600 text-xs mt-1">
                        This indicates a bug in the refund system.
                      </p>
                    </div>
                  )}

                  {unrefundedLosingBids.length === 0 &&
                    refundEvents.length > 0 && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-green-800 font-medium">
                          ✅ REFUND SYSTEM WORKING
                        </p>
                        <p className="text-green-700">
                          All losing bids have been properly refunded.
                        </p>
                      </div>
                    )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}




