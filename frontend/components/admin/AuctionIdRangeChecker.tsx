"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

interface AuctionIdRangeCheckerProps {
  className?: string;
}

interface AuctionInfo {
  auctionId: number;
  exists: boolean;
  status?: number;
  auctionType?: number;
  tokenId?: number;
  seller?: string;
  error?: string;
}

export default function AuctionIdRangeChecker({
  className = "",
}: AuctionIdRangeCheckerProps) {
  const [totalAuctions, setTotalAuctions] = useState<number>(0);
  const [auctionRange, setAuctionRange] = useState<AuctionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startId, setStartId] = useState(24);
  const [endId, setEndId] = useState(34);

  const checkAuctionRange = async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL ||
          "https://ethereum-sepolia-rpc.publicnode.com"
      );
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      // Get total auction count
      const totalCount = await auctionContract.totalAuctions();
      const total = Number(totalCount);
      setTotalAuctions(total);

      console.log(`📊 Total auctions in contract: ${total}`);

      // Check range of auction IDs
      const auctionInfos: AuctionInfo[] = [];

      for (let i = startId; i <= Math.min(endId, total - 1); i++) {
        try {
          const auctionData = await auctionContract.getAuction(i);

          auctionInfos.push({
            auctionId: i,
            exists: true,
            status: Number(auctionData.status),
            auctionType: Number(auctionData.auctionType),
            tokenId: Number(auctionData.tokenId),
            seller: auctionData.seller,
          });

          console.log(`✅ Auction ${i} exists:`, {
            status: Number(auctionData.status),
            auctionType: Number(auctionData.auctionType),
            tokenId: Number(auctionData.tokenId),
          });
        } catch (err) {
          auctionInfos.push({
            auctionId: i,
            exists: false,
            error: err instanceof Error ? err.message : "Unknown error",
          });

          console.log(`❌ Auction ${i} does not exist or error:`, err);
        }
      }

      setAuctionRange(auctionInfos);
    } catch (err) {
      console.error("Error checking auction range:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0:
        return "PENDING";
      case 1:
        return "ACTIVE";
      case 2:
        return "REVEAL";
      case 3:
        return "ENDED";
      case 4:
        return "SETTLED";
      case 5:
        return "CANCELLED";
      default:
        return `UNKNOWN (${status})`;
    }
  };

  const getAuctionTypeLabel = (type: number) => {
    switch (type) {
      case 0:
        return "English";
      case 1:
        return "Dutch";
      case 2:
        return "Sealed Bid";
      case 3:
        return "Reserve";
      default:
        return `Unknown (${type})`;
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return "text-gray-600";
      case 1:
        return "text-green-600";
      case 2:
        return "text-blue-600";
      case 3:
        return "text-orange-600";
      case 4:
        return "text-purple-600";
      case 5:
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  useEffect(() => {
    checkAuctionRange();
  }, []);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        🔍 Auction ID Range Checker
      </h2>

      {/* Summary */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          📊 Contract Summary
        </h3>
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Auctions:</span>
              <p className="text-lg font-bold text-blue-600">{totalAuctions}</p>
            </div>
            <div>
              <span className="font-medium">Valid Auction ID Range:</span>
              <p className="text-lg font-bold text-green-600">
                24 to {totalAuctions - 1}
              </p>
            </div>
            <div>
              <span className="font-medium">First Valid Auction ID:</span>
              <p className="font-mono">24</p>
            </div>
            <div>
              <span className="font-medium">Last Auction ID:</span>
              <p className="font-mono">
                {totalAuctions > 0 ? totalAuctions - 1 : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Range Input */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          🔍 Check Specific Range
        </h3>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start ID
            </label>
            <input
              type="number"
              value={startId}
              onChange={(e) => setStartId(parseInt(e.target.value) || 24)}
              min="24"
              max={totalAuctions - 1}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End ID
            </label>
            <input
              type="number"
              value={endId}
              onChange={(e) => setEndId(parseInt(e.target.value) || 10)}
              min={startId}
              max={totalAuctions - 1}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={checkAuctionRange}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Checking..." : "Check Range"}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">❌ {error}</p>
        </div>
      )}

      {/* Results */}
      {auctionRange.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            📋 Auction Range Results
          </h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-1 gap-2 text-sm">
              {auctionRange.map((auction) => (
                <div
                  key={auction.auctionId}
                  className={`p-3 rounded-md border ${
                    auction.exists
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-bold">
                        Auction #{auction.auctionId}
                      </span>
                      {auction.exists ? (
                        <>
                          <span
                            className={`font-semibold ${getStatusColor(
                              auction.status!
                            )}`}
                          >
                            {getStatusLabel(auction.status!)}
                          </span>
                          <span className="text-blue-600 font-medium">
                            {getAuctionTypeLabel(auction.auctionType!)}
                          </span>
                          <span className="text-gray-600">
                            Token #{auction.tokenId}
                          </span>
                          <span className="text-gray-500 text-xs font-mono">
                            {auction.seller?.slice(0, 10)}...
                          </span>
                        </>
                      ) : (
                        <span className="text-red-600 font-semibold">
                          ❌ Does not exist
                        </span>
                      )}
                    </div>
                    {auction.error && (
                      <span className="text-red-500 text-xs">
                        {auction.error}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analysis */}
      {auctionRange.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            💡 Analysis
          </h3>
          <div className="space-y-2 text-blue-800">
            <div>
              <span className="font-medium">Auction ID System:</span>
              <p>
                • Valid auctions start from ID <strong>24</strong>
              </p>
              <p>• IDs 0-23 are skipped (problematic/erroneous)</p>
              <p>• Valid range: 24, 25, 26, 27, ...</p>
              <p>
                • Total count: <strong>{totalAuctions}</strong> auctions
              </p>
            </div>
            <div>
              <span className="font-medium">Current Range:</span>
              <p>
                • Checking IDs {startId} to {endId}
              </p>
              <p>
                • Found {auctionRange.filter((a) => a.exists).length} existing
                auctions
              </p>
              <p>
                • Found {auctionRange.filter((a) => !a.exists).length}{" "}
                non-existing IDs
              </p>
            </div>
            {totalAuctions > 0 && (
              <div>
                <span className="font-medium">Contract State:</span>
                <p>
                  • First valid auction: <strong>#24</strong>
                </p>
                <p>
                  • Last auction: <strong>#{totalAuctions - 1}</strong>
                </p>
                <p>
                  • Next auction will be: <strong>#{totalAuctions}</strong>
                </p>
                <p>
                  • Skipped auctions: <strong>#0-23</strong> (problematic)
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}








