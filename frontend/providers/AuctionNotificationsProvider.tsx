"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useWonAuctionsManager } from "@/hooks/useWonAuctionsManager";
import ConsolidatedNotificationBadge from "@/components/notifications/ConsolidatedNotificationBadge";
import AuctionNotificationsDebug from "@/components/debug/AuctionNotificationsDebug";
import { useSealedBidAutoMonitor } from "@/hooks/useSealedBidStatusManager";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { WonAuction } from "@/types/user";
import { contracts } from "@/utils/contracts";

// ✅ CONFIGURATION: Centralized configuration for external URLs
const CONFIG = {
  ETHERSCAN_BASE_URL:
    process.env.NEXT_PUBLIC_ETHERSCAN_URL || "https://sepolia.etherscan.io",
  // NOTIFICATION_COOLDOWN: 5 * 60 * 1000, // 5 minutes - REMOVED: Buggy cooldown system
  REFUND_TOAST_DURATION: 5000, // 5 seconds
  CLAIM_TOAST_DURATION: 8000, // 8 seconds
  GAS_LIMITS: {
    END_AUCTION: 200000,
    SETTLE_AUCTION: 300000,
  },
  INTERVALS: {
    REFUND_CHECK: 300000, // 5 minutes (era 30 secondi)
    CLAIM_CHECK: 300000, // 5 minutes (era 30 secondi)
  },
  PERFORMANCE: {
    MAX_AUCTION_CHECKS: 20, // Ridotto da 50 a 20 per ridurre chiamate RPC
  },
} as const;

// ============= CONTEXT =============

interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
}

interface RefundNotification {
  id: string;
  auctionId: string;
  amount: string;
  transactionHash: string;
  timestamp: number;
  isRead: boolean;
  message: string;
}

interface ClaimNotification {
  id: string;
  auctionId: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  transactionHash?: string;
  priority: "high" | "medium" | "low";
  notificationType?: "endAuction" | "settleAuction"; // New field to distinguish notification types
  isPermanent?: boolean; // New field to protect unfinished claims from Clear All
}

interface AuctionNotificationsContextType {
  hasUnsettledAuctions: boolean;
  unsettledCount: number;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  currentAuction: WonAuction | null;
  unsettledAuctions: WonAuction[];
  isSettling: boolean;
  handleSettleAuction: (auctionId: string, auction: WonAuction) => void;
  // New 3-phase system states
  showConfirmationModal: boolean;
  showResultModal: boolean;
  selectedAuction: WonAuction | null;
  transactionResult: TransactionResult | null;
  // Sealed bid monitoring
  addToSealedBidMonitoring: (auctionId: number) => void;
  removeFromSealedBidMonitoring: (auctionId: number) => void;
  monitoredSealedBidAuctions: number[];
  isMonitoringSealedBids: boolean;
  sealedBidError: string | null;
  // Refund notifications
  refundNotifications: RefundNotification[];
  markRefundAsRead: (notificationId: string) => void;
  clearAllRefundNotifications: () => void;
  removeRefundNotification: (notificationId: string) => void;
  // Claim notifications
  claimNotifications: ClaimNotification[];
  markClaimAsRead: (notificationId: string) => void;
  clearAllClaimNotifications: () => void;
  removeClaimNotification: (notificationId: string) => void;
  removePermanentClaimNotification: (notificationId: string) => void;
  reloadClaimNotifications: () => void;
  // Debug functions
  resetRefundBlock: () => void;
  resetClaimBlock: () => void;
  clearAllNotifications: () => void;
}

const AuctionNotificationsContext =
  createContext<AuctionNotificationsContextType | null>(null);

export const useAuctionNotifications = () => {
  const context = useContext(AuctionNotificationsContext);
  if (!context) {
    throw new Error(
      "useAuctionNotifications must be used within an AuctionNotificationsProvider"
    );
  }
  return context;
};

// ============= PROVIDER =============

