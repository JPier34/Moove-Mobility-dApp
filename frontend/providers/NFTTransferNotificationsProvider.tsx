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
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from "../lib/contracts";
// import NFTReceivedNotification from "@/components/notifications/NFTReceivedNotification";
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

  // Test function
  testReceivedNotification: () => void;
  createReceivedNotification: (
    tokenId: string,
    tokenName: string,
    transactionHash: string,
    senderAddress: string
  ) => void;
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
    if (!state.transferTokenId || !state.transferRecipient) {
      console.log(
        "❌ completeTransfer: Missing transferTokenId or transferRecipient"
      );
      return;
    }

    console.log("🎉 completeTransfer: Setting showTransferSuccess to true", {
      transferTokenId: state.transferTokenId,
      transferRecipient: state.transferRecipient,
      transactionHash,
    });

    // NO NOTIFICATION FOR SENDER - Only show success toast
    setState((prev) => ({
      ...prev,
      isTransferring: false,
      isTransferConfirmed: false,
      isTransactionPending: false,
      transferTransactionHash: transactionHash,
      showTransferSuccess: true,
    }));

    // Show success toast (only for sender)
    toast.success("NFT transferred successfully!", {
      duration: 3000,
    });

    // Emit event for recipient notification
    const transferEvent = new CustomEvent("nftTransfer", {
      detail: {
        tokenId: state.transferTokenId,
        from: address, // Current user (sender)
        to: state.transferRecipient, // Recipient
        transactionHash,
      },
    });

    console.log(
      "📡 Emitting nftTransfer event for recipient:",
      transferEvent.detail
    );
    console.log("📡 Event will be received by:", state.transferRecipient);
    window.dispatchEvent(transferEvent);

    // Also emit the sent event for other components
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
    // Prevent duplicate notifications for the same NFT and transaction
    const existingNotification = state.notifications.find(
      (n) =>
        n.tokenId === notification.tokenId &&
        n.type === notification.type &&
        n.transactionHash === notification.transactionHash
    );

    if (existingNotification) {
      console.log(
        `⏭️ Notification already exists for NFT #${notification.tokenId} with tx ${notification.transactionHash}, skipping`
      );
      return;
    }

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
      notifications: [newNotification, ...prev.notifications.slice(0, 99)], // Limit to 100 notifications
      unreadCount: Math.min(prev.unreadCount + 1, 100), // Cap unread count
    }));

    // Show received notification modal if it's a received NFT
    if (notification.type === "received") {
      console.log(
        "🎁 Setting showReceivedNotification to true for NFT:",
        notification.tokenId
      );
      console.log("🎁 Current notifications:", state.notifications);
      setState((prev) => ({
        ...prev,
        showReceivedNotification: true,
      }));
      console.log("🎁 showReceivedNotification set to true");
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

    // Reload page after user closes the success modal
    // This ensures the collection is updated and the transferred NFT is removed
    console.log("🔄 Reloading page after NFT transfer success modal closed");
    setTimeout(() => {
      window.location.reload();
    }, 500); // Small delay to ensure modal closes smoothly
  };

  const closeReceivedNotification = () => {
    setState((prev) => ({
      ...prev,
      showReceivedNotification: false,
    }));
  };

  // Test function to manually trigger a received notification
  const testReceivedNotification = () => {
    console.log("🧪 Testing received notification");
    console.log("🧪 Current state before adding notification:", {
      showReceivedNotification: state.showReceivedNotification,
      notificationsCount: state.notifications.length,
    });

    addNotification({
      type: "received",
      tokenId: "999",
      tokenName: "Test NFT #999",
      transactionHash: "0x1234567890abcdef",
      senderAddress: "0x1234567890123456789012345678901234567890",
    });

    console.log("🧪 State after adding notification:", {
      showReceivedNotification: state.showReceivedNotification,
      notificationsCount: state.notifications.length,
    });
  };

  const createReceivedNotification = (
    tokenId: string,
    tokenName: string,
    transactionHash: string,
    senderAddress: string
  ) => {
    console.log("🎁 Creating received notification for NFT:", tokenId);

    addNotification({
      type: "received",
      tokenId,
      tokenName,
      transactionHash,
      senderAddress,
    });
  };

  // ============= EVENT LISTENERS =============

  // Listener per eventi di trasferimento NFT (SOLO per destinatari)
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
        isRecipient: to.toLowerCase() === address.toLowerCase(),
      });

      // SOLO se l'NFT è stato trasferito AL current user (destinatario)
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
      // NO ACTION for sender - they don't need notifications
    };

    // Aggiungi listener per eventi custom
    window.addEventListener("nftTransfer", handleNFTTransfer as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener(
        "nftTransfer",
        handleNFTTransfer as EventListener
      );
    };
  }, [address, addNotification]);

  // Listener per eventi blockchain (per destinatari che si connettono dopo)
  useEffect(() => {
    if (!address || !window.ethereum) return;

    let contract: ethers.Contract | null = null;

    const setupBlockchainListener = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        contract = new ethers.Contract(
          CONTRACT_ADDRESSES.MooveNFT,
          CONTRACT_ABIS.MooveNFT,
          provider
        );

        // Listener per eventi Transfer del contratto
        const handleTransferEvent = (
          from: string,
          to: string,
          tokenId: bigint,
          event: any
        ) => {
          console.log(`🔗 Blockchain Transfer event received:`, {
            from,
            to,
            tokenId: tokenId.toString(),
            transactionHash: event.transactionHash,
            currentUser: address,
            isRecipient: to.toLowerCase() === address.toLowerCase(),
          });

          // SOLO se l'NFT è stato trasferito AL current user (destinatario)
          if (to.toLowerCase() === address.toLowerCase()) {
            console.log(`🎉 NFT ${tokenId} received via blockchain event`);

            // Aggiungi notifica di ricevuta
            addNotification({
              type: "received",
              tokenId: tokenId.toString(),
              tokenName: `NFT #${tokenId}`,
              transactionHash: event.transactionHash,
              senderAddress: from,
            });

            // Emetti evento per notificare altri componenti
            window.dispatchEvent(
              new CustomEvent("nftTransferReceived", {
                detail: {
                  tokenId: tokenId.toString(),
                  sender: from,
                  transactionHash: event.transactionHash,
                },
              })
            );
          }
        };

        // Filtro per eventi Transfer verso l'utente corrente
        const filter = contract.filters.Transfer(null, address, null);
        contract.on(filter, handleTransferEvent);

        console.log(
          `🔗 Blockchain NFT transfer listener active for address: ${address}`
        );
      } catch (error) {
        console.error("❌ Failed to setup blockchain listener:", error);
      }
    };

    setupBlockchainListener();

    // Cleanup
    return () => {
      if (contract) {
        contract.removeAllListeners();
        console.log(`🔗 Blockchain listener removed for address: ${address}`);
      }
    };
  }, [address, addNotification]);

  // Debug: Monitor showReceivedNotification changes
  useEffect(() => {
    console.log(
      "🔍 showReceivedNotification changed:",
      state.showReceivedNotification
    );
    console.log("🔍 Current notifications:", state.notifications);
  }, [state.showReceivedNotification, state.notifications]);

  // Auto-notify when user receives an NFT (check on page load)
  useEffect(() => {
    if (!address) return;

    const checkForReceivedNFTs = async () => {
      try {
        console.log("🔍 Checking for received NFTs on page load...");

        // Check if user has any NFTs that might have been received recently
        // This is a simple check - in a real app you'd want to check recent Transfer events
        const hasRecentNotifications = state.notifications.some(
          (n) => n.type === "received" && !n.isRead
        );

        if (hasRecentNotifications) {
          console.log("🎁 Found unread received notifications, showing modal");
          setState((prev) => ({
            ...prev,
            showReceivedNotification: true,
          }));
        }
      } catch (error) {
        console.error("❌ Error checking for received NFTs:", error);
      }
    };

    // Check after a short delay to ensure everything is loaded
    const timeoutId = setTimeout(checkForReceivedNFTs, 2000);

    return () => clearTimeout(timeoutId);
  }, [address, state.notifications]);

  // Automatic NFT transfer detection
  useEffect(() => {
    if (!isConnected || !address) return;

    let lastCheckedBlock: number | null = null;
    let intervalId: NodeJS.Timeout | null = null;

    const checkForNewTransfers = async () => {
      try {
        if (!window.ethereum) return;

        const provider = new ethers.BrowserProvider(window.ethereum);
        const nftContract = new ethers.Contract(
          CONTRACT_ADDRESSES.MooveNFT,
          CONTRACT_ABIS.MooveNFT,
          provider
        );

        // Get current block number
        const currentBlock = await provider.getBlockNumber();

        // If this is the first check, start from current block
        if (lastCheckedBlock === null) {
          lastCheckedBlock = currentBlock - 10; // Check last 10 blocks
        }

        console.log(
          `🔍 Checking for NFT transfers from block ${lastCheckedBlock} to ${currentBlock}`
        );

        // Create filter for Transfer events TO the current user
        const filter = nftContract.filters.Transfer(null, address, null);

        // Query events from last checked block to current block
        const events = await nftContract.queryFilter(
          filter,
          lastCheckedBlock + 1,
          currentBlock
        );

        console.log(`📜 Found ${events.length} transfer events to ${address}`);

        for (const event of events) {
          try {
            const { from, to, tokenId } = event.args;
            const transactionHash = event.transactionHash;

            console.log(`🎁 Processing transfer event:`, {
              from,
              to,
              tokenId: tokenId.toString(),
              transactionHash,
            });

            // Get NFT metadata to get the name
            let tokenName = `NFT #${tokenId}`;
            try {
              const tokenURI = await nftContract.tokenURI(tokenId);
              if (tokenURI) {
                // Try to fetch metadata
                const response = await fetch(
                  `/api/ipfs-proxy?hash=${encodeURIComponent(tokenURI)}`
                );
                if (response.ok) {
                  const metadata = await response.json();
                  tokenName = metadata.name || tokenName;
                }
              }
            } catch (metadataError) {
              console.warn(
                `⚠️ Could not fetch metadata for NFT #${tokenId}:`,
                metadataError
              );
            }

            // Create notification for received NFT
            addNotification({
              type: "received",
              tokenId: tokenId.toString(),
              tokenName,
              transactionHash,
              senderAddress: from,
            });

            console.log(
              `✅ Created notification for NFT #${tokenId} (${tokenName})`
            );
          } catch (eventError) {
            console.error(`❌ Error processing transfer event:`, eventError);
          }
        }

        // Update last checked block
        lastCheckedBlock = currentBlock;
      } catch (error) {
        console.error("❌ Error checking for NFT transfers:", error);
      }
    };

    // Initial check
    checkForNewTransfers();

    // Set up periodic checking every 30 seconds
    intervalId = setInterval(checkForNewTransfers, 30000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isConnected, address, addNotification]);

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
    testReceivedNotification,
    createReceivedNotification,
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

      {/* NFT Received Notification - Disabled, using ReceivedNotificationModal instead */}
      {/* <NFTReceivedNotification /> */}

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

  console.log("🔍 TransferSuccessModal debug:", {
    showTransferSuccess,
    transferTokenId,
    transferRecipient,
    transferTransactionHash,
  });

  if (!showTransferSuccess || !transferTokenId || !transferRecipient) {
    console.log("❌ TransferSuccessModal: Not showing - missing data");
    return null;
  }

  console.log("✅ TransferSuccessModal: Showing modal");

  const copyTransactionHash = () => {
    if (transferTransactionHash) {
      navigator.clipboard.writeText(transferTransactionHash);
      toast.success("Transaction hash copied to clipboard!");
    }
  };

  const viewOnEtherscan = () => {
    if (transferTransactionHash) {
      const etherscanUrl = `https://sepolia.etherscan.io/tx/${transferTransactionHash}`;
      window.open(etherscanUrl, "_blank");
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
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                The page will refresh automatically to update your collection.
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

            <div className="flex space-x-3">
              {transferTransactionHash && (
                <button
                  onClick={viewOnEtherscan}
                  className="flex-1 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                >
                  View on Etherscan
                </button>
              )}
              <button
                onClick={closeTransferSuccess}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Close
              </button>
            </div>
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

  console.log("🔍 ReceivedNotificationModal debug:", {
    showReceivedNotification,
    notificationsCount: notifications.length,
    latestReceivedNotification,
    hasUnreadReceived: notifications.some(
      (n) => n.type === "received" && !n.isRead
    ),
  });

  if (!showReceivedNotification || !latestReceivedNotification) {
    console.log("❌ ReceivedNotificationModal: Not showing - missing data");
    return null;
  }

  console.log(
    "✅ ReceivedNotificationModal: Showing modal for NFT:",
    latestReceivedNotification.tokenId
  );

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
