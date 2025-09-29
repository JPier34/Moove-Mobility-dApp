"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";

// Tipi per le notifiche
export type AuctionNotificationType =
  | "dutch_purchase"
  | "sealed_bid_win"
  | "english_win"
  | "reserve_win"
  | "auction_failed"
  | "claim_ready"
  | "bid_refunded";

export interface AuctionNotification {
  id: string;
  type: AuctionNotificationType;
  auctionId: string;
  nftName?: string;
  price?: number;
  timestamp: number;
  isRead: boolean;
  source: "immediate" | "collection_check";
}

interface NotificationState {
  notifications: AuctionNotification[];
  notificationQueue: AuctionNotification[]; // Queue per notifiche in attesa
  currentNotification: AuctionNotification | null; // Notifica attualmente mostrata
  lastProcessedAuctions: Set<string>;
  isEnabled: boolean;
  pendingBatches: Map<string, AuctionNotification[]>; // Batch per tipo di notifica
}

// Hook per gestire le notifiche delle aste in modo unificato
export function useUnifiedAuctionNotifications() {
  const { address, isConnected } = useAccount();
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    notificationQueue: [],
    currentNotification: null,
    lastProcessedAuctions: new Set(),
    isEnabled: true,
    pendingBatches: new Map(),
  });

  // Genera ID unico per le notifiche
  const generateNotificationId = useCallback(() => {
    return `auction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Sistema di priorità per le notifiche
  const getNotificationPriority = useCallback(
    (type: AuctionNotificationType): number => {
      const priority = {
        claim_ready: 1, // Massima priorità - sempre immediata
        bid_refunded: 2, // Alta priorità - rimborsi importanti
        sealed_bid_win: 2, // Alta priorità
        dutch_purchase: 3, // Media priorità
        english_win: 3, // Media priorità
        reserve_win: 3, // Media priorità
        auction_failed: 4, // Bassa priorità
      };
      return priority[type] || 5;
    },
    []
  );

  // Raggruppa notifiche simili per il batching
  const batchSimilarNotifications = useCallback(
    (type: AuctionNotificationType) => {
      const batch = state.pendingBatches.get(type) || [];
      if (batch.length === 0) return;

      let message = "";
      let icon = "🏆";

      switch (type) {
        case "sealed_bid_win":
          message = `🏆 Congratulations! You won ${
            batch.length
          } sealed bid auction${batch.length > 1 ? "s" : ""}!`;
          icon = "🏆";
          break;
        case "dutch_purchase":
          message = `✅ You successfully purchased ${
            batch.length
          } Dutch auction${batch.length > 1 ? "s" : ""}!`;
          icon = "✅";
          break;
        case "english_win":
          message = `🏆 Congratulations! You won ${
            batch.length
          } English auction${batch.length > 1 ? "s" : ""}!`;
          icon = "🏆";
          break;
        case "reserve_win":
          message = `🏆 Congratulations! You won ${
            batch.length
          } Reserve auction${batch.length > 1 ? "s" : ""}!`;
          icon = "🏆";
          break;
        case "bid_refunded":
          message = `💰 You received ${batch.length} refund${
            batch.length > 1 ? "s" : ""
          } from auction${batch.length > 1 ? "s" : ""}!`;
          icon = "💰";
          break;
      }

      if (message) {
        toast.success(message, {
          duration: 6000,
          position: "top-right",
          style: {
            background: type === "auction_failed" ? "#EF4444" : "#10B981",
            color: "white",
            fontWeight: "bold",
          },
        });
      }

      // Pulisci il batch dopo aver mostrato il toast
      setState((prev) => {
        const newBatches = new Map(prev.pendingBatches);
        newBatches.delete(type);
        return { ...prev, pendingBatches: newBatches };
      });
    },
    [state.pendingBatches]
  );

  // Mostra la prossima notifica dalla queue
  const showNextNotification = useCallback(() => {
    if (state.notificationQueue.length === 0) return;

    const nextNotification = state.notificationQueue[0];
    setState((prev) => ({
      ...prev,
      currentNotification: nextNotification,
      notificationQueue: prev.notificationQueue.slice(1),
      notifications: [nextNotification, ...prev.notifications],
    }));

    console.log(`🔔 Showing next notification from queue:`, nextNotification);
  }, [state.notificationQueue]);

  // Aggiungi notifica alla queue o mostra immediatamente se alta priorità
  const addToQueue = useCallback(
    (notification: AuctionNotification) => {
      const priority = getNotificationPriority(notification.type);

      // Se è alta priorità (claim_ready), mostra immediatamente
      if (priority === 1) {
        setState((prev) => ({
          ...prev,
          notifications: [notification, ...prev.notifications],
        }));
        showToastForNotification(notification);
        return;
      }

      // Altrimenti aggiungi alla queue
      setState((prev) => ({
        ...prev,
        notificationQueue: [...prev.notificationQueue, notification],
      }));

      console.log(`🔔 Added notification to queue:`, notification);
    },
    [getNotificationPriority]
  );

  // Aggiunge una notifica con sistema intelligente
  const addNotification = useCallback(
    (
      type: AuctionNotificationType,
      auctionId: string,
      options: {
        nftName?: string;
        price?: number;
        source?: "immediate" | "collection_check";
      } = {}
    ) => {
      // Controlla se questa asta è già stata processata
      const notificationKey = `${type}_${auctionId}`;
      if (state.lastProcessedAuctions.has(notificationKey)) {
        console.log(`🔔 Notification already processed for ${notificationKey}`);
        return;
      }

      const notification: AuctionNotification = {
        id: generateNotificationId(),
        type,
        auctionId,
        nftName: options.nftName,
        price: options.price,
        timestamp: Date.now(),
        isRead: false,
        source: options.source || "immediate",
      };

      // Aggiorna il tracking delle aste processate
      setState((prev) => ({
        ...prev,
        lastProcessedAuctions: new Set([
          ...prev.lastProcessedAuctions,
          notificationKey,
        ]),
      }));

      // Se è una notifica di collection check, aggiungi direttamente alla lista
      if (options.source === "collection_check") {
        setState((prev) => ({
          ...prev,
          notifications: [notification, ...prev.notifications],
        }));
        return;
      }

      // Per notifiche immediate, usa il sistema intelligente
      const priority = getNotificationPriority(type);

      if (priority === 1) {
        // Alta priorità: mostra immediatamente
        addToQueue(notification);
      } else {
        // Media/bassa priorità: aggiungi al batch
        setState((prev) => {
          const newBatches = new Map(prev.pendingBatches);
          const existingBatch = newBatches.get(type) || [];
          newBatches.set(type, [...existingBatch, notification]);

          // Se è il primo del batch, mostra il toast raggruppato dopo un breve delay
          if (existingBatch.length === 0) {
            setTimeout(() => batchSimilarNotifications(type), 1000);
          }

          return { ...prev, pendingBatches: newBatches };
        });
      }

      console.log(
        `🔔 Added notification with priority ${priority}:`,
        notification
      );
    },
    [
      state.lastProcessedAuctions,
      generateNotificationId,
      getNotificationPriority,
      addToQueue,
      batchSimilarNotifications,
    ]
  );

  // Mostra toast per una notifica
  const showToastForNotification = useCallback(
    (notification: AuctionNotification) => {
      const { type, auctionId, nftName, price } = notification;

      let message = "";
      let icon = "🏆";

      switch (type) {
        case "dutch_purchase":
          message = `✅ Successfully purchased Dutch auction #${auctionId}${
            price ? ` for ${price} ETH` : ""
          }!`;
          icon = "✅";
          break;
        case "sealed_bid_win":
          message = `🏆 Congratulations! You won sealed bid auction #${auctionId}${
            price ? ` for ${price} ETH` : ""
          }!`;
          icon = "🏆";
          break;
        case "english_win":
          message = `🏆 Congratulations! You won English auction #${auctionId}${
            price ? ` for ${price} ETH` : ""
          }!`;
          icon = "🏆";
          break;
        case "reserve_win":
          message = `🏆 Congratulations! You won reserve auction #${auctionId}${
            price ? ` for ${price} ETH` : ""
          }!`;
          icon = "🏆";
          break;
        case "auction_failed":
          message = `❌ Auction #${auctionId} failed`;
          icon = "❌";
          break;
        case "claim_ready":
          message = `🎁 NFT from auction #${auctionId} is ready to claim!`;
          icon = "🎁";
          break;
        case "bid_refunded":
          message = `💰 Refund received! ${
            price ? `${price} ETH` : "Funds"
          } returned from auction #${auctionId}`;
          icon = "💰";
          break;
      }

      if (message) {
        toast.success(message, {
          duration: 6000,
          position: "top-right",
          style: {
            background: type === "auction_failed" ? "#EF4444" : "#10B981",
            color: "white",
            fontWeight: "bold",
          },
        });
      }
    },
    []
  );

  // Marca notifica come letta
  const markAsRead = useCallback((notificationId: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ),
    }));
  }, []);

  // Marca tutte le notifiche come lette
  const markAllAsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
    }));
  }, []);

  // Rimuove notifica
  const removeNotification = useCallback((notificationId: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== notificationId),
    }));
  }, []);

  // Disabilita/abilita notifiche
  const setNotificationsEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, isEnabled: enabled }));
  }, []);

  // Reset quando cambia utente
  useEffect(() => {
    if (address) {
      setState({
        notifications: [],
        notificationQueue: [],
        currentNotification: null,
        lastProcessedAuctions: new Set(),
        isEnabled: true,
        pendingBatches: new Map(),
      });
    }
  }, [address]);

  // Pulisce notifiche vecchie (più di 24 ore)
  useEffect(() => {
    const cleanup = setInterval(() => {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.filter(
          (n) => n.timestamp > oneDayAgo
        ),
      }));
    }, 60 * 60 * 1000); // Controlla ogni ora

    return () => clearInterval(cleanup);
  }, []);

  return {
    notifications: state.notifications,
    notificationQueue: state.notificationQueue,
    currentNotification: state.currentNotification,
    unreadCount: state.notifications.filter((n) => !n.isRead).length,
    queueCount: state.notificationQueue.length,
    isEnabled: state.isEnabled,
    addNotification,
    showNextNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    setNotificationsEnabled,
  };
}

