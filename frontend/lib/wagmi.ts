import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, localhost } from "wagmi/chains";
import { createStorage, noopStorage } from "wagmi";

const projectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "your-project-id";

// Create storage with persistence - using Wagmi's built-in persistence
const storage = createStorage({
  storage: typeof window !== "undefined" ? window.localStorage : noopStorage,
  key: "wagmi.store",
});

export const config = getDefaultConfig({
  appName: "Moove NFT Platform",
  projectId,
  chains: [sepolia, localhost],
  ssr: true,
  storage,
  // Optimized configuration for better performance
  batch: {
    multicall: {
      batchSize: 1024,
    },
  },
});
