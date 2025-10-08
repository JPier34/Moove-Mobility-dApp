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

  // Mock states for compatibility
  const transactionHash = null;
  const isWaitingForConfirmation = false;

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
  const [lastCheckedBlock, setLastCheckedBlock] = useState<number>(0);

  // Claim notifications state
  const [claimNotifications, setClaimNotifications] = useState<
    ClaimNotification[]
  >([]);
  const [lastCheckedClaimBlock, setLastCheckedClaimBlock] = useState<number>(0);

  // Track processed auctions to avoid duplicates
  const [processedClaimAuctions, setProcessedClaimAuctions] = useState<
    Set<string>
  >(new Set());

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
    setClaimNotifications([]);
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
    console.log(`🧹 [All] Clearing all notifications`);
    setRefundNotifications([]);
    setClaimNotifications([]);
    setLastCheckedBlock(0);
    setLastCheckedClaimBlock(0);
    setProcessedClaimAuctions(new Set());

    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("moove-refund-notifications");
      localStorage.removeItem("moove-claim-notifications");
      localStorage.removeItem("moove-last-checked-block");
      localStorage.removeItem("moove-last-checked-claim-block");
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

  // Fetch refund events from blockchain
  const fetchRefundEvents = async () => {
    if (!address || !isConnected) {
      console.log(
        `🔍 [Refund] Skipping fetch - not connected (address: ${address}, connected: ${isConnected})`
      );
      return;
    }

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
            duration: 5000,
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
        if (reason === "Reserve price not met") {
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

      // Fetch both AuctionSettled and AuctionEnded events
      const [settledEvents, endedEvents] = await Promise.all([
        auctionContract.queryFilter(
          auctionContract.filters.AuctionSettled(null, address),
          fromBlock,
          currentBlock
        ),
        auctionContract.queryFilter(
          auctionContract.filters.AuctionEnded(),
          fromBlock,
          currentBlock
        ),
      ]);

      console.log(
        `📊 [Claim] Found ${settledEvents.length} AuctionSettled events and ${endedEvents.length} AuctionEnded events`
      );

      // Process AuctionSettled events (these have winner information)
      const userSettledEvents = settledEvents.filter((event) => {
        const winner = (event as any).args?.winner;
        return winner && winner.toLowerCase() === address.toLowerCase();
      });

      // Process AuctionEnded events (need to check winner manually)
      const userEndedEvents = [];
      for (const event of endedEvents) {
        const auctionId = (event as any).args?.auctionId;
        if (auctionId) {
          try {
            // Get auction data to check winner
            const auctionData = await auctionContract.getAuction(auctionId);
            const winner = auctionData.highestBidder;
            if (winner && winner.toLowerCase() === address.toLowerCase()) {
              userEndedEvents.push(event);
            }
          } catch (error) {
            console.warn(
              `⚠️ [Claim] Could not check winner for auction ${auctionId}:`,
              error
            );
          }
        }
      }

      const allUserEvents = [...userSettledEvents, ...userEndedEvents];
      console.log(
        `👤 [Claim] Found ${allUserEvents.length} claim events for current user ${address} (${userSettledEvents.length} settled + ${userEndedEvents.length} ended)`
      );

      // Additional check: Look for expired auctions where user is winner
      console.log(
        `🔍 [Claim] Checking for expired auctions where user is winner...`
      );
      const expiredWinnerAuctions = [];

      try {
        // Instead of getTotalAuctions, we'll check a reasonable range
        // Start from a high number and work backwards until we find valid auctions
        const maxCheckAuctions = 100; // Check up to 100 auctions
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

        // Check ALL auctions for expired ones where user is winner
        // Start from auction #1, but prioritize recent auctions and Reserve Auctions
        const startAuction = 1; // Always start from 1
        const endAuction = totalAuctions;

        console.log(
          `🔍 [Claim] Checking auctions from ${startAuction} to ${endAuction} for expired winners`
        );
        for (
          let auctionId = startAuction;
          auctionId <= endAuction;
          auctionId++
        ) {
          try {
            const auctionData = await auctionContract.getAuction(auctionId);
            const status = Number(auctionData.status);
            const endTime = Number(auctionData.endTime);
            const highestBidder = auctionData.highestBidder;
            const auctionType = Number(auctionData.auctionType);
            const now = Math.floor(Date.now() / 1000);

            // Debug logging for each auction
            console.log(
              `🔍 [Claim] Checking auction ${auctionId}: status=${status}, endTime=${endTime}, now=${now}, highestBidder=${highestBidder}, auctionType=${auctionType}, isExpired=${
                now > endTime
              }`
            );

            // Special logging for auction #2
            if (auctionId === 2) {
              console.log(`🎯 [Claim] SPECIAL DEBUG for Auction #2:`, {
                auctionId,
                status,
                endTime,
                now,
                isExpired: now > endTime,
                highestBidder,
                userAddress: address,
                isUserWinner:
                  highestBidder.toLowerCase() === address.toLowerCase(),
                auctionType,
                endTimeFormatted: new Date(endTime * 1000).toLocaleString(),
                nowFormatted: new Date(now * 1000).toLocaleString(),
              });
            }

            // Skip Dutch auctions (they settle immediately on purchase)
            if (auctionType === 1) {
              // Dutch auction
              continue;
            }

            // ✅ FILTER: Skip very old auctions (before #30) unless they are Reserve Auctions
            if (Number(auctionId) < 30 && auctionType !== 3) {
              console.log(
                `⏭️ [Claim] Skipping old auction ${auctionId} (before #30, not Reserve)`
              );
              continue;
            }

            if (Number(auctionId) < 30 && auctionType === 3) {
              console.log(
                `🔍 [Claim] Including old Reserve Auction ${auctionId} (before #30 but Reserve Auction)`
              );
            }

            // ✅ CHECK: Verify auction is actually claimable by checking contract status
            try {
              const auctionData = await auctionContract.getAuction(auctionId);
              const status = Number(auctionData.status);

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
            } catch (error) {
              console.warn(
                `⚠️ [Claim] Could not verify auction ${auctionId} status:`,
                error
              );
              continue;
            }

            // ✅ FILTER: Only process recent auctions (last 30 days) - more lenient for claim notifications
            // BUT: Always include Reserve Auctions regardless of age (they might need special handling)
            const thirtyDaysAgo =
              Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;

            if (endTime < thirtyDaysAgo && auctionType !== 3) {
              console.log(
                `⏭️ [Claim] Skipping very old auction ${auctionId} (older than 30 days, not Reserve)`
              );
              continue;
            }

            if (endTime < thirtyDaysAgo && auctionType === 3) {
              console.log(
                `🔍 [Claim] Including old Reserve Auction ${auctionId} (older than 30 days but Reserve Auction)`
              );
            }

            // Check if auction is ACTIVE but expired and user is winner
            if (
              status === 1 &&
              now > endTime &&
              highestBidder.toLowerCase() === address.toLowerCase()
            ) {
              console.log(
                `🏆 [Claim] Found expired auction ${auctionId} where user is winner:`,
                {
                  status,
                  endTime,
                  now,
                  highestBidder,
                  auctionType,
                  isExpired: now > endTime,
                }
              );

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
                    `⚠️ [Claim] This auction should be automatically cancelled by settleAuction, not claimed`
                  );
                  // Don't add to claimable auctions - this should be handled by Reserve Auction monitoring
                  continue;
                } else {
                  console.log(
                    `✅ [Claim] Reserve Auction ${auctionId} has bid above reserve: ${highestBidAmount} >= ${reservePrice}`
                  );
                }
              }

              expiredWinnerAuctions.push({
                auctionId: auctionId.toString(),
                endTime,
                highestBidder,
                blockNumber: 0, // No specific block
                transactionHash: "expired-auction",
              });
            }
          } catch (error) {
            // Skip invalid auctions
            continue;
          }
        }

        console.log(
          `🏆 [Claim] Found ${expiredWinnerAuctions.length} expired auctions where user is winner`
        );
      } catch (error) {
        console.warn(`⚠️ [Claim] Error checking expired auctions:`, error);
      }

      const allClaimableAuctions = [...allUserEvents, ...expiredWinnerAuctions];

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
        } (${allUserEvents.length} from events + ${
          expiredWinnerAuctions.length
        } expired, ${
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

          // Handle different auction object types
          if ("auctionId" in auction) {
            // Expired auction object
            auctionId = auction.auctionId;
          } else {
            // Event object
            const args = (auction as any).args;
            auctionId = args?.auctionId;
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

          console.log(`🏆 [Claim] Processing claim: auction ${auctionId}`);

          const notification: ClaimNotification = {
            id: `${auctionId}-claim-${
              "blockNumber" in auction ? auction.blockNumber : Date.now()
            }`,
            auctionId: auctionId.toString(),
            message: `🎉 You won auction #${auctionId}! Click to claim your NFT.`,
            timestamp: Date.now(),
            isRead: false,
            transactionHash:
              "transactionHash" in auction
                ? auction.transactionHash
                : "expired-auction",
            priority: "high",
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
            duration: 8000,
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

    // Setup interval (every 30 seconds)
    const interval = setInterval(() => {
      console.log(`⏰ [Refund] Periodic fetch triggered`);
      fetchRefundEvents();
    }, 30000);

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

    // Setup interval (every 30 seconds)
    const interval = setInterval(() => {
      console.log(`⏰ [Claim] Periodic fetch triggered`);
      fetchClaimEvents();
    }, 30000);

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
    transactionHash,
    isWaitingForConfirmation,
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
