"use client";

import React from "react";
import { useWeb3Context } from "../../providers/Web3Provider";
import Button from "../ui/Button";
import { truncateAddress } from "../../utils/helpers";

export default function WalletButton() {
  const {
    account,
    isConnected,
    isLoading,
    connectWallet,
    disconnectWallet,
    chainId,
  } = useWeb3Context();

  const SEPOLIA_CHAIN_ID = 11155111;
  const isWrongNetwork = isConnected && chainId !== SEPOLIA_CHAIN_ID;

  if (isLoading) {
    return (
      <Button isLoading disabled>
        Connecting...
      </Button>
    );
  }

  if (!isConnected) {
    return <Button onClick={connectWallet}>Connect Wallet</Button>;
  }

  if (isWrongNetwork) {
    return (
      <Button variant="outline" onClick={() => window.location.reload()}>
        Wrong Network?
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm text-gray-600">
        {truncateAddress(account || "")}
      </div>
      <Button variant="outline" size="sm" onClick={disconnectWallet}>
        Disconnect
      </Button>
    </div>
  );
}
