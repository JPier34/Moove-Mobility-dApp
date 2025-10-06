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
  FETCH_INTERVAL: 60000, // 1 minuto
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

      console.log(
        `🔍 Fetching events from block ${fromBlock} to ${currentBlock}`
      );

      // Fetch all relevant events
      const [bidPlacedEvents, auctionEndedEvents, refundEvents] =
        await Promise.all([
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
          auctionContract.queryFilter(
            auctionContract.filters.BidRefunded(),
            fromBlock,
            currentBlock
          ),
        ]);

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
        const { auctionId, winner } = (event as any).args;
        if (winner.toLowerCase() === address.toLowerCase()) {
          newNotifications.push({
            id: `${auctionId}-ended-${event.blockNumber}`,
            auctionId: auctionId.toString(),
            type: "claim_ready",
            message: `Auction #${auctionId} ended! You won and can now claim your NFT.`,
            timestamp: Date.now(),
            transactionHash: event.transactionHash,
            isRead: false,
            isDismissed: false,
            priority: "high",
          });
        }
      }

      // Process BidRefunded events
      for (const event of refundEvents) {
        const { auctionId, bidder, amount } = (event as any).args;
        if (bidder.toLowerCase() === address.toLowerCase()) {
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

        // Sort by timestamp (newest first) and limit
        const sorted = merged
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
      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === notificationId ? { ...n, isDismissed: true } : n
        );
        saveNotifications(updated);
        return updated;
      });
    },
    [saveNotifications]
  );

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    saveNotifications([]);
  }, [saveNotifications]);

  const cleanupOldNotifications = useCallback(() => {
    const cutoffTime = Date.now() - CONFIG.CLEANUP_INTERVAL;
    setNotifications((prev) => {
      const filtered = prev.filter((n) => n.timestamp > cutoffTime);
      saveNotifications(filtered);
      return filtered;
    });
  }, [saveNotifications]);

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

    // Cleanup old notifications periodically
    const cleanupInterval = setInterval(
      cleanupOldNotifications,
      CONFIG.CLEANUP_INTERVAL
    );

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearInterval(cleanupInterval);
    };
  }, [address, fetchAuctionEvents, cleanupOldNotifications]);

  // ============= RETURN =============

  return {
    notifications: notifications.filter((n) => !n.isDismissed),
    loading,
    error,
    markAsRead,
    dismissNotification,
    clearAllNotifications,
    refetch: fetchAuctionEvents,
    unreadCount: notifications.filter((n) => !n.isRead && !n.isDismissed)
      .length,
    highPriorityCount: notifications.filter(
      (n) => n.priority === "high" && !n.isDismissed
    ).length,
  };
}
