"use client";

import { useEffect, useRef } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useRouter } from "next/navigation";

interface WalletDebugState {
  previousAddress: string | undefined;
  previousIsConnected: boolean;
  disconnectionCount: number;
  lastDisconnectionTime: Date | null;
  navigationHistory: string[];
}

export function useWalletDebug() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  const debugRef = useRef<WalletDebugState>({
    previousAddress: undefined,
    previousIsConnected: false,
    disconnectionCount: 0,
    lastDisconnectionTime: null,
    navigationHistory: [],
  });

  // Track navigation changes
  useEffect(() => {
    const currentPath = window.location.pathname;
    const history = debugRef.current.navigationHistory;

    if (history.length === 0 || history[history.length - 1] !== currentPath) {
      history.push(currentPath);
      console.log(`🧭 Navigation to: ${currentPath}`);
      console.log(`📊 Navigation history:`, history.slice(-5)); // Last 5 navigations
    }
  });

  // Track wallet state changes
  useEffect(() => {
    const prev = debugRef.current;
    const current = { address, isConnected, isConnecting, isReconnecting };

    // Detect disconnection
    if (prev.previousIsConnected && !isConnected && !isConnecting) {
      prev.disconnectionCount++;
      prev.lastDisconnectionTime = new Date();

      console.log(`🚨 WALLET DISCONNECTED!`);
      console.log(`📊 Disconnection #${prev.disconnectionCount}`);
      console.log(`⏰ Time: ${prev.lastDisconnectionTime.toISOString()}`);
      console.log(`📍 Current path: ${window.location.pathname}`);
      console.log(`🔄 Is connecting: ${isConnecting}`);
      console.log(`🔄 Is reconnecting: ${isReconnecting}`);
      console.log(`📜 Navigation history:`, prev.navigationHistory.slice(-3));

      // Check if it's related to navigation
      const currentPath = window.location.pathname;
      if (prev.navigationHistory.length >= 2) {
        const previousPath =
          prev.navigationHistory[prev.navigationHistory.length - 2];
        console.log(`🔗 Previous path: ${previousPath}`);
        console.log(`🔗 Current path: ${currentPath}`);

        if (previousPath !== currentPath) {
          console.log(
            `⚠️ Disconnection occurred during navigation from ${previousPath} to ${currentPath}`
          );
        }
      }
    }

    // Detect connection
    if (!prev.previousIsConnected && isConnected && address) {
      console.log(`✅ WALLET CONNECTED!`);
      console.log(`📍 Address: ${address}`);
      console.log(`📍 Current path: ${window.location.pathname}`);
      console.log(`⏰ Time: ${new Date().toISOString()}`);
    }

    // Update previous state
    prev.previousAddress = address;
    prev.previousIsConnected = isConnected;

    // Log all state changes
    console.log(`🔍 Wallet state:`, {
      address: address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : "null",
      isConnected,
      isConnecting,
      isReconnecting,
      path: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  }, [address, isConnected, isConnecting, isReconnecting]);

  // Track component mounts/unmounts
  useEffect(() => {
    const currentPath = window.location.pathname;
    console.log(`🔄 Component mounted on: ${currentPath}`);

    return () => {
      console.log(`🔄 Component unmounting from: ${currentPath}`);
    };
  });

  // Track localStorage changes
  useEffect(() => {
    const checkStorage = () => {
      const wagmiStorage = localStorage.getItem("wagmi.store");
      const walletStorage = localStorage.getItem("wagmi.wallet");

      console.log(`💾 Storage state:`, {
        wagmiStore: wagmiStorage ? "exists" : "missing",
        walletStorage: walletStorage || "missing",
        path: window.location.pathname,
      });

      // Check all localStorage keys related to wagmi
      const allKeys = Object.keys(localStorage);
      const wagmiKeys = allKeys.filter(
        (key) =>
          key.includes("wagmi") ||
          key.includes("wallet") ||
          key.includes("rainbow")
      );
      console.log(`🔑 All wagmi-related keys:`, wagmiKeys);

      // Check wagmi store content
      if (wagmiStorage) {
        try {
          const parsed = JSON.parse(wagmiStorage);
          console.log(`📦 Wagmi store content:`, {
            state: parsed.state ? "exists" : "missing",
            connectors: parsed.state?.connections
              ? Object.keys(parsed.state.connections)
              : "none",
            currentConnector: parsed.state?.current
              ? parsed.state.current
              : "none",
          });
        } catch (e) {
          console.log(`❌ Failed to parse wagmi store:`, e);
        }
      }

      // If wallet is missing but we have a connected wallet, try to restore it
      if (!walletStorage && isConnected && address) {
        console.log(`🔧 Attempting to restore wallet connection...`);
        // This would trigger a reconnection attempt
      }
    };

    checkStorage();

    // Check storage every 2 seconds
    const interval = setInterval(checkStorage, 2000);

    return () => clearInterval(interval);
  }, [isConnected, address]);

  return {
    debugInfo: debugRef.current,
    getCurrentState: () => ({
      address,
      isConnected,
      isConnecting,
      isReconnecting,
      path: window.location.pathname,
      timestamp: new Date().toISOString(),
    }),
  };
}
