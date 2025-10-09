"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

export default function Auction4Debugger() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  const debugAuction4 = async () => {
    if (!isConnected) {
      setError("Please connect your wallet");
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

      console.log("🔍 Debugging Auction #4 in detail...");

      // Get auction data
      const auctionData = await auctionContract.getAuction(4);
      console.log("🏆 Auction #4 raw data:", auctionData);

      // Parse the data
      const auctionInfo = {
        auctionId: "4",
        nftContract: auctionData.nftContract,
        tokenId: Number(auctionData.tokenId),
        seller: auctionData.seller,
        auctionType: Number(auctionData.auctionType),
        status: Number(auctionData.status),
        allowPartialFulfillment: auctionData.allowPartialFulfillment,
        isSettled: auctionData.isSettled,
        revealPhaseStarted: auctionData.revealPhaseStarted,
        startingPrice: ethers.formatEther(auctionData.startingPrice),
        reservePrice: ethers.formatEther(auctionData.reservePrice),
        buyNowPrice: ethers.formatEther(auctionData.buyNowPrice),
        currentPrice: ethers.formatEther(auctionData.currentPrice),
        bidIncrement: ethers.formatEther(auctionData.bidIncrement),
        startTime: new Date(Number(auctionData.startTime) * 1000).toISOString(),
        endTime: new Date(Number(auctionData.endTime) * 1000).toISOString(),
        extensionThreshold: Number(auctionData.extensionThreshold),
        extensionDuration: Number(auctionData.extensionDuration),
        highestBid: ethers.formatEther(auctionData.highestBid),
        highestBidder: auctionData.highestBidder,
        minBidders: Number(auctionData.minBidders),
        totalBidders: Number(auctionData.totalBidders),
      };

      console.log("🏆 Auction #4 parsed data:", auctionInfo);

      // Calculate time remaining
      const now = Math.floor(Date.now() / 1000);
      const endTimeUnix = Number(auctionData.endTime);
      const timeRemaining = endTimeUnix - now;
      const timeRemainingMinutes = Math.floor(timeRemaining / 60);
      const timeRemainingSeconds = timeRemaining % 60;

      // Check if auction should be active
      const startTimeUnix = Number(auctionData.startTime);
      const shouldBeActive = now >= startTimeUnix && now < endTimeUnix;
      const isContractActive = Number(auctionData.status) === 1; // ACTIVE

      const debugInfo = {
        ...auctionInfo,
        currentTimeUnix: now,
        startTimeUnix,
        endTimeUnix,
        timeRemainingSeconds: timeRemaining,
        timeRemainingFormatted: `${timeRemainingMinutes}m ${timeRemainingSeconds}s`,
        shouldBeActive,
        isContractActive,
        statusMatch: shouldBeActive === isContractActive,
        auctionTypeName: auctionData.auctionType === 1 ? "DUTCH" : "OTHER",
      };

      console.log("🔍 Auction #4 debug analysis:", debugInfo);
      setResults(debugInfo);
    } catch (error) {
      console.error("❌ Error debugging auction #4:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        🔍 Auction #4 Debugger
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Debug why Auction #4 (Dutch Auction) is showing "Auction Ended" despite
        having time remaining
      </p>

      <button
        onClick={debugAuction4}
        disabled={loading || !isConnected}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Debugging..." : "Debug Auction #4"}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {results && (
        <div className="mt-6 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              🏆 Auction #4 Data
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <strong>NFT Contract:</strong> {results.nftContract}
              </div>
              <div>
                <strong>Token ID:</strong> {results.tokenId}
              </div>
              <div>
                <strong>Seller:</strong> {results.seller}
              </div>
              <div>
                <strong>Auction Type:</strong> {results.auctionType} (
                {results.auctionTypeName})
              </div>
              <div>
                <strong>Status:</strong> {results.status}
              </div>
              <div>
                <strong>Is Settled:</strong> {results.isSettled ? "Yes" : "No"}
              </div>
              <div>
                <strong>Starting Price:</strong> {results.startingPrice} ETH
              </div>
              <div>
                <strong>Reserve Price:</strong> {results.reservePrice} ETH
              </div>
              <div>
                <strong>Buy Now Price:</strong> {results.buyNowPrice} ETH
              </div>
              <div>
                <strong>Current Price:</strong> {results.currentPrice} ETH
              </div>
              <div>
                <strong>Bid Increment:</strong> {results.bidIncrement} ETH
              </div>
              <div>
                <strong>Start Time:</strong> {results.startTime}
              </div>
              <div>
                <strong>End Time:</strong> {results.endTime}
              </div>
              <div>
                <strong>Extension Threshold:</strong>{" "}
                {results.extensionThreshold} seconds
              </div>
              <div>
                <strong>Extension Duration:</strong> {results.extensionDuration}{" "}
                seconds
              </div>
              <div>
                <strong>Highest Bid:</strong> {results.highestBid} ETH
              </div>
              <div>
                <strong>Highest Bidder:</strong> {results.highestBidder}
              </div>
              <div>
                <strong>Min Bidders:</strong> {results.minBidders}
              </div>
              <div>
                <strong>Total Bidders:</strong> {results.totalBidders}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              🔍 Auction Type Analysis
            </h3>
            <div className="text-sm space-y-1">
              <div>
                <strong>Raw Auction Type:</strong> {results.auctionType}
              </div>
              <div>
                <strong>Expected for Dutch:</strong> 1
              </div>
              <div>
                <strong>Is Correct:</strong>{" "}
                {results.auctionType === 1 ? "✅ Yes" : "❌ No"}
              </div>
              <div>
                <strong>Type Name:</strong> {results.auctionTypeName}
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              ⏰ Time Analysis
            </h3>
            <div className="text-sm space-y-1">
              <div>
                <strong>Current Time (Unix):</strong> {results.currentTimeUnix}
              </div>
              <div>
                <strong>Start Time (Unix):</strong> {results.startTimeUnix}
              </div>
              <div>
                <strong>End Time (Unix):</strong> {results.endTimeUnix}
              </div>
              <div>
                <strong>Time Remaining:</strong>{" "}
                {results.timeRemainingFormatted}
              </div>
              <div>
                <strong>Should Be Active:</strong>{" "}
                {results.shouldBeActive ? "✅ Yes" : "❌ No"}
              </div>
              <div>
                <strong>Contract Status Active:</strong>{" "}
                {results.isContractActive ? "✅ Yes" : "❌ No"}
              </div>
              <div>
                <strong>Status Match:</strong>{" "}
                {results.statusMatch ? "✅ Yes" : "❌ No"}
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              🎯 Frontend Display Logic
            </h3>
            <div className="text-sm space-y-1">
              <div>
                <strong>Status Check:</strong>{" "}
                {results.status !== 1 ? "❌ Not ACTIVE" : "✅ ACTIVE"}
              </div>
              <div>
                <strong>Time Check:</strong>{" "}
                {results.timeRemainingSeconds <= 0
                  ? "❌ Time Expired"
                  : "✅ Time Remaining"}
              </div>
              <div>
                <strong>Should Show "Ended":</strong>{" "}
                {results.status !== 1 || results.timeRemainingSeconds <= 0
                  ? "❌ Yes (PROBLEM)"
                  : "✅ No"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



