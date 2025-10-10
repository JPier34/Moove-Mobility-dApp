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

// ============= OPTIMIZED CONFIGURATION =============
const CONFIG = {
  ETHERSCAN_BASE_URL:
    process.env.NEXT_PUBLIC_ETHERSCAN_URL || "https://sepolia.etherscan.io",

  TOAST_DURATIONS: {
    REFUND: 5000,
    CLAIM: 8000,
  },

  GAS_LIMITS: {
    END_AUCTION: 200000,
    SETTLE_AUCTION: 300000,
  },

  // ✅ OPTIMIZED: Smarter intervals based on priority
  INTERVALS: {
    QUICK_CHECK: 60000, // 1 minute - for initial connection and high-priority checks
    NORMAL_CHECK: 300000, // 5 minutes - for routine checks
    SLOW_CHECK: 600000, // 10 minutes - for low-priority background checks
  },

  // ✅ OPTIMIZED: Reduced batch sizes and smarter limits
  PERFORMANCE: {
    MAX_AUCTION_RANGE: 100, // Check last 100 auctions max
    BATCH_SIZE: 3, // Process 3 auctions at a time
    BATCH_DELAY: 1500, // 1.5 seconds between batches
    MAX_RETRIES: 2, // Reduced from 3 to 2
    RETRY_DELAY: 2000, // 2 seconds between retries
    CACHE_DURATION: 120000, // 2 minutes cache
    MIN_CHECK_INTERVAL: 45000, // 45 seconds between checks (reduced from 2 min)
  },

  // ✅ NEW: Block range limits to reduce queryFilter calls
  BLOCK_RANGES: {
    MAX_BLOCKS_PER_QUERY: 5000, // Max blocks to query at once
    LOOKBACK_BLOCKS: 10000, // Max blocks to look back
  },
} as const;

// ============= SMART CACHE SYSTEM =============

interface CachedAuction {
  data: any;
  timestamp: number;
  status: number;
}

class AuctionCache {
  private cache: Map<string, CachedAuction> = new Map();
  private cacheDuration: number;

  constructor(cacheDuration: number = CONFIG.PERFORMANCE.CACHE_DURATION) {
    this.cacheDuration = cacheDuration;
  }

  /**
   * Get cached auction data if still valid
   */
  get(auctionId: string): any | null {
    const cached = this.cache.get(auctionId);
    if (!cached) return null;

    const now = Date.now();
    const isExpired = now - cached.timestamp > this.cacheDuration;

    // ✅ SMART: Cache longer for settled/cancelled auctions
    const isTerminalState = cached.status === 4 || cached.status === 5;
    if (isTerminalState && !isExpired) {
      console.log(`💾 [Cache] HIT for settled/cancelled auction ${auctionId}`);
      return cached.data;
    }

    if (!isExpired) {
      console.log(`💾 [Cache] HIT for auction ${auctionId}`);
      return cached.data;
    }

    console.log(`❌ [Cache] MISS (expired) for auction ${auctionId}`);
    this.cache.delete(auctionId);
    return null;
  }

