"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X, Bell } from "lucide-react";
import { useAuctionNotifications } from "@/providers/AuctionNotificationsProvider";
import AuctionNotificationsPanel from "./AuctionNotificationsPanel";

interface AuctionNotificationBannerProps {
  className?: string;
}

export default function AuctionNotificationBanner({
  className = "",
}: AuctionNotificationBannerProps) {
  const {
    hasUnsettledAuctions,
    unsettledCount,
    showNotifications,
    setShowNotifications,
    unsettledAuctions,
    handleSettleAuction,
    isSettling,
  } = useAuctionNotifications();

  const [showPanel, setShowPanel] = useState(false);

  // Non mostrare se non ci sono aste non settled o se le notifiche sono disabilitate
  if (!hasUnsettledAuctions || !showNotifications) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ type: "spring", duration: 0.5 }}
        onClick={() => {
          // Apri il pannello notifiche
          setShowPanel(true);
        }}
        className={`
                 fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999]
                 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500
                 text-white rounded-xl shadow-2xl border-2 border-white/20
                 backdrop-blur-sm cursor-pointer hover:scale-105 transition-transform
                 ${className}
               `}
      >
        <div className="flex items-center space-x-3 px-6 py-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <Bell size={24} className="text-white animate-pulse" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <Trophy size={20} className="text-yellow-200" />
              <span className="font-bold text-lg">
                🎉 You won {unsettledCount} auction
                {unsettledCount > 1 ? "s" : ""}!
                {unsettledCount > 1 && (
                  <span className="text-sm ml-2">
                    ({unsettledCount - 1} more in queue)
                  </span>
                )}
              </span>
            </div>
            <p className="text-sm text-white/90 mt-1">
              Click to view your NFT{unsettledCount > 1 ? "s" : ""} and claim
              them
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setShowNotifications(false)}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
            title="Dismiss notification"
          >
            <X size={20} />
          </button>
        </div>

        {/* Pulse effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 opacity-20 animate-pulse" />
      </motion.div>

      {/* Notifications Panel */}
      <AuctionNotificationsPanel
        unsettledAuctions={unsettledAuctions}
        isOpen={showPanel}
        onClose={() => setShowPanel(false)}
        onSettleAuction={handleSettleAuction}
        isSettling={isSettling}
      />
    </AnimatePresence>
  );
}
