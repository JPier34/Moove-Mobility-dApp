"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useAuctionNotifications } from "@/providers/AuctionNotificationsProvider";
import toast from "react-hot-toast";

export default function SealedBidMonitoringTest() {
  const { address, isConnected } = useAccount();
  const {
    addToSealedBidMonitoring,
    removeFromSealedBidMonitoring,
    monitoredSealedBidAuctions,
    isMonitoringSealedBids,
    sealedBidError,
  } = useAuctionNotifications();

  const [auctionId, setAuctionId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const addAuctionToMonitoring = async () => {
    if (!auctionId) {
      toast.error("Please enter an Auction ID");
      return;
    }

    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      addToSealedBidMonitoring?.(parseInt(auctionId));
      toast.success(`Added auction ${auctionId} to monitoring`);
    } catch (error) {
      toast.error("Error adding auction to monitoring");
    } finally {
      setLoading(false);
    }
  };

  const removeAuctionFromMonitoring = async () => {
    if (!auctionId) {
      toast.error("Please enter an Auction ID");
      return;
    }

    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      removeFromSealedBidMonitoring?.(parseInt(auctionId));
      toast.success(`Removed auction ${auctionId} from monitoring`);
    } catch (error) {
      toast.error("Error removing auction from monitoring");
    } finally {
      setLoading(false);
    }
  };

  const checkMonitoringStatus = () => {
    console.log("🔍 [SealedBid] Monitoring Status:", {
      isMonitoringSealedBids,
      monitoredAuctions: monitoredSealedBidAuctions,
      error: sealedBidError,
      walletConnected: isConnected,
      address,
    });
    toast.success("Monitoring status logged to console");
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        🔒 Sealed Bid Monitoring Test
      </h2>

      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-blue-800 dark:text-blue-200 font-semibold mb-2">
            📊 Monitoring Status
          </h3>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <div>
              <strong>Is Monitoring:</strong>{" "}
              {isMonitoringSealedBids ? "✅ YES" : "❌ NO"}
            </div>
            <div>
              <strong>Monitored Auctions:</strong>{" "}
              {monitoredSealedBidAuctions?.length || 0}
            </div>
            <div>
              <strong>Error:</strong> {sealedBidError || "None"}
            </div>
            <div>
              <strong>Wallet Connected:</strong>{" "}
              {isConnected ? "✅ YES" : "❌ NO"}
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="auctionId"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Auction ID
          </label>
          <input
            type="number"
            id="auctionId"
            value={auctionId}
            onChange={(e) => setAuctionId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="e.g., 10"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={addAuctionToMonitoring}
            disabled={loading || !auctionId}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add to Monitoring"}
          </button>

          <button
            onClick={removeAuctionFromMonitoring}
            disabled={loading || !auctionId}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Removing..." : "Remove from Monitoring"}
          </button>

          <button
            onClick={checkMonitoringStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Check Status
          </button>
        </div>

        {monitoredSealedBidAuctions &&
          monitoredSealedBidAuctions.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-3">
                📋 Monitored Auctions
              </h3>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {monitoredSealedBidAuctions.map((auctionId, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-1"
                  >
                    <span>Auction #{auctionId}</span>
                    <button
                      onClick={() => {
                        setAuctionId(auctionId.toString());
                        removeAuctionFromMonitoring();
                      }}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="text-yellow-800 dark:text-yellow-200 font-semibold mb-2">
            ℹ️ How It Works
          </h3>
          <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <div>• The system automatically monitors sealed bid auctions</div>
            <div>
              • When an auction expires, it automatically transitions to REVEAL
              phase
            </div>
            <div>
              • After reveal phase, it transitions to ENDED and determines the
              winner
            </div>
            <div>• Notifications are sent based on the auction outcome</div>
          </div>
        </div>
      </div>
    </div>
  );
}
