"use client";

import React from "react";
import { motion } from "framer-motion";

interface FailedAuctionHandlerProps {
  isHandlingFailedAuctions: boolean;
  processedFailedAuctions: number;
  onRefresh?: () => void;
}

export default function FailedAuctionHandler({
  isHandlingFailedAuctions,
  processedFailedAuctions,
  onRefresh,
}: FailedAuctionHandlerProps) {
  if (processedFailedAuctions === 0 && !isHandlingFailedAuctions) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {isHandlingFailedAuctions ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            ) : (
              <div className="h-6 w-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg
                  className="h-4 w-4 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {isHandlingFailedAuctions
                ? "Processing Failed Auctions..."
                : "Failed Auctions Handled"}
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {isHandlingFailedAuctions
                ? "Automatically assigning admin as winner for failed auctions"
                : `${processedFailedAuctions} failed auction${
                    processedFailedAuctions === 1 ? "" : "s"
                  } processed successfully`}
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isHandlingFailedAuctions}
            className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Refresh
          </button>
        )}
      </div>

      {isHandlingFailedAuctions && (
        <div className="mt-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 rounded-md p-3">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>What's happening:</strong> The system is automatically
              detecting auctions that ended without a valid winner and assigning
              the admin as the winner. This ensures that NFTs from failed
              auctions remain in the admin's collection.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}








































