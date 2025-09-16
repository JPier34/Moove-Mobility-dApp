"use client";

import React, { useState } from "react";
import { useAuctionsEnhanced } from "@/hooks/enhanced-auction-utils";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

export default function AllAuctionsDebug() {
  const { address } = useAccount();
  const { auctions, isLoading, error } = useAuctionsEnhanced();
  const [expandedAuctions, setExpandedAuctions] = useState<Set<number>>(
    new Set()
  );
  const [contractData, setContractData] = useState<any[]>([]);
  const [loadingContract, setLoadingContract] = useState(false);

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

  const getAuctionTypeName = (type: number) => {
    const typeNames = {
      0: "ENGLISH",
      1: "DUTCH",
      2: "SEALED_BID",
      3: "RESERVE",
    };
    return typeNames[type as keyof typeof typeNames] || "UNKNOWN";
  };

  const toggleExpanded = (auctionId: number) => {
    const newExpanded = new Set(expandedAuctions);
    if (newExpanded.has(auctionId)) {
      newExpanded.delete(auctionId);
    } else {
      newExpanded.add(auctionId);
    }
    setExpandedAuctions(newExpanded);
  };

  const fetchContractData = async () => {
    setLoadingContract(true);
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

      const totalAuctions = await auctionContract.totalAuctions();
      const totalCount = Number(totalAuctions);

      console.log(`🔍 Fetching ${totalCount} auctions from contract...`);

      const contractAuctions = [];
      for (let i = 0; i < totalCount; i++) {
        try {
          const auctionData = await auctionContract.getAuction(i);
          contractAuctions.push({
            auctionId: i,
            contractData: auctionData,
            status: Number(auctionData.status),
            statusName: getStatusName(Number(auctionData.status)),
            auctionType: Number(auctionData.auctionType || 0),
            auctionTypeName: getAuctionTypeName(
              Number(auctionData.auctionType || 0)
            ),
            highestBidder: auctionData.highestBidder,
            seller: auctionData.seller,
            tokenId: auctionData.tokenId.toString(),
            nftContract: auctionData.nftContract,
            isSettled: auctionData.isSettled,
            startTime: new Date(
              Number(auctionData.startTime) * 1000
            ).toISOString(),
            endTime: new Date(Number(auctionData.endTime) * 1000).toISOString(),
            startingPrice: ethers.formatEther(auctionData.startingPrice),
            reservePrice: auctionData.reservePrice
              ? ethers.formatEther(auctionData.reservePrice)
              : "N/A",
            highestBid: ethers.formatEther(auctionData.highestBid),
          });
        } catch (err) {
          console.error(`❌ Error fetching auction ${i}:`, err);
        }
      }

      setContractData(contractAuctions);
      console.log(
        `✅ Fetched ${contractAuctions.length} auctions from contract:`,
        contractAuctions
      );
    } catch (error: any) {
      console.error("❌ Error fetching contract data:", error);
    } finally {
      setLoadingContract(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          ❌ Error Loading Auctions
        </h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🔍 All Auctions Debug</h3>

      {/* Contract Data Button */}
      <div className="mb-4">
        <button
          onClick={fetchContractData}
          disabled={loadingContract}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loadingContract ? "Fetching..." : "Fetch Contract Data"}
        </button>
      </div>

      {/* Summary */}
      <div className="mb-6 p-4 bg-white rounded-lg">
        <h4 className="font-semibold mb-2">📊 Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <strong>Frontend Auctions:</strong> {auctions.length}
          </div>
          <div>
            <strong>Contract Auctions:</strong> {contractData.length}
          </div>
          <div>
            <strong>Connected Wallet:</strong> {address ? "✅" : "❌"}
          </div>
          <div>
            <strong>User Address:</strong>{" "}
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "N/A"}
          </div>
        </div>
      </div>

      {/* Contract Data */}
      {contractData.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold mb-3">
            📋 Contract Data ({contractData.length} auctions)
          </h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {contractData.map((auction) => (
              <div key={auction.auctionId} className="bg-white rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">#{auction.auctionId}</span>
                    <span className="text-sm text-gray-600">
                      {auction.auctionTypeName} | Token #{auction.tokenId}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        auction.status === 4
                          ? "bg-blue-100 text-blue-800"
                          : auction.status === 3
                          ? "bg-gray-100 text-gray-800"
                          : auction.status === 1
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {auction.statusName}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleExpanded(auction.auctionId)}
                    className="text-blue-500 hover:text-blue-700 text-sm"
                  >
                    {expandedAuctions.has(auction.auctionId) ? "Hide" : "Show"}{" "}
                    Details
                  </button>
                </div>

                {expandedAuctions.has(auction.auctionId) && (
                  <div className="mt-3 pt-3 border-t grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <div>
                      <strong>Seller:</strong> {auction.seller}
                    </div>
                    <div>
                      <strong>Winner:</strong> {auction.highestBidder || "None"}
                    </div>
                    <div>
                      <strong>Highest Bid:</strong> {auction.highestBid} ETH
                    </div>
                    <div>
                      <strong>Starting Price:</strong> {auction.startingPrice}{" "}
                      ETH
                    </div>
                    <div>
                      <strong>Reserve Price:</strong> {auction.reservePrice} ETH
                    </div>
                    <div>
                      <strong>Settled:</strong>{" "}
                      {auction.isSettled ? "Yes" : "No"}
                    </div>
                    <div>
                      <strong>Start Time:</strong> {auction.startTime}
                    </div>
                    <div>
                      <strong>End Time:</strong> {auction.endTime}
                    </div>
                    <div>
                      <strong>NFT Contract:</strong> {auction.nftContract}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Frontend Data */}
      <div>
        <h4 className="font-semibold mb-3">
          🖥️ Frontend Data ({auctions.length} auctions)
        </h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {auctions.map((auction) => (
            <div key={auction.auctionId} className="bg-white rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="font-medium">#{auction.auctionId}</span>
                  <span className="text-sm text-gray-600">
                    {auction.nftName || `NFT #${auction.nftId}`}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getAuctionTypeName(auction.auctionType)}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      auction.status === 4
                        ? "bg-blue-100 text-blue-800"
                        : auction.status === 3
                        ? "bg-gray-100 text-gray-800"
                        : auction.status === 1
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {getStatusName(auction.status)}
                  </span>
                </div>
                <button
                  onClick={() =>
                    toggleExpanded(parseInt(auction.auctionId) + 1000)
                  }
                  className="text-blue-500 hover:text-blue-700 text-sm"
                >
                  {expandedAuctions.has(parseInt(auction.auctionId) + 1000)
                    ? "Hide"
                    : "Show"}{" "}
                  Details
                </button>
              </div>

              {expandedAuctions.has(parseInt(auction.auctionId) + 1000) && (
                <div className="mt-3 pt-3 border-t grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <div>
                    <strong>Token ID:</strong> {auction.nftId}
                  </div>
                  <div>
                    <strong>Current Bid:</strong> {auction.currentBid} ETH
                  </div>
                  <div>
                    <strong>Highest Bidder:</strong>{" "}
                    {auction.highestBidder || "None"}
                  </div>
                  <div>
                    <strong>Seller:</strong> {auction.seller || "Unknown"}
                  </div>
                  <div>
                    <strong>End Time:</strong>{" "}
                    {auction.endTime?.toLocaleString()}
                  </div>
                  <div>
                    <strong>Bid Count:</strong> {auction.bidCount || 0}
                  </div>
                  <div>
                    <strong>Image:</strong> {auction.nftImage ? "✅" : "❌"}
                  </div>
                  <div>
                    <strong>Category:</strong>{" "}
                    {auction.nftCategory || "Unknown"}
                  </div>
                  <div>
                    <strong>Rarity:</strong>{" "}
                    {auction.attributes?.rarity || "Unknown"}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
