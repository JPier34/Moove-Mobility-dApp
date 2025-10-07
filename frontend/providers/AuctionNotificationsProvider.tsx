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

        // Check recent auctions (last 50) for expired ones where user is winner
        const startAuction = Math.max(1, totalAuctions - 50);
        for (
          let auctionId = startAuction;
          auctionId <= totalAuctions;
          auctionId++
        ) {
          try {
            const auctionData = await auctionContract.getAuction(auctionId);
            const status = Number(auctionData.status);
            const endTime = Number(auctionData.endTime);
            const highestBidder = auctionData.highestBidder;
            const auctionType = Number(auctionData.auctionType);
            const now = Math.floor(Date.now() / 1000);

            // Skip Dutch auctions (they settle immediately on purchase)
            if (auctionType === 1) {
              // Dutch auction
              continue;
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
      console.log(
        `👤 [Claim] Total claimable auctions: ${allClaimableAuctions.length} (${allUserEvents.length} from events + ${expiredWinnerAuctions.length} expired)`
      );

      if (allClaimableAuctions.length > 0) {
        console.log(
          `👤 [Claim] Processing ${allClaimableAuctions.length} claim events for current user`
        );

        const newNotifications: ClaimNotification[] = [];

        for (const auction of allClaimableAuctions) {
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

  // ✅ RESERVE AUCTION VIOLATION DETECTION
  const checkReserveAuctionViolations = useCallback(async () => {
    if (!address || !isConnected) return;

    try {
      console.log(
        `🔍 [Reserve Monitor] Checking for Reserve Auction violations...`
      );

      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      // Check recent auctions (last 50)
      const maxCheckAuctions = 50;
      let highestAuctionId = 0;

      // Find highest auction ID
      for (let i = maxCheckAuctions; i >= 0; i--) {
        try {
          const auctionData = await auctionContract.getAuction(i);
          if (
            auctionData &&
            auctionData.seller !== "0x0000000000000000000000000000000000000000"
          ) {
            highestAuctionId = i;
            break;
          }
        } catch (error) {
          // Auction doesn't exist, continue
        }
      }

      console.log(
        `🔍 [Reserve Monitor] Found highest auction ID: ${highestAuctionId}`
      );

      // Check last 20 auctions for violations
      const checkRange = Math.min(20, highestAuctionId + 1);
      for (
        let auctionId = highestAuctionId;
        auctionId >= Math.max(0, highestAuctionId - checkRange);
        auctionId--
      ) {
        try {
          const auctionData = await auctionContract.getAuction(auctionId);

          if (
            !auctionData ||
            auctionData.seller === "0x0000000000000000000000000000000000000000"
          ) {
            continue;
          }

          // Check if this is a Reserve Auction that ended below reserve
          if (Number(auctionData.auctionType) === 3) {
            // Reserve Auction
            const winningBid = BigInt(auctionData.highestBid);
            const reservePrice = BigInt(auctionData.reservePrice);
            const status = Number(auctionData.status);
            const endTime = Number(auctionData.endTime);
            const now = Math.floor(Date.now() / 1000);
            const isEnded = status === 2; // ENDED status
            const isExpired = status === 1 && now > endTime; // ACTIVE but expired
            const isBelowReserve = winningBid < reservePrice;

            if ((isEnded || isExpired) && isBelowReserve && winningBid > 0n) {
              const violationType = isEnded ? "ENDED" : "EXPIRED";
              console.warn(
                `🚨 [Reserve Monitor] VIOLATION DETECTED: Auction #${auctionId} ${violationType} below reserve!`,
                {
                  auctionId,
                  status,
                  endTime,
                  now,
                  isEnded,
                  isExpired,
                  winningBid: ethers.formatEther(winningBid),
                  reservePrice: ethers.formatEther(reservePrice),
                  seller: auctionData.seller,
                  highestBidder: auctionData.highestBidder,
                }
              );

              // Check if current user is the seller
              if (auctionData.seller.toLowerCase() === address.toLowerCase()) {
                const notificationId = `reserve-violation-seller-${auctionId}`;

                // Check if we already notified about this violation
                const existingNotification = refundNotifications.find(
                  (n) => n.id === notificationId
                );
                if (!existingNotification) {
                  const violationNotification: RefundNotification = {
                    id: notificationId,
                    message: `🚨 CRITICAL: Reserve Auction #${auctionId} ended below reserve price! NFT should be returned to you. Contact admin immediately.`,
                    timestamp: Date.now(),
                    isRead: false,
                    auctionId: auctionId.toString(),
                    amount: ethers.formatEther(winningBid),
                    transactionHash: "reserve-violation",
                  };

                  setRefundNotifications((prev) => [
                    ...prev,
                    violationNotification,
                  ]);
                  console.log(
                    `📢 [Reserve Monitor] Added violation notification for seller`
                  );
                }
              }

              // Check if current user is the highest bidder
              if (
                auctionData.highestBidder.toLowerCase() ===
                address.toLowerCase()
              ) {
                const notificationId = `reserve-violation-bidder-${auctionId}`;

                const existingNotification = refundNotifications.find(
                  (n) => n.id === notificationId
                );
                if (!existingNotification) {
                  const violationNotification: RefundNotification = {
                    id: notificationId,
                    message: `⚠️ Auction #${auctionId} ended below reserve price. Your bid of ${ethers.formatEther(
                      winningBid
                    )} ETH will be refunded. Do NOT claim this auction.`,
                    timestamp: Date.now(),
                    isRead: false,
                    auctionId: auctionId.toString(),
                    amount: ethers.formatEther(winningBid),
                    transactionHash: "reserve-violation",
                  };

                  setRefundNotifications((prev) => [
                    ...prev,
                    violationNotification,
                  ]);
                  console.log(
                    `📢 [Reserve Monitor] Added violation notification for bidder`
                  );
                }
              }
            }
          }
        } catch (error) {
          // Auction doesn't exist or error reading, continue
        }
      }
    } catch (error) {
      console.error(`❌ [Reserve Monitor] Error checking violations:`, error);
    }
  }, [address, isConnected, refundNotifications]);

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
    // ✅ Also check for Reserve Auction violations on startup
    checkReserveAuctionViolations();

    // Setup interval (every 30 seconds)
    const interval = setInterval(() => {
      console.log(`⏰ [Refund] Periodic fetch triggered`);
      fetchRefundEvents();
      // ✅ Also check for Reserve Auction violations
      checkReserveAuctionViolations();
    }, 30000);

    return () => {
      console.log(`🔍 [Refund] Cleaning up monitor for user ${address}`);
      clearInterval(interval);
    };
  }, [
    isConnected,
    address,
    lastCheckedBlock,
    fetchRefundEvents,
    checkReserveAuctionViolations,
  ]);

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
