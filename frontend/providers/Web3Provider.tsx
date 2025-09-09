"use client";

import React, { ReactNode } from "react";
import {
  RainbowKitProvider,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { sepolia } from "wagmi/chains";
import { config } from "@/lib/wagmi";
import "@rainbow-me/rainbowkit/styles.css";

// Check if WalletConnect projectId is configured
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

if (!projectId || projectId === "your-walletconnect-project-id-here") {
  console.warn(
    "⚠️ NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID not configured. Please add it to your .env.local file."
  );
  console.warn("Get your projectId from: https://cloud.walletconnect.com/");
}

// Optimized React Query client for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Reduced retries for faster failure
      staleTime: 60_000, // 1 minute - increased for better caching
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Disabled for faster loading
      refetchOnReconnect: true,
      gcTime: 300_000, // 5 minutes garbage collection
    },
  },
});

interface Web3ProviderProps {
  children: ReactNode;
  theme?: "light" | "dark";
}

export default function Web3Provider({
  children,
  theme = "light",
}: Web3ProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={theme === "dark" ? darkTheme() : lightTheme()}
          appInfo={{
            appName: "Moove NFT Platform",
            //learnMoreUrl: "https://moove-nft.vercel.app/about",
          }}
          modalSize="compact"
          initialChain={sepolia}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
