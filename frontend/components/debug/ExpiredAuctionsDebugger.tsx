"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

export default function ExpiredAuctionsDebugger() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  const debugExpiredAuctions = async () => {
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

      console.log("🔍 Debugging expired auctions...");

      // Find total auctions
      const maxCheckAuctions = 100;
      let totalAuctions = 0;

      for (let i = maxCheckAuctions; i >= 1; i--) {
        try {
          const auctionData = await auctionContract.getAuction(i);
          if (
            auctionData &&
            auctionData.seller !== "0x0000000000000000000000000000000000000000"
          ) {
            totalAuctions = i;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      console.log(`📊 Found ${totalAuctions} total auctions`);

      const expiredAuctions = [];
      const now = Math.floor(Date.now() / 1000);

      // Check ALL auctions, not just last 50
      for (let auctionId = 1; auctionId <= totalAuctions; auctionId++) {
        try {
          const auctionData = await auctionContract.getAuction(auctionId);
          const status = Number(auctionData.status);
          const endTime = Number(auctionData.endTime);
          const highestBidder = auctionData.highestBidder;
          const auctionType = Number(auctionData.auctionType);
          const seller = auctionData.seller;

          // Skip invalid auctions
          if (seller === "0x0000000000000000000000000000000000000000") {
            continue;
          }

          // Skip Dutch auctions
          if (auctionType === 1) {
            continue;
          }

          const isExpired = now > endTime;
          const isUserWinner =
            address && highestBidder.toLowerCase() === address.toLowerCase();

          // Check if auction is expired and user is winner
          if (isExpired && isUserWinner && status === 1) {
            expiredAuctions.push({
              auctionId,
              status,
              endTime,
              endTimeFormatted: new Date(endTime * 1000).toLocaleString(),
              highestBidder,
              auctionType,
              seller,
              isExpired,
              daysSinceExpired: Math.floor((now - endTime) / (24 * 60 * 60)),
            });
          }
        } catch (error) {
          continue;
        }
      }

      console.log(
        `🏆 Found ${expiredAuctions.length} expired auctions where user is winner`
      );

      setResults({
        totalAuctions,
        expiredAuctions,
        currentTime: now,
        currentTimeFormatted: new Date(now * 1000).toLocaleString(),
        userAddress: address,
      });
    } catch (error) {
      console.error("❌ Error debugging expired auctions:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        🔍 Expired Auctions Debugger
      </h2>

      <p className="text-gray-600 mb-4">
        Debug why expired auctions are not being detected for claim
        notifications
      </p>

      <button
        onClick={debugExpiredAuctions}
        disabled={loading || !isConnected}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg mb-4"
      >
        {loading ? "Loading..." : "Debug Expired Auctions"}
      </button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {results && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            🔍 Debug Results
          </h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p>
                  <strong>Total Auctions:</strong> {results.totalAuctions}
                </p>
                <p>
                  <strong>Current Time:</strong> {results.currentTimeFormatted}
                </p>
                <p>
                  <strong>User Address:</strong> {results.userAddress}
                </p>
              </div>
              <div>
                <p>
                  <strong>Expired Auctions Found:</strong>{" "}
                  {results.expiredAuctions.length}
                </p>
              </div>
            </div>

            {results.expiredAuctions.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  🏆 Expired Auctions Where User is Winner
                </h4>
                <div className="space-y-2">
                  {results.expiredAuctions.map((auction: any) => (
                    <div
                      key={auction.auctionId}
                      className="bg-blue-50 p-3 rounded border"
                    >
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p>
                            <strong>Auction ID:</strong> {auction.auctionId}
                          </p>
                          <p>
                            <strong>Status:</strong> {auction.status}
                          </p>
                          <p>
                            <strong>Type:</strong> {auction.auctionType}
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>End Time:</strong>{" "}
                            {auction.endTimeFormatted}
                          </p>
                          <p>
                            <strong>Days Since Expired:</strong>{" "}
                            {auction.daysSinceExpired}
                          </p>
                          <p>
                            <strong>Seller:</strong> {auction.seller}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.expiredAuctions.length === 0 && (
              <div className="mt-4 bg-yellow-50 p-3 rounded border">
                <p className="text-yellow-800">
                  <strong>No expired auctions found</strong> where the current
                  user is the winner. This could mean:
                </p>
                <ul className="list-disc list-inside mt-2 text-yellow-700">
                  <li>No auctions have expired yet</li>
                  <li>User is not the winner of any expired auctions</li>
                  <li>All expired auctions have already been settled</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
