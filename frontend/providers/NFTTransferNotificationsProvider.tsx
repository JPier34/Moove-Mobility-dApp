"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Gift, ArrowRight } from "lucide-react";
import NFTReceivedNotification from "@/components/notifications/NFTReceivedNotification";
import TransferStatusIndicator from "@/components/TransferStatusIndicator";
import TransferConfirmationHandler from "@/components/TransferConfirmationHandler";

// ============= TYPES =============

interface NFTTransferNotification {
  id: string;
  type: "sent" | "received";
  tokenId: string;
  tokenName: string;
  tokenImage?: string;
  recipientAddress?: string;
  senderAddress?: string;
  transactionHash: string;
  timestamp: number;
  isRead: boolean;
}

interface NFTTransferState {
  // Transfer in progress
  isTransferring: boolean;
  isTransferConfirmed: boolean; // Nuovo stato per distinguere conferma
  isTransactionPending: boolean; // Nuovo stato per tracciare transazione in corso
  transferTokenId: string | null;
  transferRecipient: string | null;
  transferTransactionHash: string | null;

  // Notifications
  notifications: NFTTransferNotification[];
  unreadCount: number;

  // Modal states
  showTransferConfirmation: boolean;
  showTransferSuccess: boolean;
  showReceivedNotification: boolean;
}

interface NFTTransferContextType extends NFTTransferState {
  // Transfer actions
  startTransfer: (tokenId: string, recipient: string) => void;
  confirmTransfer: () => void;
  cancelTransfer: () => void;
  completeTransfer: (transactionHash: string) => void;
  failTransfer: (error: string) => void;

  // Notification actions
  addNotification: (
    notification: Omit<NFTTransferNotification, "id" | "timestamp" | "isRead">
  ) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;

  // Modal actions
  closeTransferConfirmation: () => void;
  closeTransferSuccess: () => void;
  closeReceivedNotification: () => void;
}

// ============= CONTEXT =============

const NFTTransferContext = createContext<NFTTransferContextType | undefined>(
  undefined
);

// ============= PROVIDER =============

interface NFTTransferNotificationsProviderProps {
  children: ReactNode;
}

