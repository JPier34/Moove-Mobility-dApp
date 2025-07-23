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
import "@rainbow-me/rainbowkit/styles.css";

const config = getDefaultConfig({
  appName: "Moove NFT Platform",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!, // From .env.local
  chains: [sepolia], // Only Sepolia for deployment
  ssr: true, // Enable SSR for Next.js
});

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 30_000, // 30 seconds
      refetchOnWindowFocus: false,
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
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
