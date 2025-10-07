"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import Button from "../ui/Button";

export default function NotificationSystemTester() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  const testNotificationSystem = async () => {
    if (!isConnected || !address) {
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

      console.log("🔍 Testing notification system...");
      console.log("👤 User address:", address);

      // Get current block
      const currentBlock = await provider.getBlockNumber();
      console.log("📦 Current block:", currentBlock);

      // Test 1: Check BidRefunded events from a wider range
      const fromBlock = Math.max(currentBlock - 2000, 0); // Last 2000 blocks
      console.log("📦 Testing from block:", fromBlock, "to", currentBlock);

      // Fetch BidRefunded events
      const refundFilter = auctionContract.filters.BidRefunded();
      const events = await auctionContract.queryFilter(
        refundFilter,
        fromBlock,
        currentBlock
      );

      console.log("📡 Found BidRefunded events:", events.length);

      // Process events for current user
      const userRefundEvents = events.filter(
        (event) => (event as any).args.bidder.toLowerCase() === address.toLowerCase()
      );

      console.log(
        "👤 BidRefunded events for current user:",
        userRefundEvents.length
      );

      // Test 2: Check if notifications exist in localStorage
      const storedNotifications = localStorage.getItem("moove-notifications");
      let parsedNotifications = [];
      if (storedNotifications) {
        try {
          parsedNotifications = JSON.parse(storedNotifications);
        } catch (error) {
          console.warn("Failed to parse stored notifications:", error);
        }
      }

      const refundNotifications = parsedNotifications.filter(
        (n: any) => n.type === "refund" && n.auctionId
      );

      console.log(
        "💾 Stored refund notifications:",
        refundNotifications.length
      );

      // Test 3: Check dismissed notifications
      const dismissedNotifications = localStorage.getItem(
        "moove-dismissed-notifications"
      );
      let parsedDismissed = [];
      if (dismissedNotifications) {
        try {
          parsedDismissed = JSON.parse(dismissedNotifications);
        } catch (error) {
          console.warn("Failed to parse dismissed notifications:", error);
        }
      }

      console.log("🗑️ Dismissed notifications:", parsedDismissed.length);

      // Test 4: Check lastCheckedBlock
      const lastCheckedBlock = localStorage.getItem("lastCheckedBlock");
      console.log("📦 Last checked block:", lastCheckedBlock);

      // Analysis
      const analysis = {
        totalRefundEvents: events.length,
        userRefundEvents: userRefundEvents.length,
        storedRefundNotifications: refundNotifications.length,
        dismissedNotifications: parsedDismissed.length,
        lastCheckedBlock: lastCheckedBlock,
        missingNotifications:
          userRefundEvents.length - refundNotifications.length,
        events: userRefundEvents.map((event) => ({
          auctionId: (event as any).args.auctionId.toString(),
          amount: ethers.formatEther((event as any).args.amount),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
        })),
        storedNotifications: refundNotifications,
      };

      setResults(analysis);

      console.log("📊 Analysis:", analysis);
    } catch (error) {
      console.error("❌ Test failed:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const fixNotificationSystem = async () => {
    if (!results) return;

    try {
      console.log("🔧 Fixing notification system...");

      // Clear old notifications
      localStorage.removeItem("moove-notifications");
      localStorage.removeItem("moove-dismissed-notifications");
      localStorage.removeItem("lastCheckedBlock");

      // Create new notifications for missing refund events
      const newNotifications = results.events.map(
        (event: any, index: number) => ({
          id: `${event.auctionId}-refund-${event.blockNumber}`,
          auctionId: event.auctionId,
          type: "refund",
          message: `Your bid of ${event.amount} ETH has been refunded for auction #${event.auctionId}`,
          timestamp: Date.now(),
          transactionHash: event.transactionHash,
          amount: event.amount,
          isRead: false,
          isDismissed: false,
          priority: "medium",
        })
      );

      // Save new notifications
      localStorage.setItem(
        "moove-notifications",
        JSON.stringify(newNotifications)
      );

      // Set lastCheckedBlock to current block
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || "https://1rpc.io/sepolia"
      );
      const currentBlock = await provider.getBlockNumber();
      localStorage.setItem("lastCheckedBlock", currentBlock.toString());

      console.log("✅ Notification system fixed!");
      console.log("📊 Created", newNotifications.length, "new notifications");

      // Refresh the test
      await testNotificationSystem();
    } catch (error) {
      console.error("❌ Fix failed:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const clearAllNotifications = () => {
    localStorage.removeItem("moove-notifications");
    localStorage.removeItem("moove-dismissed-notifications");
    localStorage.removeItem("lastCheckedBlock");
    console.log("🗑️ All notifications cleared");
    setResults(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        🔧 Notification System Tester
      </h2>

      <div className="mb-6 space-y-4">
        <Button
          onClick={testNotificationSystem}
          disabled={loading || !isConnected}
          className="w-full"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Testing Notification System...
            </>
          ) : (
            "Test Notification System"
          )}
        </Button>

        {results && results.missingNotifications > 0 && (
          <Button
            onClick={fixNotificationSystem}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Fix Missing Notifications ({results.missingNotifications})
          </Button>
        )}

        <Button
          onClick={clearAllNotifications}
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700"
        >
          Clear All Notifications
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">❌ Error: {error}</p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Summary */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              📊 Analysis Summary
            </h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Total Refund Events:</strong>{" "}
                    {results.totalRefundEvents}
                  </p>
                  <p>
                    <strong>Events for You:</strong> {results.userRefundEvents}
                  </p>
                  <p>
                    <strong>Stored Notifications:</strong>{" "}
                    {results.storedRefundNotifications}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Dismissed Notifications:</strong>{" "}
                    {results.dismissedNotifications}
                  </p>
                  <p>
                    <strong>Last Checked Block:</strong>{" "}
                    {results.lastCheckedBlock || "Not set"}
                  </p>
                  <p>
                    <strong>Missing Notifications:</strong>{" "}
                    {results.missingNotifications}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Missing Notifications Alert */}
          {results.missingNotifications > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 font-medium">
                ⚠️ MISSING NOTIFICATIONS DETECTED
              </p>
              <p className="text-yellow-700">
                You have {results.missingNotifications} refund events that
                should have triggered notifications but didn't.
              </p>
              <p className="text-yellow-600 text-sm mt-1">
                This indicates a bug in the notification system. Click "Fix
                Missing Notifications" to resolve.
              </p>
            </div>
          )}

          {/* Refund Events */}
          {results.events.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                💰 Your Refund Events ({results.events.length})
              </h3>
              <div className="space-y-2">
                {results.events.map((event: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 rounded-md border bg-blue-50 border-blue-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          Auction #{event.auctionId} - {event.amount} ETH
                        </p>
                        <p className="text-xs text-gray-500">
                          Block: {event.blockNumber} | TX:{" "}
                          {event.transactionHash.slice(0, 10)}...
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          REFUNDED
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stored Notifications */}
          {results.storedNotifications.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                💾 Stored Refund Notifications (
                {results.storedNotifications.length})
              </h3>
              <div className="space-y-2">
                {results.storedNotifications.map(
                  (notification: any, index: number) => (
                    <div
                      key={index}
                      className="p-3 rounded-md border bg-green-50 border-green-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            Auction #{notification.auctionId} -{" "}
                            {notification.amount} ETH
                          </p>
                          <p className="text-sm text-gray-600">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div
                            className={`px-2 py-1 rounded text-xs ${
                              notification.isDismissed
                                ? "bg-gray-100 text-gray-800"
                                : notification.isRead
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {notification.isDismissed
                              ? "DISMISSED"
                              : notification.isRead
                              ? "READ"
                              : "UNREAD"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



