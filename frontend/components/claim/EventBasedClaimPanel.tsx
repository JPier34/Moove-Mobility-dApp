"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useEventBasedClaim } from "@/hooks/useEventBasedClaim";

export default function EventBasedClaimPanel() {
  const { claimableAuctions, loading, claimAuction, isPending, refetch } =
    useEventBasedClaim();

  const [showPanel, setShowPanel] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "claiming":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "claimed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "claiming":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "claimed":
        return "bg-green-50 border-green-200 text-green-800";
      case "failed":
        return "bg-red-50 border-red-200 text-red-800";
      default:
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "claiming":
        return "Processing...";
      case "claimed":
        return "Claimed";
      case "failed":
        return "Failed";
      default:
        return "Ready to Claim";
    }
  };

  if (loading) {
    return (
      <div className="fixed top-20 right-4 z-50">
        <div className="rounded-lg p-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (claimableAuctions.length === 0) {
    return null;
  }

  return (
    <>
      {/* Claim Panel Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed top-20 right-4 z-50"
      >
        <button
          onClick={() => setShowPanel(true)}
          className="relative bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <Trophy className="h-6 w-6" />
          {claimableAuctions.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold"
            >
              {claimableAuctions.length > 9 ? "9+" : claimableAuctions.length}
            </motion.span>
          )}

          {/* Pulse effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 opacity-20"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </button>
      </motion.div>

      {/* Claim Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPanel(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Claim Your NFTs
                  </h2>
                  {claimableAuctions.length > 0 && (
                    <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1">
                      {claimableAuctions.length}
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={refetch}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowPanel(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 max-h-96 overflow-y-auto">
                {claimableAuctions.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No auctions ready for claim
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {claimableAuctions.map((auction, index) => (
                      <motion.div
                        key={auction.auctionId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-lg border ${getStatusColor(
                          auction.claimStatus
                        )}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(auction.claimStatus)}
                            <div>
                              <h3 className="font-medium">
                                Auction #{auction.auctionId}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Amount: {auction.amount} ETH
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(
                                  auction.timestamp * 1000
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">
                              {getStatusText(auction.claimStatus)}
                            </span>

                            {auction.claimStatus === "pending" && (
                              <button
                                onClick={() => claimAuction(auction.auctionId)}
                                disabled={isPending}
                                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                              >
                                Claim
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Claim your won NFTs from completed auctions. Based on
                  blockchain events.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
