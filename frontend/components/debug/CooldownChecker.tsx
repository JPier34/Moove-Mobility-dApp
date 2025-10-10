"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";

export default function CooldownChecker() {
  const { address } = useAccount();
  const [cooldownInfo, setCooldownInfo] = useState<any>(null);

  const checkCooldown = () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    const notificationKey = `notification_${address}_7`;
    const lastNotificationTime = parseInt(
      localStorage.getItem(notificationKey) || "0"
    );
    const NOTIFICATION_COOLDOWN = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    const timeSinceLastNotification = now - lastNotificationTime;
    const isInCooldown = timeSinceLastNotification < NOTIFICATION_COOLDOWN;
    const cooldownRemaining = isInCooldown
      ? NOTIFICATION_COOLDOWN - timeSinceLastNotification
      : 0;

    const info = {
      notificationKey,
      lastNotificationTime,
      lastNotificationTimeFormatted:
        lastNotificationTime > 0
          ? new Date(lastNotificationTime).toISOString()
          : "Never",
      now,
      nowFormatted: new Date(now).toISOString(),
      timeSinceLastNotification,
      timeSinceLastNotificationMinutes: Math.floor(
        timeSinceLastNotification / (60 * 1000)
      ),
      NOTIFICATION_COOLDOWN,
      NOTIFICATION_COOLDOWNMinutes: 5,
      isInCooldown,
      cooldownRemaining,
      cooldownRemainingMinutes: Math.floor(cooldownRemaining / (60 * 1000)),
      cooldownRemainingSeconds: Math.floor(
        (cooldownRemaining % (60 * 1000)) / 1000
      ),
    };

    setCooldownInfo(info);
    console.log("🔍 Cooldown Info for Auction #7:", info);
  };

  const clearCooldown = () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    const notificationKey = `notification_${address}_7`;
    localStorage.removeItem(notificationKey);
    toast.success("✅ Cooldown cleared for auction #7");

    // Refresh the cooldown info
    checkCooldown();
  };

  const clearAllCooldowns = () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    // Clear all notification cooldowns for this user
    const keys = Object.keys(localStorage);
    const userCooldownKeys = keys.filter((key) =>
      key.startsWith(`notification_${address}_`)
    );

    userCooldownKeys.forEach((key) => {
      localStorage.removeItem(key);
    });

    toast.success(
      `✅ Cleared ${userCooldownKeys.length} cooldowns for user ${address}`
    );

    // Refresh the cooldown info
    checkCooldown();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">
        ⏰ Cooldown Checker - Auction #7
      </h2>

      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={checkCooldown}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Check Cooldown
          </button>

          <button
            onClick={clearCooldown}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Clear Auction #7 Cooldown
          </button>

          <button
            onClick={clearAllCooldowns}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear All Cooldowns
          </button>
        </div>

        {cooldownInfo && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">📊 Cooldown Status</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <strong>Notification Key:</strong>{" "}
                {cooldownInfo.notificationKey}
              </div>
              <div>
                <strong>Last Notification:</strong>{" "}
                {cooldownInfo.lastNotificationTimeFormatted}
              </div>
              <div>
                <strong>Current Time:</strong> {cooldownInfo.nowFormatted}
              </div>
              <div>
                <strong>Time Since Last:</strong>{" "}
                {cooldownInfo.timeSinceLastNotificationMinutes} minutes
              </div>
              <div>
                <strong>Cooldown Duration:</strong>{" "}
                {cooldownInfo.NOTIFICATION_COOLDOWNMinutes} minutes
              </div>
              <div>
                <strong>Is In Cooldown:</strong>{" "}
                {cooldownInfo.isInCooldown ? "✅ YES" : "❌ NO"}
              </div>
              {cooldownInfo.isInCooldown && (
                <>
                  <div>
                    <strong>Cooldown Remaining:</strong>{" "}
                    {cooldownInfo.cooldownRemainingMinutes} minutes
                  </div>
                  <div>
                    <strong>Cooldown Remaining:</strong>{" "}
                    {cooldownInfo.cooldownRemainingSeconds} seconds
                  </div>
                </>
              )}
            </div>

            {cooldownInfo.isInCooldown && (
              <div className="mt-4 p-3 bg-red-50 rounded">
                <h4 className="font-semibold text-red-800">
                  🚨 Cooldown Active!
                </h4>
                <div className="text-sm text-red-700">
                  <p>
                    The notification system is blocked for auction #7 due to
                    cooldown.
                  </p>
                  <p>This is why you're not seeing the claim notification.</p>
                  <p>
                    <strong>Solution:</strong> Clear the cooldown using the
                    button above.
                  </p>
                </div>
              </div>
            )}

            {!cooldownInfo.isInCooldown && (
              <div className="mt-4 p-3 bg-green-50 rounded">
                <h4 className="font-semibold text-green-800">✅ No Cooldown</h4>
                <div className="text-sm text-green-700">
                  <p>No cooldown is blocking notifications for auction #7.</p>
                  <p>
                    The issue might be elsewhere in the notification system.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">
            💡 How Cooldown Works
          </h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              <strong>Purpose:</strong> Prevents spam notifications for the same
              auction
            </p>
            <p>
              <strong>Duration:</strong> 5 minutes after each notification
            </p>
            <p>
              <strong>Key Format:</strong> notification_{address}_auctionId
            </p>
            <p>
              <strong>Problem:</strong> When you called endAuction(), it set a
              cooldown that blocks settleAuction notifications
            </p>
            <p>
              <strong>Solution:</strong> Clear the cooldown to allow
              settleAuction notifications
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
