"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, CheckCircle, AlertCircle, Gift, Trophy } from "lucide-react";
import {
  useUnifiedAuctionNotifications,
  AuctionNotificationType,
} from "@/hooks/useUnifiedAuctionNotifications";

interface UnifiedAuctionNotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UnifiedAuctionNotificationsPanel({
  isOpen,
  onClose,
}: UnifiedAuctionNotificationsPanelProps) {
  const {
    notifications,
    notificationQueue,
    currentNotification,
    unreadCount,
    queueCount,
    showNextNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useUnifiedAuctionNotifications();

  const [selectedNotification, setSelectedNotification] = useState<
    string | null
  >(null);

  const getNotificationIcon = (type: AuctionNotificationType) => {
    switch (type) {
      case "dutch_purchase":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "sealed_bid_win":
      case "english_win":
      case "reserve_win":
        return <Trophy className="w-5 h-5 text-yellow-600" />;
      case "auction_failed":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "claim_ready":
        return <Gift className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationTitle = (type: AuctionNotificationType) => {
    switch (type) {
      case "dutch_purchase":
        return "Dutch Auction Purchased";
      case "sealed_bid_win":
        return "Sealed Bid Won";
      case "english_win":
        return "English Auction Won";
      case "reserve_win":
        return "Reserve Auction Won";
      case "auction_failed":
        return "Auction Failed";
      case "claim_ready":
        return "NFT Ready to Claim";
      default:
        return "Auction Update";
    }
  };

  const getNotificationColor = (type: AuctionNotificationType) => {
    switch (type) {
      case "dutch_purchase":
        return "border-green-200 bg-green-50 dark:bg-green-900/20";
      case "sealed_bid_win":
      case "english_win":
      case "reserve_win":
        return "border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20";
      case "auction_failed":
        return "border-red-200 bg-red-50 dark:bg-red-900/20";
      case "claim_ready":
        return "border-blue-200 bg-blue-50 dark:bg-blue-900/20";
      default:
        return "border-gray-200 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navigate to my collection
    onClose();
    window.location.href = "/my-collection";
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleRemoveNotification = (notificationId: string) => {
    removeNotification(notificationId);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Bell className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Auction Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
              {queueCount > 0 && (
                <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full ml-2">
                  {queueCount} in queue
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {queueCount > 0 && (
                <button
                  onClick={() => {
                    showNextNotification();
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full transition-colors"
                  title="Show next notification from queue"
                >
                  Next ({queueCount})
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[60vh]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No notifications yet
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  You'll see auction updates here
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-lg p-4 transition-all duration-200 ${
                      notification.isRead
                        ? "opacity-60"
                        : "shadow-md hover:shadow-lg"
                    } ${getNotificationColor(notification.type)}`}
                  >
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type)}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3
                            className={`text-sm font-semibold ${
                              notification.isRead
                                ? "text-gray-600 dark:text-gray-400"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {getNotificationTitle(notification.type)}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Auction #{notification.auctionId}
                          {notification.nftName && ` - ${notification.nftName}`}
                          {notification.price && ` (${notification.price} ETH)`}
                        </p>

                        {notification.source === "collection_check" && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Detected in your collection
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            title="Mark as read"
                          >
                            <CheckCircle className="w-4 h-4 text-gray-500" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleRemoveNotification(notification.id)
                          }
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          title="Remove notification"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <button
                        onClick={() => handleNotificationClick(notification)}
                        className="w-full text-sm bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors"
                      >
                        View Collection
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={markAllAsRead}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Mark all as read
              </button>
              <button
                onClick={() => {
                  onClose();
                  window.location.href = "/my-collection";
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <span>View Collection</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