  /**
   * Store auction data in cache
   */
  set(auctionId: string, data: any, status: number): void {
    this.cache.set(auctionId, {
      data,
      timestamp: Date.now(),
      status,
    });
    console.log(`💾 [Cache] SET auction ${auctionId} (status: ${status})`);
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.cache.entries()) {
      // Don't clean terminal states
      const isTerminalState = value.status === 4 || value.status === 5;
      if (isTerminalState) continue;

      if (now - value.timestamp > this.cacheDuration) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 [Cache] Cleaned ${cleaned} expired entries`);
    }
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; settled: number; active: number } {
    let settled = 0;
    let active = 0;

    for (const value of this.cache.values()) {
      if (value.status === 4 || value.status === 5) {
        settled++;
      } else {
        active++;
      }
    }

    return {
      size: this.cache.size,
      settled,
      active,
    };
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    console.log(`🧹 [Cache] Cleared all entries`);
  }
}

// ============= SMART AUCTION FINDER =============

/**
 * Efficiently find the total number of auctions without excessive RPC calls
 */
async function findTotalAuctions(
  auctionContract: ethers.Contract,
  cache: AuctionCache
): Promise<number> {
  console.log(`🔍 [Finder] Searching for total auctions...`);

  // ✅ OPTIMIZATION: Binary search instead of linear
  let low = 1;
  let high = CONFIG.PERFORMANCE.MAX_AUCTION_RANGE;
  let totalAuctions = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    try {
      // Check cache first
      const cached = cache.get(mid.toString());
      if (cached) {
        console.log(`💾 [Finder] Using cached data for auction ${mid}`);
        totalAuctions = mid;
        low = mid + 1;
        continue;
      }

      const auctionData = await auctionContract.getAuction(mid);

      if (
        auctionData &&
        auctionData.seller !== "0x0000000000000000000000000000000000000000"
      ) {
        // Auction exists, cache it and search higher
        const status = Number(auctionData.status);
        cache.set(mid.toString(), auctionData, status);
        totalAuctions = mid;
        low = mid + 1;
      } else {
        // Auction doesn't exist, search lower
        high = mid - 1;
      }
    } catch (error) {
      // Error means auction doesn't exist
      high = mid - 1;
    }
  }

  console.log(`✅ [Finder] Found ${totalAuctions} total auctions`);
  return totalAuctions;
}

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
  // ✅ NEW: Initialize cache and throttling states
  const [auctionCache] = useState(() => new AuctionCache());
  const [lastRefundCheck, setLastRefundCheck] = useState<number>(0);
  const [lastClaimCheck, setLastClaimCheck] = useState<number>(0);

  // ============= OPTIMIZED CLAIM EVENT FETCHER =============

  /**
   * Fetch claim notifications with optimized RPC usage
   */
  const fetchClaimEventsOptimized = useCallback(async () => {
    if (!address || !isConnected) {
      console.log(
        `🔍 [Claim] Skipping fetch - not connected (address: ${address}, connected: ${isConnected})`
      );
      return;
    }

    // ✅ THROTTLING: Check if enough time has passed
    const now = Date.now();
    if (now - lastClaimCheck < CONFIG.PERFORMANCE.MIN_CHECK_INTERVAL) {
      console.log(
        `⏭️ [Claim] Skipping - too soon since last check (${Math.round(
          (now - lastClaimCheck) / 1000
        )}s ago)`
      );
      return;
    }
    setLastClaimCheck(now);

    console.log(`🔍 [Claim] Starting optimized fetch for user ${address}`);

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
      const fromBlock = Math.max(
        lastCheckedClaimBlock,
        currentBlock - CONFIG.BLOCK_RANGES.LOOKBACK_BLOCKS
      );

      console.log(
        `🔍 [Claim] Block range: ${fromBlock} → ${currentBlock} (lastChecked: ${lastCheckedClaimBlock})`
      );

      if (fromBlock >= currentBlock) {
        console.log(
          `⏭️ [Claim] No new blocks to check (fromBlock: ${fromBlock}, currentBlock: ${currentBlock})`
        );
        return;
      }

      // ✅ OPTIMIZATION: Use cache stats to decide whether to do full scan
      const cacheStats = auctionCache.getStats();
      console.log(
        `📊 [Cache] Stats: ${cacheStats.size} total, ${cacheStats.settled} settled, ${cacheStats.active} active`
      );

      // ✅ SMART: Find total auctions efficiently
      const totalAuctions = await findTotalAuctions(
        auctionContract,
        auctionCache
      );

      if (totalAuctions === 0) {
        console.log(`⏭️ [Claim] No auctions found, skipping claim check`);
        return;
      }

      console.log(
        `🔍 [Claim] Checking ${totalAuctions} auctions for claimable status`
      );

      // ✅ OPTIMIZATION: Check auctions in reverse order (newest first)
      const claimableAuctions = [];
      const nowTimestamp = Math.floor(Date.now() / 1000);

      // ✅ BATCH: Process in small batches with delays
      const batches = [];
      for (
        let i = totalAuctions;
        i >= Math.max(1, totalAuctions - CONFIG.PERFORMANCE.MAX_AUCTION_RANGE);
        i -= CONFIG.PERFORMANCE.BATCH_SIZE
      ) {
        batches.push({
          start: Math.max(1, i - CONFIG.PERFORMANCE.BATCH_SIZE + 1),
          end: i,
        });
      }

      console.log(
        `📦 [Claim] Processing ${batches.length} batches (newest first)`
      );

      for (const batch of batches) {
        console.log(`📦 [Claim] Processing batch ${batch.start}-${batch.end}`);

        for (let auctionId = batch.end; auctionId >= batch.start; auctionId--) {
          try {
            // ✅ CACHE: Check cache first
            let auctionData = auctionCache.get(auctionId.toString());
            let status: number = 0;

            if (!auctionData) {
              // Fetch from contract with retry logic
              let retries = CONFIG.PERFORMANCE.MAX_RETRIES;
              while (retries > 0) {
                try {
                  auctionData = await auctionContract.getAuction(auctionId);
                  status = Number(auctionData.status);
                  auctionCache.set(auctionId.toString(), auctionData, status);
                  break;
                } catch (error) {
                  retries--;
                  if (retries === 0) {
                    console.warn(
                      `⚠️ [Claim] Failed to fetch auction ${auctionId} after retries`
                    );
                    continue;
                  }
                  await new Promise((resolve) =>
                    setTimeout(resolve, CONFIG.PERFORMANCE.RETRY_DELAY)
                  );
                }
              }
            } else {
              status = Number(auctionData.status);
            }

            if (!auctionData) continue;

            const endTime = Number(auctionData.endTime);
            const highestBidder = auctionData.highestBidder;
            const auctionType = Number(auctionData.auctionType);

            // ✅ FILTER: Skip Dutch auctions (auto-settle) and non-winner auctions
            if (auctionType === 1) continue;
            if (highestBidder.toLowerCase() !== address.toLowerCase()) continue;

            // ✅ FILTER: Skip already processed auctions
            if (processedClaimAuctions.has(auctionId.toString())) {
              console.log(
                `⏭️ [Claim] Skipping already processed auction ${auctionId}`
              );
              continue;
            }

            // ✅ FILTER: Skip settled/cancelled auctions
            if (status === 4 || status === 5) {
              console.log(
                `⏭️ [Claim] Skipping settled/cancelled auction ${auctionId} (status: ${status})`
              );
              continue;
            }

            // ✅ CASE 1: ACTIVE but expired → needs endAuction()
            if (status === 1 && nowTimestamp > endTime) {
              console.log(
                `🏁 [Claim] Found expired ACTIVE auction ${auctionId} - needs endAuction()`
              );

              claimableAuctions.push({
                auctionId: auctionId.toString(),
                endTime,
                highestBidder,
                blockNumber: 0,
                transactionHash: "expired-auction",
                notificationType: "endAuction",
              });
            }

            // ✅ CASE 2: ENDED (status 3) → needs settleAuction()
            else if (status === 3) {
              console.log(
                `🏆 [Claim] Found ENDED auction ${auctionId} - needs settleAuction()`
              );

              // Special handling for Reserve Auctions
              if (auctionType === 3) {
                const reservePrice = parseFloat(
                  ethers.formatEther(auctionData.reservePrice)
                );
                const highestBidAmount = parseFloat(
                  ethers.formatEther(auctionData.highestBid)
                );

                if (highestBidAmount < reservePrice) {
                  console.log(
                    `⚠️ [Claim] Reserve Auction ${auctionId}: bid ${highestBidAmount} < reserve ${reservePrice}`
                  );
                }
              }

              claimableAuctions.push({
                auctionId: auctionId.toString(),
                endTime,
                highestBidder,
                blockNumber: 0,
                transactionHash: "ended-auction",
                notificationType: "settleAuction",
              });
            }
          } catch (error) {
            // Skip invalid auctions
            continue;
          }
        }

        // ✅ DELAY: Pause between batches to avoid rate limiting
        if (batches.length > 1 && batch !== batches[batches.length - 1]) {
          await new Promise((resolve) =>
            setTimeout(resolve, CONFIG.PERFORMANCE.BATCH_DELAY)
          );
        }
      }

      console.log(
        `🏆 [Claim] Found ${claimableAuctions.length} claimable auctions`
      );

      // Create notifications for claimable auctions
      if (claimableAuctions.length > 0) {
        const newNotifications: ClaimNotification[] = [];

        for (const auction of claimableAuctions) {
          const message =
            auction.notificationType === "endAuction"
              ? `🏁 Auction #${auction.auctionId} has expired! Click to end auction and proceed to settlement.`
              : `🏆 You won auction #${auction.auctionId}! Click to claim your NFT.`;

          const notification: ClaimNotification = {
            id: `${auction.notificationType}-${auction.auctionId}-${auction.blockNumber}`,
            auctionId: auction.auctionId,
            message,
            timestamp: Date.now(),
            isRead: false,
            transactionHash: auction.transactionHash,
            priority: "high",
            notificationType: auction.notificationType as
              | "endAuction"
              | "settleAuction",
            isPermanent: true,
          };

          newNotifications.push(notification);

          // Mark as processed
          setProcessedClaimAuctions(
            (prev) => new Set([...prev, auction.auctionId])
          );
        }

