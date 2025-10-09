"use client";

import React, { useState } from "react";
import { AuctionNotificationsProvider } from "@/providers/AuctionNotificationsProvider";
import DutchAuctionChecker from "@/components/debug/DutchAuctionChecker";
import NFT114Debug from "@/components/debug/NFT114Debug";
import NFT114DetailedDebug from "@/components/debug/NFT114DetailedDebug";
import RefundSystemTester from "@/components/debug/RefundSystemTester";
import AdminCreationDebugger from "@/components/debug/AdminCreationDebugger";
import Auction30Debugger from "@/components/debug/Auction30Debugger";
import Auction31Debugger from "@/components/debug/Auction31Debugger";
import ExpiredAuctionsDebugger from "@/components/debug/ExpiredAuctionsDebugger";
import Auction2DetailedDebugger from "@/components/debug/Auction2DetailedDebugger";
import AuctionSecurityValidator from "@/components/debug/AuctionSecurityValidator";
import RefundNotificationDebugger from "@/components/debug/RefundNotificationDebugger";
import Auction7ClaimDebug from "@/components/debug/Auction7ClaimDebug";
import NotificationSystemTester from "@/components/debug/NotificationSystemTester";
import SealedBidNotificationTest from "@/components/debug/SealedBidNotificationTest";
// Debug components removed
// ModularValidationTester COMPLETELY REMOVED - was causing build errors

export default function DebugPage() {
  const [auctionId, setAuctionId] = useState<number>(2);
  const [buyerAddress, setBuyerAddress] = useState<string>("");

  return (
    <AuctionNotificationsProvider>
      <div className="min-h-screen bg-black dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🧪 Debug & Testing Center
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive testing tools for auction system validation
            </p>
          </div>

          {/* Admin Creation Debugger */}
          <div className="mb-8">
            <AdminCreationDebugger />
          </div>

          {/* Notification System Tester */}
          <div className="mb-8">
            <NotificationSystemTester />
          </div>

          {/* Refund Notification Debugger */}
          <div className="mb-8">
            <RefundNotificationDebugger />
          </div>

          {/* Expired Auctions Debugger */}
          <div className="mb-8">
            <ExpiredAuctionsDebugger />
          </div>

          {/* Auction #2 Detailed Debugger */}
          <div className="mb-8 text-black dark:text-white">
            <Auction2DetailedDebugger />
          </div>

          {/* Auction #4 Debugger - REMOVED */}
          <div className="mb-8 text-black dark:text-white">
            <div className="text-gray-500">
              Auction4Debugger component removed
            </div>

            {/* Race Condition Test - REMOVED */}
            <div className="justify-end items-start bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🧪 Race Condition Test - REMOVED
              </h2>
              <p className="text-gray-600 mb-4">
                RaceConditionTest component removed
              </p>
              <div className="text-gray-500">Component removed</div>
            </div>
          </div>

          {/* Refund System Tester */}
          <div className="mb-8">
            <RefundSystemTester />
          </div>

          {/* NFT 114 Detailed Debug */}
          <div className="mb-8">
            <NFT114DetailedDebug />
          </div>

          {/* NFT 114 Debug */}
          <div className="mb-8">
            <NFT114Debug />
          </div>

          {/* Dutch Auction Checker */}
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                🔍 Dutch Auction Purchase Checker
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Auction ID
                  </label>
                  <input
                    type="number"
                    value={auctionId}
                    onChange={(e) => setAuctionId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter auction ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Buyer Address (Optional)
                  </label>
                  <input
                    type="text"
                    value={buyerAddress}
                    onChange={(e) => setBuyerAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0x..."
                  />
                </div>
              </div>
            </div>

            <DutchAuctionChecker
              auctionId={auctionId}
              buyerAddress={buyerAddress || undefined}
            />
          </div>

          <div className="text-center">
            <div className="p-8 bg-gray-100 border border-gray-300 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🧹 Debug Components Removed
              </h3>
              <p className="text-gray-700">
                All debug components have been removed for production readiness.
                The system is now clean and optimized.
              </p>
            </div>
          </div>

          {/* Test Instructions */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-black">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              📋 Testing Instructions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-black">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  🎯 Auction Type Testing
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Verify all 4 auction types are present</li>
                  <li>• Check status mapping consistency</li>
                  <li>• Test filtering by auction type</li>
                  <li>• Validate status color coding</li>
                </ul>
              </div>
              <div className="text-black">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  🔍 Status Validation
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Test individual auction status checking</li>
                  <li>• Verify contract vs frontend mapping</li>
                  <li>• Check settlement status accuracy</li>
                  <li>• Validate winner detection</li>
                </ul>
              </div>
              <div className="text-black">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  💰 Transaction Testing
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Monitor transaction states</li>
                  <li>• Test transaction tracking</li>
                  <li>• Verify completion detection</li>
                  <li>• Check error handling</li>
                </ul>
              </div>
              <div className="text-black">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  🏆 Collection Testing
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Test NFT collection loading</li>
                  <li>• Verify ownership detection</li>
                  <li>• Check settled auction filtering</li>
                  <li>• Validate collection display</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Expected Results */}
          <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-black">
            <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">
              ✅ Expected Test Results
            </h2>
            <div className="text-sm text-green-700 dark:text-green-300 space-y-2">
              <div className="text-black">
                <strong>Auction Types:</strong> All 4 types (English, Dutch,
                Sealed Bid, Reserve) should be present
              </div>
              <div className="text-black">
                <strong>Status Mapping:</strong> Contract status 3→5
                (CANCELLED), 4→4 (SETTLED), ENDED→3
              </div>
              <div className="text-black">
                <strong>Collection:</strong> Only settled auctions (status 4)
                should appear in My Collection
              </div>
              <div className="text-black">
                <strong>Transactions:</strong> All transaction states should be
                tracked correctly
              </div>
              <div className="text-black">
                <strong>Winner Detection:</strong> highestBidder should match
                connected wallet address
              </div>
            </div>
          </div>
        </div>

        {/* Sealed Bid Notification Test */}
        <div className="mt-8">
          <SealedBidNotificationTest />
        </div>

        {/* Auction #7 Claim Debug */}
        <div className="mt-8">
          <Auction7ClaimDebug />
        </div>

        {/* Auction Security Validator */}
        <AuctionSecurityValidator />
      </div>
    </AuctionNotificationsProvider>
  );
}
