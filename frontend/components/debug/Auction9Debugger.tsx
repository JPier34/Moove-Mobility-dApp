"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import toast from "react-hot-toast";

export default function Auction9Debugger() {
  const { address, isConnected } = useAccount();
  const [auctionData, setAuctionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAuction9 = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || "https://1rpc.io/sepolia"
      );
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      console.log("🔍 Fetching auction #9 data...");
      const data = await auctionContract.getAuction(9);

      const processedData = {
        auctionId: "9",
        status: Number(data.status),
        auctionType: Number(data.auctionType),
        seller: data.seller,
        highestBidder: data.highestBidder,
        highestBid: ethers.formatEther(data.highestBid),
        startTime: new Date(Number(data.startTime) * 1000).toISOString(),
        endTime: new Date(Number(data.endTime) * 1000).toISOString(),
        currentTime: new Date().toISOString(),
        isExpired: Math.floor(Date.now() / 1000) > Number(data.endTime),
        isUserWinner:
          data.highestBidder.toLowerCase() === address.toLowerCase(),
        reservePrice: data.reservePrice
          ? ethers.formatEther(data.reservePrice)
          : "N/A",
        buyNowPrice: data.buyNowPrice
          ? ethers.formatEther(data.buyNowPrice)
          : "N/A",
      };

      setAuctionData(processedData);
      console.log("📊 Auction #9 data:", processedData);

      // Check notification logic
      const shouldHaveNotification = checkNotificationLogic(processedData);
      console.log("🔔 Should have notification:", shouldHaveNotification);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error("❌ Error fetching auction #9:", err);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const checkNotificationLogic = (data: any) => {
    const nowTimestamp = Math.floor(Date.now() / 1000);
    const endTime = Math.floor(new Date(data.endTime).getTime() / 1000);

    const logic = {
      status: data.status,
      auctionType: data.auctionType,
      isExpired: data.isExpired,
      isUserWinner: data.isUserWinner,
      shouldHaveEndAuction:
        data.status === 1 && data.isExpired && data.isUserWinner,
      shouldHaveSettleAuction: data.status === 3 && data.isUserWinner,
      shouldHaveRefund: data.status === 5, // Cancelled
      timeSinceExpired: data.isExpired
        ? Math.floor((nowTimestamp - endTime) / 60)
        : 0,
    };

    console.log("🧠 Notification logic:", logic);
    return logic;
  };

  const checkLocalStorage = () => {
    if (typeof window === "undefined") return;

    const refundNotifications = localStorage.getItem(
      "moove-refund-notifications"
    );
    const claimNotifications = localStorage.getItem(
      "moove-claim-notifications"
    );
    const lastCheckedBlock = localStorage.getItem("moove-last-checked-block");
    const lastCheckedClaimBlock = localStorage.getItem(
      "moove-last-checked-claim-block"
    );

    console.log("💾 LocalStorage data:", {
      refundNotifications: refundNotifications
        ? JSON.parse(refundNotifications)
        : null,
      claimNotifications: claimNotifications
        ? JSON.parse(claimNotifications)
        : null,
      lastCheckedBlock,
      lastCheckedClaimBlock,
    });

    toast.success("LocalStorage data logged to console");
  };

  const forceNotificationCheck = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      // Dispatch force check event
      window.dispatchEvent(
        new CustomEvent("forceClaimCheck", {
          detail: { auctionId: "9" },
        })
      );

      toast.success("Force notification check triggered");
    } catch (err) {
      toast.error("Error triggering force check");
    }
  };

  const getStatusName = (status: number) => {
    const statusNames = {
      0: "PENDING",
      1: "ACTIVE",
      2: "REVEAL",
      3: "ENDED",
      4: "SETTLED",
      5: "CANCELLED",
    };
    return statusNames[status as keyof typeof statusNames] || "UNKNOWN";
  };

  const getTypeName = (type: number) => {
    const typeNames = {
      0: "ENGLISH",
      1: "DUTCH",
      2: "SEALED_BID",
      3: "RESERVE",
    };
    return typeNames[type as keyof typeof typeNames] || "UNKNOWN";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        🔍 Auction #9 Debugger
      </h2>

      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={checkAuction9}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Checking..." : "Check Auction #9"}
          </button>

          <button
            onClick={checkLocalStorage}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Check LocalStorage
          </button>

          <button
            onClick={forceNotificationCheck}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Force Notification Check
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-red-800 dark:text-red-200 font-semibold">
              ❌ Error
            </h3>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {auctionData && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-gray-900 dark:text-white font-semibold mb-3">
              📊 Auction #9 Details
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Status:</strong> {auctionData.status} (
                {getStatusName(auctionData.status)})
              </div>
              <div>
                <strong>Type:</strong> {auctionData.auctionType} (
                {getTypeName(auctionData.auctionType)})
              </div>
              <div>
                <strong>Seller:</strong> {auctionData.seller}
              </div>
              <div>
                <strong>Highest Bidder:</strong> {auctionData.highestBidder}
              </div>
              <div>
                <strong>Highest Bid:</strong> {auctionData.highestBid} ETH
              </div>
              <div>
                <strong>Reserve Price:</strong> {auctionData.reservePrice} ETH
              </div>
              <div>
                <strong>Start Time:</strong> {auctionData.startTime}
              </div>
              <div>
                <strong>End Time:</strong> {auctionData.endTime}
              </div>
              <div>
                <strong>Current Time:</strong> {auctionData.currentTime}
              </div>
              <div>
                <strong>Is Expired:</strong>{" "}
                {auctionData.isExpired ? "✅ YES" : "❌ NO"}
              </div>
              <div>
                <strong>Is User Winner:</strong>{" "}
                {auctionData.isUserWinner ? "✅ YES" : "❌ NO"}
              </div>
              <div>
                <strong>User Address:</strong> {address}
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                🔔 Notification Analysis
              </h4>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                {auctionData.status === 1 &&
                  auctionData.isExpired &&
                  auctionData.isUserWinner && (
                    <div className="text-green-600 dark:text-green-400">
                      ✅ Should have END_AUCTION notification
                    </div>
                  )}
                {auctionData.status === 3 && auctionData.isUserWinner && (
                  <div className="text-green-600 dark:text-green-400">
                    ✅ Should have SETTLE_AUCTION notification
                  </div>
                )}
                {auctionData.status === 4 && (
                  <div className="text-gray-600 dark:text-gray-400">
                    ℹ️ Auction is already SETTLED
                  </div>
                )}
                {auctionData.status === 5 && (
                  <div className="text-orange-600 dark:text-orange-400">
                    ⚠️ Auction was CANCELLED
                  </div>
                )}
                {!auctionData.isUserWinner && (
                  <div className="text-gray-600 dark:text-gray-400">
                    ℹ️ You are not the winner of this auction
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