        // Add notifications (avoid duplicates)
        setClaimNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const trulyNew = newNotifications.filter(
            (n) => !existingIds.has(n.id)
          );

          if (trulyNew.length > 0) {
            const merged = [...prev, ...trulyNew];
            console.log(
              `💾 [Claim] Adding ${trulyNew.length} new notifications`
            );
            saveClaimNotifications(merged);

            // Reload to ensure sync
            setTimeout(() => {
              reloadClaimNotifications();
            }, 100);

            // Show toasts
            trulyNew.forEach((n) => {
              toast.success(n.message, {
                duration: CONFIG.TOAST_DURATIONS.CLAIM,
                position: "top-right",
              });
            });

            return merged;
          }

          return prev;
        });
      }

      // Update last checked block
      setLastCheckedClaimBlock(currentBlock);

      // Cleanup cache
      auctionCache.cleanup();
    } catch (error) {
      console.error("❌ [Claim] Error fetching claim events:", error);
    }
  }, [
    address,
    isConnected,
    lastCheckedClaimBlock,
    processedClaimAuctions,
    auctionCache,
    lastClaimCheck,
    saveClaimNotifications,
    reloadClaimNotifications,
  ]);

  // ============= OPTIMIZED REFUND EVENT FETCHER =============

  /**
   * Fetch refund notifications with optimized RPC usage
   */
  const fetchRefundEventsOptimized = useCallback(async () => {
    if (!address || !isConnected) {
      console.log(
        `🔍 [Refund] Skipping fetch - not connected (address: ${address}, connected: ${isConnected})`
      );
      return;
    }

    // ✅ THROTTLING: Check if enough time has passed
    const now = Date.now();
    if (now - lastRefundCheck < CONFIG.PERFORMANCE.MIN_CHECK_INTERVAL) {
      console.log(
        `⏭️ [Refund] Skipping - too soon since last check (${Math.round(
          (now - lastRefundCheck) / 1000
        )}s ago)`
      );
      return;
    }
    setLastRefundCheck(now);

    console.log(`🔍 [Refund] Starting optimized fetch for user ${address}`);

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

      // ✅ OPTIMIZED: Limit block range to reduce queryFilter load
      const maxBlockRange = CONFIG.BLOCK_RANGES.LOOKBACK_BLOCKS;
      const fromBlock = Math.max(
        lastCheckedBlock,
        currentBlock - maxBlockRange
      );

      console.log(
        `🔍 [Refund] Block range: ${fromBlock} → ${currentBlock} (lastChecked: ${lastCheckedBlock})`
      );

      if (fromBlock >= currentBlock) {
        console.log(
          `⏭️ [Refund] No new blocks to check (fromBlock: ${fromBlock}, currentBlock: ${currentBlock})`
        );
        return;
      }

      // ✅ OPTIMIZED: Split large block ranges into smaller chunks
      const blockRangeSize = CONFIG.BLOCK_RANGES.MAX_BLOCKS_PER_QUERY;
      const ranges = [];

      for (
        let start = fromBlock;
        start < currentBlock;
        start += blockRangeSize
      ) {
        ranges.push({
          from: start,
          to: Math.min(start + blockRangeSize - 1, currentBlock),
        });
      }

      console.log(
        `📦 [Refund] Fetching events in ${ranges.length} block range(s)`
      );

      const allRefundEvents = [];

      // Fetch events for each range
      for (const range of ranges) {
        console.log(
          `📦 [Refund] Fetching BidRefunded events from block ${range.from} to ${range.to}`
        );

        try {
          const refundEvents = await auctionContract.queryFilter(
            auctionContract.filters.BidRefunded(),
            range.from,
            range.to
          );

          allRefundEvents.push(...refundEvents);
          console.log(
            `📊 [Refund] Found ${refundEvents.length} BidRefunded events in range`
          );

          // Small delay between ranges to avoid rate limiting
          if (ranges.length > 1 && range !== ranges[ranges.length - 1]) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(
            `❌ [Refund] Error fetching events for range ${range.from}-${range.to}:`,
            error
          );
          // Continue with other ranges even if one fails
          continue;
        }
      }

      console.log(
        `📊 [Refund] Total BidRefunded events found: ${allRefundEvents.length}`
      );

      // Filter events for current user
      const userRefundEvents = allRefundEvents.filter((event) => {
        const bidder = (event as any).args?.bidder;
        return bidder && bidder.toLowerCase() === address.toLowerCase();
      });

      console.log(
        `👤 [Refund] Found ${userRefundEvents.length} refund events for current user ${address}`
      );

      if (userRefundEvents.length > 0) {
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

        // Add new notifications to existing ones (avoid duplicates)
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
            duration: CONFIG.TOAST_DURATIONS.REFUND,
            position: "top-right",
          });
        });
      }

      // ✅ OPTIMIZED: Fetch AuctionCancelled events (for Reserve Auctions)
      console.log(
        `🔍 [Reserve] Fetching AuctionCancelled events in ${ranges.length} range(s)`
      );

      const allCancelledEvents = [];

      for (const range of ranges) {
        try {
          const cancelledEvents = await auctionContract.queryFilter(
            auctionContract.filters.AuctionCancelled(),
            range.from,
            range.to
          );

          allCancelledEvents.push(...cancelledEvents);
          console.log(
            `📊 [Reserve] Found ${cancelledEvents.length} AuctionCancelled events in range`
          );

          // Small delay between ranges
          if (ranges.length > 1 && range !== ranges[ranges.length - 1]) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(
            `❌ [Reserve] Error fetching cancelled events for range ${range.from}-${range.to}:`,
            error
          );
          continue;
        }
      }

      console.log(
        `📊 [Reserve] Total AuctionCancelled events found: ${allCancelledEvents.length}`
      );

      // Process cancelled events for Reserve Auctions
      for (const event of allCancelledEvents) {
        const args = (event as any).args;
        const auctionId = args?.auctionId;
        const reason = args?.reason;

        if (!auctionId || !reason) {
          console.warn(
            `⚠️ [Reserve] Skipping cancelled event with missing data:`,
            { auctionId, reason }
          );
          continue;
        }

        const RESERVE_PRICE_NOT_MET_REASON = "Reserve price not met";
        if (reason === RESERVE_PRICE_NOT_MET_REASON) {
          try {
            // Get auction data to check if current user was involved
            const auctionData = await auctionContract.getAuction(auctionId);
            const seller = auctionData.seller;
            const highestBidder = auctionData.highestBidder;

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
      console.error("❌ [Refund] Error fetching refund events:", error);
    }
  }, [
    address,
    isConnected,
    lastCheckedBlock,
    lastRefundCheck,
    saveRefundNotifications,
  ]);

  // Legacy functions for backward compatibility
  const fetchRefundEvents = async () => {
    if (!address || !isConnected) {
      console.log(
        `🔍 [Refund] Skipping fetch - not connected (address: ${address}, connected: ${isConnected})`
      );
      return;
    }

    // ✅ THROTTLING: Check if enough time has passed since last check
    const now = Date.now();
    if (now - lastRefundCheck < CONFIG.PERFORMANCE.MIN_CHECK_INTERVAL) {
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
            duration: CONFIG.TOAST_DURATIONS.REFUND,
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
    if (now - lastClaimCheck < CONFIG.PERFORMANCE.MIN_CHECK_INTERVAL) {
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
        const maxCheckAuctions = CONFIG.PERFORMANCE.MAX_AUCTION_RANGE;
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
            duration: CONFIG.TOAST_DURATIONS.CLAIM,
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

  // ✅ OPTIMIZED: Smarter interval management for REFUND events
  useEffect(() => {
    if (!isConnected || !address) {
      console.log(`🔍 [Refund] Skipping monitor setup - not connected`);
      return;
    }

    console.log(`🔍 [Refund] Setting up optimized monitor for user ${address}`);

    // Initial fetch with quick check
    fetchRefundEventsOptimized();

    // First few minutes: quick checks
    const quickInterval = setInterval(() => {
      fetchRefundEventsOptimized();
    }, CONFIG.INTERVALS.QUICK_CHECK);

    // After 5 minutes: switch to normal checks
    const switchTimeout = setTimeout(() => {
      clearInterval(quickInterval);

      const normalInterval = setInterval(() => {
        fetchRefundEventsOptimized();
      }, CONFIG.INTERVALS.NORMAL_CHECK);

      return () => clearInterval(normalInterval);
    }, 300000); // 5 minutes

    return () => {
      clearInterval(quickInterval);
      clearTimeout(switchTimeout);
    };
  }, [isConnected, address, fetchRefundEventsOptimized]);

  // ✅ OPTIMIZED: Smarter interval management for CLAIM events
  useEffect(() => {
    if (!isConnected || !address) {
      console.log(`🔍 [Claim] Skipping monitor setup - not connected`);
      return;
    }

    console.log(`🔍 [Claim] Setting up optimized monitor for user ${address}`);

    // Initial fetch with quick check
    fetchClaimEventsOptimized();

    // First few minutes: quick checks
    const quickInterval = setInterval(() => {
      fetchClaimEventsOptimized();
    }, CONFIG.INTERVALS.QUICK_CHECK);

    // After 5 minutes: switch to normal checks
    const switchTimeout = setTimeout(() => {
      clearInterval(quickInterval);

      const normalInterval = setInterval(() => {
        fetchClaimEventsOptimized();
      }, CONFIG.INTERVALS.NORMAL_CHECK);

      return () => clearInterval(normalInterval);
    }, 300000); // 5 minutes

    return () => {
      clearInterval(quickInterval);
      clearTimeout(switchTimeout);
    };
  }, [isConnected, address, fetchClaimEventsOptimized]);

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
