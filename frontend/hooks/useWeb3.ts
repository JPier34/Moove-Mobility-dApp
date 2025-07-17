import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import detectEthereumProvider from "@metamask/detect-provider";

interface Web3State {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useWeb3() {
  const [web3State, setWeb3State] = useState<Web3State>({
    provider: null,
    signer: null,
    account: null,
    chainId: null,
    isConnected: false,
    isLoading: false,
    error: null,
  });

  const connectWallet = useCallback(async () => {
    setWeb3State((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const detectedProvider = await detectEthereumProvider();

      if (!detectedProvider) {
        throw new Error("MetaMask not detected. Please install MetaMask.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);

      // Request account access
      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      const network = await provider.getNetwork();

      setWeb3State({
        provider,
        signer,
        account,
        chainId: Number(network.chainId),
        isConnected: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setWeb3State((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to connect wallet",
      }));
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWeb3State({
      provider: null,
      signer: null,
      account: null,
      chainId: null,
      isConnected: false,
      isLoading: false,
      error: null,
    });
  }, []);

  const switchNetwork = useCallback(async (targetChainId: number) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error: any) {
      // Chain not added to MetaMask
      if (error.code === 4902) {
        const networkConfig = getNetworkConfig(targetChainId);
        if (networkConfig) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [networkConfig],
          });
        }
      }
    }
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      window.location.reload(); // Recommended by MetaMask
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [connectWallet, disconnectWallet]);

  return {
    ...web3State,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  };
}

function getNetworkConfig(chainId: number) {
  const configs: Record<number, any> = {
    11155111: {
      // Sepolia
      chainId: "0xaa36a7",
      chainName: "Sepolia test network",
      rpcUrls: ["https://sepolia.infura.io/v3/"],
      blockExplorerUrls: ["https://sepolia.etherscan.io/"],
      nativeCurrency: {
        name: "ETH",
        symbol: "ETH",
        decimals: 18,
      },
    },
  };
  return configs[chainId];
}
