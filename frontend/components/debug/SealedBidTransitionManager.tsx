"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import toast from "react-hot-toast";

export default function SealedBidTransitionManager() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const forceTransitionAuction9 = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        signer
      );

      console.log("🔄 Forcing transition for auction #9...");

      // Check current status
      const currentData = await auctionContract.getAuction(9);
      console.log("📊 Current auction data:", {
        status: Number(currentData.status),
        auctionType: Number(currentData.auctionType),
        endTime: new Date(Number(currentData.endTime) * 1000).toISOString(),
        isExpired: Math.floor(Date.now() / 1000) > Number(currentData.endTime),
      });

      // Try to end the auction (this should trigger the transition)
      console.log("🏁 Attempting to end auction #9...");
      const tx = await auctionContract.endAuction(9, {
        gasLimit: 200000,
      });

      console.log("📝 Transaction sent:", tx.hash);
      toast.success("Ending auction #9...", { duration: 3000 });

      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed:", receipt);

      toast.success("Auction #9 ended successfully!", { duration: 5000 });

      // Check new status
      const newData = await auctionContract.getAuction(9);
      console.log("📊 New auction data:", {
        status: Number(newData.status),
        highestBidder: newData.highestBidder,
        highestBid: ethers.formatEther(newData.highestBid),
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error("❌ Error forcing transition:", err);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const checkAuction9Status = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || "https://1rpc.io/sepolia"
      );
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      const data = await auctionContract.getAuction(9);
      const statusNames = {
        0: "PENDING",
        1: "ACTIVE", 
        2: "REVEAL",
        3: "ENDED",
        4: "SETTLED",
        5: "CANCELLED"
      };

      const result = {
        status: Number(data.status),
        statusName: statusNames[Number(data.status) as keyof typeof statusNames],
        auctionType: Number(data.auctionType),
        highestBidder: data.highestBidder,
        highestBid: ethers.formatEther(data.highestBid),
        endTime: new Date(Number(data.endTime) * 1000).toISOString(),
        isExpired: Math.floor(Date.now() / 1000) > Number(data.endTime),
      };

      console.log("📊 Auction #9 Status:", result);
      toast.success(`Status: ${result.statusName} (${result.status})`);
      
    } catch (err) {
      console.error("❌ Error checking status:", err);
      toast.error("Error checking auction status");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        🔄 Sealed Bid Transition Manager
      </h2>
      
      <div className="space-y-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="text-yellow-800 dark:text-yellow-200 font-semibold mb-2">
            ⚠️ Auction #9 Issue Detected
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            Auction #9 has sealed bids but is stuck in ACTIVE status. 
            The system should have automatically transitioned to REVEAL phase.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={checkAuction9Status}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Check Status
          </button>
          
          <button
            onClick={forceTransitionAuction9}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Force Transition"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-red-800 dark:text-red-200 font-semibold">❌ Error</h3>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-blue-800 dark:text-blue-200 font-semibold mb-2">
            💡 What This Does
          </h3>
          <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
            <li>• Forces the auction to transition from ACTIVE → REVEAL → ENDED</li>
            <li>• Determines the winner based on revealed bids</li>
            <li>• Should trigger notifications for the winner</li>
            <li>• Gas cost: ~200,000 gas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
