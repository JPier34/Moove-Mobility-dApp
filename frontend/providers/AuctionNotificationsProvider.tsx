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

  INTERVALS: {
    QUICK_CHECK: 60000, // 1 minute
    NORMAL_CHECK: 300000, // 5 minutes
    SLOW_CHECK: 600000, // 10 minutes
  },

  PERFORMANCE: {
    MAX_AUCTION_RANGE: 100,
    BATCH_SIZE: 3,
    BATCH_DELAY: 1500,
    MAX_RETRIES: 2,
    RETRY_DELAY: 2000,
    CACHE_DURATION: 120000, // 2 minutes
    MIN_CHECK_INTERVAL: 45000, // 45 seconds
  },

  BLOCK_RANGES: {
    MAX_BLOCKS_PER_QUERY: 5000,
    LOOKBACK_BLOCKS: 10000,
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

  get(auctionId: string): any | null {
    const cached = this.cache.get(auctionId);
    if (!cached) return null;

    const now = Date.now();
    const isExpired = now - cached.timestamp > this.cacheDuration;
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

  set(auctionId: string, data: any, status: number): void {
    this.cache.set(auctionId, {
      data,
      timestamp: Date.now(),
      status,
    });
    console.log(`💾 [Cache] SET auction ${auctionId} (status: ${status})`);
  }

  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.cache.entries()) {
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

  clear(): void {
    this.cache.clear();
    console.log(`🧹 [Cache] Cleared all entries`);
  }
}

// ============= SMART AUCTION FINDER =============

async function findTotalAuctions(
  auctionContract: ethers.Contract,
  cache: AuctionCache
): Promise<number> {
  console.log(`🔍 [Finder] Searching for total auctions...`);

  let low = 1;
  let high = CONFIG.PERFORMANCE.MAX_AUCTION_RANGE;
  let totalAuctions = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    try {
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
        const status = Number(auctionData.status);
        cache.set(mid.toString(), auctionData, status);
        totalAuctions = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    } catch (error) {
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
  notificationType?:
    | "endAuction"
    | "settleAuction"
    | "sealedBidWin"
    | "sealedBidLoss"
    | "auctionFailed";
  isPermanent?: boolean;
  amount?: string;
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
  showConfirmationModal: boolean;
  showResultModal: boolean;
  selectedAuction: WonAuction | null;
  transactionResult: TransactionResult | null;
  addToSealedBidMonitoring: (auctionId: number) => void;
  removeFromSealedBidMonitoring: (auctionId: number) => void;
  monitoredSealedBidAuctions: number[];
  isMonitoringSealedBids: boolean;
  sealedBidError: string | null;
  refundNotifications: RefundNotification[];
  markRefundAsRead: (notificationId: string) => void;
  clearAllRefundNotifications: () => void;
  removeRefundNotification: (notificationId: string) => void;
  claimNotifications: ClaimNotification[];
  markClaimAsRead: (notificationId: string) => void;
  clearAllClaimNotifications: () => void;
  removeClaimNotification: (notificationId: string) => void;
  removePermanentClaimNotification: (notificationId: string) => void;
  reloadClaimNotifications: () => void;
  resetRefundBlock: () => void;
  resetClaimBlock: () => void;
  clearAllNotifications: () => void;
  addSealedBidNotification: (notification: ClaimNotification) => void;
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
  // External hooks
  const { address, isConnected } = useAccount();
  const {
    unsettledAuctions: wonAuctions,
    currentAuction,
    isSettling,
    handleSettleAuction,
  } = useWonAuctionsManager();

  // 3-phase system states
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<WonAuction | null>(
    null
  );
  const [transactionResult, setTransactionResult] =
    useState<TransactionResult | null>(null);

  // Cache and throttling
  const [auctionCache] = useState(() => new AuctionCache());
  const [lastRefundCheck, setLastRefundCheck] = useState<number>(0);
  const [lastClaimCheck, setLastClaimCheck] = useState<number>(0);

  // Sealed bid monitoring
  const {
    addToMonitoring,
    removeFromMonitoring,
    monitoredAuctions,
    isProcessing: isMonitoringSealedBids,
    error: sealedBidError,
  } = useSealedBidAutoMonitor();

  // Notification visibility
  const [showNotifications, setShowNotifications] = useState(true);

  // Refund notifications
  const [refundNotifications, setRefundNotifications] = useState<
    RefundNotification[]
  >([]);
  const [lastCheckedBlock, setLastCheckedBlock] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("moove-last-checked-block");
      return stored ? parseInt(stored) : 0;
    }
    return 0;
  });

  // Claim notifications
  const [claimNotifications, setClaimNotifications] = useState<
    ClaimNotification[]
  >([]);
  const [lastCheckedClaimBlock, setLastCheckedClaimBlock] = useState<number>(
    () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("moove-last-checked-claim-block");
        return stored ? parseInt(stored) : 0;
      }
      return 0;
    }
  );

  // Processed auctions tracking
  const [processedClaimAuctions, setProcessedClaimAuctions] = useState<
    Set<string>
  >(() => {
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

  // Auto-save effects
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "moove-last-checked-block",
          lastCheckedBlock.toString()
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
      } catch (error) {
        console.warn("Failed to save lastCheckedClaimBlock:", error);
      }
    }
  }, [lastCheckedClaimBlock]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "moove-processed-claim-auctions",
          JSON.stringify([...processedClaimAuctions])
        );
      } catch (error) {
        console.warn("Failed to save processedClaimAuctions:", error);
      }
    }
  }, [processedClaimAuctions]);

  // Notification management functions
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
    setClaimNotifications((prev) => {
      const notification = prev.find((n) => n.id === notificationId);
      if (notification?.isPermanent) {
        return prev;
      }
      return prev.filter((n) => n.id !== notificationId);
    });
  };

  const removePermanentClaimNotification = (notificationId: string) => {
    setClaimNotifications((prev) =>
      prev.filter((n) => n.id !== notificationId)
    );
  };

  const markClaimAsRead = (notificationId: string) => {
    setClaimNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  };

  const clearAllClaimNotifications = () => {
    setClaimNotifications((prev) => {
      const permanentNotifications = prev.filter((n) => n.isPermanent === true);
      return permanentNotifications;
    });
  };

  const resetRefundBlock = () => {
    setLastCheckedBlock(0);
  };

  const resetClaimBlock = () => {
    setLastCheckedClaimBlock(0);
  };

  const clearAllNotifications = () => {
    setRefundNotifications([]);
    clearAllClaimNotifications();
    setLastCheckedBlock(0);
    setLastCheckedClaimBlock(0);
    setProcessedClaimAuctions(new Set());

    if (typeof window !== "undefined") {
      localStorage.removeItem("moove-refund-notifications");
      localStorage.removeItem("moove-claim-notifications");
      localStorage.removeItem("moove-last-checked-block");
      localStorage.removeItem("moove-last-checked-claim-block");
      localStorage.removeItem("moove-processed-claim-auctions");
    }
  };

  const addSealedBidNotification = (notification: ClaimNotification) => {
    console.log(`🔒 [SealedBid] Adding notification:`, notification);

    setClaimNotifications((prev) => {
      // Check if notification already exists
      const exists = prev.some((n) => n.id === notification.id);
      if (exists) {
        console.log(
          `🔒 [SealedBid] Notification ${notification.id} already exists, skipping`
        );
        return prev;
      }

      const merged = [...prev, notification];
      saveClaimNotifications(merged);

      // Show toast
      toast.success(notification.message, {
        duration: CONFIG.TOAST_DURATIONS.CLAIM,
        position: "top-right",
      });

      return merged;
    });
  };

  // Save/load helpers
  const saveRefundNotifications = useCallback(
    (notifications: RefundNotification[]) => {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem(
          "moove-refund-notifications",
          JSON.stringify(notifications)
        );
      } catch (error) {
        console.warn("Failed to save refund notifications:", error);
      }
    },
    []
  );

  const loadRefundNotifications = useCallback((): RefundNotification[] => {
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
  }, []);

  const saveClaimNotifications = useCallback(
    (notifications: ClaimNotification[]) => {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem(
          "moove-claim-notifications",
          JSON.stringify(notifications)
        );
      } catch (error) {
        console.warn("Failed to save claim notifications:", error);
      }
    },
    []
  );

  const loadClaimNotifications = useCallback((): ClaimNotification[] => {
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
  }, []);

  const reloadClaimNotifications = useCallback(() => {
    const loaded = loadClaimNotifications();
    setClaimNotifications(loaded);
  }, [loadClaimNotifications]);

  // Optimized fetch functions
  const fetchClaimEventsOptimized = useCallback(async () => {
    if (!address || !isConnected) {
      return;
    }

    const now = Date.now();
    if (now - lastClaimCheck < CONFIG.PERFORMANCE.MIN_CHECK_INTERVAL) {
      return;
    }
    setLastClaimCheck(now);

    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || "https://1rpc.io/sepolia"
      );
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(
        lastCheckedClaimBlock,
        currentBlock - CONFIG.BLOCK_RANGES.LOOKBACK_BLOCKS
      );

      if (fromBlock >= currentBlock) {
        return;
      }

      const cacheStats = auctionCache.getStats();
      console.log(
        `📊 [Cache] Stats: ${cacheStats.size} total, ${cacheStats.settled} settled, ${cacheStats.active} active`
      );

      const totalAuctions = await findTotalAuctions(
        auctionContract,
        auctionCache
      );

      if (totalAuctions === 0) {
        return;
      }

      const claimableAuctions = [];
      const nowTimestamp = Math.floor(Date.now() / 1000);

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

      for (const batch of batches) {
        for (let auctionId = batch.end; auctionId >= batch.start; auctionId--) {
          try {
            let auctionData = auctionCache.get(auctionId.toString());
            let status: number = 0;

            if (!auctionData) {
              let retries = CONFIG.PERFORMANCE.MAX_RETRIES;
              while (retries > 0) {
                try {
                  auctionData = await auctionContract.getAuction(auctionId);
                  status = Number(auctionData.status);
                  auctionCache.set(auctionId.toString(), auctionData, status);
                  break;
                } catch (error) {
                  retries--;
                  if (retries === 0) continue;
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

            if (auctionType === 1) continue; // Skip Dutch auctions
            if (status === 4 || status === 5) continue;

            // ✅ SEALED BID LOGIC: Special handling for sealed bid auctions
            if (auctionType === 2) {
              // For sealed bid auctions, we need to check if user has bids
              // and if the auction is in REVEAL or ENDED phase
              if (status === 2 || status === 3) {
                // Check if user has any bids in this sealed bid auction
                try {
                  const bids = await auctionContract.getAuctionBids(auctionId);
                  const userHasBids = bids.some(
                    (bid: any) =>
                      bid.bidder.toLowerCase() === address.toLowerCase()
                  );

                  if (!userHasBids) continue; // User didn't bid on this sealed bid auction

                  // User has bids, check if they won
                  let userWon = false;
                  if (status === 3) {
                    // ENDED phase
                    userWon =
                      highestBidder.toLowerCase() === address.toLowerCase();
                  }

                  console.log(
                    `🔒 [SealedBid] Auction ${auctionId}: userHasBids=${userHasBids}, userWon=${userWon}, status=${status}`
                  );

                  // Only proceed if user has bids
                  if (!userHasBids) continue;
                } catch (error) {
                  console.warn(
                    `⚠️ [SealedBid] Could not check bids for auction ${auctionId}:`,
                    error
                  );
                  continue;
                }
              } else {
                // Still in ACTIVE phase, skip
                continue;
              }
            } else {
              // For non-sealed bid auctions, check if user is highest bidder
              if (highestBidder.toLowerCase() !== address.toLowerCase())
                continue;
            }

            // ✅ SEQUENTIAL NOTIFICATION LOGIC
            // Check if endAuction notification already exists for this auction
            const hasEndAuctionNotification = claimNotifications.some(
              (n) =>
                n.auctionId === auctionId.toString() &&
                n.notificationType === "endAuction"
            );

            // ✅ CASE 1: ACTIVE but expired → needs endAuction()
            if (status === 1 && nowTimestamp > endTime) {
              // Only create endAuction notification if it doesn't exist
              if (!hasEndAuctionNotification) {
                claimableAuctions.push({
                  auctionId: auctionId.toString(),
                  endTime,
                  highestBidder,
                  blockNumber: 0,
                  transactionHash: "expired-auction",
                  notificationType: "endAuction",
                });
              }
            }
            // ✅ CASE 2: ENDED (status 3) → needs settleAuction()
            else if (status === 3) {
              // Only create settleAuction notification if endAuction notification is gone
              if (!hasEndAuctionNotification) {
                claimableAuctions.push({
                  auctionId: auctionId.toString(),
                  endTime,
                  highestBidder,
                  blockNumber: 0,
                  transactionHash: "ended-auction",
                  notificationType: "settleAuction",
                });
              }
            }
            // ✅ CASE 3: SEALED BID REVEAL (status 2) → needs reveal bids
            else if (auctionType === 2 && status === 2) {
              // Check if user has unrevealed bids
              try {
                const bids = await auctionContract.getAuctionBids(auctionId);
                const userBids = bids.filter(
                  (bid: any) =>
                    bid.bidder.toLowerCase() === address.toLowerCase()
                );

                if (userBids.length > 0) {
                  console.log(
                    `🔒 [SealedBid] User has ${userBids.length} bids to reveal in auction ${auctionId}`
                  );
                  // For now, we'll create a generic notification
                  // In the future, we could add specific "reveal bid" notifications
                }
              } catch (error) {
                console.warn(
                  `⚠️ [SealedBid] Could not check user bids for auction ${auctionId}:`,
                  error
                );
              }
            }
          } catch (error) {
            continue;
          }
        }

        if (batches.length > 1 && batch !== batches[batches.length - 1]) {
          await new Promise((resolve) =>
            setTimeout(resolve, CONFIG.PERFORMANCE.BATCH_DELAY)
          );
        }
      }

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
        }

        setClaimNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const trulyNew = newNotifications.filter(
            (n) => !existingIds.has(n.id)
          );

          if (trulyNew.length > 0) {
            console.log(
              `🔔 [Claim] Adding ${trulyNew.length} new notifications:`,
              trulyNew.map((n) => `${n.notificationType}-${n.auctionId}`)
            );

            const merged = [...prev, ...trulyNew];
            saveClaimNotifications(merged);

            setTimeout(() => {
              reloadClaimNotifications();
            }, 100);

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

      setLastCheckedClaimBlock(currentBlock);
      auctionCache.cleanup();
    } catch (error) {
      console.error("❌ [Claim] Error fetching claim events:", error);
    }
  }, [
    address,
    isConnected,
    lastCheckedClaimBlock,
    claimNotifications,
    auctionCache,
    lastClaimCheck,
    saveClaimNotifications,
    reloadClaimNotifications,
  ]);

  const fetchRefundEventsOptimized = useCallback(async () => {
    if (!address || !isConnected) {
      return;
    }

    const now = Date.now();
    if (now - lastRefundCheck < CONFIG.PERFORMANCE.MIN_CHECK_INTERVAL) {
      return;
    }
    setLastRefundCheck(now);

    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || "https://1rpc.io/sepolia"
      );
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      const currentBlock = await provider.getBlockNumber();
      const maxBlockRange = CONFIG.BLOCK_RANGES.LOOKBACK_BLOCKS;
      const fromBlock = Math.max(
        lastCheckedBlock,
        currentBlock - maxBlockRange
      );

      if (fromBlock >= currentBlock) {
        return;
      }

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

      const allRefundEvents = [];

      for (const range of ranges) {
        try {
          const refundEvents = await auctionContract.queryFilter(
            auctionContract.filters.BidRefunded(),
            range.from,
            range.to
          );

          allRefundEvents.push(...refundEvents);

          if (ranges.length > 1 && range !== ranges[ranges.length - 1]) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (error) {
          continue;
        }
      }

      const userRefundEvents = allRefundEvents.filter((event) => {
        const bidder = (event as any).args?.bidder;
        return bidder && bidder.toLowerCase() === address.toLowerCase();
      });

      if (userRefundEvents.length > 0) {
        const newNotifications: RefundNotification[] = [];

        for (const event of userRefundEvents) {
          const args = (event as any).args;
          const auctionId = args?.auctionId;
          const bidder = args?.bidder;
          const amount = args?.amount;

          if (!auctionId || !bidder || !amount) continue;

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

        setRefundNotifications((prev) => {
          const merged = [...prev, ...newNotifications];
          const unique = merged.filter(
            (n, index, self) => index === self.findIndex((t) => t.id === n.id)
          );
          saveRefundNotifications(unique);
          return unique;
        });

        newNotifications.forEach((notification) => {
          toast.success(notification.message, {
            duration: CONFIG.TOAST_DURATIONS.REFUND,
            position: "top-right",
          });
        });
      }

      // Fetch AuctionCancelled events
      const allCancelledEvents = [];

      for (const range of ranges) {
        try {
          const cancelledEvents = await auctionContract.queryFilter(
            auctionContract.filters.AuctionCancelled(),
            range.from,
            range.to
          );

          allCancelledEvents.push(...cancelledEvents);

          if (ranges.length > 1 && range !== ranges[ranges.length - 1]) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (error) {
          continue;
        }
      }

      for (const event of allCancelledEvents) {
        const args = (event as any).args;
        const auctionId = args?.auctionId;
        const reason = args?.reason;

        if (!auctionId || !reason) continue;

        const RESERVE_PRICE_NOT_MET_REASON = "Reserve price not met";
        if (reason === RESERVE_PRICE_NOT_MET_REASON) {
          try {
            const auctionData = await auctionContract.getAuction(auctionId);
            const seller = auctionData.seller;
            const highestBidder = auctionData.highestBidder;

            if (seller.toLowerCase() === address.toLowerCase()) {
              toast.success(
                `🏠 Reserve Auction #${auctionId} was automatically cancelled because the highest bid was below the reserve price. Your NFT has been returned to you.`,
                {
                  duration: 8000,
                  position: "top-right",
                }
              );
            }

            if (highestBidder.toLowerCase() === address.toLowerCase()) {
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

  // Initialize notifications from localStorage
  useEffect(() => {
    const stored = loadRefundNotifications();
    setRefundNotifications(stored);
    if (stored.length === 0) {
      setLastCheckedBlock(0);
    }
  }, [loadRefundNotifications]);

  useEffect(() => {
    const stored = loadClaimNotifications();
    setClaimNotifications(stored);
    if (stored.length === 0) {
      setLastCheckedClaimBlock(0);
    }
  }, [loadClaimNotifications]);

  // Setup interval monitoring for refund events
  useEffect(() => {
    if (!isConnected || !address) {
      return;
    }

    fetchRefundEventsOptimized();

    const quickInterval = setInterval(() => {
      fetchRefundEventsOptimized();
    }, CONFIG.INTERVALS.QUICK_CHECK);

    const switchTimeout = setTimeout(() => {
      clearInterval(quickInterval);

      const normalInterval = setInterval(() => {
        fetchRefundEventsOptimized();
      }, CONFIG.INTERVALS.NORMAL_CHECK);

      return () => clearInterval(normalInterval);
    }, 300000);

    return () => {
      clearInterval(quickInterval);
      clearTimeout(switchTimeout);
    };
  }, [isConnected, address, fetchRefundEventsOptimized]);

  // Setup interval monitoring for claim events
  useEffect(() => {
    if (!isConnected || !address) {
      return;
    }

    fetchClaimEventsOptimized();

    const quickInterval = setInterval(() => {
      fetchClaimEventsOptimized();
    }, CONFIG.INTERVALS.QUICK_CHECK);

    const switchTimeout = setTimeout(() => {
      clearInterval(quickInterval);

      const normalInterval = setInterval(() => {
        fetchClaimEventsOptimized();
      }, CONFIG.INTERVALS.NORMAL_CHECK);

      return () => clearInterval(normalInterval);
    }, 300000);

    return () => {
      clearInterval(quickInterval);
      clearTimeout(switchTimeout);
    };
  }, [isConnected, address, fetchClaimEventsOptimized]);

  // ✅ IMMEDIATE CHECK: Listen for force claim check events
  useEffect(() => {
    const handleForceClaimCheck = (event: CustomEvent) => {
      const { auctionId } = event.detail;
      console.log(
        `🔄 [ForceCheck] Received force claim check for auction ${auctionId}`
      );

      // Clear cache for this specific auction to force fresh data
      auctionCache.clear();

      // Trigger immediate claim check
      setTimeout(() => {
        fetchClaimEventsOptimized();
      }, 1000); // Small delay to ensure transaction is fully processed
    };

    const handleAddSealedBidNotification = (event: CustomEvent) => {
      const notification = event.detail;
      console.log(
        `🔒 [SealedBid] Received sealed bid notification event:`,
        notification
      );
      addSealedBidNotification(notification);
    };

    window.addEventListener(
      "forceClaimCheck",
      handleForceClaimCheck as EventListener
    );
    window.addEventListener(
      "addSealedBidNotification",
      handleAddSealedBidNotification as EventListener
    );

    return () => {
      window.removeEventListener(
        "forceClaimCheck",
        handleForceClaimCheck as EventListener
      );
      window.removeEventListener(
        "addSealedBidNotification",
        handleAddSealedBidNotification as EventListener
      );
    };
  }, [fetchClaimEventsOptimized, auctionCache, addSealedBidNotification]);

  // ✅ SEALED BID MONITORING: Activate automatic monitoring for sealed bid auctions
  useEffect(() => {
    if (!address || !isConnected || !addToMonitoring) {
      console.log(
        "🔒 [SealedBid] Monitoring not available - wallet not connected or function not available"
      );
      return;
    }

    console.log("🔒 [SealedBid] Starting automatic monitoring system...");

    const startSealedBidMonitoring = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(
          process.env.NEXT_PUBLIC_RPC_URL || "https://1rpc.io/sepolia"
        );
        const auctionContract = new ethers.Contract(
          contracts.MooveAuction.address,
          contracts.MooveAuction.abi,
          provider
        );

        console.log("🔍 [SealedBid] Fetching total auctions...");
        const totalAuctions = await auctionContract.totalAuctions();
        console.log(`📊 [SealedBid] Found ${totalAuctions} total auctions`);

        let sealedBidCount = 0;
        for (let i = 1; i <= totalAuctions; i++) {
          try {
            const auction = await auctionContract.getAuction(i);
            const auctionType = Number(auction.auctionType);
            const status = Number(auction.status);

            if (auctionType === 2) {
              // SEALED_BID
              console.log(
                `🔒 [SealedBid] Adding auction ${i} to monitoring (status: ${status})`
              );
              addToMonitoring(i);
              sealedBidCount++;
            }
          } catch (error) {
            // Check if it's an "Auction does not exist" error
            if (
              error instanceof Error &&
              error.message.includes("Auction does not exist")
            ) {
              console.log(
                `📝 [SealedBid] Auction ${i} does not exist, skipping`
              );
              break; // Stop iterating if we hit a non-existent auction
            } else {
              console.warn(
                `⚠️ [SealedBid] Could not fetch auction ${i}:`,
                error
              );
            }
          }
        }

        console.log(
          `✅ [SealedBid] Added ${sealedBidCount} sealed bid auctions to monitoring`
        );
      } catch (error) {
        console.error(
          "❌ [SealedBid] Error starting sealed bid monitoring:",
          error
        );
      }
    };

    // Start monitoring with a small delay to ensure everything is initialized
    const startTimeout = setTimeout(() => {
      startSealedBidMonitoring();
    }, 2000);

    return () => {
      clearTimeout(startTimeout);
    };
  }, [address, isConnected, addToMonitoring]);

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
    showConfirmationModal,
    showResultModal,
    selectedAuction,
    transactionResult,
    addToSealedBidMonitoring: addToMonitoring,
    removeFromSealedBidMonitoring: removeFromMonitoring,
    monitoredSealedBidAuctions: monitoredAuctions,
    isMonitoringSealedBids,
    sealedBidError,
    refundNotifications,
    markRefundAsRead,
    clearAllRefundNotifications,
    removeRefundNotification,
    claimNotifications,
    markClaimAsRead,
    clearAllClaimNotifications,
    removeClaimNotification,
    removePermanentClaimNotification,
    reloadClaimNotifications,
    resetRefundBlock,
    resetClaimBlock,
    clearAllNotifications,
    addSealedBidNotification,
  };

  return (
    <AuctionNotificationsContext.Provider value={contextValue}>
      {children}
      <ConsolidatedNotificationBadge />
    </AuctionNotificationsContext.Provider>
  );
};

export { AuctionNotificationsContext };
