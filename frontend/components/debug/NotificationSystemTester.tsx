"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import toast from "react-hot-toast";

export default function NotificationSystemTester() {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const testNotificationSystem = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      // Test auction #7 specifically
      const auctionData = await auctionContract.getAuction(7);
      const status = Number(auctionData.status);
      const endTime = Number(auctionData.endTime);
      const highestBidder = auctionData.highestBidder;
      const auctionType = Number(auctionData.auctionType);
      const now = Math.floor(Date.now() / 1000);

      const isExpired = now > endTime;
      const isUserWinner =
        highestBidder.toLowerCase() === address.toLowerCase();

      // ✅ REMOVED: Cooldown check - cooldown system has been removed
      // const notificationKey = `notification_${address}_7`;
      // const lastNotificationTime = parseInt(
      //   localStorage.getItem(notificationKey) || "0"
      // );
      // const NOTIFICATION_COOLDOWN = 5 * 60 * 1000;
      // const isInCooldown =
      //   Date.now() - lastNotificationTime < NOTIFICATION_COOLDOWN;

      // Check existing notifications
      const existingNotifications = JSON.parse(
        localStorage.getItem("moove-claim-notifications") || "[]"
      );
      const hasExistingNotification = existingNotifications.some(
        (n: any) => n.auctionId === "7"
      );

      // Check processed auctions
      const processedAuctions = JSON.parse(
        localStorage.getItem("moove-processed-claim-auctions") || "[]"
      );
      const isProcessed = processedAuctions.includes("7");

      const results = {
        // Auction data
        auctionId: 7,
        status,
        endTime: new Date(endTime * 1000).toISOString(),
        currentTime: new Date().toISOString(),
        isExpired,
        highestBidder,
        isUserWinner,
        auctionType,

        // Notification system state
        // notificationKey, // REMOVED: No longer needed
        // lastNotificationTime, // REMOVED: No longer needed
        // lastNotificationTimeFormatted: // REMOVED: No longer needed
        //   lastNotificationTime > 0
        //     ? new Date(lastNotificationTime).toISOString()
        //     : "Never",
        // isInCooldown, // REMOVED: No longer needed
        hasExistingNotification,
        isProcessed,

        // Logic checks
        shouldHaveNotification: status === 3 && isUserWinner, // REMOVED: && !isInCooldown
        statusCheck: status === 3,
        winnerCheck: isUserWinner,
        // cooldownCheck: !isInCooldown, // REMOVED: No longer needed

        // System state
        existingNotificationsCount: existingNotifications.length,
        processedAuctionsCount: processedAuctions.length,
      };

      setTestResults(results);
      console.log("🧪 Notification System Test Results:", results);

      // Show summary
      if (results.shouldHaveNotification) {
        toast.success("✅ Auction #7 should have a notification!");
      } else {
        toast.error("❌ Auction #7 should NOT have a notification");
      }
    } catch (error) {
      console.error("Error testing notification system:", error);
      toast.error("Error testing notification system");
    } finally {
      setIsLoading(false);
    }
  };

  const forceNotificationGeneration = async () => {
    if (!testResults || !isConnected || !address) {
      toast.error("Please run the test first");
      return;
    }

    if (!testResults.shouldHaveNotification) {
      toast.error(
        "Auction #7 should not have a notification based on current state"
      );
      return;
    }

    try {
      // Create notification manually
      const notification = {
        id: `7-settleAuction-${Date.now()}`,
        auctionId: "7",
        message: "🎉 You won auction #7! Click to claim your NFT.",
        timestamp: Date.now(),
        isRead: false,
        transactionHash: "ended-auction",
        priority: "high" as const,
        notificationType: "settleAuction" as const,
        isPermanent: true,
      };

      // Save to localStorage
      const existingNotifications = JSON.parse(
        localStorage.getItem("moove-claim-notifications") || "[]"
      );

      // Check if notification already exists
      const exists = existingNotifications.some(
        (n: any) =>
          n.auctionId === "7" && n.notificationType === "settleAuction"
      );

      if (exists) {
        toast.error("Notification for auction #7 already exists");
        return;
      }

      existingNotifications.push(notification);
      localStorage.setItem(
        "moove-claim-notifications",
        JSON.stringify(existingNotifications)
      );

      // ✅ REMOVED: Cooldown setting - cooldown system has been removed
      // const notificationKey = `notification_${address}_7`;
      // localStorage.setItem(notificationKey, Date.now().toString());

      // Mark as processed
      const processedAuctions = JSON.parse(
        localStorage.getItem("moove-processed-claim-auctions") || "[]"
      );
      if (!processedAuctions.includes("7")) {
        processedAuctions.push("7");
        localStorage.setItem(
          "moove-processed-claim-auctions",
          JSON.stringify(processedAuctions)
        );
      }

      toast.success(
        "✅ Notification created for auction #7! Refresh the page to see it."
      );

      // Refresh test results
      setTimeout(() => {
        testNotificationSystem();
      }, 1000);
    } catch (error) {
      console.error("Error creating notification:", error);
      toast.error("Error creating notification");
    }
  };

  const clearAllData = () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    // Clear all notification data
    localStorage.removeItem("moove-claim-notifications");
    localStorage.removeItem("moove-processed-claim-auctions");

    // ✅ REMOVED: Cooldown clearing - cooldown system has been removed
    // const keys = Object.keys(localStorage);
    // const userCooldownKeys = keys.filter((key) =>
    //   key.startsWith(`notification_${address}_`)
    // );
    // userCooldownKeys.forEach((key) => {
    //   localStorage.removeItem(key);
    // });

    toast.success("✅ All notification data cleared");

    // Refresh test results
    setTimeout(() => {
      testNotificationSystem();
    }, 1000);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">
        🧪 Notification System Tester
      </h2>

      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={testNotificationSystem}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Testing..." : "Test Notification System"}
          </button>

          <button
            onClick={forceNotificationGeneration}
            disabled={!testResults?.shouldHaveNotification}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Force Generate Notification
          </button>

          <button
            onClick={clearAllData}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear All Data
          </button>
        </div>

        {testResults && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">📊 Test Results</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Auction Data</h4>
                <div className="text-sm space-y-1">
                  <div>
                    <strong>Status:</strong> {testResults.status} (
                    {testResults.status === 3 ? "ENDED" : "OTHER"})
                  </div>
                  <div>
                    <strong>Type:</strong> {testResults.auctionType} (
                    {testResults.auctionType === 0 ? "ENGLISH" : "OTHER"})
                  </div>
                  <div>
                    <strong>Is Expired:</strong>{" "}
                    {testResults.isExpired ? "✅ YES" : "❌ NO"}
                  </div>
                  <div>
                    <strong>Is User Winner:</strong>{" "}
                    {testResults.isUserWinner ? "✅ YES" : "❌ NO"}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-green-800 mb-2">
                  System State
                </h4>
                <div className="text-sm space-y-1">
                  <div>
                    <strong>Has Existing:</strong>{" "}
                    {testResults.hasExistingNotification ? "✅ YES" : "❌ NO"}
                  </div>
                  <div>
                    <strong>Is Processed:</strong>{" "}
                    {testResults.isProcessed ? "✅ YES" : "❌ NO"}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded">
              <h4 className="font-semibold text-blue-800">
                🔔 Notification Logic
              </h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div>
                  Should Have Notification:{" "}
                  {testResults.shouldHaveNotification ? "✅ YES" : "❌ NO"}
                </div>
                <div>
                  Status Check (status === 3):{" "}
                  {testResults.statusCheck ? "✅ true" : "❌ false"}
                </div>
                <div>
                  Winner Check (isUserWinner):{" "}
                  {testResults.winnerCheck ? "✅ true" : "❌ false"}
                </div>
                <div className="text-green-600 font-semibold">
                  ✅ Cooldown System Removed - No longer blocking notifications!
                </div>
              </div>
            </div>

            {testResults.shouldHaveNotification && (
              <div className="mt-4 p-3 bg-green-50 rounded">
                <h4 className="font-semibold text-green-800">
                  ✅ Ready for Notification
                </h4>
                <div className="text-sm text-green-700">
                  <p>
                    All conditions are met for generating a notification for
                    auction #7.
                  </p>
                  <p>
                    Use "Force Generate Notification" to create it manually.
                  </p>
                </div>
              </div>
            )}

            {!testResults.shouldHaveNotification && (
              <div className="mt-4 p-3 bg-red-50 rounded">
                <h4 className="font-semibold text-red-800">
                  ❌ Cannot Generate Notification
                </h4>
                <div className="text-sm text-red-700">
                  <p>
                    One or more conditions are not met for generating a
                    notification.
                  </p>
                  <p>Check the logic above to see what's missing.</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">
            💡 How This Works
          </h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>
              <strong>Test:</strong> Checks all conditions for notification
              generation
            </p>
            <p>
              <strong>Force Generate:</strong> Manually creates the notification
              if conditions are met
            </p>
            <p>
              <strong>Clear All Data:</strong> Resets all notification system
              data
            </p>
            <p>
              <strong>Purpose:</strong> Debug why notifications aren't being
              generated automatically
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