export const AuctionNotificationsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { address, isConnected } = useAccount();
  const {
    unsettledAuctions: wonAuctions,
    currentAuction,
    isSettling,
    handleSettleAuction,
  } = useWonAuctionsManager();

  // New 3-phase system states
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<WonAuction | null>(
    null
  );
  const [transactionResult, setTransactionResult] =
    useState<TransactionResult | null>(null);

  // Sealed bid monitoring
  const {
    addToMonitoring,
    removeFromMonitoring,
    monitoredAuctions,
    isProcessing: isMonitoringSealedBids,
    error: sealedBidError,
  } = useSealedBidAutoMonitor();

  // Notification visibility state
  const [showNotifications, setShowNotifications] = useState(true);

  // Stato per tracciare se l'utente ha già visto le notifiche
  const [hasSeenNotifications, setHasSeenNotifications] = useState(false);

  // Refund notifications state
  const [refundNotifications, setRefundNotifications] = useState<
    RefundNotification[]
  >([]);
  const [lastCheckedBlock, setLastCheckedBlock] = useState<number>(() => {
    // ✅ PERSISTENCE: Load lastCheckedBlock from localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("moove-last-checked-block");
      return stored ? parseInt(stored) : 0;
    }
    return 0;
  });

  // Claim notifications state
  const [claimNotifications, setClaimNotifications] = useState<
    ClaimNotification[]
  >([]);
  const [lastCheckedClaimBlock, setLastCheckedClaimBlock] = useState<number>(
    () => {
      // ✅ PERSISTENCE: Load lastCheckedClaimBlock from localStorage
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("moove-last-checked-claim-block");
        return stored ? parseInt(stored) : 0;
      }
      return 0;
    }
  );

  // Track processed auctions to avoid duplicates
  const [processedClaimAuctions, setProcessedClaimAuctions] = useState<
    Set<string>
  >(() => {
    // ✅ PERSISTENCE: Load processedClaimAuctions from localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("moove-processed-claim-auctions");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return new Set(Array.isArray(parsed) ? parsed : []);
        } catch (error) {
          console.warn("Failed to parse processedClaimAuctions:", error);
        }
      }
    }
    return new Set();
  });

  // ✅ Auto-save notifications to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "moove-refund-notifications",
          JSON.stringify(refundNotifications)
        );
      } catch (error) {
        console.warn("Failed to save refund notifications:", error);
      }
    }
  }, [refundNotifications]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "moove-claim-notifications",
          JSON.stringify(claimNotifications)
        );
      } catch (error) {
        console.warn("Failed to save claim notifications:", error);
      }
    }
  }, [claimNotifications]);

  // ✅ Auto-save block numbers to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "moove-last-checked-block",
          lastCheckedBlock.toString()
        );
        console.log(
          `💾 [Persistence] Saved lastCheckedBlock: ${lastCheckedBlock}`
        );
      } catch (error) {
        console.warn("Failed to save lastCheckedBlock:", error);
      }
    }
  }, [lastCheckedBlock]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "moove-last-checked-claim-block",
          lastCheckedClaimBlock.toString()
        );
        console.log(
          `💾 [Persistence] Saved lastCheckedClaimBlock: ${lastCheckedClaimBlock}`
        );
      } catch (error) {
        console.warn("Failed to save lastCheckedClaimBlock:", error);
      }
    }
  }, [lastCheckedClaimBlock]);

  // ✅ Auto-save processedClaimAuctions to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "moove-processed-claim-auctions",
          JSON.stringify([...processedClaimAuctions])
        );
        console.log(
          `💾 [Persistence] Saved processedClaimAuctions: ${processedClaimAuctions.size} auctions`
        );
      } catch (error) {
        console.warn("Failed to save processedClaimAuctions:", error);
      }
    }
  }, [processedClaimAuctions]);

  // Refund notification functions
  const markRefundAsRead = (notificationId: string) => {
    setRefundNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  };

  const clearAllRefundNotifications = () => {
    setRefundNotifications([]);
  };

  const removeRefundNotification = (notificationId: string) => {
    setRefundNotifications((prev) =>
      prev.filter((n) => n.id !== notificationId)
    );
  };

  const removeClaimNotification = (notificationId: string) => {
    console.log(`🗑️ [Claim] Removing claim notification ${notificationId}`);
    setClaimNotifications((prev) => {
      const notification = prev.find((n) => n.id === notificationId);
      if (notification?.isPermanent) {
        console.log(
          `🛡️ [Claim] Notification ${notificationId} is permanent - cannot be removed`
        );
        return prev; // Don't remove permanent notifications
      }
      return prev.filter((n) => n.id !== notificationId);
    });
  };

  // ✅ NEW: Special function to remove permanent notifications only after successful action
  const removePermanentClaimNotification = (notificationId: string) => {
    console.log(
      `✅ [Claim] Removing permanent claim notification ${notificationId} after successful action`
    );
    setClaimNotifications((prev) =>
      prev.filter((n) => n.id !== notificationId)
    );
  };

  // Claim notification functions
  const markClaimAsRead = (notificationId: string) => {
    setClaimNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  };

  const clearAllClaimNotifications = () => {
    console.log(
      `🧹 [Claim] Clearing all claim notifications (preserving permanent ones)`
    );
    setClaimNotifications((prev) => {
      // ✅ PROTECTION: Keep permanent notifications (unfinished claims)
      const permanentNotifications = prev.filter((n) => n.isPermanent === true);
      console.log(
        `🛡️ [Claim] Preserving ${permanentNotifications.length} permanent claim notifications`
      );
      return permanentNotifications;
    });
  };

  // Reset functions for debugging
  const resetRefundBlock = () => {
    console.log(`🔄 [Refund] Manually resetting lastCheckedBlock to 0`);
    setLastCheckedBlock(0);
  };

  const resetClaimBlock = () => {
    console.log(`🔄 [Claim] Manually resetting lastCheckedClaimBlock to 0`);
    setLastCheckedClaimBlock(0);
  };

  const clearAllNotifications = () => {
    console.log(
      `🧹 [All] Clearing all notifications (preserving permanent claim notifications)`
    );
    setRefundNotifications([]);
    clearAllClaimNotifications(); // This now preserves permanent notifications
    setLastCheckedBlock(0);
    setLastCheckedClaimBlock(0);
    setProcessedClaimAuctions(new Set());

    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("moove-refund-notifications");
      localStorage.removeItem("moove-claim-notifications");
      localStorage.removeItem("moove-last-checked-block");
      localStorage.removeItem("moove-last-checked-claim-block");
      localStorage.removeItem("moove-processed-claim-auctions");
    }
  };

  // Save/load refund notifications from localStorage
  const saveRefundNotifications = (notifications: RefundNotification[]) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        "moove-refund-notifications",
        JSON.stringify(notifications)
      );
    } catch (error) {
      console.warn("Failed to save refund notifications:", error);
    }
  };

  const loadRefundNotifications = (): RefundNotification[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("moove-refund-notifications");
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.warn("Failed to load refund notifications:", error);
    }
    return [];
  };

  // Save/load claim notifications from localStorage
  const saveClaimNotifications = (notifications: ClaimNotification[]) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        "moove-claim-notifications",
        JSON.stringify(notifications)
      );
    } catch (error) {
      console.warn("Failed to save claim notifications:", error);
    }
  };

  const loadClaimNotifications = (): ClaimNotification[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("moove-claim-notifications");
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.warn("Failed to load claim notifications:", error);
    }
    return [];
  };

  // ✅ NEW: Function to reload claim notifications from localStorage
  const reloadClaimNotifications = useCallback(() => {
    const loaded = loadClaimNotifications();
    setClaimNotifications(loaded);
    console.log(
      `🔄 [Notifications] Reloaded ${loaded.length} claim notifications from localStorage`
    );
  }, []);

  // ✅ NEW: Cache for auction data to reduce RPC calls
  const [auctionCache, setAuctionCache] = useState<Map<string, any>>(new Map());
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(0);
  const CACHE_DURATION = 60000; // 1 minute cache

  // ✅ IMPROVED: Dedicated function to find ENDED auctions where user is winner
  const fetchEndedAuctionsForUser = useCallback(async () => {
    if (!address || !isConnected) {
      console.log(
        `🔍 [EndedAuctions] Skipping - not connected (address: ${address}, connected: ${isConnected})`
      );
      return [];
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      // ✅ IMPROVED: Get total auctions with retry logic
      let totalAuctions;
      let retries = 3;

      while (retries > 0) {
        try {
          totalAuctions = await auctionContract.totalAuctions();
          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            console.error(
              "❌ [EndedAuctions] Failed to get total auctions after retries:",
              error
            );
            return [];
          }
          console.log(
            `⚠️ [EndedAuctions] Retrying totalAuctions (${retries} retries left)...`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
        }
      }

      console.log(
        `🔍 [EndedAuctions] Checking ${totalAuctions} auctions for ENDED status...`
      );

      const endedAuctions = [];

      // ✅ IMPROVED: Check auctions from 1 to totalAuctions
      for (let auctionId = 1; auctionId <= totalAuctions; auctionId++) {
        try {
          const auctionData = await auctionContract.getAuction(auctionId);
          const status = Number(auctionData.status);
          const endTime = Number(auctionData.endTime);
          const highestBidder = auctionData.highestBidder;
          const auctionType = Number(auctionData.auctionType);
          const now = Math.floor(Date.now() / 1000);

          // ✅ IMPROVED: Check if auction is ENDED (status 3) and user is winner
          if (status === 3) {
            const isUserWinner =
              highestBidder.toLowerCase() === address.toLowerCase();

            if (isUserWinner) {
              console.log(
                `🏆 [EndedAuctions] Found ENDED auction #${auctionId} where user is winner`
              );

              // ✅ IMPROVED: Create proper notification data
              const notificationData = {
                auctionId: auctionId.toString(),
                endTime,
                highestBidder,
                blockNumber: 0,
                transactionHash: "ended-auction",
                notificationType: "settleAuction",
                // ✅ NEW: Add additional data for better notification handling
                auctionType,
                status,
                timestamp: now,
              };

              endedAuctions.push(notificationData);
            }
          }
        } catch (error) {
          // Auction doesn't exist or error reading it - continue silently
          continue;
        }
      }

      console.log(
        `✅ [EndedAuctions] Found ${endedAuctions.length} ENDED auctions where user is winner`
      );
      return endedAuctions;
    } catch (error) {
      console.error("❌ [EndedAuctions] Error fetching ended auctions:", error);
      return [];
    }
  }, [address, isConnected]);
  // ✅ NEW: Throttling to prevent too frequent calls
  const [lastRefundCheck, setLastRefundCheck] = useState<number>(0);
  const [lastClaimCheck, setLastClaimCheck] = useState<number>(0);
  const MIN_CHECK_INTERVAL = 120000; // 2 minutes minimum between checks

  const fetchRefundEvents = async () => {
    if (!address || !isConnected) {
      console.log(
        `🔍 [Refund] Skipping fetch - not connected (address: ${address}, connected: ${isConnected})`
      );
      return;
    }

    // ✅ THROTTLING: Check if enough time has passed since last check
    const now = Date.now();
    if (now - lastRefundCheck < MIN_CHECK_INTERVAL) {
      console.log(
        `⏭️ [Refund] Skipping - too soon since last check (${Math.round(
          (now - lastRefundCheck) / 1000
        )}s ago)`
      );
      return;
    }
    setLastRefundCheck(now);

    console.log(`🔍 [Refund] Starting fetch for user ${address}`);

    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || "https://1rpc.io/sepolia"
      );
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      // Get current block
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(lastCheckedBlock, currentBlock - 10000); // Last 10000 blocks max

      console.log(
        `🔍 [Refund] Block range: ${fromBlock} → ${currentBlock} (lastChecked: ${lastCheckedBlock})`
      );

      if (fromBlock >= currentBlock) {
        console.log(
          `⏭️ [Refund] No new blocks to check (fromBlock: ${fromBlock}, currentBlock: ${currentBlock})`
        );
        return;
      }

      console.log(
        `🔍 [Refund] Fetching refund events from block ${fromBlock} to ${currentBlock}`
      );

      // Fetch BidRefunded events
      const refundEvents = await auctionContract.queryFilter(
        auctionContract.filters.BidRefunded(),
        fromBlock,
        currentBlock
      );

      console.log(
        `📊 [Refund] Found ${refundEvents.length} BidRefunded events`
      );

      // Process events for current user
      const userRefundEvents = refundEvents.filter((event) => {
        const bidder = (event as any).args?.bidder;
        return bidder && bidder.toLowerCase() === address.toLowerCase();
      });

      console.log(
        `👤 [Refund] Found ${userRefundEvents.length} refund events for current user ${address}`
      );

      if (userRefundEvents.length > 0) {
        console.log(
          `👤 [Refund] Processing ${userRefundEvents.length} refund events for current user`
        );

        const newNotifications: RefundNotification[] = [];

        for (const event of userRefundEvents) {
          const args = (event as any).args;
          const auctionId = args?.auctionId;
          const bidder = args?.bidder;
          const amount = args?.amount;

          if (!auctionId || !bidder || !amount) {
            console.warn(`⚠️ [Refund] Skipping event with missing data:`, {
              auctionId,
              bidder,
              amount,
            });
            continue;
          }

          console.log(
            `💰 [Refund] Processing refund: auction ${auctionId}, bidder ${bidder}, amount ${ethers.formatEther(
              amount
            )} ETH`
          );

          const notification: RefundNotification = {
            id: `${auctionId}-refund-${event.blockNumber}`,
            auctionId: auctionId.toString(),
            amount: ethers.formatEther(amount),
            transactionHash: event.transactionHash,
            timestamp: Date.now(),
            isRead: false,
            message: `Your offer on auction #${auctionId} has been overcome! You received a refund of ${ethers.formatEther(
              amount
            )} ETH.`,
          };

          newNotifications.push(notification);
        }

        // Add new notifications to existing ones
        setRefundNotifications((prev) => {
          const merged = [...prev, ...newNotifications];
          const unique = merged.filter(
            (n, index, self) => index === self.findIndex((t) => t.id === n.id)
          );
          console.log(
            `💾 [Refund] Saving ${unique.length} total notifications (${newNotifications.length} new)`
          );
          saveRefundNotifications(unique);
          return unique;
        });

        // Show toast notifications for new refunds
        newNotifications.forEach((notification) => {
          console.log(`🔔 [Refund] Showing toast: ${notification.message}`);
          toast.success(notification.message, {
            duration: CONFIG.REFUND_TOAST_DURATION,
            position: "top-right",
          });
        });
      } else {
        console.log(
          `👤 [Refund] No refund events found for current user ${address}`
        );
      }

      // ✅ NEW: Fetch AuctionCancelled events for Reserve Auction automatic cancellation
      console.log(
        `🔍 [Reserve] Fetching AuctionCancelled events from block ${fromBlock} to ${currentBlock}`
      );

      const cancelledEvents = await auctionContract.queryFilter(
        auctionContract.filters.AuctionCancelled(),
        fromBlock,
        currentBlock
      );

      console.log(
        `📊 [Reserve] Found ${cancelledEvents.length} AuctionCancelled events`
      );

      // Process cancelled events for Reserve Auctions
      for (const event of cancelledEvents) {
        const args = (event as any).args;
        const auctionId = args?.auctionId;
        const reason = args?.reason;

        if (!auctionId || !reason) {
          console.warn(
            `⚠️ [Reserve] Skipping cancelled event with missing data:`,
            {
              auctionId,
              reason,
            }
          );
          continue;
        }

        console.log(
          `🚨 [Reserve] Processing cancelled auction ${auctionId} with reason: ${reason}`
        );

        // Check if this is a Reserve Auction cancellation due to reserve price not met
        const RESERVE_PRICE_NOT_MET_REASON = "Reserve price not met";
        if (reason === RESERVE_PRICE_NOT_MET_REASON) {
          try {
            // Get auction data to check if current user was involved
            const auctionData = await auctionContract.getAuction(auctionId);
            const seller = auctionData.seller;
            const highestBidder = auctionData.highestBidder;
            const auctionType = Number(auctionData.auctionType);

            // Check if current user is the seller
            if (seller.toLowerCase() === address.toLowerCase()) {
              console.log(
                `🏠 [Reserve] User is seller of cancelled Reserve Auction ${auctionId}`
              );
              toast.success(
                `🏠 Reserve Auction #${auctionId} was automatically cancelled because the highest bid was below the reserve price. Your NFT has been returned to you.`,
                {
                  duration: 8000,
                  position: "top-right",
                }
              );
            }

            // Check if current user is the highest bidder
            if (highestBidder.toLowerCase() === address.toLowerCase()) {
              console.log(
                `💰 [Reserve] User is highest bidder of cancelled Reserve Auction ${auctionId}`
              );
              toast.success(
                `💰 Reserve Auction #${auctionId} was automatically cancelled because your bid was below the reserve price. You will receive a refund.`,
                {
                  duration: 8000,
                  position: "top-right",
                }
              );
            }
          } catch (error) {
            console.warn(
              `⚠️ [Reserve] Could not get auction data for cancelled auction ${auctionId}:`,
              error
            );
          }
        }
      }

      // Update last checked block
      console.log(
        `📝 [Refund] Updating lastCheckedBlock from ${lastCheckedBlock} to ${currentBlock}`
      );
      setLastCheckedBlock(currentBlock);
    } catch (error) {
      console.error("Error fetching refund events:", error);
    }
  };

  // Fetch claim events from blockchain
  const fetchClaimEvents = async () => {
    if (!address || !isConnected) {
      console.log(
        `🔍 [Claim] Skipping fetch - not connected (address: ${address}, connected: ${isConnected})`
      );
      return;
    }

    // ✅ THROTTLING: Check if enough time has passed since last check
    const now = Date.now();
    if (now - lastClaimCheck < MIN_CHECK_INTERVAL) {
      console.log(
        `⏭️ [Claim] Skipping - too soon since last check (${Math.round(
          (now - lastClaimCheck) / 1000
        )}s ago)`
      );
      return;
    }
    setLastClaimCheck(now);

    console.log(`🔍 [Claim] Starting fetch for user ${address}`);

    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || "https://1rpc.io/sepolia"
      );
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      // Get current block
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(lastCheckedClaimBlock, currentBlock - 10000); // Last 10000 blocks max

      console.log(
        `🔍 [Claim] Block range: ${fromBlock} → ${currentBlock} (lastCheckedClaim: ${lastCheckedClaimBlock})`
      );

      if (fromBlock >= currentBlock) {
        console.log(
          `⏭️ [Claim] No new blocks to check (fromBlock: ${fromBlock}, currentBlock: ${currentBlock})`
        );
        return;
      }

      console.log(
        `🔍 [Claim] Fetching claim events from block ${fromBlock} to ${currentBlock}`
      );

      // Events are only emitted when someone manually calls endAuction/settleAuction
      // For expired auctions, we only check contract state directly
      console.log(
        `📊 [Claim] Skipping blockchain event search - checking contract state directly for expired auctions`
      );

      // Additional check: Look for expired auctions where user is winner
      console.log(
        `🔍 [Claim] Checking for expired auctions where user is winner...`
      );
      const expiredWinnerAuctions = [];

      try {
        // ✅ PERFORMANCE: Check a reasonable range to avoid excessive API calls
        // Start from a high number and work backwards until we find valid auctions
        const maxCheckAuctions = CONFIG.PERFORMANCE.MAX_AUCTION_CHECKS;
        let totalAuctions = 0;

        // Find the highest auction ID by checking backwards
        for (let i = maxCheckAuctions; i >= 1; i--) {
          try {
            const auctionData = await auctionContract.getAuction(i);
            if (
              auctionData &&
              auctionData.seller !==
                "0x0000000000000000000000000000000000000000"
            ) {
              totalAuctions = i;
              break;
            }
          } catch (error) {
            // Auction doesn't exist, continue checking
            continue;
          }
        }

        console.log(
          `📊 [Claim] Found ${totalAuctions} total auctions (checked up to ${maxCheckAuctions})`
        );

        // ✅ PERFORMANCE: Skip if no auctions found
        if (totalAuctions === 0) {
          console.log(`⏭️ [Claim] No auctions found, skipping claim check`);
          return;
        }

        // ✅ OPTIMIZED: Batch auction data fetching to reduce RPC calls
        console.log(
          `🔍 [Claim] Checking ${totalAuctions} auctions for ENDED status and expired winners`
        );

        // ✅ BATCH: Fetch auction data in smaller batches to avoid overwhelming RPC
        const BATCH_SIZE = 5; // Process 5 auctions at a time
        const batches = [];
        for (let i = 1; i <= totalAuctions; i += BATCH_SIZE) {
          batches.push({
            start: i,
            end: Math.min(i + BATCH_SIZE - 1, totalAuctions),
          });
        }

        console.log(
          `📦 [Claim] Processing ${batches.length} batches of auctions`
        );

        for (const batch of batches) {
          console.log(
            `📦 [Claim] Processing batch ${batch.start}-${batch.end}`
          );

          // Process batch with small delay to avoid rate limiting
          for (
            let auctionId = batch.start;
            auctionId <= batch.end;
            auctionId++
          ) {
            try {
              const auctionData = await auctionContract.getAuction(auctionId);
              const status = Number(auctionData.status);
              const endTime = Number(auctionData.endTime);
              const highestBidder = auctionData.highestBidder;
              const auctionType = Number(auctionData.auctionType);
              const now = Math.floor(Date.now() / 1000);

              // ✅ DEBUG: Special logging for auction #7
              if (auctionId === 7) {
                console.log(`🔍 [DEBUG] Processing auction #7:`, {
                  status,
                  endTime: new Date(endTime * 1000).toISOString(),
                  now: new Date(now * 1000).toISOString(),
                  highestBidder,
                  auctionType,
                  isExpired: now > endTime,
                  isUserWinner:
                    highestBidder.toLowerCase() === address.toLowerCase(),
                });
              }

              // ✅ FILTER: Skip Dutch auctions (they settle automatically on purchase)
              if (auctionType === 1) {
                console.log(
                  `⏭️ [Claim] Skipping Dutch auction ${auctionId} (settles automatically)`
                );
                continue;
              }

              // Skip if auction is already settled (status 4)
              if (status === 4) {
                console.log(
                  `⏭️ [Claim] Skipping already settled auction ${auctionId} (status: ${status})`
                );
                continue;
              }

              // Skip if auction is cancelled (status 5)
              if (status === 5) {
                console.log(
                  `⏭️ [Claim] Skipping cancelled auction ${auctionId} (status: ${status})`
                );
                continue;
              }

              // ✅ NO TIME FILTER: Check all auctions regardless of age

              // ✅ REMOVED: Buggy cooldown system that blocked legitimate notifications
              // The cooldown was preventing settleAuction notifications after endAuction notifications
              // This caused users to miss important claim notifications

              // ✅ UNIFIED LOGIC: Check if auction needs action and user is winner
              if (highestBidder.toLowerCase() === address.toLowerCase()) {
                // CASE 1: Auction is ACTIVE but expired - needs endAuction()
                if (status === 1 && now > endTime) {
                  console.log(
                    `🏁 [Claim] Found expired auction ${auctionId} where user is winner - needs endAuction():`,
                    {
                      status,
                      endTime,
                      now,
                      highestBidder,
                      auctionType,
                      isExpired: now > endTime,
                    }
                  );

                  // ✅ REMOVED: Cooldown setting - was causing notification blocking
                  // localStorage.setItem(notificationKey, Date.now().toString());

                  expiredWinnerAuctions.push({
                    auctionId: auctionId.toString(),
                    endTime,
                    highestBidder,
                    blockNumber: 0,
                    transactionHash: "expired-auction",
                    notificationType: "endAuction",
                  });
                }

                // CASE 2: Auction is ENDED - needs settleAuction()
                else if (status === 3) {
                  console.log(
                    `🏆 [Claim] Found ended auction ${auctionId} where user is winner - needs settleAuction():`,
                    {
                      status,
                      endTime,
                      now,
                      highestBidder,
                      auctionType,
                    }
                  );

                  // ✅ DEBUG: Special logging for auction #7
                  if (auctionId === 7) {
                    console.log(
                      `🎯 [DEBUG] Auction #7 should get settleAuction notification!`
                    );
                  }

                  // Special handling for Reserve Auctions with bid below reserve
                  if (auctionType === 3) {
                    const reservePrice = parseFloat(
                      ethers.formatEther(auctionData.reservePrice)
                    );
                    const highestBidAmount = parseFloat(
                      ethers.formatEther(auctionData.highestBid)
                    );

                    if (highestBidAmount < reservePrice) {
                      console.log(
                        `🚨 [Claim] Reserve Auction ${auctionId} has bid below reserve: ${highestBidAmount} < ${reservePrice}`
                      );
                      console.log(
                        `⚠️ [Claim] settleAuction() will automatically cancel and refund - no NFT transfer`
                      );
                    } else {
                      console.log(
                        `✅ [Claim] Reserve Auction ${auctionId} has bid above reserve: ${highestBidAmount} >= ${reservePrice}`
                      );
                    }
                  }

                  // ✅ REMOVED: Cooldown setting - was causing notification blocking
                  // localStorage.setItem(notificationKey, Date.now().toString());

                  expiredWinnerAuctions.push({
                    auctionId: auctionId.toString(),
                    endTime,
                    highestBidder,
                    blockNumber: 0,
                    transactionHash: "ended-auction",
                    notificationType: "settleAuction",
                  });

                  // ✅ DEBUG: Special logging for auction #7
                  if (auctionId === 7) {
                    console.log(
                      `✅ [DEBUG] Auction #7 added to expiredWinnerAuctions for settleAuction notification!`
                    );
                  }
                }

                // CASE 3: Sealed Bid already settled - no action needed
                else if (auctionType === 2 && status === 4) {
                  console.log(
                    `✅ [Claim] Sealed Bid auction ${auctionId} already settled automatically - no action needed`
                  );
                  // Don't add to notifications - already processed
                }
              }
            } catch (error) {
              // Skip invalid auctions
              continue;
            }
          }

          // ✅ DELAY: Small delay between batches to avoid rate limiting
          if (batches.length > 1) {
            console.log(`⏳ [Claim] Waiting 2 seconds before next batch...`);
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }

        console.log(
          `🏆 [Claim] Found ${expiredWinnerAuctions.length} expired auctions where user is winner`
        );
      } catch (error) {
        console.warn(`⚠️ [Claim] Error checking expired auctions:`, error);
      }

      const allClaimableAuctions = [...expiredWinnerAuctions];

      // ✅ FILTER: Remove duplicates based on auctionId
      const uniqueClaimableAuctions = allClaimableAuctions.filter(
        (auction, index, self) => {
          const auctionId =
            "auctionId" in auction
              ? auction.auctionId
              : (auction as any).args?.auctionId?.toString();
          return (
            index ===
            self.findIndex((a) => {
              const aAuctionId =
                "auctionId" in a
                  ? a.auctionId
                  : (a as any).args?.auctionId?.toString();
              return aAuctionId === auctionId;
            })
          );
        }
      );

      console.log(
        `👤 [Claim] Total claimable auctions: ${
          uniqueClaimableAuctions.length
        } (${expiredWinnerAuctions.length} expired auctions, ${
          allClaimableAuctions.length - uniqueClaimableAuctions.length
        } duplicates removed)`
      );

      if (uniqueClaimableAuctions.length > 0) {
        console.log(
          `👤 [Claim] Processing ${uniqueClaimableAuctions.length} claim events for current user`
        );

        const newNotifications: ClaimNotification[] = [];

        for (const auction of uniqueClaimableAuctions) {
          let auctionId: string;
          let notificationType: "endAuction" | "settleAuction" | undefined;

          // Handle different auction object types
          if ("auctionId" in auction) {
            // Expired auction object
            auctionId = auction.auctionId;
            notificationType = (auction as any).notificationType;
          } else {
            // Event object
            const args = (auction as any).args;
            auctionId = args?.auctionId;
            notificationType = "settleAuction"; // Events are always settleAuction
          }

          if (!auctionId) {
            console.warn(
              `⚠️ [Claim] Skipping auction with missing auctionId:`,
              auction
            );
            continue;
          }

          // Check if we already processed this auction
          if (processedClaimAuctions.has(auctionId)) {
            console.log(
              `⏭️ [Claim] Skipping already processed auction ${auctionId}`
            );
            continue;
          }

          console.log(
            `🏆 [Claim] Processing ${
              notificationType || "settleAuction"
            } notification: auction ${auctionId}`
          );

          // Create appropriate message based on notification type
          let message: string;
          if (notificationType === "endAuction") {
            message = `🏁 Auction #${auctionId} has expired! Click to end auction and proceed to settlement.`;
          } else {
            message = `🏆 You won auction #${auctionId}! Click to claim your NFT.`;
          }

          const notification: ClaimNotification = {
            id: `${notificationType || "settleAuction"}-${auctionId}-${
              "blockNumber" in auction ? auction.blockNumber : Date.now()
            }`,
            auctionId: auctionId.toString(),
            message,
            timestamp: Date.now(),
            isRead: false,
            transactionHash:
              "transactionHash" in auction
                ? auction.transactionHash
                : "expired-auction",
            priority: "high",
            notificationType: notificationType || "settleAuction",
            isPermanent: true, // ✅ PROTECTION: Mark as permanent to survive Clear All
          };

          newNotifications.push(notification);

          // Mark auction as processed
          setProcessedClaimAuctions((prev) => new Set([...prev, auctionId]));
        }

        // Add new notifications to existing ones (avoid duplicates)
        setClaimNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const trulyNewNotifications = newNotifications.filter(
            (n) => !existingIds.has(n.id)
          );

          if (trulyNewNotifications.length > 0) {
            const merged = [...prev, ...trulyNewNotifications];
            console.log(
              `💾 [Claim] Adding ${trulyNewNotifications.length} new notifications (${prev.length} existing)`
            );
            saveClaimNotifications(merged);

            // ✅ NEW: Reload notifications to ensure sync with localStorage
            setTimeout(() => {
              reloadClaimNotifications();
            }, 100);

            return merged;
          } else {
            console.log(
              `⏭️ [Claim] No new notifications to add (all already exist)`
            );
            return prev;
          }
        });

        // Show toast notifications for new claims
        newNotifications.forEach((notification) => {
          console.log(`🔔 [Claim] Showing toast: ${notification.message}`);
          toast.success(notification.message, {
            duration: CONFIG.CLAIM_TOAST_DURATION,
            position: "top-right",
          });
        });
      } else {
        console.log(
          `👤 [Claim] No claim events found for current user ${address}`
        );
      }

      // Update last checked block
      console.log(
        `📝 [Claim] Updating lastCheckedClaimBlock from ${lastCheckedClaimBlock} to ${currentBlock}`
      );
      setLastCheckedClaimBlock(currentBlock);
    } catch (error) {
      console.error("Error fetching claim events:", error);
    }
  };

  // Initialize refund notifications from localStorage
  useEffect(() => {
    const stored = loadRefundNotifications();
    console.log(
      `📂 [Refund] Loading ${stored.length} stored notifications from localStorage`
    );
    setRefundNotifications(stored);

    // Reset lastCheckedBlock if no stored notifications
    if (stored.length === 0) {
      console.log(
        `🔄 [Refund] No stored notifications found, resetting lastCheckedBlock to 0`
      );
      setLastCheckedBlock(0);
    }
  }, []);

  // Initialize claim notifications from localStorage
  useEffect(() => {
    const stored = loadClaimNotifications();
    console.log(
      `📂 [Claim] Loading ${stored.length} stored notifications from localStorage`
    );
    setClaimNotifications(stored);

    // Reset lastCheckedClaimBlock if no stored notifications
    if (stored.length === 0) {
      console.log(
        `🔄 [Claim] No stored notifications found, resetting lastCheckedClaimBlock to 0`
      );
      setLastCheckedClaimBlock(0);
    }
  }, []);

  // Monitor refund events periodically
  useEffect(() => {
    if (!isConnected || !address) {
      console.log(
        `🔍 [Refund] Skipping monitor setup - not connected (address: ${address}, connected: ${isConnected})`
      );
      return;
    }

    console.log(
      `🔍 [Refund] Setting up monitor for user ${address} (lastCheckedBlock: ${lastCheckedBlock})`
    );

    // Initial fetch
    fetchRefundEvents();

    // Setup interval
    const interval = setInterval(() => {
      console.log(`⏰ [Refund] Periodic fetch triggered`);
      fetchRefundEvents();
    }, CONFIG.INTERVALS.REFUND_CHECK);

    return () => {
      console.log(`🔍 [Refund] Cleaning up monitor for user ${address}`);
      clearInterval(interval);
    };
  }, [isConnected, address, lastCheckedBlock, fetchRefundEvents]);

  // Monitor claim events periodically
  useEffect(() => {
    if (!isConnected || !address) {
      console.log(
        `🔍 [Claim] Skipping monitor setup - not connected (address: ${address}, connected: ${isConnected})`
      );
      return;
    }

    console.log(
      `🔍 [Claim] Setting up monitor for user ${address} (lastCheckedClaimBlock: ${lastCheckedClaimBlock})`
    );

    // Initial fetch
    fetchClaimEvents();

    // Setup interval
    const interval = setInterval(() => {
      console.log(`⏰ [Claim] Periodic fetch triggered`);
      fetchClaimEvents();
    }, CONFIG.INTERVALS.CLAIM_CHECK);

    return () => {
      console.log(`🔍 [Claim] Cleaning up monitor for user ${address}`);
      clearInterval(interval);
    };
  }, [isConnected, address, lastCheckedClaimBlock]);

  // Context value
  const contextValue: AuctionNotificationsContextType = {
    hasUnsettledAuctions: wonAuctions.length > 0,
    unsettledCount: wonAuctions.length,
    showNotifications,
    setShowNotifications,
    currentAuction,
    unsettledAuctions: wonAuctions as unknown as WonAuction[],
    isSettling,
    handleSettleAuction,
    // New 3-phase system states
    showConfirmationModal,
    showResultModal,
    selectedAuction,
    transactionResult,
    // Sealed bid monitoring
    addToSealedBidMonitoring: addToMonitoring,
    removeFromSealedBidMonitoring: removeFromMonitoring,
    monitoredSealedBidAuctions: monitoredAuctions,
    isMonitoringSealedBids,
    sealedBidError,
    // Refund notifications
    refundNotifications,
    markRefundAsRead,
    clearAllRefundNotifications,
    removeRefundNotification,
    // Claim notifications
    claimNotifications,
    markClaimAsRead,
    clearAllClaimNotifications,
    removeClaimNotification,
    removePermanentClaimNotification,
    reloadClaimNotifications,
    // Debug functions
    resetRefundBlock,
    resetClaimBlock,
    clearAllNotifications,
  };

  return (
    <AuctionNotificationsContext.Provider value={contextValue}>
      {children}

      {/* Notification Badge */}
      <ConsolidatedNotificationBadge />

      {/* Debug Panel */}
      <AuctionNotificationsDebug />
    </AuctionNotificationsContext.Provider>
  );
};

export { AuctionNotificationsContext };
