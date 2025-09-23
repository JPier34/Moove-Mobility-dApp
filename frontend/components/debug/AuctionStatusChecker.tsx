"use client";

import React, { useState } from "react";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

interface AuctionStatusCheckerProps {
  auctionId: number;
}

export default function AuctionStatusChecker({
  auctionId,
}: AuctionStatusCheckerProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAuctionStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No ethereum provider available");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      console.log(
        `🔍 Checking auction ${auctionId} status directly from contract...`
      );

      const auctionData = await auctionContract.getAuction(auctionId);
      const status = Number(auctionData.status);
      const endTime = Number(auctionData.endTime);
      const currentTime = Math.floor(Date.now() / 1000);

      const result = {
        auctionId: auctionData.auctionId.toString(),
        status: status,
        statusName: getStatusName(status),
        isSettled: auctionData.isSettled,
        highestBidder: auctionData.highestBidder,
        highestBid: ethers.formatEther(auctionData.highestBid),
        seller: auctionData.seller,
        nftContract: auctionData.nftContract,
        tokenId: auctionData.tokenId.toString(),
        auctionType: Number(auctionData.auctionType || 0),
        startTime: new Date(Number(auctionData.startTime) * 1000).toISOString(),
        endTime: new Date(endTime * 1000).toISOString(),
        currentTime: new Date().toISOString(),
        timeDifference: (endTime * 1000 - Date.now()) / 1000,
        timeExpired: currentTime >= endTime,
        startingPrice: ethers.formatEther(auctionData.startingPrice),
        reservePrice: auctionData.reservePrice
          ? ethers.formatEther(auctionData.reservePrice)
          : "N/A",
      };

      console.log(`📊 Contract auction data:`, result);
      setStatus(result);
    } catch (error: any) {
      console.error(`❌ Error checking auction ${auctionId} status:`, error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusName = (status: number) => {
    const statusNames = {
      0: "PENDING",
      1: "ACTIVE",
      2: "REVEAL", // Per sealed bid auctions
      3: "ENDED",
      4: "SETTLED",
      5: "CANCELLED",
    };
    return statusNames[status as keyof typeof statusNames] || "UNKNOWN";
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🔍 Auction Status Checker</h3>

      <div className="mb-4">
        <button
          onClick={checkAuctionStatus}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Checking..." : `Check Auction ${auctionId}`}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {status && (
        <div className="space-y-2">
          <h4 className="font-semibold text-green-600">
            ✅ Auction Status Found
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <strong>ID:</strong> {status.auctionId}
            </div>
            <div>
              <strong>Status:</strong> {status.status} ({status.statusName})
            </div>
            <div>
              <strong>Settled:</strong> {status.isSettled ? "Yes" : "No"}
            </div>
            <div>
              <strong>Type:</strong> {status.auctionType}
            </div>
            <div>
              <strong>Seller:</strong> {status.seller}
            </div>
            <div>
              <strong>Highest Bidder:</strong> {status.highestBidder}
            </div>
            <div>
              <strong>Highest Bid:</strong> {status.highestBid} ETH
            </div>
            <div>
              <strong>Starting Price:</strong> {status.startingPrice} ETH
            </div>
            <div>
              <strong>Reserve Price:</strong> {status.reservePrice} ETH
            </div>
            <div>
              <strong>NFT Contract:</strong> {status.nftContract}
            </div>
            <div>
              <strong>Token ID:</strong> {status.tokenId}
            </div>
            <div>
              <strong>Start Time:</strong> {status.startTime}
            </div>
            <div>
              <strong>End Time:</strong> {status.endTime}
            </div>
            <div>
              <strong>Time Expired:</strong> {status.timeExpired ? "Yes" : "No"}
            </div>
            <div>
              <strong>Time Difference:</strong> {status.timeDifference} seconds
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