export function NFTTransferNotificationsProvider({
  children,
}: NFTTransferNotificationsProviderProps) {
  const { address, isConnected } = useAccount();

  const [state, setState] = useState<NFTTransferState>({
    isTransferring: false,
    isTransferConfirmed: false,
    isTransactionPending: false,
    transferTokenId: null,
    transferRecipient: null,
    transferTransactionHash: null,
    notifications: [],
    unreadCount: 0,
    showTransferConfirmation: false,
    showTransferSuccess: false,
    showReceivedNotification: false,
  });

  // ============= TRANSFER ACTIONS =============

  const startTransfer = (tokenId: string, recipient: string) => {
    setState((prev) => ({
      ...prev,
      isTransferring: true,
      isTransferConfirmed: false, // Non confermato ancora
      transferTokenId: tokenId,
      transferRecipient: recipient,
      showTransferConfirmation: true,
    }));
  };

  const confirmTransfer = () => {
    setState((prev) => ({
      ...prev,
      isTransferConfirmed: true, // Ora è confermato!
      isTransactionPending: true, // Transazione in corso
      showTransferConfirmation: false,
    }));
  };

  const cancelTransfer = () => {
    setState((prev) => ({
      ...prev,
      isTransferring: false,
      isTransferConfirmed: false,
      isTransactionPending: false,
      transferTokenId: null,
      transferRecipient: null,
      transferTransactionHash: null,
      showTransferConfirmation: false,
      showTransferSuccess: false,
    }));
  };

  const completeTransfer = (transactionHash: string) => {
    if (!state.transferTokenId || !state.transferRecipient) return;

    // Add sent notification
    addNotification({
      type: "sent",
      tokenId: state.transferTokenId,
      tokenName: `NFT #${state.transferTokenId}`, // Will be updated with real name
      transactionHash,
      recipientAddress: state.transferRecipient,
    });

    setState((prev) => ({
      ...prev,
      isTransferring: false,
      isTransferConfirmed: false,
      isTransactionPending: false,
      transferTransactionHash: transactionHash,
      showTransferSuccess: true,
    }));

    // Show success toast
    toast.success("NFT transferred successfully!", {
      duration: 5000,
    });

    // Emit event for other components
    window.dispatchEvent(
      new CustomEvent("nftTransferSent", {
        detail: {
          tokenId: state.transferTokenId,
          recipient: state.transferRecipient,
          transactionHash,
        },
      })
    );
  };

  const failTransfer = (error: string) => {
    setState((prev) => ({
      ...prev,
      isTransferring: false,
      isTransferConfirmed: false,
      isTransactionPending: false,
      transferTokenId: null,
      transferRecipient: null,
      transferTransactionHash: null,
      showTransferConfirmation: false,
      showTransferSuccess: false,
    }));

    toast.error(`Transfer failed: ${error}`, {
      duration: 5000,
    });
  };

  // ============= NOTIFICATION ACTIONS =============

  const addNotification = (
    notification: Omit<NFTTransferNotification, "id" | "timestamp" | "isRead">
  ) => {
    const newNotification: NFTTransferNotification = {
      ...notification,
      id: `nft-transfer-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      timestamp: Date.now(),
      isRead: false,
    };

    setState((prev) => ({
      ...prev,
      notifications: [newNotification, ...prev.notifications],
      unreadCount: prev.unreadCount + 1,
    }));

    // Show received notification modal if it's a received NFT
    if (notification.type === "received") {
      setState((prev) => ({
        ...prev,
        showReceivedNotification: true,
      }));
    }
  };

  const markAsRead = (notificationId: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, prev.unreadCount - 1),
    }));
  };

  const markAllAsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  };

  const clearNotifications = () => {
    setState((prev) => ({
      ...prev,
      notifications: [],
      unreadCount: 0,
    }));
  };

  // ============= MODAL ACTIONS =============

  const closeTransferConfirmation = () => {
    setState((prev) => ({
      ...prev,
      showTransferConfirmation: false,
    }));
  };

  const closeTransferSuccess = () => {
    setState((prev) => ({
      ...prev,
      showTransferSuccess: false,
      transferTokenId: null,
      transferRecipient: null,
      transferTransactionHash: null,
    }));
  };

  const closeReceivedNotification = () => {
    setState((prev) => ({
      ...prev,
      showReceivedNotification: false,
    }));
  };

  // ============= EVENT LISTENERS =============

  // Listener per eventi di trasferimento NFT
  useEffect(() => {
    if (!address) return;

    const handleNFTTransfer = (event: CustomEvent) => {
      const { tokenId, from, to, transactionHash } = event.detail;

      console.log(`📡 Received NFT transfer event:`, {
        tokenId,
        from,
        to,
        transactionHash,
        currentUser: address,
      });

      // Se l'NFT è stato trasferito al current user
      if (to.toLowerCase() === address.toLowerCase()) {
        console.log(`🎉 NFT ${tokenId} received by current user`);

        // Aggiungi notifica di ricevuta
        addNotification({
          type: "received",
          tokenId,
          tokenName: `NFT #${tokenId}`,
          transactionHash,
          senderAddress: from,
        });

        // Emetti evento per notificare altri componenti
        window.dispatchEvent(
          new CustomEvent("nftTransferReceived", {
            detail: {
              tokenId,
              sender: from,
              transactionHash,
            },
          })
        );
      }
    };

    // Aggiungi listener
    window.addEventListener("nftTransfer", handleNFTTransfer as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener(
        "nftTransfer",
        handleNFTTransfer as EventListener
      );
    };
  }, [address, addNotification]);

  // Reset state when user disconnects
  useEffect(() => {
    if (!isConnected) {
      setState({
        isTransferring: false,
        transferTokenId: null,
        transferRecipient: null,
        transferTransactionHash: null,
        notifications: [],
        unreadCount: 0,
        showTransferConfirmation: false,
        showTransferSuccess: false,
        showReceivedNotification: false,
        isTransferConfirmed: false,
        isTransactionPending: false,
      });
    }
  }, [isConnected]);

  // ============= CONTEXT VALUE =============

  const contextValue: NFTTransferContextType = {
    ...state,
    startTransfer,
    confirmTransfer,
    cancelTransfer,
    completeTransfer,
    failTransfer,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    closeTransferConfirmation,
    closeTransferSuccess,
    closeReceivedNotification,
  };

  return (
    <NFTTransferContext.Provider value={contextValue}>
      {children}

      {/* Transfer Confirmation Modal */}
      <TransferConfirmationModal />

      {/* Transfer Success Modal */}
      <TransferSuccessModal />

      {/* Received Notification Modal */}
      <ReceivedNotificationModal />

      {/* Notification Badge - Now handled by UnifiedNotificationBadge */}

      {/* NFT Received Notification */}
      <NFTReceivedNotification />

      {/* Transfer Status Indicator */}
      <TransferStatusIndicator />

      {/* Transfer Confirmation Handler */}
      <TransferConfirmationHandler />
    </NFTTransferContext.Provider>
  );
}

