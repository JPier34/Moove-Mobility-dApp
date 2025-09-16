"use client";

import React from "react";
import AuctionTypeTester from "@/components/debug/AuctionTypeTester";
import AuctionStatusChecker from "@/components/debug/AuctionStatusChecker";
import TransactionTrackerDebug from "@/components/debug/TransactionTrackerDebug";
import NFTCollectionChecker from "@/components/debug/NFTCollectionChecker";
import EnglishAuctionTester from "@/components/debug/EnglishAuctionTester";
import RoleChecker from "@/components/debug/RoleChecker";
import AllAuctionsDebug from "@/components/debug/AllAuctionsDebug";
// ModularValidationTester COMPLETELY REMOVED - was causing build errors

export default function DebugPage() {
  return (
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Role Checker - NEW */}
          <div className="lg:col-span-2">
            <RoleChecker />
          </div>

          {/* Modular Validation Tester - DISABLED */}
          <div className="lg:col-span-2">
            <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                ⚠️ Modular Validation Tester - Temporarily Disabled
              </h3>
              <p className="text-yellow-700">
                This component uses the old complex modular system that was
                causing React hooks errors. It will be rebuilt with the new
                simplified approach.
              </p>
            </div>
          </div>

          {/* English Auction Tester */}
          <div className="lg:col-span-2 text-black">
            <EnglishAuctionTester />
          </div>

          {/* Auction Type Tester */}
          <div className="lg:col-span-2 text-black">
            <AuctionTypeTester />
          </div>

          {/* Auction Status Checker */}
          <div className="text-black">
            <AuctionStatusChecker auctionId={0} />
          </div>

          {/* All Auctions Debug */}
          <div className="text-black">
            <AllAuctionsDebug />
          </div>

          {/* Transaction Tracker Debug */}
          <div className="text-black">
            <TransactionTrackerDebug />
          </div>

          {/* NFT Collection Checker */}
          <div className="lg:col-span-2 text-black">
            <NFTCollectionChecker
              tokenId={1}
              userAddress="0x777382955f33Bb8540602E914D9b650C962EF6Cc"
            />
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
              <strong>Status Mapping:</strong> Contract status 3→5 (CANCELLED),
              4→4 (SETTLED), ENDED→3
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
    </div>
  );
}
