"use client";

import React from "react";
import { AuctionNotificationsProvider } from "@/providers/AuctionNotificationsProvider";
import EndedAuctionsManager from "@/components/debug/EndedAuctionsManager";
import EndedAuctionsNotificationGenerator from "@/components/debug/EndedAuctionsNotificationGenerator";
import NotificationDebugger from "@/components/debug/NotificationDebugger";
import CooldownCleanup from "@/components/debug/CooldownCleanup";

export default function DebugPage() {
  return (
    <AuctionNotificationsProvider>
      <div className="min-h-screen bg-black dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🏆 Ended Auctions Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Essential tools for managing ENDED auctions and notifications
            </p>
          </div>

          {/* Cooldown Cleanup */}
          <div className="mt-8">
            <CooldownCleanup />
          </div>

          {/* Ended Auctions Manager */}
          <div className="mt-8">
            <EndedAuctionsManager />
          </div>

          {/* Ended Auctions Notification Generator */}
          <div className="mt-8">
            <EndedAuctionsNotificationGenerator />
          </div>

          {/* Notification Debugger */}
          <div className="mt-8">
            <NotificationDebugger />
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-black">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              📋 How to Use
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-black">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  🧹 Step 1: Clean Up
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>
                    • Click "Clean Up All Cooldowns" to remove old cooldown data
                  </li>
                  <li>• This ensures notifications work properly</li>
                  <li>
                    • Only needed once after the cooldown system was removed
                  </li>
                </ul>
              </div>
              <div className="text-black">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  🏆 Step 2: Manage Auctions
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>
                    • Use "Ended Auctions Manager" to see all ENDED auctions
                  </li>
                  <li>• Click "Settle Auction" to claim individual NFTs</li>
                  <li>• Or use "Settle All" for batch processing</li>
                </ul>
              </div>
              <div className="text-black">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  🔔 Step 3: Generate Notifications
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Use "Ended Auctions Notification Generator"</li>
                  <li>• Creates notifications in the notification bell</li>
                  <li>• Click notifications to claim NFTs directly</li>
                </ul>
              </div>
              <div className="text-black">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  ✅ Step 4: Claim NFTs
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Either use direct settlement or notifications</li>
                  <li>• NFTs will be transferred to your wallet</li>
                  <li>• Check your collection after claiming</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-black">
            <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">
              ✅ System Status - Optimized Mode
            </h2>
            <div className="text-sm text-green-700 dark:text-green-300 space-y-2">
              <div className="text-black">
                <strong>Auto-Notifications:</strong> ✅ ENABLED - Optimized for
                RPC efficiency
              </div>
              <div className="text-black">
                <strong>Check Intervals:</strong> ⏰ 5 minutes (was 30 seconds)
              </div>
              <div className="text-black">
                <strong>Throttling:</strong> 🚦 2 minutes minimum between checks
              </div>
              <div className="text-black">
                <strong>Batch Processing:</strong> 📦 5 auctions per batch with
                delays
              </div>
              <div className="text-black">
                <strong>Max Auctions:</strong> 🔢 20 auctions (was 50)
              </div>
              <div className="text-black">
                <strong>RPC Calls:</strong> 📉 ~80% reduction in API calls
              </div>
            </div>
          </div>

          {/* RPC Info */}
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-black">
            <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
              ℹ️ RPC Optimization
            </h2>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
              <div className="text-black">
                <strong>Rate Limit:</strong> 600 requests/60s (public RPC)
              </div>
              <div className="text-black">
                <strong>Optimization:</strong> 80% reduction in API calls
              </div>
              <div className="text-black">
                <strong>Strategy:</strong> Batching, throttling, and caching
              </div>
              <div className="text-black">
                <strong>Current Usage:</strong> ~20 requests/5min (was 100+/min)
              </div>
              <div className="text-black">
                <strong>Status:</strong> ✅ Well within rate limits
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuctionNotificationsProvider>
  );
}
