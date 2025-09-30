"use client";

import { useAuctionDebug } from "../../hooks/useAuctionDebug";
import { useState } from "react";

export default function AuctionDebugPage() {
  const {
    debugResults,
    isLoading,
    error,
    analyzeAllAuctions,
    analyzeSingleAuction,
    checkNFTOwnershipForToken,
  } = useAuctionDebug();
  const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(
    null
  );
  const [selectedTokenId, setSelectedTokenId] = useState<string>("");

  const handleAnalyzeAll = () => {
    analyzeAllAuctions();
  };

  const handleAnalyzeSingle = () => {
    if (selectedAuctionId !== null) {
      analyzeSingleAuction(selectedAuctionId);
    }
  };

  const handleCheckOwnership = () => {
    if (selectedTokenId) {
      checkNFTOwnershipForToken(selectedTokenId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Analyzing auctions...
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
            Analysis Failed
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={handleAnalyzeAll}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  const claimableAuctions = debugResults.filter((r) => r.analysis.canBeClaimed);
  const wonAuctions = debugResults.filter((r) => r.analysis.hasValidWinner);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Auction Debug Analysis
            </h1>
            <button
              onClick={handleAnalyzeAll}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Analyze All Auctions
            </button>
          </div>

          {/* Summary */}
          {debugResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {debugResults.length}
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total Auctions
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  All auctions analyzed
                </div>
              </div>

              <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {wonAuctions.length}
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  Won Auctions
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Auctions won by user
                </div>
              </div>

              <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {claimableAuctions.length}
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  Claimable Auctions
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Ready to claim
                </div>
              </div>
            </div>
          )}

          {/* Individual Analysis */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Individual Analysis
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Auction ID
                </label>
                <input
                  type="number"
                  value={selectedAuctionId || ""}
                  onChange={(e) =>
                    setSelectedAuctionId(parseInt(e.target.value) || null)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter auction ID"
                />
                <button
                  onClick={handleAnalyzeSingle}
                  disabled={selectedAuctionId === null}
                  className="mt-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
                >
                  Analyze Auction
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Token ID
                </label>
                <input
                  type="text"
                  value={selectedTokenId}
                  onChange={(e) => setSelectedTokenId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter token ID"
                />
                <button
                  onClick={handleCheckOwnership}
                  disabled={!selectedTokenId}
                  className="mt-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
                >
                  Check Ownership
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {debugResults.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Analysis Results
              </h2>
              <div className="space-y-4">
                {debugResults.map((result) => (
                  <div
                    key={result.auctionId}
                    className={`border rounded-lg p-4 ${
                      result.analysis.canBeClaimed
                        ? "border-green-500 bg-green-50 dark:bg-green-900"
                        : result.analysis.hasValidWinner
                        ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Auction {result.auctionId}
                      </h3>
                      <div
                        className={`px-2 py-1 rounded text-sm font-medium ${
                          result.analysis.canBeClaimed
                            ? "bg-green-500 text-white"
                            : result.analysis.hasValidWinner
                            ? "bg-yellow-500 text-white"
                            : "bg-gray-500 text-white"
                        }`}
                      >
                        {result.analysis.canBeClaimed
                          ? "CLAIMABLE"
                          : result.analysis.hasValidWinner
                          ? "WON"
                          : "NOT WON"}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-700 dark:text-gray-300">
                          Contract Data:
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          <div>Status: {result.contractData.status}</div>
                          <div>
                            Is Settled:{" "}
                            {result.contractData.isSettled ? "Yes" : "No"}
                          </div>
                          <div>
                            Highest Bidder: {result.contractData.highestBidder}
                          </div>
                          <div>Token ID: {result.contractData.tokenId}</div>
                        </div>
                      </div>

                      <div>
                        <div className="font-medium text-gray-700 dark:text-gray-300">
                          Analysis:
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          <div>
                            Is Ended: {result.analysis.isEnded ? "Yes" : "No"}
                          </div>
                          <div>
                            Is Settled:{" "}
                            {result.analysis.isSettled ? "Yes" : "No"}
                          </div>
                          <div>
                            Is Time Expired:{" "}
                            {result.analysis.isTimeExpired ? "Yes" : "No"}
                          </div>
                          <div>
                            Has Valid Winner:{" "}
                            {result.analysis.hasValidWinner ? "Yes" : "No"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {result.analysis.claimRequirements.length > 0 && (
                      <div className="mt-2">
                        <div className="font-medium text-red-600 dark:text-red-400">
                          Claim Requirements:
                        </div>
                        <ul className="text-red-600 dark:text-red-400 text-sm">
                          {result.analysis.claimRequirements.map(
                            (req, index) => (
                              <li key={index}>• {req}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {debugResults.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Recommendations
              </h2>
              <div className="space-y-3">
                {claimableAuctions.length > 0 ? (
                  <div className="text-green-700 dark:text-green-300">
                    • <strong>Claimable Auctions Found:</strong> You have{" "}
                    {claimableAuctions.length} auction(s) ready to claim.
                  </div>
                ) : wonAuctions.length > 0 ? (
                  <div className="text-yellow-700 dark:text-yellow-300">
                    • <strong>Won Auctions Not Claimable:</strong> You have{" "}
                    {wonAuctions.length} won auction(s) but they cannot be
                    claimed yet. Check the requirements above.
                  </div>
                ) : (
                  <div className="text-gray-700 dark:text-gray-300">
                    • <strong>No Won Auctions:</strong> You don't have any won
                    auctions at the moment.
                  </div>
                )}
                <div className="text-blue-700 dark:text-blue-300">
                  • <strong>Next Steps:</strong> If you have claimable auctions,
                  try using the claim functionality in the my-collection page.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


