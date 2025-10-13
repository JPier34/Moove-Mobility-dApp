"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

export default function Auction7ClaimDebug() {
  const { address, isConnected } = useAccount();
  const [auctionData, setAuctionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const fetchAuction7Data = async () => {
      if (!isConnected || !address) return;

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

        console.log("🔍 [Auction7 Debug] Fetching auction #7 data...");

        // Get auction data
        const auction = await auctionContract.getAuction(7);
        setAuctionData(auction);

        // Calculate debug info
        const now = Math.floor(Date.now() / 1000);
        const endTime = Number(auction.endTime);
        const status = Number(auction.status);
        const highestBidder = auction.highestBidder;
        const auctionType = Number(auction.auctionType);

        const isExpired = now > endTime;
        const isUserWinner =
          highestBidder.toLowerCase() === address.toLowerCase();
        const shouldHaveNotification =
          status === 1 && isExpired && isUserWinner;

        // Check localStorage for notification cooldown
        const notificationKey = `moove-claim-notification-7`;
        const lastNotificationTime = parseInt(
          localStorage.getItem(notificationKey) || "0"
        );
        const NOTIFICATION_COOLDOWN = 5 * 60 * 1000; // 5 minutes
        const timeSinceLastNotification = Date.now() - lastNotificationTime;
        const isInCooldown = timeSinceLastNotification < NOTIFICATION_COOLDOWN;

        // Check if notification exists in localStorage
        const existingNotifications = localStorage.getItem(
          "moove-claim-notifications"
        );
        let hasExistingNotification = false;
        if (existingNotifications) {
          try {
            const notifications = JSON.parse(existingNotifications);
            hasExistingNotification = notifications.some(
              (n: any) => n.auctionId === "7"
            );
          } catch (e) {
            console.warn("Failed to parse existing notifications:", e);
          }
        }

        const debugData = {
          // Basic auction info
          auctionId: 7,
          status,
          auctionType,
          endTime,
          highestBidder,
          seller: auction.seller,

          // Time calculations
          now,
          endTimeDate: new Date(endTime * 1000).toISOString(),
          nowDate: new Date(now * 1000).toISOString(),
          isExpired,
          timeSinceExpired: isExpired ? now - endTime : 0,
          timeSinceExpiredMinutes: isExpired
            ? Math.floor((now - endTime) / 60)
            : 0,

          // User info
          userAddress: address,
          isUserWinner,

          // Notification logic
          shouldHaveNotification,
          statusCheck: `status === 1: ${status === 1}`,
          expiredCheck: `now > endTime: ${isExpired}`,
          winnerCheck: `isUserWinner: ${isUserWinner}`,

          // Cooldown info
          lastNotificationTime,
          timeSinceLastNotification,
          isInCooldown,
          cooldownRemaining: isInCooldown
            ? NOTIFICATION_COOLDOWN - timeSinceLastNotification
            : 0,

          // Existing notifications
          hasExistingNotification,
          existingNotificationsCount: existingNotifications
            ? JSON.parse(existingNotifications).length
            : 0,
        };

        setDebugInfo(debugData);
        console.log("🔍 [Auction7 Debug] Debug data:", debugData);
      } catch (err) {
        console.error("❌ [Auction7 Debug] Error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchAuction7Data();
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        ⚠️ Please connect your wallet to debug Auction #7
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
        🔄 Loading Auction #7 debug data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        ❌ Error loading Auction #7: {error}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        🔍 Auction #7 Claim Debug
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Info */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            📊 Basic Auction Info
          </h4>
          <div className="space-y-1 text-sm">
            <div>
              <strong>Status:</strong> {debugInfo?.status} (
              {debugInfo?.status === 1
                ? "ACTIVE"
                : debugInfo?.status === 3
                ? "ENDED"
                : debugInfo?.status === 4
                ? "SETTLED"
                : "UNKNOWN"}
              )
            </div>
            <div>
              <strong>Type:</strong> {debugInfo?.auctionType} (
              {debugInfo?.auctionType === 0
                ? "ENGLISH"
                : debugInfo?.auctionType === 1
                ? "DUTCH"
                : debugInfo?.auctionType === 2
                ? "SEALED_BID"
                : debugInfo?.auctionType === 3
                ? "RESERVE"
                : "UNKNOWN"}
              )
            </div>
            <div>
              <strong>End Time:</strong> {debugInfo?.endTimeDate}
            </div>
            <div>
              <strong>Highest Bidder:</strong> {debugInfo?.highestBidder}
            </div>
            <div>
              <strong>Seller:</strong> {debugInfo?.seller}
            </div>
          </div>
        </div>

        {/* Time Analysis */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            ⏰ Time Analysis
          </h4>
          <div className="space-y-1 text-sm">
            <div>
              <strong>Current Time:</strong> {debugInfo?.nowDate}
            </div>
            <div>
              <strong>Is Expired:</strong>{" "}
              {debugInfo?.isExpired ? "✅ YES" : "❌ NO"}
            </div>
            <div>
              <strong>Time Since Expired:</strong>{" "}
              {debugInfo?.timeSinceExpiredMinutes} minutes
            </div>
            <div>
              <strong>End Time Unix:</strong> {debugInfo?.endTime}
            </div>
            <div>
              <strong>Current Unix:</strong> {debugInfo?.now}
            </div>
          </div>
        </div>

        {/* User Analysis */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            👤 User Analysis
          </h4>
          <div className="space-y-1 text-sm">
            <div>
              <strong>User Address:</strong> {debugInfo?.userAddress}
            </div>
            <div>
              <strong>Is Winner:</strong>{" "}
              {debugInfo?.isUserWinner ? "✅ YES" : "❌ NO"}
            </div>
            <div>
              <strong>Winner Check:</strong> {debugInfo?.winnerCheck}
            </div>
          </div>
        </div>

        {/* Notification Logic */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            🔔 Notification Logic
          </h4>
          <div className="space-y-1 text-sm">
            <div>
              <strong>Should Have Notification:</strong>{" "}
              {debugInfo?.shouldHaveNotification ? "✅ YES" : "❌ NO"}
            </div>
            <div>
              <strong>Status Check:</strong> {debugInfo?.statusCheck}
            </div>
            <div>
              <strong>Expired Check:</strong> {debugInfo?.expiredCheck}
            </div>
            <div>
              <strong>Winner Check:</strong> {debugInfo?.winnerCheck}
            </div>
          </div>
        </div>

        {/* Cooldown Analysis */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            ⏱️ Cooldown Analysis
          </h4>
          <div className="space-y-1 text-sm">
            <div>
              <strong>Last Notification:</strong>{" "}
              {debugInfo?.lastNotificationTime
                ? new Date(debugInfo.lastNotificationTime).toISOString()
                : "Never"}
            </div>
            <div>
              <strong>Time Since Last:</strong>{" "}
              {Math.floor(debugInfo?.timeSinceLastNotification / 1000)} seconds
            </div>
            <div>
              <strong>Is In Cooldown:</strong>{" "}
              {debugInfo?.isInCooldown ? "✅ YES" : "❌ NO"}
            </div>
            <div>
              <strong>Cooldown Remaining:</strong>{" "}
              {Math.floor(debugInfo?.cooldownRemaining / 1000)} seconds
            </div>
          </div>
        </div>

        {/* Existing Notifications */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            📝 Existing Notifications
          </h4>
          <div className="space-y-1 text-sm">
            <div>
              <strong>Has Existing:</strong>{" "}
              {debugInfo?.hasExistingNotification ? "✅ YES" : "❌ NO"}
            </div>
            <div>
              <strong>Total Notifications:</strong>{" "}
              {debugInfo?.existingNotificationsCount}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900 rounded">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          📋 Summary
        </h4>
        <div className="text-sm">
          {debugInfo?.shouldHaveNotification ? (
            <div className="text-green-600 dark:text-green-400">
              ✅ <strong>Auction #7 SHOULD have a claim notification!</strong>
              <br />
              Status: {debugInfo.status} (ACTIVE), Expired:{" "}
              {debugInfo.isExpired ? "YES" : "NO"}, Winner:{" "}
              {debugInfo.isUserWinner ? "YES" : "NO"}
            </div>
          ) : (
            <div className="text-red-600 dark:text-red-400">
              ❌{" "}
              <strong>Auction #7 should NOT have a claim notification</strong>
              <br />
              Status: {debugInfo.status}, Expired:{" "}
              {debugInfo.isExpired ? "YES" : "NO"}, Winner:{" "}
              {debugInfo.isUserWinner ? "YES" : "NO"}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => {
            // Clear cooldown
            localStorage.removeItem("moove-claim-notification-7");
            console.log("🧹 Cleared cooldown for Auction #7");
            window.location.reload();
          }}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          🧹 Clear Cooldown
        </button>

        <button
          onClick={() => {
            // Force trigger notification
            const notification = {
              id: `claim-7-${Date.now()}`,
              auctionId: "7",
              message: "Auction #7 is ready for claim!",
              timestamp: Date.now(),
              isRead: false,
              priority: "high",
              notificationType: "endAuction",
              isPermanent: true,
            };

            const existing = localStorage.getItem("moove-claim-notifications");
            const notifications = existing ? JSON.parse(existing) : [];
            notifications.push(notification);
            localStorage.setItem(
              "moove-claim-notifications",
              JSON.stringify(notifications)
            );

            console.log("🔔 Force created notification for Auction #7");
            window.location.reload();
          }}
          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
        >
          🔔 Force Create Notification
        </button>
      </div>
    </div>
  );
}




