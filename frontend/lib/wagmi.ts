import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, localhost } from "wagmi/chains";
import { createStorage, noopStorage } from "wagmi";
import { http } from "viem";

const projectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "your-project-id";

// Create storage with persistence - using Wagmi's built-in persistence
const storage = createStorage({
  storage: typeof window !== "undefined" ? window.localStorage : noopStorage,
  key: "wagmi.store",
});

// Custom RPC URLs for better reliability
const customSepolia = {
  ...sepolia,
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_RPC_URL || "https://1rpc.io/sepolia",
        "https://sepolia.drpc.org",
        "https://rpc.sepolia.org",
      ],
    },
    public: {
      http: [
        process.env.NEXT_PUBLIC_RPC_URL || "https://1rpc.io/sepolia",
        "https://sepolia.drpc.org",
        "https://rpc.sepolia.org",
      ],
    },
  },
};

export const config = getDefaultConfig({
  appName: "Moove NFT Platform",
  projectId,
  chains: [customSepolia, localhost],
  ssr: true,
  storage,
  // Optimized configuration for better performance
  batch: {
    multicall: {
      batchSize: 1024,
    },
  },
});
