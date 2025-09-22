"use client";

import React, { useState } from "react";
import { AuctionType, AuctionStatus } from "@/types/auction";
import { useAuctionsEnhanced } from "@/hooks/enhanced-auction-utils";
import { useAccount } from "wagmi";

interface AuctionTypeTesterProps {
  className?: string;
}

export default function AuctionTypeTester({
  className = "",
}: AuctionTypeTesterProps) {
  const { address } = useAccount();
  const { auctions, isLoading, error } = useAuctionsEnhanced();
  const [selectedType, setSelectedType] = useState<AuctionType | "ALL">("ALL");

  const auctionTypeNames = {
    [AuctionType.ENGLISH]: "English",
    [AuctionType.DUTCH]: "Dutch",
    [AuctionType.SEALED_BID]: "Sealed Bid",
    [AuctionType.RESERVE]: "Reserve",
  };

  const auctionStatusNames = {
    [AuctionStatus.PENDING]: "Pending",
    [AuctionStatus.ACTIVE]: "Active",
    [AuctionStatus.REVEAL]: "Reveal",
    [AuctionStatus.ENDED]: "Ended",
    [AuctionStatus.SETTLED]: "Settled",
    [AuctionStatus.CANCELLED]: "Cancelled",
  };

  const getStatusColor = (status: AuctionStatus) => {
    const colors = {
      [AuctionStatus.PENDING]: "bg-yellow-100 text-yellow-800",
      [AuctionStatus.ACTIVE]: "bg-green-100 text-green-800",
      [AuctionStatus.REVEAL]: "bg-purple-100 text-purple-800",
      [AuctionStatus.ENDED]: "bg-gray-100 text-gray-800",
      [AuctionStatus.SETTLED]: "bg-blue-100 text-blue-800",
      [AuctionStatus.CANCELLED]: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const filteredAuctions =
    selectedType === "ALL"
      ? auctions
      : auctions.filter((auction) => auction.auctionType === selectedType);

  const typeStats = auctions.reduce((stats, auction) => {
    const type = auction.auctionType;
    const status = auction.status as AuctionStatus;

    if (!stats[type]) {
      stats[type] = {
        total: 0,
        byStatus: {} as Record<AuctionStatus, number>,
      };
    }

    stats[type].total++;
    stats[type].byStatus[status] = (stats[type].byStatus[status] || 0) + 1;

    return stats;
  }, {} as Record<AuctionType, { total: number; byStatus: Record<AuctionStatus, number> }>);

  if (isLoading) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-6 bg-red-50 border border-red-200 rounded-lg ${className}`}
      >
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          ❌ Error Loading Auctions
        </h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-lg shadow ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🧪 Auction Type Tester
      </h3>

      {/* Type Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Auction Type:
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedType("ALL")}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedType === "ALL"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({auctions.length})
          </button>
          {Object.entries(auctionTypeNames).map(([type, name]) => (
            <button
              key={type}
              onClick={() => setSelectedType(Number(type) as AuctionType)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedType === Number(type)
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {name} ({typeStats[Number(type) as AuctionType]?.total || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Type Statistics */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-3">
          📊 Statistics by Type
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(typeStats).map(([type, stats]) => (
            <div key={type} className="bg-gray-50 rounded-lg p-3">
              <h5 className="font-medium text-gray-800 mb-2">
                {auctionTypeNames[Number(type) as AuctionType]}
              </h5>
              <div className="text-sm text-gray-600">
                <div className="mb-1">Total: {stats.total}</div>
                {Object.entries(stats.byStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between">
                    <span>
                      {auctionStatusNames[Number(status) as AuctionStatus]}:
                    </span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auction List */}
      <div className="mb-4">
        <h4 className="text-md font-semibold text-gray-800 mb-3">
          📋 Auctions ({filteredAuctions.length})
        </h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredAuctions.map((auction) => (
            <div
              key={auction.auctionId}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-gray-800">
                    #{auction.auctionId}
                  </span>
                  <span className="text-sm text-gray-600">
                    {auction.nftName || `NFT #${auction.nftId}`}
                  </span>
                  <span className="text-xs text-gray-500">
                    {auctionTypeNames[auction.auctionType]}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Token ID: {auction.nftId} | Current Bid: {auction.currentBid}{" "}
                  ETH
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    auction.status as AuctionStatus
                  )}`}
                >
                  {auctionStatusNames[auction.status as AuctionStatus]}
                </span>
                {auction.highestBidder && (
                  <span className="text-xs text-gray-500">
                    Winner: {auction.highestBidder.slice(0, 6)}...
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-md font-semibold text-blue-800 mb-2">
          ✅ Test Results
        </h4>
        <div className="text-sm text-blue-700 space-y-1">
          <div>• Total auctions loaded: {auctions.length}</div>
          <div>• Auction types present: {Object.keys(typeStats).length}/4</div>
          <div>
            • Status mapping:{" "}
            {
              Object.values(AuctionStatus).filter((v) => typeof v === "number")
                .length
            }{" "}
            statuses
          </div>
          <div>
            • Connected wallet: {address ? "✅ Connected" : "❌ Not connected"}
          </div>
        </div>
      </div>
    </div>
  );
}







