"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, X, CheckCircle } from "lucide-react";
import { useAccount } from "wagmi";
import { useNFTTransferNotifications } from "@/providers/NFTTransferNotificationsProvider";

interface NFTReceivedNotificationProps {
  className?: string;
}

export default function NFTReceivedNotification({
  className = "",
}: NFTReceivedNotificationProps) {
  const { address } = useAccount();
  const { notifications, markAsRead } = useNFTTransferNotifications();
  const [showNotification, setShowNotification] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<any>(null);

  // Trova la notifica più recente di ricevuta non letta
  useEffect(() => {
    const latestReceivedNotification = notifications.find(
      (n) => n.type === "received" && !n.isRead
    );

    if (latestReceivedNotification) {
      setCurrentNotification(latestReceivedNotification);
      setShowNotification(true);
    }
  }, [notifications]);

  const handleClose = () => {
    if (currentNotification) {
      markAsRead(currentNotification.id);
    }
    setShowNotification(false);
    setCurrentNotification(null);
  };

  const handleViewCollection = () => {
    handleClose();
    // Navigate to collection page
    window.location.href = "/my-collection";
  };

  if (!showNotification || !currentNotification) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -100, scale: 0.8 }}
        transition={{ type: "spring", duration: 0.5 }}
        className={`fixed top-4 right-4 z-[99999] max-w-sm w-full ${className}`}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-blue-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Gift className="w-5 h-5" />
                <h3 className="font-semibold">NFT Received!</h3>
              </div>
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <Gift className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {currentNotification.tokenName}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  You received this NFT from{" "}
                  <span className="font-mono text-xs">
                    {currentNotification.senderAddress?.slice(0, 6)}...
                    {currentNotification.senderAddress?.slice(-4)}
                  </span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Transaction:{" "}
                  <span className="font-mono">
                    {currentNotification.transactionHash.slice(0, 8)}...
                    {currentNotification.transactionHash.slice(-6)}
                  </span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 mt-4">
              <button
                onClick={handleViewCollection}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1"
              >
                <CheckCircle className="w-4 h-4" />
                <span>View Collection</span>
              </button>
              <button
                onClick={handleClose}
                className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}








