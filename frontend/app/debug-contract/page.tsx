"use client";

import { useContractVerification } from "../../hooks/useContractVerification";
import { useState } from "react";

export default function ContractDebugPage() {
  const { debugInfo, isLoading, error, verifyContract } =
    useContractVerification();
  const [showDetails, setShowDetails] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Verifying contract...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Contract Verification Failed
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={verifyContract}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Retry Verification
          </button>
        </div>
      </div>
    );
  }

  if (!debugInfo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No Debug Info Available
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please connect your wallet to verify the contract.
          </p>
        </div>
      </div>
    );
  }

  const corruptionRate =
    debugInfo.eventAnalysis.totalEvents > 0
      ? (debugInfo.eventAnalysis.corruptedEvents /
          debugInfo.eventAnalysis.totalEvents) *
        100
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Contract Debug Analysis
            </h1>
            <button
              onClick={verifyContract}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Refresh Analysis
            </button>
          </div>

          {/* Contract Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div
              className={`p-4 rounded-lg ${
                debugInfo.isVerified
                  ? "bg-green-100 dark:bg-green-900"
                  : "bg-red-100 dark:bg-red-900"
              }`}
            >
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {debugInfo.isVerified ? "✅" : "❌"}
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                Contract Status
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {debugInfo.isVerified ? "Valid" : "Issues Detected"}
              </div>
            </div>

            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {debugInfo.eventAnalysis.totalEvents}
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                Contract Events
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                BidPlaced events via contract query
              </div>
            </div>

            <div
              className={`p-4 rounded-lg ${
                corruptionRate > 0
                  ? "bg-red-100 dark:bg-red-900"
                  : "bg-green-100 dark:bg-green-900"
              }`}
            >
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {corruptionRate.toFixed(1)}%
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                Corruption Rate
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {debugInfo.eventAnalysis.corruptedEvents} corrupted events
              </div>
            </div>

            <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {debugInfo.eventAnalysis.additionalInfo.rawLogCount}
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                Raw Logs
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                All logs from contract address
              </div>
            </div>
          </div>

          {/* Issues */}
          {debugInfo.issues.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Contract Issues
              </h2>
              <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <ul className="space-y-2">
                  {debugInfo.issues.map((issue, index) => (
                    <li key={index} className="text-red-700 dark:text-red-300">
                      • {issue}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Event Details */}
          {debugInfo.eventAnalysis.additionalInfo.eventDetails.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Event Details Analysis
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="space-y-4">
                  {debugInfo.eventAnalysis.additionalInfo.eventDetails.map(
                    (event, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                              Auction ID
                            </div>
                            <div className="text-sm text-gray-900 dark:text-white font-mono">
                              {event.auctionId}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                              Bidder
                            </div>
                            <div className="text-sm text-gray-900 dark:text-white font-mono">
                              {event.bidder}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                              Amount (Wei)
                            </div>
                            <div className="text-sm text-gray-900 dark:text-white font-mono">
                              {event.amount}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                              Is Highest Bid
                            </div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {event.isHighestBid ? "✅ Yes" : "❌ No"}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                              Transaction Hash
                            </div>
                            <div className="text-sm text-gray-900 dark:text-white font-mono">
                              {event.transactionHash}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                              Block Number
                            </div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {event.blockNumber}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Corruption Patterns */}
          {debugInfo.eventAnalysis.corruptedEvents > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Corruption Patterns Detected
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    Invalid Auction IDs
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {
                      debugInfo.eventAnalysis.corruptionPatterns
                        .invalidAuctionIds.length
                    }{" "}
                    found
                  </div>
                  {debugInfo.eventAnalysis.corruptionPatterns.invalidAuctionIds
                    .length > 0 && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Examples:{" "}
                      {debugInfo.eventAnalysis.corruptionPatterns.invalidAuctionIds
                        .slice(0, 3)
                        .join(", ")}
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    Invalid Bidders
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {
                      debugInfo.eventAnalysis.corruptionPatterns.invalidBidders
                        .length
                    }{" "}
                    found
                  </div>
                  {debugInfo.eventAnalysis.corruptionPatterns.invalidBidders
                    .length > 0 && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Pattern:{" "}
                      {
                        debugInfo.eventAnalysis.corruptionPatterns
                          .invalidBidders[0]
                      }
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    Zero Values
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {
                      debugInfo.eventAnalysis.corruptionPatterns.zeroValues
                        .length
                    }{" "}
                    found
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Events with 0 ETH value
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contract Info */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Contract Information
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Address
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white font-mono">
                    {debugInfo.contractInfo.address}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Code Hash
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white font-mono">
                    {debugInfo.contractInfo.codeHash.slice(0, 20)}...
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Recommendations
            </h2>
            <div className="space-y-3">
              {!debugInfo.isVerified && (
                <div className="text-blue-700 dark:text-blue-300">
                  • <strong>Contract Issues Detected:</strong> The deployed
                  contract has issues that need to be addressed.
                </div>
              )}
              {debugInfo.eventAnalysis.corruptedEvents > 0 && (
                <div className="text-blue-700 dark:text-blue-300">
                  • <strong>Data Corruption:</strong> The contract is emitting
                  corrupted events. This suggests a bug in the contract
                  implementation.
                </div>
              )}
              <div className="text-blue-700 dark:text-blue-300">
                • <strong>Contract Redeployment:</strong> Consider redeploying
                the contract with the correct implementation.
              </div>
              <div className="text-blue-700 dark:text-blue-300">
                • <strong>Frontend Filtering:</strong> Implement robust data
                validation in the frontend to handle corrupted data.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
