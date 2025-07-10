"use client";

import React, { createContext, useContext } from "react";
import { useWeb3 } from "@/hooks/useWeb3";
import toast, { Toaster } from "react-hot-toast";

interface Web3ContextType {
  provider: any;
  signer: any;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export function useWeb3Context() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3Context must be used within Web3Provider");
  }
  return context;
}

interface Web3ProviderProps {
  children: React.ReactNode;
}

export default function Web3Provider({ children }: Web3ProviderProps) {
  const web3 = useWeb3();

  // Show toast notifications for connection events
  React.useEffect(() => {
    if (web3.error) {
      toast.error(web3.error);
    }
  }, [web3.error]);

  React.useEffect(() => {
    if (web3.isConnected && web3.account) {
      toast.success(
        `Connected to ${web3.account.slice(0, 6)}...${web3.account.slice(-4)}`
      );
    }
  }, [web3.isConnected, web3.account]);

  return (
    <Web3Context.Provider value={web3}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />
    </Web3Context.Provider>
  );
}
