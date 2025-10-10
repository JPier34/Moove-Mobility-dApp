"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";

export default function CooldownCleanup() {
  const { address } = useAccount();
  const [cleanupResults, setCleanupResults] = useState<any>(null);

  const cleanupAllCooldowns = () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    // Find all cooldown keys
    const keys = Object.keys(localStorage);
    const cooldownKeys = keys.filter((key) =>
      key.startsWith(`notification_${address}_`)
    );

    // Remove all cooldown keys
    cooldownKeys.forEach((key) => {
      localStorage.removeItem(key);
    });

    const results = {
      totalKeysFound: cooldownKeys.length,
      keysRemoved: cooldownKeys,
      userAddress: address,
      timestamp: new Date().toISOString(),
    };

    setCleanupResults(results);

    if (cooldownKeys.length > 0) {
      toast.success(`✅ Removed ${cooldownKeys.length} cooldown entries`);
    } else {
      toast.info("ℹ️ No cooldown entries found");
    }

    console.log("🧹 Cooldown Cleanup Results:", results);
  };

  const checkCooldownStatus = () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    const keys = Object.keys(localStorage);
    const cooldownKeys = keys.filter((key) =>
      key.startsWith(`notification_${address}_`)
    );

    const cooldownDetails = cooldownKeys.map((key) => {
      const value = localStorage.getItem(key);
      const timestamp = value ? parseInt(value) : 0;
      return {
        key,
        timestamp,
        timestampFormatted:
          timestamp > 0 ? new Date(timestamp).toISOString() : "Never",
        ageMinutes:
          timestamp > 0
            ? Math.floor((Date.now() - timestamp) / (60 * 1000))
            : 0,
      };
    });

    const results = {
      totalCooldowns: cooldownKeys.length,
      cooldownDetails,
      userAddress: address,
      timestamp: new Date().toISOString(),
    };

    setCleanupResults(results);
    console.log("🔍 Cooldown Status Check:", results);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">
        🧹 Cooldown System Cleanup
      </h2>

      <div className="space-y-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">
            ✅ Cooldown System Removed
          </h3>
          <div className="text-sm text-green-700 space-y-1">
            <p>
              <strong>Status:</strong> The buggy cooldown system has been
              completely removed from the code.
            </p>
            <p>
              <strong>Impact:</strong> Users will no longer miss claim
              notifications due to cooldown blocking.
            </p>
            <p>
              <strong>Action:</strong> Clean up any existing cooldown data from
              localStorage.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={checkCooldownStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Check Cooldown Status
          </button>

          <button
            onClick={cleanupAllCooldowns}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clean Up All Cooldowns
          </button>
        </div>

        {cleanupResults && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">📊 Cleanup Results</h3>

            <div className="text-sm space-y-2">
              <div>
                <strong>User Address:</strong> {cleanupResults.userAddress}
              </div>
              <div>
                <strong>Total Cooldowns Found:</strong>{" "}
                {cleanupResults.totalCooldowns || cleanupResults.totalKeysFound}
              </div>
              <div>
                <strong>Timestamp:</strong> {cleanupResults.timestamp}
              </div>

              {cleanupResults.cooldownDetails &&
                cleanupResults.cooldownDetails.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-blue-800 mb-2">
                      Cooldown Details
                    </h4>
                    <div className="space-y-1">
                      {cleanupResults.cooldownDetails.map(
                        (cooldown: any, index: number) => (
                          <div
                            key={index}
                            className="bg-blue-50 p-2 rounded text-xs"
                          >
                            <div>
                              <strong>Key:</strong> {cooldown.key}
                            </div>
                            <div>
                              <strong>Set At:</strong>{" "}
                              {cooldown.timestampFormatted}
                            </div>
                            <div>
                              <strong>Age:</strong> {cooldown.ageMinutes}{" "}
                              minutes ago
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {cleanupResults.keysRemoved &&
                cleanupResults.keysRemoved.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-red-800 mb-2">
                      Removed Keys
                    </h4>
                    <div className="space-y-1">
                      {cleanupResults.keysRemoved.map(
                        (key: string, index: number) => (
                          <div
                            key={index}
                            className="bg-red-50 p-2 rounded text-xs font-mono"
                          >
                            {key}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">
            💡 What Was Fixed
          </h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>
              <strong>Problem:</strong> Cooldown system blocked settleAuction
              notifications after endAuction notifications
            </p>
            <p>
              <strong>Root Cause:</strong> Generic cooldown per auction instead
              of specific cooldown per notification type
            </p>
            <p>
              <strong>Solution:</strong> Completely removed the buggy cooldown
              system
            </p>
            <p>
              <strong>Result:</strong> Users will now receive all legitimate
              notifications without blocking
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
