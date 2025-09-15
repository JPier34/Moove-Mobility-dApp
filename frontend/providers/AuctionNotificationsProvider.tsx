"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useWonAuctionsManager } from "@/hooks/useWonAuctionsManager";
import CongratulationsModal from "@/components/collection/CongratulationsModal";
import AuctionNotificationBanner from "@/components/notifications/AuctionNotificationBanner";
import AuctionNotificationsDebug from "@/components/debug/AuctionNotificationsDebug";
import { useAccount } from "wagmi";

// ============= CONTEXT =============

interface AuctionNotificationsContextType {
  hasUnsettledAuctions: boolean;
  unsettledCount: number;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
}

const AuctionNotificationsContext =
  createContext<AuctionNotificationsContextType | null>(null);

// ============= PROVIDER =============

interface AuctionNotificationsProviderProps {
  children: React.ReactNode;
}

export function AuctionNotificationsProvider({
  children,
}: AuctionNotificationsProviderProps) {
  const { address, isConnected } = useAccount();

  // Hook per gestire le aste vinte
  const {
    currentAuction,
    showCongratulations,
    isSettling,
    error: settleError,
    handleSettleAuction,
    handleCloseCongratulationsModal,
    unsettledAuctions,
  } = useWonAuctionsManager();

  // Stato per controllare se mostrare le notifiche
  const [showNotifications, setShowNotifications] = useState(true);

  // Stato per tracciare se l'utente ha già visto le notifiche
  const [hasSeenNotifications, setHasSeenNotifications] = useState(false);

  // Debug logging
  useEffect(() => {
    if (isConnected && address) {
      console.log("🔔 AuctionNotificationsProvider - User connected:", address);
      console.log("🔔 Unsettled auctions:", unsettledAuctions.length);
      console.log("🔔 Show congratulations:", showCongratulations);
    }
  }, [isConnected, address, unsettledAuctions.length, showCongratulations]);

  // Gestisci la chiusura del modal
  const handleCloseModal = () => {
    console.log("🔔 Closing congratulations modal");
    handleCloseCongratulationsModal();
    setHasSeenNotifications(true);
  };

  // Gestisci il settlement dell'asta
  const handleSettle = async (auctionId: string) => {
    console.log("🔔 Settling auction from global provider:", auctionId);
    await handleSettleAuction(auctionId);
  };

  // Reset delle notifiche quando l'utente si disconnette
  useEffect(() => {
    if (!isConnected) {
      setHasSeenNotifications(false);
      setShowNotifications(true);
    }
  }, [isConnected]);

  // Context value
  const contextValue: AuctionNotificationsContextType = {
    hasUnsettledAuctions: unsettledAuctions.length > 0,
    unsettledCount: unsettledAuctions.length,
    showNotifications,
    setShowNotifications,
  };

  return (
    <AuctionNotificationsContext.Provider value={contextValue}>
      {children}

      {/* Banner di notifica globale */}
      <AuctionNotificationBanner />

      {/* Debug component (development only) */}
      <AuctionNotificationsDebug />

      {/* Modal globale per le congratulazioni */}
      {isConnected && showNotifications && (
        <CongratulationsModal
          auction={currentAuction}
          isOpen={showCongratulations}
          onClose={handleCloseModal}
          onSettle={handleSettle}
          isSettling={isSettling}
        />
      )}
    </AuctionNotificationsContext.Provider>
  );
}

// ============= HOOK =============

export function useAuctionNotifications() {
  const context = useContext(AuctionNotificationsContext);
  if (!context) {
    throw new Error(
      "useAuctionNotifications must be used within AuctionNotificationsProvider"
    );
  }
  return context;
}

// ============= EXPORT =============

export default AuctionNotificationsProvider;
