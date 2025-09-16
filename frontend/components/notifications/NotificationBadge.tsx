"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { useAuctionNotifications } from "@/providers/AuctionNotificationsProvider";
import AuctionNotificationsPanel from "./AuctionNotificationsPanel";

export default function NotificationBadge() {
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

  // Debug logging
  console.log("🔔 NotificationBadge debug:", {
    hasUnsettledAuctions,
    unsettledCount,
    showNotifications,
    unsettledAuctionsLength: unsettledAuctions.length,
    unsettledAuctions: unsettledAuctions.map((a) => ({
      auctionId: a.auctionId,
      nftId: a.nftId,
      name: a.name,
      status: a.status,
      isSettled: a.isSettled,
    })),
  });

  // Don't show if no unsettled auctions or notifications disabled
  if (!hasUnsettledAuctions || !showNotifications) {
    console.log("🔔 NotificationBadge not showing:", {
      hasUnsettledAuctions,
      showNotifications,
    });
    return null;
  }

  return (
    <>
      {/* Notification Badge */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="fixed top-20 right-4 z-[99999]"
        >
          <div className="relative">
            {/* Badge */}
            <button
              onClick={() => {
                console.log("🔔 NotificationBadge clicked!");
                setShowPanel(true);
              }}
              className="relative bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 cursor-pointer pointer-events-auto"
              style={{ zIndex: 99999 }}
            >
              <Bell className="w-6 h-6" />

              {/* Notification Count */}
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                {unsettledCount}
              </div>
            </button>

            {/* Pulse Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-ping opacity-20" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Notifications Panel */}
      <AuctionNotificationsPanel
        unsettledAuctions={unsettledAuctions}
        isOpen={showPanel}
        onClose={() => setShowPanel(false)}
        onSettleAuction={handleSettleAuction}
        isSettling={isSettling}
      />
    </>
  );
}
