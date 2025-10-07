"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

export default function Auction31Debugger() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auctionData, setAuctionData] = useState<any>(null);

  const debugAuction31 = async () => {
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

      console.log("🔍 Debugging Auction #31...");

      // 1. Get auction data
      const auction = await auctionContract.getAuction(31);
      console.log("🏆 Auction #31 raw data:", auction);

      // 2. Parse the data
      const auctionInfo = {
        auctionId: "31",
        nftContract: auction.nftContract,
        tokenId: Number(auction.tokenId),
        seller: auction.seller,
        auctionType: Number(auction.auctionType),
        status: Number(auction.status),
        allowPartialFulfillment: auction.allowPartialFulfillment,
        isSettled: auction.isSettled,
        revealPhaseStarted: auction.revealPhaseStarted,
        startingPrice: ethers.formatEther(auction.startingPrice),
        reservePrice: ethers.formatEther(auction.reservePrice),
        buyNowPrice: ethers.formatEther(auction.buyNowPrice),
        currentPrice: ethers.formatEther(auction.currentPrice),
        bidIncrement: ethers.formatEther(auction.bidIncrement),
        highestBid: ethers.formatEther(auction.highestBid),
        startTime: Number(auction.startTime),
        endTime: Number(auction.endTime),
        extensionThreshold: Number(auction.extensionThreshold),
        extensionDuration: Number(auction.extensionDuration),
        revealEndTime: Number(auction.revealEndTime),
        highestBidder: auction.highestBidder,
        minBidders: Number(auction.minBidders),
        totalBidders: Number(auction.totalBidders),
      };

      console.log("🏆 Auction #31 parsed data:", auctionInfo);

      setAuctionData(auctionInfo);

      // 3. Check auction type mapping
      const auctionTypeNames = {
        0: "ENGLISH",
        1: "DUTCH",
        2: "SEALED_BID",
        3: "RESERVE",
      };

      console.log("🔍 Auction Type Analysis:", {
        rawAuctionType: auction.auctionType,
        parsedAuctionType: Number(auction.auctionType),
        typeName: auctionTypeNames[Number(auction.auctionType)],
        expectedForReserve: 3,
        isCorrect: Number(auction.auctionType) === 3,
      });
    } catch (error) {
      console.error("❌ Error debugging auction #31:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        🔍 Auction #31 Debugger
      </h2>

      <p className="text-gray-600 mb-4">
        Debug the Reserve Auction creation issue for auction #31
      </p>

      <button
        onClick={debugAuction31}
        disabled={loading || !isConnected}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg mb-4"
      >
        {loading ? "Loading..." : "Debug Auction #31"}
      </button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Auction Data */}
      {auctionData && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            🏆 Auction #31 Data
          </h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p>
                  <strong>NFT Contract:</strong> {auctionData.nftContract}
                </p>
                <p>
                  <strong>Token ID:</strong> {auctionData.tokenId}
                </p>
                <p>
                  <strong>Seller:</strong> {auctionData.seller}
                </p>
                <p>
                  <strong>Auction Type:</strong> {auctionData.auctionType}
                </p>
                <p>
                  <strong>Status:</strong> {auctionData.status}
                </p>
                <p>
                  <strong>Is Settled:</strong>{" "}
                  {auctionData.isSettled ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <p>
                  <strong>Starting Price:</strong> {auctionData.startingPrice}{" "}
                  ETH
                </p>
                <p>
                  <strong>Reserve Price:</strong> {auctionData.reservePrice} ETH
                </p>
                <p>
                  <strong>Buy Now Price:</strong> {auctionData.buyNowPrice} ETH
                </p>
                <p>
                  <strong>Current Price:</strong> {auctionData.currentPrice} ETH
                </p>
                <p>
                  <strong>Bid Increment:</strong> {auctionData.bidIncrement} ETH
                </p>
                <p>
                  <strong>Highest Bid:</strong> {auctionData.highestBid} ETH
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p>
                  <strong>Start Time:</strong>{" "}
                  {new Date(auctionData.startTime * 1000).toLocaleString()}
                </p>
                <p>
                  <strong>End Time:</strong>{" "}
                  {new Date(auctionData.endTime * 1000).toLocaleString()}
                </p>
                <p>
                  <strong>Extension Threshold:</strong>{" "}
                  {auctionData.extensionThreshold} seconds
                </p>
                <p>
                  <strong>Extension Duration:</strong>{" "}
                  {auctionData.extensionDuration} seconds
                </p>
              </div>
              <div>
                <p>
                  <strong>Highest Bidder:</strong> {auctionData.highestBidder}
                </p>
                <p>
                  <strong>Min Bidders:</strong> {auctionData.minBidders}
                </p>
                <p>
                  <strong>Total Bidders:</strong> {auctionData.totalBidders}
                </p>
                <p>
                  <strong>Reveal Phase Started:</strong>{" "}
                  {auctionData.revealPhaseStarted ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </div>

          {/* Auction Type Analysis */}
          <div className="mt-4 bg-blue-50 p-4 rounded-md">
            <h4 className="font-semibold text-blue-900 mb-2">
              🔍 Auction Type Analysis
            </h4>
            <div className="text-sm">
              <p>
                <strong>Raw Auction Type:</strong> {auctionData.auctionType}
              </p>
              <p>
                <strong>Expected for Reserve:</strong> 3
              </p>
              <p>
                <strong>Is Correct:</strong>{" "}
                {auctionData.auctionType === 3 ? "✅ Yes" : "❌ No"}
              </p>
              <p>
                <strong>Type Name:</strong>{" "}
                {auctionData.auctionType === 0
                  ? "ENGLISH"
                  : auctionData.auctionType === 1
                  ? "DUTCH"
                  : auctionData.auctionType === 2
                  ? "SEALED_BID"
                  : auctionData.auctionType === 3
                  ? "RESERVE"
                  : "UNKNOWN"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
