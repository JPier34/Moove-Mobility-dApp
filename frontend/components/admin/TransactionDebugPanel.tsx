"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import { AuctionStatus } from "@/types/auction";

interface TransactionDebugPanelProps {
  className?: string;
}

interface TransactionData {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  status: number;
  logs: any[];
}

interface AuctionData {
  auctionId: string;
  status: number;
  endTime: number;
  currentBid: string;
  highestBidder: string;
  bidCount: number;
  isSettled: boolean;
}

export default function TransactionDebugPanel({
  className = "",
}: TransactionDebugPanelProps) {
  const [txHash, setTxHash] = useState("");
  const [txData, setTxData] = useState<TransactionData | null>(null);
  const [auctionData, setAuctionData] = useState<AuctionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeTransaction = async () => {
    if (!txHash.trim()) {
      setError("Please enter a transaction hash");
      return;
    }

    setLoading(true);
    setError(null);
    setTxData(null);
    setAuctionData(null);

    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL ||
          "https://ethereum-sepolia-rpc.publicnode.com"
      );

      console.log(`🔍 Analyzing transaction: ${txHash}`);

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

      const transactionData: TransactionData = {
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        timestamp: block.timestamp,
        from: tx.from,
        to: tx.to || "",
        value: ethers.formatEther(tx.value),
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: ethers.formatUnits(tx.gasPrice || 0, "gwei"),
        status: receipt.status || 0,
        logs: [...receipt.logs],
      };

      setTxData(transactionData);

      // Analyze logs to find auction-related events
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      console.log(`📊 Transaction logs: ${receipt.logs.length} logs found`);

      // Look for auction events
      let auctionId: string | null = null;
      let eventType: string | null = null;

      for (const log of receipt.logs) {
        try {
          // Try to decode the log
          const decoded = auctionContract.interface.parseLog({
            topics: log.topics,
            data: log.data,
          });

          if (decoded) {
            console.log(`📋 Decoded log: ${decoded.name}`, decoded.args);

            if (
              decoded.name === "BidPlaced" ||
              decoded.name === "AuctionEnded" ||
              decoded.name === "AuctionSettled" ||
              decoded.name === "BidRefunded"
            ) {
              auctionId = decoded.args.auctionId?.toString();
              eventType = decoded.name;
              console.log(
                `🎯 Found auction event: ${eventType} for auction ${auctionId}`
              );
            }
          }
        } catch (e) {
          // Log might not be from our contract
          continue;
        }
      }

      // If we found an auction ID, get current auction data
      if (auctionId) {
        console.log(`🔍 Fetching current data for auction ${auctionId}`);

        try {
          const currentAuction = await auctionContract.getAuction(auctionId);

          const auctionInfo: AuctionData = {
            auctionId: auctionId,
            status: Number(currentAuction.status),
            endTime: Number(currentAuction.endTime),
            currentBid: ethers.formatEther(currentAuction.highestBid),
            highestBidder: currentAuction.highestBidder,
            bidCount: Number(currentAuction.totalBidders),
            isSettled: currentAuction.isSettled,
          };

          setAuctionData(auctionInfo);
          console.log(`📊 Current auction data:`, auctionInfo);
        } catch (e) {
          console.error("Failed to fetch auction data:", e);
          setError(`Failed to fetch auction data: ${e}`);
        }
      }
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

  const isAuctionExpired = (endTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    return now > endTime;
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        🔍 Transaction Debug Panel
      </h2>

      {/* Input Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transaction Hash
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="0x..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={analyzeTransaction}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">❌ {error}</p>
        </div>
      )}

      {/* Transaction Data */}
      {txData && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            📋 Transaction Details
          </h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Hash:</span>
                <p className="font-mono text-xs break-all">{txData.hash}</p>
              </div>
              <div>
                <span className="font-medium">Block:</span>
                <p>{txData.blockNumber.toLocaleString()}</p>
              </div>
              <div>
                <span className="font-medium">Timestamp:</span>
                <p>{formatTimestamp(txData.timestamp)}</p>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <p
                  className={
                    txData.status === 1 ? "text-green-600" : "text-red-600"
                  }
                >
                  {txData.status === 1 ? "✅ Success" : "❌ Failed"}
                </p>
              </div>
              <div>
                <span className="font-medium">From:</span>
                <p className="font-mono text-xs">{txData.from}</p>
              </div>
              <div>
                <span className="font-medium">To:</span>
                <p className="font-mono text-xs">{txData.to}</p>
              </div>
              <div>
                <span className="font-medium">Value:</span>
                <p>{txData.value} ETH</p>
              </div>
              <div>
                <span className="font-medium">Gas Used:</span>
                <p>{txData.gasUsed}</p>
              </div>
              <div>
                <span className="font-medium">Gas Price:</span>
                <p>{txData.gasPrice} Gwei</p>
              </div>
              <div>
                <span className="font-medium">Logs:</span>
                <p>{txData.logs.length} events</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auction Data */}
      {auctionData && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            🎯 Auction Analysis
          </h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Auction ID:</span>
                <p className="font-mono">{auctionData.auctionId}</p>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <p
                  className={`font-semibold ${
                    auctionData.status === AuctionStatus.ACTIVE
                      ? "text-green-600"
                      : auctionData.status === AuctionStatus.ENDED
                      ? "text-orange-600"
                      : auctionData.status === AuctionStatus.SETTLED
                      ? "text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  {getStatusLabel(auctionData.status)}
                </p>
              </div>
              <div>
                <span className="font-medium">End Time:</span>
                <p>{formatTimestamp(auctionData.endTime)}</p>
              </div>
              <div>
                <span className="font-medium">Time Expired:</span>
                <p
                  className={
                    isAuctionExpired(auctionData.endTime)
                      ? "text-red-600"
                      : "text-green-600"
                  }
                >
                  {isAuctionExpired(auctionData.endTime) ? "✅ YES" : "❌ NO"}
                </p>
              </div>
              <div>
                <span className="font-medium">Current Bid:</span>
                <p>{auctionData.currentBid} ETH</p>
              </div>
              <div>
                <span className="font-medium">Highest Bidder:</span>
                <p className="font-mono text-xs">{auctionData.highestBidder}</p>
              </div>
              <div>
                <span className="font-medium">Bid Count:</span>
                <p>{auctionData.bidCount}</p>
              </div>
              <div>
                <span className="font-medium">Is Settled:</span>
                <p
                  className={
                    auctionData.isSettled ? "text-green-600" : "text-red-600"
                  }
                >
                  {auctionData.isSettled ? "✅ YES" : "❌ NO"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Summary */}
      {txData && auctionData && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            🔍 Analysis Summary
          </h3>
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Transaction Status:</span>
                <span
                  className={
                    txData.status === 1 ? "text-green-600" : "text-red-600"
                  }
                >
                  {txData.status === 1 ? "✅ Success" : "❌ Failed"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Auction Status:</span>
                <span
                  className={`font-semibold ${
                    auctionData.status === AuctionStatus.ACTIVE
                      ? "text-green-600"
                      : auctionData.status === AuctionStatus.ENDED
                      ? "text-orange-600"
                      : auctionData.status === AuctionStatus.SETTLED
                      ? "text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  {getStatusLabel(auctionData.status)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Time Expired:</span>
                <span
                  className={
                    isAuctionExpired(auctionData.endTime)
                      ? "text-red-600"
                      : "text-green-600"
                  }
                >
                  {isAuctionExpired(auctionData.endTime) ? "✅ YES" : "❌ NO"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Settled:</span>
                <span
                  className={
                    auctionData.isSettled ? "text-green-600" : "text-red-600"
                  }
                >
                  {auctionData.isSettled ? "✅ YES" : "❌ NO"}
                </span>
              </div>

              {/* Inconsistency Detection */}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="font-medium text-yellow-800 mb-2">
                  ⚠️ Potential Issues:
                </h4>
                <ul className="space-y-1 text-yellow-700">
                  {auctionData.status === AuctionStatus.ACTIVE &&
                    isAuctionExpired(auctionData.endTime) && (
                      <li>
                        • Auction is ACTIVE but time has expired - should be
                        ENDED
                      </li>
                    )}
                  {auctionData.status === AuctionStatus.ENDED &&
                    !auctionData.isSettled && (
                      <li>
                        • Auction is ENDED but not settled - claim should be
                        available
                      </li>
                    )}
                  {auctionData.status === AuctionStatus.SETTLED &&
                    !auctionData.isSettled && (
                      <li>
                        • Status shows SETTLED but isSettled is false - data
                        inconsistency
                      </li>
                    )}
                  {txData.status === 0 && (
                    <li>
                      • Transaction failed - check gas limit and contract state
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-gray-600">
        <h4 className="font-medium mb-2">📝 Instructions:</h4>
        <ul className="space-y-1">
          <li>
            • Paste a transaction hash to analyze auction-related transactions
          </li>
          <li>• The tool will decode events and fetch current auction state</li>
          <li>
            • Look for inconsistencies between transaction events and current
            state
          </li>
          <li>• Check if expired auctions are still showing as ACTIVE</li>
        </ul>
      </div>
    </div>
  );
}








