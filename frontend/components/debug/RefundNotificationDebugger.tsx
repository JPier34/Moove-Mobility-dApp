"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import Button from "../ui/Button";

interface RefundEvent {
  auctionId: string;
  bidder: string;
  amount: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

interface NotificationCheck {
  event: RefundEvent;
  shouldNotify: boolean;
  reason: string;
  userAddress: string;
}

export default function RefundNotificationDebugger() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refundEvents, setRefundEvents] = useState<RefundEvent[]>([]);
  const [notificationChecks, setNotificationChecks] = useState<
    NotificationCheck[]
  >([]);
  const [lastCheckedBlock, setLastCheckedBlock] = useState<number>(0);

  const debugRefundNotifications = async () => {
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

      console.log("🔍 Debugging refund notifications...");
      console.log("👤 User address:", address);

      // Get current block
      const currentBlock = await provider.getBlockNumber();
      console.log("📦 Current block:", currentBlock);

      // Get last checked block from localStorage (simulate useConsolidatedNotifications behavior)
      const storedLastBlock = localStorage.getItem("lastCheckedBlock");
      const fromBlock = storedLastBlock
        ? parseInt(storedLastBlock)
        : Math.max(currentBlock - 1000, 0);

      console.log("📦 From block:", fromBlock);
      console.log("📦 To block:", currentBlock);

      // Fetch BidRefunded events
      const refundFilter = auctionContract.filters.BidRefunded();
      const events = await auctionContract.queryFilter(
        refundFilter,
        fromBlock,
        currentBlock
      );

      console.log("📡 Found BidRefunded events:", events.length);

      // Process events
      const refundDetails: RefundEvent[] = [];
      const checks: NotificationCheck[] = [];

      for (const event of events) {
        const refundEvent: RefundEvent = {
          auctionId: (event as any).args.auctionId.toString(),
          bidder: (event as any).args.bidder,
          amount: ethers.formatEther((event as any).args.amount),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: 0, // Will be filled from block
        };

        // Get block timestamp
        try {
          const block = await provider.getBlock(event.blockNumber);
          refundEvent.timestamp = block?.timestamp || 0;
        } catch (error) {
          console.warn("Could not get block timestamp:", error);
        }

        refundDetails.push(refundEvent);

        // Check if this event should trigger a notification for the current user
        const shouldNotify =
          refundEvent.bidder.toLowerCase() === address.toLowerCase();
        const reason = shouldNotify
          ? "User is the bidder who received the refund"
          : "User is not the bidder who received the refund";

        checks.push({
          event: refundEvent,
          shouldNotify,
          reason,
          userAddress: address,
        });

        console.log(`🔍 Event ${refundEvent.auctionId}:`, {
          bidder: refundEvent.bidder,
          userAddress: address,
          shouldNotify,
          reason,
        });
      }

      setRefundEvents(refundDetails);
      setNotificationChecks(checks);
      setLastCheckedBlock(currentBlock);

      // Update localStorage (simulate useConsolidatedNotifications behavior)
      localStorage.setItem("lastCheckedBlock", currentBlock.toString());

      console.log("✅ Refund notification debug completed");
      console.log("📊 Summary:", {
        totalEvents: refundDetails.length,
        eventsForUser: checks.filter((c) => c.shouldNotify).length,
        eventsNotForUser: checks.filter((c) => !c.shouldNotify).length,
      });
    } catch (error) {
      console.error("❌ Debug failed:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const clearLastCheckedBlock = () => {
    localStorage.removeItem("lastCheckedBlock");
    setLastCheckedBlock(0);
    console.log("🗑️ Cleared lastCheckedBlock from localStorage");
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        🔔 Refund Notification Debugger
      </h2>

      <div className="mb-6 space-y-4">
        <Button
          onClick={debugRefundNotifications}
          disabled={loading || !isConnected}
          className="w-full"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Debugging Refund Notifications...
            </>
          ) : (
            "Debug Refund Notifications"
          )}
        </Button>

        <Button
          onClick={clearLastCheckedBlock}
          disabled={loading}
          className="w-full bg-gray-500 hover:bg-gray-600"
        >
          Clear Last Checked Block
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">❌ Error: {error}</p>
        </div>
      )}

      {/* User Info */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          👤 User Information
        </h3>
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-sm">
            <strong>Address:</strong> {address}
          </p>
          <p className="text-sm">
            <strong>Last Checked Block:</strong> {lastCheckedBlock}
          </p>
        </div>
      </div>

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
                className="p-3 rounded-md border bg-blue-50 border-blue-200"
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
                    <p className="text-xs text-gray-500">
                      Time:{" "}
                      {event.timestamp
                        ? new Date(event.timestamp * 1000).toLocaleString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notification Checks */}
      {notificationChecks.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            🔔 Notification Analysis ({notificationChecks.length})
          </h3>
          <div className="space-y-2">
            {notificationChecks.map((check, index) => (
              <div
                key={index}
                className={`p-3 rounded-md border ${
                  check.shouldNotify
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      Auction #{check.event.auctionId} - {check.event.amount}{" "}
                      ETH
                    </p>
                    <p className="text-sm text-gray-600">
                      Bidder: {check.event.bidder}
                    </p>
                    <p className="text-sm text-gray-600">
                      Reason: {check.reason}
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`px-2 py-1 rounded text-xs ${
                        check.shouldNotify
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {check.shouldNotify ? "SHOULD NOTIFY" : "NO NOTIFICATION"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {notificationChecks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            📊 Summary
          </h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm space-y-2">
              <p>
                <strong>Total Refund Events:</strong> {refundEvents.length}
              </p>
              <p>
                <strong>Events for Current User:</strong>{" "}
                {notificationChecks.filter((c) => c.shouldNotify).length}
              </p>
              <p>
                <strong>Events for Other Users:</strong>{" "}
                {notificationChecks.filter((c) => !c.shouldNotify).length}
              </p>

              {notificationChecks.filter((c) => c.shouldNotify).length > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-yellow-800 font-medium">
                    ⚠️ NOTIFICATION ISSUE DETECTED
                  </p>
                  <p className="text-yellow-700">
                    There are{" "}
                    {notificationChecks.filter((c) => c.shouldNotify).length}{" "}
                    refund events that should have triggered notifications for
                    you.
                  </p>
                  <p className="text-yellow-600 text-xs mt-1">
                    Check the notification system logic in
                    useConsolidatedNotifications.ts
                  </p>
                </div>
              )}

              {notificationChecks.filter((c) => c.shouldNotify).length ===
                0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-800 font-medium">
                    ✅ NO NOTIFICATION ISSUES
                  </p>
                  <p className="text-green-700">
                    All refund events are for other users, so no notifications
                    should be sent to you.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



