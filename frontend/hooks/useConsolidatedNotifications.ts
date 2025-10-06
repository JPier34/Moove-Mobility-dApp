"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "../utils/contracts";

// ============= TIPI UNIFICATI =============

export interface ConsolidatedNotification {
  id: string; // Unique ID: auctionId-type-timestamp
  auctionId: string;
  type: "claim_ready" | "claimed" | "refund" | "win" | "auction_ended";
  message: string;
  timestamp: number;
  transactionHash?: string;
  amount?: string;
  isRead: boolean;
  isDismissed: boolean;
  priority: "high" | "medium" | "low";
}

interface AuctionEventData {
  auctionId: string;
  bidder: string;
  amount: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
}

// ============= CONFIGURAZIONE =============

const CONFIG = {
  FETCH_INTERVAL: 30000, // 30 seconds to reduce excessive calls
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000, // 5 secondi
  RATE_LIMIT_DELAY: 30000, // 30 secondi
  MAX_NOTIFICATIONS: 50,
  CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 ore
} as const;

// ============= HOOK PRINCIPALE =============

export function useConsolidatedNotifications() {
  const { address } = useAccount();
  const [notifications, setNotifications] = useState<
    ConsolidatedNotification[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckedBlock, setLastCheckedBlock] = useState<number>(0);

  // Track dismissed notifications to prevent them from being reloaded
  const [dismissedNotifications, setDismissedNotifications] = useState<
    Set<string>
  >(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("moove-dismissed-notifications");
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(parsed);
      }
    } catch (error) {
      console.warn("Failed to load dismissed notifications:", error);
    }
    return new Set();
  });

  // Refs per prevenire race conditions
  const isFetchingRef = useRef(false);
  const retryCountRef = useRef(0);
  const lastFetchTimeRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ============= PERSISTENZA =============

  const saveNotifications = useCallback(
    (notifications: ConsolidatedNotification[]) => {
      if (typeof window === "undefined") return;
      try {
        const toSave = notifications.slice(0, CONFIG.MAX_NOTIFICATIONS);
        localStorage.setItem("moove-notifications", JSON.stringify(toSave));
      } catch (error) {
        console.warn("Failed to save notifications:", error);
      }
    },
    []
  );

  const loadNotifications = useCallback((): ConsolidatedNotification[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("moove-notifications");
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.warn("Failed to load notifications:", error);
    }
    return [];
  }, []);

  const saveDismissedNotifications = useCallback((dismissed: Set<string>) => {
    if (typeof window === "undefined") return;
    try {
      const array = Array.from(dismissed);
      localStorage.setItem(
        "moove-dismissed-notifications",
        JSON.stringify(array)
      );
      console.log(
        `💾 Saved ${array.length} dismissed notifications to localStorage`
      );
    } catch (error) {
      console.warn("Failed to save dismissed notifications:", error);
    }
  }, []);

  // ============= GESTIONE ERRORI =============

  const handleError = useCallback((error: any, context: string) => {
    console.error(`❌ [${context}] Error:`, error);

    // Gestione rate limiting
    if (
      error.message?.includes("429") ||
      error.message?.includes("Too Many Requests")
    ) {
      console.warn("⚠️ Rate limited, backing off...");
      retryCountRef.current = CONFIG.MAX_RETRIES; // Skip retries for rate limiting
      lastFetchTimeRef.current = Date.now() + CONFIG.RATE_LIMIT_DELAY;
      setError("Rate limited. Retrying in 30 seconds...");
      return;
    }

    // Gestione altri errori
    retryCountRef.current++;
    if (retryCountRef.current < CONFIG.MAX_RETRIES) {
      console.log(
        `🔄 Retrying in ${CONFIG.RETRY_DELAY}ms (attempt ${retryCountRef.current})`
      );
      setTimeout(() => {
        retryCountRef.current--;
      }, CONFIG.RETRY_DELAY);
    } else {
      setError(`Failed after ${CONFIG.MAX_RETRIES} retries: ${error.message}`);
    }
  }, []);

  // ============= FETCHING DATI =============

  const fetchAuctionEvents = useCallback(async () => {
    if (!address || isFetchingRef.current) return;

    // Rate limiting check
    if (Date.now() < lastFetchTimeRef.current) {
      console.log("⏳ Rate limited, skipping fetch");
      return;
    }

    isFetchingRef.current = true;
    setError(null);

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
      const fromBlock = Math.max(lastCheckedBlock, currentBlock - 1000); // Last 1000 blocks max

      // Validate block range
      if (fromBlock >= currentBlock) {
        console.log(
          `⏭️ No new blocks to check (fromBlock: ${fromBlock}, currentBlock: ${currentBlock})`
        );
        return;
      }

      // Ensure minimum block range to avoid RPC errors
      if (currentBlock - fromBlock < 2) {
        console.log(
          `⏭️ Block range too small (${
            currentBlock - fromBlock
          } blocks), skipping fetch`
        );
        return;
      }

      console.log(
        `🔍 Fetching events from block ${fromBlock} to ${currentBlock}`
      );

      // Fetch events in smaller batches to respect drpc.org limit (max 3 per batch)
      console.log("📡 Fetching events in batches to respect RPC limits...");

      // Batch 1: BidPlaced and AuctionEnded (2 requests)
      const [bidPlacedEvents, auctionEndedEvents] = await Promise.all([
        auctionContract.queryFilter(
          auctionContract.filters.BidPlaced(),
          fromBlock,
          currentBlock
        ),
        auctionContract.queryFilter(
          auctionContract.filters.AuctionEnded(),
          fromBlock,
          currentBlock
        ),
      ]);

      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Batch 2: BidRefunded and AuctionSettled (2 requests)
      const [refundEvents, settledEvents] = await Promise.all([
        auctionContract.queryFilter(
          auctionContract.filters.BidRefunded(),
          fromBlock,
          currentBlock
        ),
        auctionContract.queryFilter(
          auctionContract.filters.AuctionSettled(),
          fromBlock,
          currentBlock
        ),
      ]);

      console.log(
        `📊 Event counts: BidPlaced=${bidPlacedEvents.length}, AuctionEnded=${auctionEndedEvents.length}, BidRefunded=${refundEvents.length}, AuctionSettled=${settledEvents.length}`
      );

      // Process events
      const newNotifications: ConsolidatedNotification[] = [];

      // Process BidPlaced events
      for (const event of bidPlacedEvents) {
        const { auctionId, bidder, amount } = (event as any).args;
        if (bidder.toLowerCase() === address.toLowerCase()) {
          newNotifications.push({
            id: `${auctionId}-bid-${event.blockNumber}`,
            auctionId: auctionId.toString(),
            type: "win",
            message: `You placed a bid of ${ethers.formatEther(
              amount
            )} ETH on auction #${auctionId}`,
            timestamp: Date.now(),
            transactionHash: event.transactionHash,
            amount: ethers.formatEther(amount),
            isRead: false,
            isDismissed: false,
            priority: "medium",
          });
        }
      }

      // Process AuctionEnded events
      for (const event of auctionEndedEvents) {
        const { auctionId } = (event as any).args;

        // Get auction data to determine winner and check if actually ended
        const auctionData = await auctionContract.getAuction(auctionId);
        const winner = auctionData.highestBidder;
        const isSettled = auctionData.isSettled;
        const endTime = Number(auctionData.endTime);
        const currentTime = Math.floor(Date.now() / 1000);
        const status = Number(auctionData.status);

        console.log(`🔍 [AuctionEnded Event] Auction ${auctionId} analysis:`, {
          winner,
          isSettled,
          endTime: new Date(endTime * 1000).toISOString(),
          currentTime: new Date(currentTime * 1000).toISOString(),
          status,
          isActuallyEnded: currentTime >= endTime,
          isStatusEnded: status === 3,
        });

        // Only create claim_ready notification if:
        // 1. User is the winner
        // 2. Auction is not settled
        // 3. Auction is actually ended (time has passed)
        // 4. Auction status is ENDED (3) OR ACTIVE (1) - both are claimable when time expired
        if (
          winner &&
          winner.toLowerCase() === address.toLowerCase() &&
          !isSettled &&
          currentTime >= endTime &&
          (status === 3 || status === 1)
        ) {
          console.log(
            `✅ Creating claim_ready notification for auction ${auctionId}`
          );
          newNotifications.push({
            id: `${auctionId}-claim-ready-${event.blockNumber}`,
            auctionId: auctionId.toString(),
            type: "claim_ready",
            message: `Auction #${auctionId} ended! You won and can now claim your NFT.`,
            timestamp: Date.now(),
            transactionHash: event.transactionHash,
            isRead: false,
            isDismissed: false,
            priority: "high",
          });
        } else {
          console.log(
            `❌ Not creating claim_ready notification for auction ${auctionId}:`,
            {
              reason: !winner
                ? "No winner"
                : winner.toLowerCase() !== address.toLowerCase()
                ? "Not user's auction"
                : isSettled
                ? "Already settled"
                : currentTime < endTime
                ? "Not yet ended"
                : status !== 3
                ? "Status not ENDED"
                : "Unknown",
            }
          );
        }
      }

      // Process BidRefunded events
      console.log(`🔍 Found ${refundEvents.length} BidRefunded events`);
      for (const event of refundEvents) {
        const { auctionId, bidder, amount } = (event as any).args;
        console.log(
          `🔍 BidRefunded event: auctionId=${auctionId}, bidder=${bidder}, amount=${amount}`
        );
        console.log(
          `🔍 Comparing bidder ${bidder.toLowerCase()} with address ${address.toLowerCase()}`
        );

        if (bidder.toLowerCase() === address.toLowerCase()) {
          console.log(
            `✅ Creating refund notification for auction ${auctionId}`
          );
          newNotifications.push({
            id: `${auctionId}-refund-${event.blockNumber}`,
            auctionId: auctionId.toString(),
            type: "refund",
            message: `You received a refund of ${ethers.formatEther(
              amount
            )} ETH from auction #${auctionId}`,
            timestamp: Date.now(),
            transactionHash: event.transactionHash,
            amount: ethers.formatEther(amount),
            isRead: false,
            isDismissed: false,
            priority: "medium",
          });
        } else {
          console.log(`❌ BidRefunded event not for current user`);
        }
      }

      // Process AuctionSettled events - mark claim_ready notifications as claimed
      for (const event of settledEvents) {
        const { auctionId, winner } = (event as any).args;
        if (winner.toLowerCase() === address.toLowerCase()) {
          // Add a "claimed" notification
          newNotifications.push({
            id: `${auctionId}-claimed-${event.blockNumber}`,
            auctionId: auctionId.toString(),
            type: "claimed",
            message: `You successfully claimed NFT from auction #${auctionId}!`,
            timestamp: Date.now(),
            transactionHash: event.transactionHash,
            isRead: false,
            isDismissed: false,
            priority: "high",
          });
        }
      }

      // Merge with existing notifications
      setNotifications((prev) => {
        const existing = new Map(prev.map((n) => [n.id, n]));
        const merged = [...prev];

        for (const newNotif of newNotifications) {
          if (!existing.has(newNotif.id)) {
            merged.push(newNotif);
          }
        }

        // Remove claim_ready notifications when claimed notifications are added
        const claimedAuctions = new Set(
          newNotifications
            .filter((n) => n.type === "claimed")
            .map((n) => n.auctionId)
        );

        const filtered = merged.filter((notification) => {
          // Remove dismissed notifications
          if (dismissedNotifications.has(notification.id)) {
            console.log(
              `🗑️ Removing dismissed notification ${notification.id}`
            );
            return false;
          }

          // Remove claim_ready notifications for auctions that have been claimed
          if (
            notification.type === "claim_ready" &&
            claimedAuctions.has(notification.auctionId)
          ) {
            console.log(
              `🗑️ Removing claim_ready notification for auction ${notification.auctionId} (now claimed)`
            );
            return false;
          }
          return true;
        });

        // Sort by timestamp (newest first) and limit
        const sorted = filtered
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, CONFIG.MAX_NOTIFICATIONS);

        saveNotifications(sorted);
        return sorted;
      });

      // Update last checked block
      setLastCheckedBlock(currentBlock);
      retryCountRef.current = 0; // Reset retry count on success
    } catch (error) {
      handleError(error, "fetchAuctionEvents");
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [address, lastCheckedBlock, handleError, saveNotifications]);

  // ============= GESTIONE NOTIFICHE =============

  const markAsRead = useCallback(
    (notificationId: string) => {
      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        );
        saveNotifications(updated);
        return updated;
      });
    },
    [saveNotifications]
  );

  const dismissNotification = useCallback(
    (notificationId: string) => {
      setDismissedNotifications((prev) => {
        const newSet = new Set(prev);
        newSet.add(notificationId);
        saveDismissedNotifications(newSet);
        return newSet;
      });

      // Also remove from current notifications state
      setNotifications((prev) => {
        const updated = prev.filter((n) => n.id !== notificationId);
        saveNotifications(updated);
        return updated;
      });
    },
    [saveDismissedNotifications, saveNotifications]
  );

  const clearAllNotifications = useCallback(() => {
    // Add all current notifications to dismissed set
    setDismissedNotifications((prev) => {
      const newSet = new Set(prev);
      notifications.forEach((n) => newSet.add(n.id));
      saveDismissedNotifications(newSet);
      return newSet;
    });

    // Clear current notifications
    setNotifications([]);
    saveNotifications([]);
  }, [notifications, saveDismissedNotifications, saveNotifications]);

  const cleanupOldNotifications = useCallback(() => {
    const cutoffTime = Date.now() - CONFIG.CLEANUP_INTERVAL;
    setNotifications((prev) => {
      const filtered = prev.filter((n) => n.timestamp > cutoffTime);
      saveNotifications(filtered);
      return filtered;
    });
  }, [saveNotifications]);

  // Function to check and remove claim_ready notifications for already settled auctions
  const cleanupClaimedNotifications = useCallback(async () => {
    if (!address) return;

    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || "https://1rpc.io/sepolia"
      );
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      setNotifications((prev) => {
        const updated = prev.filter(async (notification) => {
          if (notification.type === "claim_ready") {
            try {
              const auctionData = await auctionContract.getAuction(
                notification.auctionId
              );
              const isSettled = auctionData.isSettled;

              if (isSettled) {
                console.log(
                  `🗑️ Removing claim_ready notification for auction ${notification.auctionId} (auction is settled)`
                );
                return false; // Remove this notification
              }
            } catch (error) {
              console.warn(
                `Failed to check auction ${notification.auctionId} status:`,
                error
              );
            }
          }
          return true; // Keep this notification
        });

        // Since we can't use async in filter, we need to do this differently
        return prev;
      });

      // Alternative approach: check each claim_ready notification synchronously
      const claimReadyNotifications = notifications.filter(
        (n) => n.type === "claim_ready"
      );
      if (claimReadyNotifications.length > 0) {
        const settledAuctions = new Set<string>();

        for (const notification of claimReadyNotifications) {
          try {
            const auctionData = await auctionContract.getAuction(
              notification.auctionId
            );
            if (auctionData.isSettled) {
              settledAuctions.add(notification.auctionId);
            }
          } catch (error) {
            console.warn(
              `Failed to check auction ${notification.auctionId} status:`,
              error
            );
          }
        }

        if (settledAuctions.size > 0) {
          setNotifications((prev) => {
            const filtered = prev.filter((notification) => {
              if (
                notification.type === "claim_ready" &&
                settledAuctions.has(notification.auctionId)
              ) {
                console.log(
                  `🗑️ Removing claim_ready notification for auction ${notification.auctionId} (auction is settled)`
                );
                return false;
              }
              return true;
            });
            saveNotifications(filtered);
            return filtered;
          });
        }
      }
    } catch (error) {
      console.error("Error cleaning up claimed notifications:", error);
    }
  }, [address, notifications, saveNotifications]);

  // ============= EFFECTS =============

  // Initialize notifications from localStorage
  useEffect(() => {
    const stored = loadNotifications();
    setNotifications(stored);
    setLoading(false);
  }, [loadNotifications]);

  // Setup interval
  useEffect(() => {
    if (!address) return;

    // Initial fetch
    fetchAuctionEvents();

    // Setup interval
    intervalRef.current = setInterval(() => {
      fetchAuctionEvents();
    }, CONFIG.FETCH_INTERVAL);

    // Listen for manual refresh triggers
    const handleRefreshNotifications = () => {
      console.log("🔄 Manual notification refresh triggered");
      fetchAuctionEvents();
    };

    window.addEventListener("refreshNotifications", handleRefreshNotifications);

    // Also dispatch auction refresh event
    const handleAuctionRefresh = () => {
      window.dispatchEvent(new CustomEvent("auction-refresh"));
    };
    window.addEventListener("refreshNotifications", handleAuctionRefresh);

    // Cleanup old notifications periodically
    const cleanupInterval = setInterval(
      cleanupOldNotifications,
      CONFIG.CLEANUP_INTERVAL
    );

    // Cleanup claimed notifications every 5 minutes
    const claimedCleanupInterval = setInterval(
      cleanupClaimedNotifications,
      5 * 60 * 1000 // 5 minutes
    );

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearInterval(cleanupInterval);
      clearInterval(claimedCleanupInterval);
      window.removeEventListener(
        "refreshNotifications",
        handleRefreshNotifications
      );
      window.removeEventListener("refreshNotifications", handleAuctionRefresh);
    };
  }, [
    address,
    fetchAuctionEvents,
    cleanupOldNotifications,
    cleanupClaimedNotifications,
    dismissedNotifications,
  ]);

  // ============= RETURN =============

  return {
    notifications: notifications, // No need to filter dismissed - they're already excluded
    loading,
    error,
    markAsRead,
    dismissNotification,
    clearAllNotifications,
    refetch: fetchAuctionEvents,
    unreadCount: notifications.filter((n) => !n.isRead).length,
    highPriorityCount: notifications.filter((n) => n.priority === "high")
      .length,
  };
}
