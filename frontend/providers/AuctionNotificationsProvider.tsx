"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useWonAuctionsManager } from "@/hooks/useWonAuctionsManager";
import CongratulationsModal from "@/components/collection/CongratulationsModal";
import UnifiedNotificationBadge from "@/components/notifications/UnifiedNotificationBadge";
import AuctionNotificationsDebug from "@/components/debug/AuctionNotificationsDebug";
import AuctionConfirmationModal from "@/components/notifications/AuctionConfirmationModal";
import AuctionResultModal from "@/components/notifications/AuctionResultModal";
import { useAccount } from "wagmi";
import { WonAuction } from "@/hooks/useWonAuctionsForClaim";

// ============= CONTEXT =============

interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
}

interface AuctionNotificationsContextType {
  hasUnsettledAuctions: boolean;
  unsettledCount: number;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  currentAuction: WonAuction | null;
  unsettledAuctions: WonAuction[];
  isSettling: boolean;
  transactionHash: string | null;
  isWaitingForConfirmation: boolean;
  handleSettleAuction: (auctionId: string, auction: WonAuction) => void;
  // New 3-phase system states
  showConfirmationModal: boolean;
  showResultModal: boolean;
  selectedAuction: WonAuction | null;
  transactionResult: TransactionResult | null;
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

  // ID unique to track the provider instances
  const providerId = React.useMemo(
    () => Math.random().toString(36).substr(2, 9),
    []
  );

  // Use original simple modal management (no complex event system)
  const {
    unsettledAuctions,
    currentAuction,
    showCongratulations,
    isSettling,
    handleSettleAuction: originalSettleAuction,
    handleCloseCongratulationsModal,
  } = useWonAuctionsManager();

  // Simple transaction tracking
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isWaitingForConfirmation, setIsWaitingForConfirmation] =
    useState(false);

  // New 3-phase system states
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<WonAuction | null>(
    null
  );
  const [transactionResult, setTransactionResult] =
    useState<TransactionResult | null>(null);

  // Stato per controllare se mostrare le notifiche
  const [showNotifications, setShowNotifications] = useState(true);

  // Stato per tracciare se l'utente ha già visto le notifiche
  const [hasSeenNotifications, setHasSeenNotifications] = useState(false);

  // Debug logging (solo quando cambia l'indirizzo o il numero di aste)
  useEffect(() => {
    if (isConnected && address && unsettledAuctions.length > 0) {
      console.log(
        `🔔 [${providerId}] User connected: ${address}, Unsettled auctions: ${unsettledAuctions.length}`
      );
    }
  }, [isConnected, address, unsettledAuctions.length, providerId]);

  // Gestisci la chiusura del modal
  const handleCloseModal = () => {
    console.log(`🔔 [${providerId}] Closing congratulations modal`);
    handleCloseCongratulationsModal();
    setHasSeenNotifications(true);
  };

  // New 3-phase settlement system
  const handleSettleAuction = (auctionId: string, auction: WonAuction) => {
    console.log(
      `🔔 [${providerId}] Starting 3-phase settlement for auction:`,
      auctionId,
      "with auction data:",
      auction
    );

    // Phase 1: Show confirmation modal with the complete auction data
    setSelectedAuction(auction);
    setShowConfirmationModal(true);
  };

  const processSettlement = async () => {
    if (!selectedAuction) return;

    console.log(
      `🔔 [${providerId}] Processing settlement for auction:`,
      selectedAuction.auctionId
    );

    setShowConfirmationModal(false);
    setIsWaitingForConfirmation(true);

    try {
      // Phase 2: Execute the actual settlement (non-async, just triggers transaction)
      originalSettleAuction(selectedAuction.auctionId);

      // Don't show result modal immediately - wait for transaction confirmation
      // The result modal will be shown when we receive the transaction confirmation event
      console.log(
        `🔔 [${providerId}] Settlement transaction initiated, waiting for confirmation...`
      );
    } catch (error) {
      console.error(`❌ [${providerId}] Settlement failed:`, error);

      // Phase 3: Show error result immediately for errors
      setTransactionResult({
        success: false,
        error: error instanceof Error ? error.message : "Transaction failed",
      });
      setShowResultModal(true);
      setIsWaitingForConfirmation(false);
    }
  };

  const handleCloseConfirmationModal = () => {
    setShowConfirmationModal(false);
    setSelectedAuction(null);
  };

  const handleCloseResultModal = () => {
    setShowResultModal(false);
    setSelectedAuction(null);
    setTransactionResult(null);
  };

  // Wrapper for CongratulationsModal compatibility
  const handleSettleAuctionWrapper = (auctionId: string) => {
    const auction = unsettledAuctions.find((a) => a.auctionId === auctionId);
    if (auction) {
      handleSettleAuction(auctionId, auction);
    }
  };

  // Listen for transaction confirmation events
  useEffect(() => {
    const handleTransactionEvent = (event: CustomEvent) => {
      const { type, hash, auctionId } = event.detail;

      if (
        type === "transaction_confirmed" &&
        selectedAuction?.auctionId === auctionId
      ) {
        console.log(
          `✅ [${providerId}] Transaction confirmed for auction ${auctionId}:`,
          hash
        );

        // Phase 3: Show result modal after transaction confirmation
        setTransactionResult({
          success: true,
          hash: hash,
        });
        setShowResultModal(true);
        setIsWaitingForConfirmation(false);
      } else if (
        type === "transaction_sent" &&
        selectedAuction?.auctionId === auctionId
      ) {
        console.log(
          `📤 [${providerId}] Transaction sent for auction ${auctionId}:`,
          hash
        );
        // Keep waiting for confirmation
      }
    };

    window.addEventListener(
      "settleAuctionEvent",
      handleTransactionEvent as EventListener
    );

    return () => {
      window.removeEventListener(
        "settleAuctionEvent",
        handleTransactionEvent as EventListener
      );
    };
  }, [selectedAuction, providerId]);

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
    currentAuction,
    unsettledAuctions,
    isSettling,
    transactionHash,
    isWaitingForConfirmation,
    handleSettleAuction,
    // New 3-phase system states
    showConfirmationModal,
    showResultModal,
    selectedAuction,
    transactionResult,
  };

  return (
    <AuctionNotificationsContext.Provider value={contextValue}>
      {children}

      {/* Unified Notification Badge - Moved to SimplifiedAppProvider */}

      {/* Debug component (development only) */}
      <AuctionNotificationsDebug />

      {/* Global Modal */}
      <CongratulationsModal
        auction={currentAuction}
        isOpen={showCongratulations}
        onClose={handleCloseModal}
        onSettle={handleSettleAuctionWrapper}
        isSettling={isSettling}
        transactionHash={transactionHash}
        isWaitingForConfirmation={isWaitingForConfirmation}
      />

      {/* New 3-phase system modals */}
      <AuctionConfirmationModal
        isOpen={showConfirmationModal}
        onClose={handleCloseConfirmationModal}
        onConfirm={processSettlement}
        auction={selectedAuction}
        isProcessing={isWaitingForConfirmation}
      />

      <AuctionResultModal
        isOpen={showResultModal}
        onClose={handleCloseResultModal}
        auction={selectedAuction}
        result={transactionResult}
      />
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
