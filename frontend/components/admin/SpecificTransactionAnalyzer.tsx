"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import { AuctionStatus } from "@/types/auction";

interface SpecificTransactionAnalyzerProps {
  txHash: string;
  className?: string;
}

interface TransactionAnalysis {
  hash: string;
  blockNumber: number;
  timestamp: number;
  status: number;
  events: {
    name: string;
    args: any;
    auctionId?: string;
  }[];
  auctionData?: {
    auctionId: string;
    status: number;
    endTime: number;
    currentBid: string;
    highestBidder: string;
    bidCount: number;
    isSettled: boolean;
  };
  inconsistencies: string[];
}

export default function SpecificTransactionAnalyzer({
  txHash,
  className = "",
}: SpecificTransactionAnalyzerProps) {
  const [analysis, setAnalysis] = useState<TransactionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (txHash) {
      analyzeSpecificTransaction();
    }
  }, [txHash]);

  const analyzeSpecificTransaction = async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL ||
          "https://ethereum-sepolia-rpc.publicnode.com"
      );

      console.log(`🔍 Analyzing specific transaction: ${txHash}`);

      // Get transaction details
      const tx = await provider.getTransaction(txHash);
      if (!tx) {
        throw new Error("Transaction not found");
      }

      // Get transaction receipt
      const receipt = await provider.getTransactionReceipt(txHash);
      if (!receipt) {
        throw new Error("Transaction receipt not found");
      }

      // Get block details for timestamp
      const block = await provider.getBlock(receipt.blockNumber);
      if (!block) {
        throw new Error("Block not found");
      }

      // Analyze logs to find auction-related events
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      const events: { name: string; args: any; auctionId?: string }[] = [];
      let auctionId: string | null = null;

      console.log(`📊 Analyzing ${receipt.logs.length} logs`);

      for (const log of receipt.logs) {
        try {
          const decoded = auctionContract.interface.parseLog({
            topics: log.topics,
            data: log.data,
          });

          if (decoded) {
            console.log(`📋 Decoded event: ${decoded.name}`, decoded.args);

            const eventData = {
              name: decoded.name,
              args: decoded.args,
              auctionId: decoded.args.auctionId?.toString(),
            };

            events.push(eventData);

            if (
              decoded.name === "BidPlaced" ||
              decoded.name === "AuctionEnded" ||
              decoded.name === "AuctionSettled" ||
              decoded.name === "BidRefunded"
            ) {
              auctionId = decoded.args.auctionId?.toString();
            }
          }
        } catch (e) {
          // Log might not be from our contract
          continue;
        }
      }

      // Get current auction data if we found an auction ID
      let auctionData = null;
      if (auctionId) {
        try {
          const currentAuction = await auctionContract.getAuction(auctionId);

          auctionData = {
            auctionId: auctionId,
            status: Number(currentAuction.status),
            endTime: Number(currentAuction.endTime),
            currentBid: ethers.formatEther(currentAuction.highestBid),
            highestBidder: currentAuction.highestBidder,
            bidCount: Number(currentAuction.totalBidders),
            isSettled: currentAuction.isSettled,
          };

          console.log(`📊 Current auction data:`, auctionData);
        } catch (e) {
          console.error("Failed to fetch auction data:", e);
        }
      }

      // Detect inconsistencies
      const inconsistencies: string[] = [];

      if (auctionData) {
        const now = Math.floor(Date.now() / 1000);
        const isExpired = now > auctionData.endTime;

        if (auctionData.status === AuctionStatus.ACTIVE && isExpired) {
          inconsistencies.push(
            "Auction is ACTIVE but time has expired - should be ENDED"
          );
        }

        if (
          auctionData.status === AuctionStatus.ENDED &&
          !auctionData.isSettled
        ) {
          inconsistencies.push(
            "Auction is ENDED but not settled - claim should be available"
          );
        }

        if (
          auctionData.status === AuctionStatus.SETTLED &&
          !auctionData.isSettled
        ) {
          inconsistencies.push(
            "Status shows SETTLED but isSettled is false - data inconsistency"
          );
        }

        // Check if this transaction should have triggered a status change
        const hasEndAuctionEvent = events.some(
          (e) => e.name === "AuctionEnded"
        );
        const hasSettleEvent = events.some((e) => e.name === "AuctionSettled");

        if (hasEndAuctionEvent && auctionData.status !== AuctionStatus.ENDED) {
          inconsistencies.push(
            "Transaction emitted AuctionEnded but auction status is not ENDED"
          );
        }

        if (hasSettleEvent && !auctionData.isSettled) {
          inconsistencies.push(
            "Transaction emitted AuctionSettled but auction is not settled"
          );
        }
      }

      if (receipt.status === 0) {
        inconsistencies.push(
          "Transaction failed - check gas limit and contract state"
        );
      }

      const analysisResult: TransactionAnalysis = {
        hash: txHash,
        blockNumber: receipt.blockNumber,
        timestamp: block.timestamp,
        status: receipt.status || 0,
        events,
        auctionData: auctionData || undefined,
        inconsistencies,
      };

      setAnalysis(analysisResult);
    } catch (err) {
      console.error("Transaction analysis failed:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case AuctionStatus.PENDING:
        return "PENDING";
      case AuctionStatus.ACTIVE:
        return "ACTIVE";
      case AuctionStatus.REVEAL:
        return "REVEAL";
      case AuctionStatus.ENDED:
        return "ENDED";
      case AuctionStatus.SETTLED:
        return "SETTLED";
      case AuctionStatus.CANCELLED:
        return "CANCELLED";
      default:
        return `UNKNOWN (${status})`;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Analyzing transaction...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">❌ {error}</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        🔍 Transaction Analysis: {txHash.slice(0, 10)}...
      </h2>

      {/* Transaction Summary */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          📋 Transaction Summary
        </h3>
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Block:</span>
              <p>{analysis.blockNumber.toLocaleString()}</p>
            </div>
            <div>
              <span className="font-medium">Timestamp:</span>
              <p>{formatTimestamp(analysis.timestamp)}</p>
            </div>
            <div>
              <span className="font-medium">Status:</span>
              <p
                className={
                  analysis.status === 1 ? "text-green-600" : "text-red-600"
                }
              >
                {analysis.status === 1 ? "✅ Success" : "❌ Failed"}
              </p>
            </div>
            <div>
              <span className="font-medium">Events:</span>
              <p>{analysis.events.length} auction events</p>
            </div>
          </div>
        </div>
      </div>

      {/* Events */}
      {analysis.events.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            📊 Events Emitted
          </h3>
          <div className="space-y-2">
            {analysis.events.map((event, index) => (
              <div key={index} className="bg-blue-50 p-3 rounded-md">
                <div className="font-medium text-blue-900">{event.name}</div>
                <div className="text-sm text-blue-700 mt-1">
                  <div>Auction ID: {event.auctionId}</div>
                  {event.name === "BidPlaced" && (
                    <div>Bidder: {event.args.bidder}</div>
                  )}
                  {event.name === "BidRefunded" && (
                    <div>Bidder: {event.args.bidder}</div>
                  )}
                  {event.name === "AuctionSettled" && (
                    <div>Winner: {event.args.winner}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Auction State */}
      {analysis.auctionData && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            🎯 Current Auction State
          </h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Auction ID:</span>
                <p className="font-mono">{analysis.auctionData.auctionId}</p>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <p
                  className={`font-semibold ${
                    analysis.auctionData.status === AuctionStatus.ACTIVE
                      ? "text-green-600"
                      : analysis.auctionData.status === AuctionStatus.ENDED
                      ? "text-orange-600"
                      : analysis.auctionData.status === AuctionStatus.SETTLED
                      ? "text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  {getStatusLabel(analysis.auctionData.status)}
                </p>
              </div>
              <div>
                <span className="font-medium">End Time:</span>
                <p>{formatTimestamp(analysis.auctionData.endTime)}</p>
              </div>
              <div>
                <span className="font-medium">Time Expired:</span>
                <p
                  className={
                    Math.floor(Date.now() / 1000) > analysis.auctionData.endTime
                      ? "text-red-600"
                      : "text-green-600"
                  }
                >
                  {Math.floor(Date.now() / 1000) > analysis.auctionData.endTime
                    ? "✅ YES"
                    : "❌ NO"}
                </p>
              </div>
              <div>
                <span className="font-medium">Current Bid:</span>
                <p>{analysis.auctionData.currentBid} ETH</p>
              </div>
              <div>
                <span className="font-medium">Highest Bidder:</span>
                <p className="font-mono text-xs">
                  {analysis.auctionData.highestBidder}
                </p>
              </div>
              <div>
                <span className="font-medium">Bid Count:</span>
                <p>{analysis.auctionData.bidCount}</p>
              </div>
              <div>
                <span className="font-medium">Is Settled:</span>
                <p
                  className={
                    analysis.auctionData.isSettled
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {analysis.auctionData.isSettled ? "✅ YES" : "❌ NO"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inconsistencies */}
      {analysis.inconsistencies.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            ⚠️ Detected Issues
          </h3>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <ul className="space-y-2">
              {analysis.inconsistencies.map((issue, index) => (
                <li key={index} className="text-red-800 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          💡 Recommendations
        </h3>
        <ul className="space-y-2 text-blue-800">
          {analysis.inconsistencies.some((i) =>
            i.includes("ACTIVE but time has expired")
          ) && (
            <li>• Check if automatic auction expiration system is working</li>
          )}
          {analysis.inconsistencies.some((i) =>
            i.includes("ENDED but not settled")
          ) && <li>• Verify claim system is functioning correctly</li>}
          {analysis.inconsistencies.some((i) =>
            i.includes("Transaction failed")
          ) && <li>• Check gas limit and contract state before transaction</li>}
          {analysis.events.some((e) => e.name === "BidRefunded") && (
            <li>
              • Verify notification system is detecting BidRefunded events
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
