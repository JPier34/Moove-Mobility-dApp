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
import { useAutomaticAuctionMonitor } from "@/hooks/useAutomaticAuctionMonitor";
import UnifiedNotificationBadge from "@/components/notifications/UnifiedNotificationBadge";
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
          staleTime: 60_000, // 1 minute
          gcTime: 5 * 60 * 1000, // 5 minutes
          refetchOnWindowFocus: false,
          refetchOnReconnect: true,
          refetchOnMount: false, // Prevent unnecessary refetches
        },
        mutations: {
          retry: 1,
        },
      },
    });
  }
  return queryClient;
}

interface SimplifiedAppProviderProps {
  children: ReactNode;
}

// Component to handle automatic auction monitoring
function AuctionMonitor() {
  useAutomaticAuctionMonitor();
  return null; // This component doesn't render anything
}

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
        >
          <ThemeProvider>
            <AuctionNotificationsProvider>
              <NFTTransferNotificationsProvider>
                {/* Automatic Auction Monitor - Runs in background */}
                <AuctionMonitor />

                {children}

                {/* Unified Notification Badge - Rendered after both providers */}
                <UnifiedNotificationBadge />
              </NFTTransferNotificationsProvider>
            </AuctionNotificationsProvider>
          </ThemeProvider>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
