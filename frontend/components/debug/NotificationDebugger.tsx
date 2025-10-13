"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useAuctionNotifications } from "@/providers/AuctionNotificationsProvider";

export default function NotificationDebugger() {
  const { address, isConnected } = useAccount();
  const { claimNotifications, reloadClaimNotifications } =
    useAuctionNotifications();
  const [localStorageData, setLocalStorageData] = useState<any>(null);

  const checkLocalStorage = () => {
    if (typeof window === "undefined") return;

    const claimNotifications = localStorage.getItem(
      "moove-claim-notifications"
    );
    const processedAuctions = localStorage.getItem(
      "moove-processed-claim-auctions"
    );

    const data = {
      claimNotifications: claimNotifications
        ? JSON.parse(claimNotifications)
        : [],
      processedAuctions: processedAuctions ? JSON.parse(processedAuctions) : [],
      timestamp: new Date().toISOString(),
    };

    setLocalStorageData(data);
    console.log("🔍 LocalStorage Debug Data:", data);
  };

  const clearAllNotifications = () => {
    if (typeof window === "undefined") return;

    localStorage.removeItem("moove-claim-notifications");
    localStorage.removeItem("moove-processed-claim-auctions");

    setLocalStorageData(null);
    reloadClaimNotifications();

    console.log("🧹 Cleared all notification data from localStorage");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">
        🔍 Notification Debugger
      </h2>

      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">
            💡 How This Works
          </h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              <strong>Purpose:</strong> Debug notification system and
              localStorage data
            </p>
            <p>
              <strong>Context Notifications:</strong> Shows notifications loaded
              in React context
            </p>
            <p>
              <strong>LocalStorage Data:</strong> Shows raw data stored in
              browser localStorage
            </p>
            <p>
              <strong>Reload:</strong> Refreshes notifications from localStorage
              to context
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={checkLocalStorage}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Check LocalStorage
          </button>

          <button
            onClick={reloadClaimNotifications}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Reload Notifications
          </button>

          <button
            onClick={clearAllNotifications}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear All
          </button>
        </div>

        {/* Context Notifications */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">
            📊 Context Notifications ({claimNotifications.length})
          </h3>

          {claimNotifications.length > 0 ? (
            <div className="space-y-2">
              {claimNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-blue-50 p-2 rounded text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>ID:</strong> {notification.id}
                    </div>
                    <div className="text-gray-600">
                      {notification.isRead ? "✅ Read" : "❌ Unread"}
                    </div>
                  </div>
                  <div>
                    <strong>Message:</strong> {notification.message}
                  </div>
                  <div>
                    <strong>Auction ID:</strong> {notification.auctionId}
                  </div>
                  <div>
                    <strong>Type:</strong> {notification.notificationType}
                  </div>
                  <div>
                    <strong>Priority:</strong> {notification.priority}
                  </div>
                  <div>
                    <strong>Permanent:</strong>{" "}
                    {notification.isPermanent ? "Yes" : "No"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No notifications in context</p>
          )}
        </div>

        {/* LocalStorage Data */}
        {localStorageData && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">💾 LocalStorage Data</h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-blue-800 mb-2">
                  Claim Notifications (
                  {localStorageData.claimNotifications.length})
                </h4>
                {localStorageData.claimNotifications.length > 0 ? (
                  <div className="space-y-2">
                    {localStorageData.claimNotifications.map(
                      (notification: any) => (
                        <div
                          key={notification.id}
                          className="bg-blue-50 p-2 rounded text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <strong>ID:</strong> {notification.id}
                            </div>
                            <div className="text-gray-600">
                              {notification.isRead ? "✅ Read" : "❌ Unread"}
                            </div>
                          </div>
                          <div>
                            <strong>Message:</strong> {notification.message}
                          </div>
                          <div>
                            <strong>Auction ID:</strong>{" "}
                            {notification.auctionId}
                          </div>
                          <div>
                            <strong>Type:</strong>{" "}
                            {notification.notificationType}
                          </div>
                          <div>
                            <strong>Priority:</strong> {notification.priority}
                          </div>
                          <div>
                            <strong>Permanent:</strong>{" "}
                            {notification.isPermanent ? "Yes" : "No"}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">
                    No claim notifications in localStorage
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-medium text-green-800 mb-2">
                  Processed Auctions (
                  {localStorageData.processedAuctions.length})
                </h4>
                {localStorageData.processedAuctions.length > 0 ? (
                  <div className="space-y-1">
                    {localStorageData.processedAuctions.map(
                      (auctionId: string) => (
                        <div
                          key={auctionId}
                          className="bg-green-50 p-2 rounded text-xs"
                        >
                          Auction #{auctionId}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">
                    No processed auctions in localStorage
                  </p>
                )}
              </div>

              <div className="text-sm text-gray-600">
                <strong>Last Checked:</strong> {localStorageData.timestamp}
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">
            ⚠️ Debugging Tips
          </h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>
              <strong>If notifications don't appear:</strong> Check if data
              exists in localStorage
            </p>
            <p>
              <strong>If context is empty:</strong> Use "Reload Notifications"
              to sync from localStorage
            </p>
            <p>
              <strong>If duplicates exist:</strong> Use "Clear All" to reset the
              system
            </p>
            <p>
              <strong>If still not working:</strong> Check browser console for
              errors
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


