"use client";

import React, { ReactNode } from "react";
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createStorage, noopStorage } from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";

// Check if WalletConnect projectId is configured
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

if (!projectId || projectId === "your-walletconnect-project-id-here") {
  console.warn(
    "⚠️ NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID not configured. Please add it to your .env.local file."
  );
  console.warn("Get your projectId from: https://cloud.walletconnect.com/");
}

// Create storage for wallet persistence
const storage = createStorage({
  storage: typeof window !== "undefined" ? window.localStorage : noopStorage,
  key: "moove-wagmi-store", // Custom key to avoid conflicts
});

const config = getDefaultConfig({
  appName: "Moove NFT Platform",
  projectId: projectId || "00000000000000000000000000000000", // Fallback projectId
  chains: [sepolia], // Only Sepolia for deployment
  ssr: true, // Enable SSR for Next.js
  storage, // Add storage for persistence
});

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 30_000, // 30 seconds
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
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
