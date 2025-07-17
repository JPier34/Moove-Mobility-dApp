import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, localhost } from "wagmi/chains";

const projectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "your-project-id";

export const config = getDefaultConfig({
  appName: "Moove NFT Platform",
  projectId,
  chains: [sepolia, localhost],
  ssr: true,
});
