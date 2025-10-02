"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  Clock,
  DollarSign,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import { useUnifiedNotifications } from "@/hooks/useUnifiedNotifications";

export default function UnifiedNotificationBadge() {
  const {
    notifications,
    loading,
    hasUnreadNotifications,
    unreadCount,
    markAsRead,
    dismissNotification,
    clearAllNotifications,
  } = useUnifiedNotifications();

  const [showPanel, setShowPanel] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "claim_ready":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "claimed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "refund":
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "claim_ready":
        return "bg-orange-50 border-orange-200 text-orange-800";
      case "claimed":
        return "bg-green-50 border-green-200 text-green-800";
      case "refund":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const handleClaimClick = (auctionId: string) => {
    // Mark as read and navigate to claim panel
    markAsRead(auctionId);
    // You can add navigation logic here if needed
    console.log(`🎯 Claim clicked for auction ${auctionId}`);
  };

  const handleViewTransaction = (transactionHash: string) => {
    const etherscanUrl = `https://sepolia.etherscan.io/tx/${transactionHash}`;
    window.open(etherscanUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!hasUnreadNotifications) {
    return null;
  }

  return (
    <>
      {/* Notification Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed top-4 right-4 z-50"
      >
        <button
          onClick={() => setShowPanel(true)}
          className="relative bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}

          {/* Pulse effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 opacity-20"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </button>
      </motion.div>

      {/* Notifications Panel */}
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
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      clearAllNotifications();
                      setShowPanel(false);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowPanel(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No notifications yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-3 rounded-lg border ${getNotificationColor(
                          notification.type
                        )}`}
                      >
                        <div className="flex items-start space-x-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {notification.message}
                            </p>
                            {notification.amount && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Amount: {notification.amount} ETH
                              </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(
                                notification.timestamp * 1000
                              ).toLocaleString()}
                            </p>

                            {/* Action buttons */}
                            <div className="flex space-x-2 mt-2">
                              {notification.type === "claim_ready" && (
                                <button
                                  onClick={() =>
                                    handleClaimClick(notification.auctionId)
                                  }
                                  className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded transition-colors"
                                >
                                  Claim NFT
                                </button>
                              )}
                              {notification.type === "claimed" &&
                                notification.transactionHash && (
                                  <button
                                    onClick={() =>
                                      handleViewTransaction(
                                        notification.transactionHash!
                                      )
                                    }
                                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors flex items-center space-x-1"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    <span>View TX</span>
                                  </button>
                                )}
                              {notification.type === "refund" &&
                                notification.transactionHash && (
                                  <button
                                    onClick={() =>
                                      handleViewTransaction(
                                        notification.transactionHash!
                                      )
                                    }
                                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors flex items-center space-x-1"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    <span>View TX</span>
                                  </button>
                                )}
                            </div>
                          </div>
                          <button
                            onClick={() => dismissNotification(notification.id)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                            title="Dismiss notification"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Notifications are based on blockchain events and update
                  automatically
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
