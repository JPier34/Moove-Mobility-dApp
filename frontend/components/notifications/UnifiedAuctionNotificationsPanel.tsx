"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Trophy } from "lucide-react";
import { useAuctionNotifications } from "@/hooks/useAuctionNotifications";

interface UnifiedAuctionNotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UnifiedAuctionNotificationsPanel({
  isOpen,
  onClose,
}: UnifiedAuctionNotificationsPanelProps) {
  const {
    hasNewWins,
    newWinsCount,
    unreadCount,
    queueCount,
    showNextNotification,
  } = useAuctionNotifications();

  const [selectedNotification, setSelectedNotification] = useState<
    string | null
  >(null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Auction Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {hasNewWins ? (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                  <div className="flex items-center space-x-3">
                    <Trophy className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <div>
                      <h3 className="font-semibold text-green-800 dark:text-green-200">
                        New Auction Win!
                      </h3>
                      <p className="text-sm text-green-600 dark:text-green-300">
                        You have {newWinsCount} new auction win
                        {newWinsCount > 1 ? "s" : ""} ready to claim.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      showNextNotification();
                      onClose();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No new notifications</p>
                <p className="text-sm mt-2">
                  You'll see auction updates here when you win auctions.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
