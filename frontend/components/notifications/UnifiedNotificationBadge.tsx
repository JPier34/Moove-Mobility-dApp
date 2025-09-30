"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Gift } from "lucide-react";
import { useAuctionNotifications } from "@/providers/AuctionNotificationsProvider";
import { useNFTTransferNotifications } from "@/providers/NFTTransferNotificationsProvider";
import AuctionNotificationsPanel from "./AuctionNotificationsPanel";
import NFTTransferNotificationsPanel from "./NFTTransferNotificationsPanel";
import UnifiedAuctionNotificationsPanel from "./UnifiedAuctionNotificationsPanel";

export default function UnifiedNotificationBadge() {
  const {
    hasUnsettledAuctions,
    unsettledCount: auctionCount,
    showNotifications: showAuctionNotifications,
    setShowNotifications: setShowAuctionNotifications,
    unsettledAuctions,
    handleSettleAuction,
    isSettling,
  } = useAuctionNotifications();

  const { notifications: transferNotifications, unreadCount: transferCount } =
    useNFTTransferNotifications();

  const [showPanel, setShowPanel] = useState(false);
  const [showTransferPanel, setShowTransferPanel] = useState(false);
  const [showUnifiedPanel, setShowUnifiedPanel] = useState(false);

  // Calcola il totale delle notifiche (includi le notifiche unificate e la queue)
  const unreadCount = auctionCount;
  const queueCount = auctionCount;
  const totalNotifications =
    auctionCount + transferCount + unreadCount + queueCount;
  const hasNotifications =
    hasUnsettledAuctions ||
    transferCount > 0 ||
    unreadCount > 0 ||
    queueCount > 0;

  // Debug logging
  console.log("🔔 UnifiedNotificationBadge debug:", {
    hasUnsettledAuctions,
    auctionCount,
    transferCount,
    unreadCount,
    queueCount,
    totalNotifications,
    showAuctionNotifications,
    unsettledAuctionsLength: unsettledAuctions.length,
    transferNotificationsLength: transferNotifications.length,
  });

  // Don't show if no notifications or auction notifications disabled
  if (!hasNotifications || !showAuctionNotifications) {
    console.log("🔔 UnifiedNotificationBadge not showing:", {
      hasNotifications,
      showAuctionNotifications,
    });
    return null;
  }

  // Determina l'icona e il colore basato sul tipo di notifica prevalente
  const hasAuctionNotifications = hasUnsettledAuctions;
  const hasTransferNotifications = transferCount > 0;
  const hasUnifiedNotifications = unreadCount > 0 || queueCount > 0;

  const showNextNotification = () => {
    console.log("Show next notification");
  };

  const getIconAndColor = () => {
    if (hasUnifiedNotifications) {
      // Priorità alle notifiche unificate (più recenti)
      return {
        icon: Bell,
        gradient: "from-purple-500 to-pink-600",
        pulseColor: "from-purple-500 to-pink-600",
      };
    } else if (hasAuctionNotifications && hasTransferNotifications) {
      // Entrambi i tipi di notifiche - usa icona mista
      return {
        icon: Bell,
        gradient: "from-purple-500 to-green-600",
        pulseColor: "from-purple-500 to-green-600",
      };
    } else if (hasAuctionNotifications) {
      // Solo aste - usa icona campana
      return {
        icon: Bell,
        gradient: "from-blue-500 to-purple-600",
        pulseColor: "from-blue-500 to-purple-600",
      };
    } else {
      // Solo trasferimenti - usa icona regalo
      return {
        icon: Gift,
        gradient: "from-green-500 to-blue-600",
        pulseColor: "from-green-500 to-blue-600",
      };
    }
  };

  const { icon: Icon, gradient, pulseColor } = getIconAndColor();

  return (
    <>
      {/* Unified Notification Badge */}
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
                console.log("🔔 UnifiedNotificationBadge clicked!");
                if (hasUnifiedNotifications) {
                  // Se ci sono notifiche in queue, mostra la prossima
                  if (queueCount > 0) {
                    showNextNotification();
                  }
                  setShowUnifiedPanel(true);
                } else if (hasAuctionNotifications) {
                  setShowPanel(true);
                } else if (hasTransferNotifications) {
                  setShowTransferPanel(true);
                }
              }}
              className={`relative bg-gradient-to-r ${gradient} text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 cursor-pointer pointer-events-auto`}
              style={{ zIndex: 99999 }}
            >
              <Icon className="w-6 h-6" />

              {/* Notification Count */}
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                {totalNotifications}
              </div>
            </button>

            {/* Pulse Effect */}
            <div
              className={`absolute inset-0 bg-gradient-to-r ${pulseColor} rounded-full animate-ping opacity-20`}
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Notifications Panel - Aste */}
      {hasAuctionNotifications && (
        <AuctionNotificationsPanel
          unsettledAuctions={unsettledAuctions}
          isOpen={showPanel}
          onClose={() => setShowPanel(false)}
          onSettleAuction={handleSettleAuction}
          isSettling={isSettling}
        />
      )}

      {/* Notifications Panel - NFT Transfer */}
      {hasTransferNotifications && (
        <NFTTransferNotificationsPanel
          isOpen={showTransferPanel}
          onClose={() => setShowTransferPanel(false)}
        />
      )}

      {/* Unified Auction Notifications Panel */}
      {hasUnifiedNotifications && (
        <UnifiedAuctionNotificationsPanel
          isOpen={showUnifiedPanel}
          onClose={() => setShowUnifiedPanel(false)}
        />
      )}
    </>
  );
}
