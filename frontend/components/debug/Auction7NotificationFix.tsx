"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import toast from "react-hot-toast";

export default function Auction7NotificationFix() {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const checkAuction7 = async () => {
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

      // Get auction data
      const auctionData = await auctionContract.getAuction(7);
      const status = Number(auctionData.status);
      const endTime = Number(auctionData.endTime);
      const highestBidder = auctionData.highestBidder;
      const auctionType = Number(auctionData.auctionType);
      const now = Math.floor(Date.now() / 1000);

      const isExpired = now > endTime;
      const isUserWinner =
        highestBidder.toLowerCase() === address.toLowerCase();

      const debugData = {
        auctionId: 7,
        status,
        endTime: new Date(endTime * 1000).toISOString(),
        currentTime: new Date().toISOString(),
        isExpired,
        highestBidder,
        isUserWinner,
        auctionType,
        now,
        endTimeUnix: endTime,
        currentUnix: now,
        timeSinceExpired: Math.floor((now - endTime) / 60), // minutes
      };

      setDebugInfo(debugData);
      console.log("🔍 Auction #7 Debug Info:", debugData);
    } catch (error) {
      console.error("Error checking auction 7:", error);
      toast.error("Error checking auction 7");
    } finally {
      setIsLoading(false);
    }
  };

  const forceCreateNotification = async () => {
    if (!debugInfo || !isConnected || !address) {
      toast.error("Please check auction first");
      return;
    }

    if (!debugInfo.isUserWinner) {
      toast.error("You are not the winner of auction #7");
      return;
    }

    if (debugInfo.status !== 3) {
      toast.error(`Auction #7 status is ${debugInfo.status}, not 3 (ENDED)`);
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

      // Also save to processed auctions to prevent duplicates
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

      // Trigger a page refresh to show the notification
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error creating notification:", error);
      toast.error("Error creating notification");
    }
  };

  const clearCooldown = () => {
    const notificationKey = `notification_${address}_7`;
    localStorage.removeItem(notificationKey);
    toast.success("✅ Cooldown cleared for auction #7");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">
        🔧 Auction #7 Notification Fix
      </h2>

      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={checkAuction7}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Checking..." : "Check Auction #7"}
          </button>

          <button
            onClick={clearCooldown}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Clear Cooldown
          </button>
        </div>

        {debugInfo && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">📊 Auction #7 Status</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <strong>Status:</strong> {debugInfo.status} (
                {debugInfo.status === 3 ? "ENDED" : "OTHER"})
              </div>
              <div>
                <strong>Type:</strong> {debugInfo.auctionType} (
                {debugInfo.auctionType === 0 ? "ENGLISH" : "OTHER"})
              </div>
              <div>
                <strong>End Time:</strong> {debugInfo.endTime}
              </div>
              <div>
                <strong>Current Time:</strong> {debugInfo.currentTime}
              </div>
              <div>
                <strong>Is Expired:</strong>{" "}
                {debugInfo.isExpired ? "✅ YES" : "❌ NO"}
              </div>
              <div>
                <strong>Time Since Expired:</strong>{" "}
                {debugInfo.timeSinceExpired} minutes
              </div>
              <div>
                <strong>Highest Bidder:</strong> {debugInfo.highestBidder}
              </div>
              <div>
                <strong>Is User Winner:</strong>{" "}
                {debugInfo.isUserWinner ? "✅ YES" : "❌ NO"}
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded">
              <h4 className="font-semibold text-blue-800">
                🔔 Notification Logic
              </h4>
              <div className="text-sm text-blue-700">
                <div>
                  Should Have Notification:{" "}
                  {debugInfo.status === 3 && debugInfo.isUserWinner
                    ? "✅ YES"
                    : "❌ NO"}
                </div>
                <div>
                  Status Check: status === 3:{" "}
                  {debugInfo.status === 3 ? "true" : "false"}
                </div>
                <div>
                  Winner Check: isUserWinner:{" "}
                  {debugInfo.isUserWinner ? "true" : "false"}
                </div>
              </div>
            </div>

            {debugInfo.status === 3 && debugInfo.isUserWinner && (
              <div className="mt-4">
                <button
                  onClick={forceCreateNotification}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  🎯 Force Create Notification
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  This will manually create a claim notification for auction #7
                </p>
              </div>
            )}
          </div>
        )}

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">💡 Explanation</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>
              <strong>Status 3 (ENDED):</strong> This is normal! It means the
              auction has ended but hasn't been settled yet.
            </p>
            <p>
              <strong>Missing Notification:</strong> The system should create a
              "settleAuction" notification for ENDED auctions where you're the
              winner.
            </p>
            <p>
              <strong>Fix:</strong> Use the "Force Create Notification" button
              to manually create the missing notification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
