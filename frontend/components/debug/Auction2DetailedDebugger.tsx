"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

export default function Auction2DetailedDebugger() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  const debugAuction2 = async () => {
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

      console.log("🔍 Debugging Auction #2 in detail...");

      // Get auction data
      const auctionData = await auctionContract.getAuction(2);
      console.log("🏆 Auction #2 raw data:", auctionData);

      // Parse the data
      const auctionInfo = {
        auctionId: "2",
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
        highestBid: ethers.formatEther(auctionData.highestBid),
        startTime: Number(auctionData.startTime),
        endTime: Number(auctionData.endTime),
        extensionThreshold: Number(auctionData.extensionThreshold),
        extensionDuration: Number(auctionData.extensionDuration),
        revealEndTime: Number(auctionData.revealEndTime),
        highestBidder: auctionData.highestBidder,
        minBidders: Number(auctionData.minBidders),
        totalBidders: Number(auctionData.totalBidders),
      };

      console.log("🏆 Auction #2 parsed data:", auctionInfo);

      const now = Math.floor(Date.now() / 1000);
      const isExpired = now > auctionInfo.endTime;
      const isUserWinner =
        auctionInfo.highestBidder.toLowerCase() ===
        (address?.toLowerCase() || "");
      const isReserveAuction = auctionInfo.auctionType === 3;
      const isBelowReserve =
        parseFloat(auctionInfo.highestBid) <
        parseFloat(auctionInfo.reservePrice);

      // Check if this should trigger notifications
      const shouldTriggerClaim =
        isExpired && isUserWinner && auctionInfo.status === 1;
      const shouldTriggerReserveViolation =
        isReserveAuction && isBelowReserve && isExpired;

      console.log("🔍 Analysis:", {
        isExpired,
        isUserWinner,
        isReserveAuction,
        isBelowReserve,
        shouldTriggerClaim,
        shouldTriggerReserveViolation,
        reservePrice: auctionInfo.reservePrice,
        highestBid: auctionInfo.highestBid,
      });

      // Check for events
      console.log("🔍 Checking for events...");

      // Get current block and calculate a reasonable range (last 10000 blocks)
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000);

      console.log(
        `🔍 Checking events from block ${fromBlock} to ${currentBlock}`
      );

      // Check AuctionSettled events
      const settledEvents = await auctionContract.queryFilter(
        auctionContract.filters.AuctionSettled(2, address),
        fromBlock,
        currentBlock
      );

      // Check AuctionCancelled events
      const cancelledEvents = await auctionContract.queryFilter(
        auctionContract.filters.AuctionCancelled(2),
        fromBlock,
        currentBlock
      );

      // Check AuctionEnded events
      const endedEvents = await auctionContract.queryFilter(
        auctionContract.filters.AuctionEnded(2),
        fromBlock,
        currentBlock
      );

      console.log("📊 Events found:", {
        settled: settledEvents.length,
        cancelled: cancelledEvents.length,
        ended: endedEvents.length,
      });

      setResults({
        auctionInfo,
        analysis: {
          isExpired,
          isUserWinner,
          isReserveAuction,
          isBelowReserve,
          shouldTriggerClaim,
          shouldTriggerReserveViolation,
          now,
          endTimeFormatted: new Date(
            auctionInfo.endTime * 1000
          ).toLocaleString(),
        },
        blockRange: {
          fromBlock,
          currentBlock,
          rangeSize: currentBlock - fromBlock,
        },
        events: {
          settled: settledEvents.map((e) => ({
            blockNumber: e.blockNumber,
            transactionHash: e.transactionHash,
            args: (e as any).args,
          })),
          cancelled: cancelledEvents.map((e) => ({
            blockNumber: e.blockNumber,
            transactionHash: e.transactionHash,
            args: (e as any).args,
          })),
          ended: endedEvents.map((e) => ({
            blockNumber: e.blockNumber,
            transactionHash: e.transactionHash,
            args: (e as any).args,
          })),
        },
      });
    } catch (error) {
      console.error("❌ Error debugging auction #2:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-black mb-4">
        🔍 Auction #2 Detailed Debugger
      </h2>

      <p className="text-gray-600 mb-4">
        Debug why Auction #2 (Reserve Auction with bid below reserve) is not
        triggering notifications
      </p>

      <button
        onClick={debugAuction2}
        disabled={loading || !isConnected}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-black dark:text-white px-4 py-2 rounded-lg mb-4"
      >
        {loading ? "Loading..." : "Debug Auction #2"}
      </button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {results && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            🏆 Auction #2 Analysis
          </h3>
          <div className="bg-gray-50 text-black p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p>
                  <strong>Auction Type:</strong>{" "}
                  {results.auctionInfo.auctionType} (RESERVE)
                </p>
                <p>
                  <strong>Status:</strong> {results.auctionInfo.status} (ACTIVE)
                </p>
                <p>
                  <strong>Starting Price:</strong>{" "}
                  {results.auctionInfo.startingPrice} ETH
                </p>
                <p>
                  <strong>Reserve Price:</strong>{" "}
                  {results.auctionInfo.reservePrice} ETH
                </p>
                <p>
                  <strong>Highest Bid:</strong> {results.auctionInfo.highestBid}{" "}
                  ETH
                </p>
                <p>
                  <strong>Highest Bidder:</strong>{" "}
                  {results.auctionInfo.highestBidder}
                </p>
              </div>
              <div>
                <p>
                  <strong>Start Time:</strong>{" "}
                  {new Date(
                    results.auctionInfo.startTime * 1000
                  ).toLocaleString()}
                </p>
                <p>
                  <strong>End Time:</strong> {results.analysis.endTimeFormatted}
                </p>
                <p>
                  <strong>Current Time:</strong>{" "}
                  {new Date(results.analysis.now * 1000).toLocaleString()}
                </p>
                <p>
                  <strong>Is Expired:</strong>{" "}
                  {results.analysis.isExpired ? "✅ Yes" : "❌ No"}
                </p>
                <p>
                  <strong>Is User Winner:</strong>{" "}
                  {results.analysis.isUserWinner ? "✅ Yes" : "❌ No"}
                </p>
                <p>
                  <strong>Is Below Reserve:</strong>{" "}
                  {results.analysis.isBelowReserve ? "✅ Yes" : "❌ No"}
                </p>
              </div>
            </div>

            <div className="mt-4 bg-blue-50 p-4 rounded-md">
              <h4 className="font-semibold text-blue-900 mb-2">
                🔍 Notification Analysis
              </h4>
              <div className="text-sm">
                <p>
                  <strong>Should Trigger Claim:</strong>{" "}
                  {results.analysis.shouldTriggerClaim ? "✅ Yes" : "❌ No"}
                </p>
                <p>
                  <strong>Should Trigger Reserve Violation:</strong>{" "}
                  {results.analysis.shouldTriggerReserveViolation
                    ? "✅ Yes"
                    : "❌ No"}
                </p>
              </div>
            </div>

            <div className="mt-4 bg-green-50 p-4 rounded-md">
              <h4 className="font-semibold text-green-900 mb-2">
                📊 Events Found
              </h4>
              <div className="text-sm">
                <p>
                  <strong>Block Range:</strong> {results.blockRange.fromBlock} →{" "}
                  {results.blockRange.currentBlock} (
                  {results.blockRange.rangeSize} blocks)
                </p>
                <p>
                  <strong>AuctionSettled Events:</strong>{" "}
                  {results.events.settled.length}
                </p>
                <p>
                  <strong>AuctionCancelled Events:</strong>{" "}
                  {results.events.cancelled.length}
                </p>
                <p>
                  <strong>AuctionEnded Events:</strong>{" "}
                  {results.events.ended.length}
                </p>

                {results.events.settled.length > 0 && (
                  <div className="mt-2">
                    <p>
                      <strong>Settled Event Details:</strong>
                    </p>
                    {results.events.settled.map((event: any, index: number) => (
                      <div
                        key={index}
                        className="bg-white p-2 rounded border mt-1"
                      >
                        <p>Block: {event.blockNumber}</p>
                        <p>Tx: {event.transactionHash}</p>
                        <p>Winner: {event.args?.winner}</p>
                        <p>
                          Final Price:{" "}
                          {event.args?.finalPrice
                            ? ethers.formatEther(event.args.finalPrice)
                            : "N/A"}{" "}
                          ETH
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {results.events.cancelled.length > 0 && (
                  <div className="mt-2">
                    <p>
                      <strong>Cancelled Event Details:</strong>
                    </p>
                    {results.events.cancelled.map(
                      (event: any, index: number) => (
                        <div
                          key={index}
                          className="bg-white p-2 rounded border mt-1"
                        >
                          <p>Block: {event.blockNumber}</p>
                          <p>Tx: {event.transactionHash}</p>
                          <p>Reason: {event.args?.reason}</p>
                        </div>
                      )
                    )}
                  </div>
                )}

                {results.events.ended.length > 0 && (
                  <div className="mt-2">
                    <p>
                      <strong>Ended Event Details:</strong>
                    </p>
                    {results.events.ended.map((event: any, index: number) => (
                      <div
                        key={index}
                        className="bg-white p-2 rounded border mt-1"
                      >
                        <p>Block: {event.blockNumber}</p>
                        <p>Tx: {event.transactionHash}</p>
                        <p>Auction ID: {event.args?.auctionId}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 bg-yellow-50 p-4 rounded-md">
              <h4 className="font-semibold text-yellow-900 mb-2">
                🤔 Expected Behavior
              </h4>
              <div className="text-sm text-yellow-800">
                <p>
                  <strong>For Reserve Auction with bid below reserve:</strong>
                </p>
                <ul className="list-disc list-inside mt-2">
                  <li>
                    When <code>settleAuction</code> is called, it should
                    automatically cancel the auction
                  </li>
                  <li>
                    An <code>AuctionCancelled</code> event should be emitted
                    with reason "Reserve price not met"
                  </li>
                  <li>The NFT should be returned to the seller</li>
                  <li>The bidder should be refunded</li>
                  <li>
                    No claim notification should appear (since auction is
                    cancelled)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
