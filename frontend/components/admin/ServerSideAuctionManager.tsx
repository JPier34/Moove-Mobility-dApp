"use client";

import React, { useState } from "react";
import { useAutomaticServerSideAuctionMonitor } from "@/hooks/useAutomaticServerSideAuctionMonitor";
import { useServerSideAuctionActions } from "@/hooks/useServerSideAuctionActions";

interface ServerSideAuctionManagerProps {
  className?: string;
}

export default function ServerSideAuctionManager({
  className = "",
}: ServerSideAuctionManagerProps) {
  const {
    expiredAuctions,
    processedAuctions,
    isMonitoring,
    loading,
    startMonitoring,
    stopMonitoring,
    manualProcessAuction,
    checkExpiredAuctions,
  } = useAutomaticServerSideAuctionMonitor();

  const { getAuctionStatus } = useServerSideAuctionActions();
  const [selectedAuctionId, setSelectedAuctionId] = useState("");
  const [auctionStatus, setAuctionStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);

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

  const checkAuctionStatus = async () => {
    if (!selectedAuctionId) return;

    setStatusLoading(true);
    try {
      const status = await getAuctionStatus(selectedAuctionId);
      setAuctionStatus(status);
    } catch (err) {
      console.error("Failed to get auction status:", err);
      setAuctionStatus({
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        🤖 Server-Side Auction Manager
      </h2>

      {/* Monitoring Controls */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          📊 Automatic Monitoring
        </h3>
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={startMonitoring}
              disabled={isMonitoring || loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isMonitoring ? "Monitoring..." : "Start Monitoring"}
            </button>
            <button
              onClick={stopMonitoring}
              disabled={!isMonitoring}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Stop Monitoring
            </button>
            <button
              onClick={checkExpiredAuctions}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Checking..." : "Check Now"}
            </button>
          </div>

          <div className="text-sm text-gray-600">
            <p>
              • Status:{" "}
              <span
                className={isMonitoring ? "text-green-600" : "text-gray-500"}
              >
                {isMonitoring ? "🟢 Active" : "🔴 Inactive"}
              </span>
              {isMonitoring && (
                <span className="ml-2 text-xs text-blue-600">
                  (Persistent - survives page reload)
                </span>
              )}
            </p>
            <p>• Processed Auctions: {processedAuctions.length}</p>
            <p>• Expired Auctions Found: {expiredAuctions.length}</p>
          </div>
        </div>
      </div>

      {/* Expired Auctions List */}
      {expiredAuctions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            ⏰ Expired Auctions
          </h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="space-y-2">
              {expiredAuctions.map((auction) => (
                <div
                  key={auction.auctionId}
                  className="flex items-center justify-between p-2 bg-white rounded border"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold">
                      Auction #{auction.auctionId}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        auction.status === 1
                          ? "bg-green-100 text-green-800"
                          : auction.status === 2
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {getStatusLabel(auction.status)}
                    </span>
                    <span className="text-blue-600 text-sm">
                      {getAuctionTypeLabel(auction.auctionType)}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {new Date(auction.endTime * 1000).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => manualProcessAuction(auction.auctionId)}
                    disabled={
                      loading || processedAuctions.includes(auction.auctionId)
                    }
                    className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50"
                  >
                    {processedAuctions.includes(auction.auctionId)
                      ? "✅ Processed"
                      : "Process"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manual Auction Check */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          🔍 Manual Auction Check
        </h3>
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex gap-2 mb-4">
            <input
              type="number"
              value={selectedAuctionId}
              onChange={(e) => setSelectedAuctionId(e.target.value)}
              placeholder="Auction ID"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={checkAuctionStatus}
              disabled={statusLoading || !selectedAuctionId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {statusLoading ? "Checking..." : "Check Status"}
            </button>
          </div>

          {auctionStatus && (
            <div className="bg-white p-3 rounded border">
              {auctionStatus.error ? (
                <p className="text-red-600">❌ {auctionStatus.error}</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    {getStatusLabel(auctionStatus.status)}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span>{" "}
                    {getAuctionTypeLabel(auctionStatus.auctionType)}
                  </div>
                  <div>
                    <span className="font-medium">Expired:</span>{" "}
                    {auctionStatus.isExpired ? "✅ Yes" : "❌ No"}
                  </div>
                  <div>
                    <span className="font-medium">Settled:</span>{" "}
                    {auctionStatus.isSettled ? "✅ Yes" : "❌ No"}
                  </div>
                  <div>
                    <span className="font-medium">End Time:</span>{" "}
                    {new Date(auctionStatus.endTime * 1000).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Highest Bidder:</span>{" "}
                    {auctionStatus.highestBidder?.slice(0, 10)}...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          💡 How It Works
        </h3>
        <div className="space-y-2 text-blue-800">
          <p>
            • <strong>Server-Side:</strong> Uses admin private key to sign
            transactions
          </p>
          <p>
            • <strong>No MetaMask:</strong> Transactions are signed on the
            server
          </p>
          <p>
            • <strong>Automatic:</strong> Monitors auctions every 2 minutes
          </p>
          <p>
            • <strong>Smart Logic:</strong> Handles different auction types
            correctly
          </p>
          <p>
            • <strong>Safe:</strong> Only processes expired auctions
          </p>
        </div>
      </div>
    </div>
  );
}








