"use client";

import React from "react";
import { motion } from "framer-motion";
import { useAuctionCreationMonitor } from "@/hooks/useAuctionCreationMonitor";

export default function RealAuctionDataViewer() {
  const {
    auctions,
    isLoading,
    error,
    refresh,
    getAuctionTypeName,
    getStatusName,
    formatDuration,
  } = useAuctionCreationMonitor();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case 1:
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case 2:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case 3:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case 4:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case 5:
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getTypeEmoji = (type: number) => {
    switch (type) {
      case 0:
        return "⬆️";
      case 1:
        return "⬇️";
      case 2:
        return "🔒";
      case 3:
        return "🏛️";
      default:
        return "❓";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          📊 Real Auction Data from Contract
        </h2>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Loading...</span>
            </>
          ) : (
            <>
              <span>🔄</span>
              <span>Refresh</span>
            </>
          )}
        </button>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Dati reali delle aste dal contratto smart (ultimi 10)
      </p>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">❌</span>
            <span className="text-red-700 dark:text-red-400">
              Error: {error}
            </span>
          </div>
        </div>
      )}

      {isLoading && auctions.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading auction data...
          </p>
        </div>
      ) : auctions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">📭</div>
          <p className="text-gray-600 dark:text-gray-400">
            Nessuna asta trovata nel contratto
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {auctions.map((auction) => (
            <motion.div
              key={auction.auctionId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                    #{auction.auctionId}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      NFT Token #{auction.tokenId}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Created: {formatDate(auction.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      auction.status
                    )}`}
                  >
                    {getStatusName(auction.status)}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    {getTypeEmoji(auction.auctionType)}{" "}
                    {getAuctionTypeName(auction.auctionType)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Start Price:
                  </span>
                  <div className="font-mono font-medium">
                    {auction.startPrice} ETH
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Duration:
                  </span>
                  <div className="font-medium">
                    {formatDuration(auction.duration)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Bid Increment:
                  </span>
                  <div className="font-mono font-medium">
                    {auction.bidIncrement} ETH
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Seller:
                  </span>
                  <div className="font-mono text-xs">
                    {auction.seller.slice(0, 6)}...{auction.seller.slice(-4)}
                  </div>
                </div>
              </div>

              {/* Optional fields */}
              {(auction.reservePrice !== "0" ||
                auction.buyNowPrice !== "0") && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {auction.reservePrice !== "0" && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Reserve Price:
                        </span>
                        <div className="font-mono font-medium">
                          {auction.reservePrice} ETH
                        </div>
                      </div>
                    )}
                    {auction.buyNowPrice !== "0" && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Buy Now Price:
                        </span>
                        <div className="font-mono font-medium">
                          {auction.buyNowPrice} ETH
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Extension settings for English auctions */}
              {auction.auctionType === 0 &&
                (auction.extensionThreshold > 0 ||
                  auction.extensionDuration > 0) && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Extension Threshold:
                        </span>
                        <div className="font-medium">
                          {formatDuration(auction.extensionThreshold)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Extension Duration:
                        </span>
                        <div className="font-medium">
                          {formatDuration(auction.extensionDuration)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
