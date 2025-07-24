"use client";

import { useState, useEffect, useCallback } from "react";

// Browser Notification API interface
interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  dir?: "auto" | "ltr" | "rtl";
  lang?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
}

// Future use (for Service Worker Push Notifications)
interface PushNotificationOptions extends NotificationOptions {
  actions?: { action: string; title: string; icon?: string }[];
  image?: string;
  vibrate?: number[];
}

export const useNotifications = () => {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported("Notification" in window);
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission =
    useCallback(async (): Promise<NotificationPermission> => {
      if (!isSupported) return "denied";

      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }, [isSupported]);

  // Base notification function
  const sendNotification = useCallback(
    (options: NotificationOptions) => {
      if (permission !== "granted") return null;

      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || "/favicon.ico",
        badge: options.badge || "/favicon.ico",
        tag: options.tag,
        data: options.data,
        dir: options.dir,
        lang: options.lang,
        requireInteraction: options.requireInteraction,
        silent: options.silent,
      });

      // Handle vibration separately
      if ("vibrate" in navigator && options.data?.vibrate) {
        navigator.vibrate(options.data.vibrate);
      }

      // Handle notification events
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();

        // Emit custom event for app to handle
        window.dispatchEvent(
          new CustomEvent("notification-click", {
            detail: { tag: options.tag, data: options.data },
          })
        );
      };

      notification.onerror = (error) => {
        console.error("Notification error:", error);
      };

      // Auto close after 5 seconds (unless requireInteraction is true)
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }

      return notification;
    },
    [permission]
  );

  // Bid ending notification
  const sendBidEndingNotification = useCallback(
    (auction: any, timeLeft: number) => {
      return sendNotification({
        title: `Asta in Scadenza!`,
        body: `${timeLeft} minuti rimasti per ${auction.nftName}. La tua offerta: ${auction.myBid} ETH`,
        icon: auction.nftImage || "/favicon.ico",
        tag: `auction-${auction.id}`,
        data: {
          auctionId: auction.id,
          type: "bid_ending",
          vibrate: [200, 100, 200],
        },
        requireInteraction: true,
      });
    },
    [sendNotification]
  );

  // Auction won notification
  const sendAuctionWonNotification = useCallback(
    (auction: any) => {
      return sendNotification({
        title: `🏆 Asta Vinta!`,
        body: `Congratulazioni! Hai vinto ${auction.nftName} per ${auction.winningBid} ETH`,
        icon: auction.nftImage || "/favicon.ico",
        tag: `auction-won-${auction.id}`,
        data: {
          auctionId: auction.id,
          type: "auction_won",
          vibrate: [300, 100, 300, 100, 300],
        },
        requireInteraction: true,
      });
    },
    [sendNotification]
  );

  // Vehicle unlocked notification
  const sendVehicleUnlockedNotification = useCallback(
    (vehicleData: any) => {
      return sendNotification({
        title: `🛴 Veicolo Sbloccato`,
        body: `${vehicleData.vehicleId} è pronto! L'accesso scade tra ${vehicleData.accessDuration} minuti`,
        tag: `vehicle-${vehicleData.vehicleId}`,
        data: {
          vehicleId: vehicleData.vehicleId,
          type: "vehicle_unlocked",
          vibrate: [200, 100, 200],
        },
      });
    },
    [sendNotification]
  );

  // Transaction notifications
  const sendTransactionNotification = useCallback(
    (
      type: "pending" | "success" | "error",
      txHash?: string,
      message?: string
    ) => {
      const notificationMap = {
        pending: {
          title: "⏳ Transazione in Corso",
          body: message || "La tua transazione è in elaborazione...",
          icon: "/favicon.ico",
        },
        success: {
          title: "✅ Transazione Completata",
          body: message || "La tua transazione è stata confermata!",
          icon: "/favicon.ico",
        },
        error: {
          title: "❌ Transazione Fallita",
          body: message || "La transazione è fallita. Riprova.",
          icon: "/favicon.ico",
        },
      };

      const config = notificationMap[type];
      return sendNotification({
        title: config.title,
        body: config.body,
        icon: config.icon,
        tag: `transaction-${txHash || Date.now()}`,
        data: { txHash, type },
      });
    },
    [sendNotification]
  );

  // Network status notifications
  const sendNetworkNotification = useCallback(
    (chainName: string, isCorrectNetwork: boolean) => {
      if (isCorrectNetwork) {
        return sendNotification({
          title: "✅ Rete Corretta",
          body: `Connesso alla rete ${chainName}`,
          tag: "network-status",
          data: { type: "network_correct", chainName },
        });
      } else {
        return sendNotification({
          title: "⚠️ Rete Sbagliata",
          body: `Per favore cambia alla rete Sepolia. Attualmente su: ${chainName}`,
          tag: "network-status",
          data: { type: "network_wrong", chainName },
          requireInteraction: true,
        });
      }
    },
    [sendNotification]
  );

  // Wallet connection notifications
  const sendWalletNotification = useCallback(
    (
      type: "connected" | "disconnected" | "error",
      address?: string,
      message?: string
    ) => {
      const notificationMap = {
        connected: {
          title: "🔗 Wallet Connesso",
          body:
            message ||
            `Wallet connesso: ${address?.slice(0, 6)}...${address?.slice(-4)}`,
        },
        disconnected: {
          title: "🔌 Wallet Disconnesso",
          body: message || "Il wallet è stato disconnesso",
        },
        error: {
          title: "❌ Errore Wallet",
          body: message || "Errore nella connessione del wallet",
        },
      };

      const config = notificationMap[type];
      return sendNotification({
        title: config.title,
        body: config.body,
        icon: "/favicon.ico",
        tag: "wallet-status",
        data: { type: `wallet_${type}`, address },
      });
    },
    [sendNotification]
  );

  // Future use (Service Worker registration)
  const registerServiceWorker = useCallback(async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker registered:", registration);
        return registration;
      } catch (error) {
        console.error("Service Worker registration failed:", error);
        return null;
      }
    }
    return null;
  }, []);

  // Future use (Push subscription)
  const subscribeToPush = useCallback(
    async (serviceWorkerRegistration: ServiceWorkerRegistration) => {
      try {
        const subscription =
          await serviceWorkerRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY,
          });

        return subscription;
      } catch (error) {
        console.error("Push subscription failed:", error);
        return null;
      }
    },
    []
  );

  // Returns all functions and state
  return {
    // State
    permission,
    isSupported,

    // Core functions
    requestPermission,
    sendNotification,

    // Specific notifications
    sendBidEndingNotification,
    sendAuctionWonNotification,
    sendVehicleUnlockedNotification,
    sendTransactionNotification,
    sendNetworkNotification,
    sendWalletNotification,

    // Future use (Advanced features)
    registerServiceWorker,
    subscribeToPush,
  };
};

