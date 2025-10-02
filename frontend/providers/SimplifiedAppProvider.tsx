"use client";

import React, { ReactNode, useEffect } from "react";
import {
  RainbowKitProvider,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { sepolia } from "wagmi/chains";
import { config } from "@/lib/wagmi";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuctionNotificationsProvider } from "@/providers/AuctionNotificationsProvider";
import { NFTTransferNotificationsProvider } from "@/providers/NFTTransferNotificationsProvider";
// DISABLED: Separate monitors - Using only event-based system
// import { useAutomaticAuctionMonitor } from "@/hooks/useAutomaticAuctionMonitor";
// import { useClaimReadyNotifications } from "@/hooks/useClaimReadyNotifications";
// import { useBidRefundListener } from "@/hooks/useBidRefundListener";
import UnifiedNotificationBadge from "@/components/notifications/UnifiedNotificationBadge";
import EventBasedClaimPanel from "@/components/claim/EventBasedClaimPanel";
import AutomaticRefundHandler from "@/components/refunds/AutomaticRefundHandler";
// Removed custom wallet persistence - using Wagmi's built-in persistence
import "@rainbow-me/rainbowkit/styles.css";

// Optimized React Query client - moved outside component to prevent re-creation
let queryClient: QueryClient | null = null;

function getQueryClient() {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          staleTime: 10 * 60 * 1000, // 10 minutes - Increased for better caching
          gcTime: 30 * 60 * 1000, // 30 minutes - Keep data longer
          refetchOnWindowFocus: false,
          refetchOnReconnect: false, // Disabled to prevent unnecessary refetches
          refetchOnMount: false, // Prevent unnecessary refetches
          refetchInterval: false, // Disable automatic refetching
          refetchIntervalInBackground: false,
          // Optimize for performance
          networkMode: "online",
          structuralSharing: true, // Enable structural sharing for better performance
        },
        mutations: {
          retry: 1,
          networkMode: "online",
        },
      },
    });
  }
  return queryClient;
}

interface SimplifiedAppProviderProps {
  children: ReactNode;
}

// DISABLED: Separate monitor functions - Using only event-based system
// function AuctionMonitor() {
//   useAutomaticAuctionMonitor();
//   return null;
// }

// function ClaimReadyMonitor() {
//   useClaimReadyNotifications();
//   return null;
// }

// function BidRefundMonitor() {
//   useBidRefundListener();
//   return null;
// }

// Removed WalletPersistenceWrapper - using Wagmi's built-in persistence

export default function SimplifiedAppProvider({
  children,
}: SimplifiedAppProviderProps) {
  // Auto-cleanup of old wallet persistence data
  useEffect(() => {
    console.log("🏗️ SimplifiedAppProvider initialized");

    // Clean up old wallet persistence data automatically
    const oldKeys = ["wagmi.wallet.state", "wagmi.wallet"];
    let cleaned = false;

    oldKeys.forEach((key) => {
      if (localStorage.getItem(key)) {
        console.log(`🧹 Auto-cleaning old wallet data: ${key}`);
        localStorage.removeItem(key);
        cleaned = true;
      }
    });

    if (cleaned) {
      console.log("✅ Old wallet persistence data cleaned automatically");
      // Force a page reload to ensure clean state
      console.log("🔄 Reloading page to ensure clean state...");
      setTimeout(() => {
        window.location.reload();
      }, 100);
      return;
    }

    // Additional cleanup: clear any corrupted wagmi data
    const wagmiStore = localStorage.getItem("wagmi.store");
    if (wagmiStore) {
      try {
        const store = JSON.parse(wagmiStore);
        // If store is corrupted or empty, clear it
        if (!store || !store.state) {
          console.log("🧹 Clearing corrupted wagmi store data");
          localStorage.removeItem("wagmi.store");
        }
      } catch (error) {
        console.log("🧹 Clearing corrupted wagmi store data");
        localStorage.removeItem("wagmi.store");
      }
    }

    const client = getQueryClient();

    // Clear any stale cache entries that might cause errors
    try {
      // Remove any stale query entries that might reference non-existent hooks
      const queryCache = client.getQueryCache();
      const queries = queryCache.getAll();

      // Find and remove any stale queries from old NFT loading hooks
      const staleQueries = queries.filter((query) =>
        query.queryKey.some(
          (key) =>
            typeof key === "string" &&
            (key.includes("useIncrementalNFTLoading") ||
              key.includes("useOptimizedMyCollection") ||
              key.includes("useNFTDebug") ||
              key.includes("useUserNFTFinder") ||
              key.includes("useSmartNFTFinder") ||
              key.includes("useConditionalNFTLoading") ||
              key.includes("useLazyMyCollection") ||
              key.includes("useOptimizedUserNFTFinder") ||
              key.includes("useImmediateLazyCollection") ||
              key.includes("useSimpleLazyCollection"))
        )
      );

      if (staleQueries.length > 0) {
        console.log(`🧹 Removing ${staleQueries.length} stale query entries`);
        staleQueries.forEach((query) => {
          queryCache.remove(query);
        });
      }

      // Also clear any queries that might be in error state
      const errorQueries = queries.filter(
        (query) => query.state.status === "error"
      );
      if (errorQueries.length > 0) {
        console.log(`🧹 Removing ${errorQueries.length} error query entries`);
        errorQueries.forEach((query) => {
          queryCache.remove(query);
        });
      }
    } catch (error) {
      console.warn("⚠️ Error clearing stale cache entries:", error);
    }

    console.log("📊 QueryClient config:", {
      staleTime: client.getDefaultOptions().queries?.staleTime,
      gcTime: client.getDefaultOptions().queries?.gcTime,
      refetchOnMount: client.getDefaultOptions().queries?.refetchOnMount,
    });
  }, []);

  return (
    <QueryClientProvider client={getQueryClient()}>
      <WagmiProvider config={config}>
        <RainbowKitProvider
          theme={{
            lightMode: lightTheme({
              accentColor: "#00D4AA",
              accentColorForeground: "white",
              borderRadius: "medium",
            }),
            darkMode: darkTheme({
              accentColor: "#00D4AA",
              accentColorForeground: "white",
              borderRadius: "medium",
            }),
          }}
          showRecentTransactions={false}
        >
          <ThemeProvider>
            <AuctionNotificationsProvider>
              <NFTTransferNotificationsProvider>
                {/* DISABLED: All separate monitors - Using only event-based system */}
                {/* <AuctionMonitor /> */}
                {/* <ClaimReadyMonitor /> */}
                {/* <BidRefundMonitor /> */}

                {children}

                {/* Unified Notification Badge - Single system for claim notifications */}
                <UnifiedNotificationBadge />

                {/* Event-Based Claim Panel - For claiming won auctions */}
                <EventBasedClaimPanel />

                {/* Automatic Refund Handler - Processes refunds when auctions are settled */}
                <AutomaticRefundHandler />
              </NFTTransferNotificationsProvider>
            </AuctionNotificationsProvider>
          </ThemeProvider>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