// Hook per notifiche specifiche delle aste
export function useAuctionNotificationTriggers() {
  const { addNotification } = useUnifiedAuctionNotifications();

  // Trigger per acquisto Dutch Auction
  const notifyDutchPurchase = useCallback(
    (auctionId: string, price: number, nftName?: string) => {
      addNotification("dutch_purchase", auctionId, {
        nftName,
        price,
        source: "immediate",
      });
    },
    [addNotification]
  );

  // Trigger per vincita Sealed Bid
  const notifySealedBidWin = useCallback(
    (auctionId: string, price: number, nftName?: string) => {
      addNotification("sealed_bid_win", auctionId, {
        nftName,
        price,
        source: "immediate",
      });
    },
    [addNotification]
  );

  // Trigger per vincita English Auction
  const notifyEnglishWin = useCallback(
    (auctionId: string, price: number, nftName?: string) => {
      addNotification("english_win", auctionId, {
        nftName,
        price,
        source: "immediate",
      });
    },
    [addNotification]
  );

  // Trigger per vincita Reserve Auction
  const notifyReserveWin = useCallback(
    (auctionId: string, price: number, nftName?: string) => {
      addNotification("reserve_win", auctionId, {
        nftName,
        price,
        source: "immediate",
      });
    },
    [addNotification]
  );

  // Trigger per asta fallita
  const notifyAuctionFailed = useCallback(
    (auctionId: string, reason?: string) => {
      addNotification("auction_failed", auctionId, {
        source: "immediate",
      });
    },
    [addNotification]
  );

  // Trigger per NFT pronto al claim
  const notifyClaimReady = useCallback(
    (auctionId: string, nftName?: string) => {
      addNotification("claim_ready", auctionId, {
        nftName,
        source: "immediate",
      });
    },
    [addNotification]
  );

  // Trigger per rimborso ricevuto
  const notifyBidRefunded = useCallback(
    (auctionId: string, refundAmount?: number, nftName?: string) => {
      addNotification("bid_refunded", auctionId, {
        nftName,
        price: refundAmount,
        source: "immediate",
      });
    },
    [addNotification]
  );

  return {
    notifyDutchPurchase,
    notifySealedBidWin,
    notifyEnglishWin,
    notifyReserveWin,
    notifyAuctionFailed,
    notifyClaimReady,
    notifyBidRefunded,
  };
}