// ===== NOTIFICATION EVENT HANDLER HOOK =====
export const useNotificationEvents = () => {
  useEffect(() => {
    const handleNotificationClick = (event: CustomEvent) => {
      const { tag, data } = event.detail;

      // Handle different notification types
      switch (data?.type) {
        case "bid_ending":
          // Navigate to auction page
          if (typeof window !== "undefined") {
            window.location.href = `/auctions/${data.auctionId}`;
          }
          break;

        case "auction_won":
          // Navigate to my collection with highlight
          if (typeof window !== "undefined") {
            window.location.href = `/my-collection?highlight=${data.auctionId}`;
          }
          break;

        case "vehicle_unlocked":
          // Show success message or navigate
          console.log("Vehicle unlocked:", data.vehicleId);
          break;

        case "wallet_connected":
          console.log("Wallet connected notification clicked");
          break;

        case "network_wrong":
          // Could trigger network switch modal
          console.log("Wrong network notification clicked");
          break;

        default:
          // Default action - focus window
          if (typeof window !== "undefined") {
            window.focus();
          }
      }
    };

    // Add event listener
    if (typeof window !== "undefined") {
      window.addEventListener(
        "notification-click",
        handleNotificationClick as EventListener
      );
    }

    // Cleanup
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "notification-click",
          handleNotificationClick as EventListener
        );
      }
    };
  }, []);
};
