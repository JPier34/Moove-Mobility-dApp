"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, ArrowRight, X, ExternalLink } from "lucide-react";
import { useNFTTransferNotifications } from "@/providers/NFTTransferNotificationsProvider";

interface NFTTransferNotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NFTTransferNotificationsPanel({
  isOpen,
  onClose,
}: NFTTransferNotificationsPanelProps) {
  const { notifications, markAsRead, markAllAsRead } =
    useNFTTransferNotifications();

  // Filter only received notifications
  const receivedNotifications = notifications.filter(
    (n) => n.type === "received" && !n.isRead
  );

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleViewOnEtherscan = (transactionHash: string) => {
    const etherscanUrl = `https://sepolia.etherscan.io/tx/${transactionHash}`;
    window.open(etherscanUrl, "_blank");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99998] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Gift className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  NFT Received
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {receivedNotifications.length} new NFT
                  {receivedNotifications.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {receivedNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Gift className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No new NFT notifications
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {receivedNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Gift className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {notification.tokenName}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <span>From:</span>
                            <span className="font-mono">
                              {notification.senderAddress?.slice(0, 6)}...
                              {notification.senderAddress?.slice(-4)}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span>Transaction:</span>
                            <button
                              onClick={() =>
                                handleViewOnEtherscan(
                                  notification.transactionHash
                                )
                              }
                              className="font-mono text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center space-x-1"
                            >
                              <span>
                                {notification.transactionHash.slice(0, 6)}...
                                {notification.transactionHash.slice(-4)}
                              </span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="ml-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {receivedNotifications.length > 0 && (
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleMarkAllAsRead}
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
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}











