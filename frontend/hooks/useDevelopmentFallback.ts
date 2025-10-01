"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

interface DevelopmentFallback {
  isDevelopment: boolean;
  mockNFTCount: number;
  mockAuctionCount: number;
  contractsDeployed: boolean;
}

export function useDevelopmentFallback(): DevelopmentFallback {
  const { address, isConnected } = useAccount();
  const [fallback, setFallback] = useState<DevelopmentFallback>({
    isDevelopment: false,
    mockNFTCount: 0,
    mockAuctionCount: 0,
    contractsDeployed: false,
  });

  useEffect(() => {
    const checkEnvironment = async () => {
      try {
        // Check if we're in development
        const isDev =
          process.env.NODE_ENV === "development" ||
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";

        // Check if contracts are deployed
        let contractsDeployed = false;
        if (window.ethereum && isConnected) {
          try {
            const provider = new (await import("ethers")).BrowserProvider(
              window.ethereum as any
            );

            // Check NFT contract
            const nftCode = await provider.getCode(
              "0x40E455515bf712144C1A5D859F19d64b537754f7"
            );
            const auctionCode = await provider.getCode(
              "0x463a4fff0796AF7C69788463629AeF046A2fc211"
            );

            contractsDeployed = nftCode !== "0x" && auctionCode !== "0x";
          } catch (error) {
            console.warn("Failed to check contract deployment:", error);
          }
        }

        setFallback({
          isDevelopment: isDev,
          mockNFTCount: isDev && !contractsDeployed ? 50 : 0, // Mock 50 NFTs for development
          mockAuctionCount: isDev && !contractsDeployed ? 10 : 0, // Mock 10 auctions for development
          contractsDeployed,
        });

        if (isDev && !contractsDeployed) {
          console.log("🚧 Development mode: Using mock data");
          console.log("📊 Mock NFT count:", 50);
          console.log("📊 Mock auction count:", 10);
        }
      } catch (error) {
        console.error("Failed to check development environment:", error);
      }
    };

    checkEnvironment();
  }, [isConnected]);

  return fallback;
}