// ============= HOOK =============

export function useNFTTransferNotifications() {
  const context = useContext(NFTTransferContext);
  if (context === undefined) {
    throw new Error(
      "useNFTTransferNotifications must be used within a NFTTransferNotificationsProvider"
    );
  }
  return context;
}

// ============= MODAL COMPONENTS =============

function TransferConfirmationModal() {
  const {
    showTransferConfirmation,
    transferTokenId,
    transferRecipient,
    isTransactionPending,
    closeTransferConfirmation,
    confirmTransfer,
    cancelTransfer,
  } = useNFTTransferNotifications();

  if (!showTransferConfirmation || !transferTokenId || !transferRecipient)
    return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={closeTransferConfirmation}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4"
        >
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 mb-4">
                <ArrowRight className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm Transfer
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Are you sure you want to transfer NFT #{transferTokenId}?
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  To:
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                  {transferRecipient.slice(0, 6)}...
                  {transferRecipient.slice(-4)}
                </span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={cancelTransfer}
                disabled={isTransactionPending}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isTransactionPending
                    ? "text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                    : "text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmTransfer();
                  // Il TransferConfirmationHandler gestirà l'esecuzione
                }}
                disabled={isTransactionPending}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isTransactionPending
                    ? "text-white bg-purple-400 cursor-not-allowed"
                    : "text-white bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {isTransactionPending ? "Processing..." : "Confirm Transfer"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function TransferSuccessModal() {
  const {
    showTransferSuccess,
    transferTokenId,
    transferRecipient,
    transferTransactionHash,
    closeTransferSuccess,
  } = useNFTTransferNotifications();

  if (!showTransferSuccess || !transferTokenId || !transferRecipient)
    return null;

  const copyTransactionHash = () => {
    if (transferTransactionHash) {
      navigator.clipboard.writeText(transferTransactionHash);
      toast.success("Transaction hash copied to clipboard!");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={closeTransferSuccess}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4"
        >
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Transfer Successful!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                NFT #{transferTokenId} has been transferred successfully.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  To:
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                  {transferRecipient.slice(0, 6)}...
                  {transferRecipient.slice(-4)}
                </span>
              </div>
              {transferTransactionHash && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Transaction:
                  </span>
                  <button
                    onClick={copyTransactionHash}
                    className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-mono"
                  >
                    {transferTransactionHash.slice(0, 6)}...
                    {transferTransactionHash.slice(-4)}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={closeTransferSuccess}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function ReceivedNotificationModal() {
  const {
    showReceivedNotification,
    notifications,
    closeReceivedNotification,
    markAsRead,
  } = useNFTTransferNotifications();

  const latestReceivedNotification = notifications.find(
    (n) => n.type === "received" && !n.isRead
  );

  if (!showReceivedNotification || !latestReceivedNotification) return null;

  const handleClose = () => {
    markAsRead(latestReceivedNotification.id);
    closeReceivedNotification();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4"
        >
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                <Gift className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                NFT Received!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                You have received {latestReceivedNotification.tokenName}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  From:
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                  {latestReceivedNotification.senderAddress?.slice(0, 6)}...
                  {latestReceivedNotification.senderAddress?.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Transaction:
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                  {latestReceivedNotification.transactionHash.slice(0, 6)}...
                  {latestReceivedNotification.transactionHash.slice(-4)}
                </span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              View in Collection
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// NFTTransferNotificationBadge function removed - now handled by UnifiedNotificationBadge
