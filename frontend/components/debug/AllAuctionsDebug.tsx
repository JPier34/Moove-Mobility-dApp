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
        "0x6096c74Ed257b14c601210e0B6256e39D534154e", // CORRECTED MooveAuction address
        [
          "function totalAuctions() view returns (uint256)",
          "function getAuction(uint256 auctionId) view returns (bytes)",
        ],
        provider
      );

      const totalAuctions = await auctionContract.totalAuctions();
      const totalCount = Number(totalAuctions);

      console.log(`🔍 Fetching ${totalCount} auctions from contract...`);

      const contractAuctions = [];
      for (let i = 0; i < totalCount; i++) {
        try {
          // Get raw bytes data
          const rawData = await auctionContract.getAuction(i);
          console.log(`📊 Raw data for auction ${i}:`, rawData);
          console.log(`📏 Raw data length: ${rawData.length} characters`);
          console.log(`📏 Raw data bytes: ${(rawData.length - 2) / 2} bytes`);

          // Analyze the raw data structure
          const dataBytes = (rawData.length - 2) / 2;
          console.log(
            `🔍 Data analysis: ${dataBytes} bytes = ${
              dataBytes / 32
            } fields of 32 bytes each`
          );

          // Try different decoding approaches based on data length
          let decoded;
          let auctionData;

          if (rawData === "0x") {
            // Auction doesn't exist
            console.log(`ℹ️ Auction ${i} doesn't exist (empty data)`);
            continue;
          }

          // Calculate expected length for different structures
          const dataLength = rawData.length - 2; // Remove "0x" prefix
          console.log(`📏 Data length for auction ${i}: ${dataLength} bytes`);

          // Try manual hex parsing for truncated data
          if (dataBytes >= 256) {
            console.log(
              `🔍 Manual hex parsing for auction ${i} (${dataBytes} bytes)`
            );

            // Extract data manually from hex string
            const hexData = rawData.slice(2); // Remove "0x"

            // Parse first 8 fields (256 bytes = 8 * 32 bytes)
            const auctionId = BigInt("0x" + hexData.slice(0, 64));
            const nftContract = "0x" + hexData.slice(64, 104);
            const tokenId = BigInt("0x" + hexData.slice(104, 168));
            const seller = "0x" + hexData.slice(168, 208);
            const auctionType = parseInt(hexData.slice(208, 210), 16);
            const startingPrice = BigInt("0x" + hexData.slice(210, 274));
            const reservePrice = BigInt("0x" + hexData.slice(274, 338));
            const buyNowPrice = BigInt("0x" + hexData.slice(338, 402));

            console.log(`🔍 Manual parsing results:`, {
              auctionId: auctionId.toString(),
              nftContract,
              tokenId: tokenId.toString(),
              seller,
              auctionType,
              startingPrice: ethers.formatEther(startingPrice),
              reservePrice: ethers.formatEther(reservePrice),
              buyNowPrice: ethers.formatEther(buyNowPrice),
            });

            decoded = [
              auctionId,
              nftContract,
              tokenId,
              seller,
              auctionType,
              startingPrice,
              reservePrice,
              buyNowPrice,
            ];
          } else {
            console.log(
              `❌ Data too short for auction ${i}: ${dataBytes} bytes`
            );
            continue;
          }

          // Create auctionData based on number of decoded fields
          auctionData = {
            auctionId: decoded[0].toString(),
            nftContract: decoded[1],
            tokenId: decoded[2].toString(),
            seller: decoded[3],
            // Use decoded values if available, otherwise defaults
            auctionType: decoded[4] !== undefined ? Number(decoded[4]) : 0,
            startingPrice:
              decoded[5] !== undefined ? ethers.formatEther(decoded[5]) : "0.0",
            reservePrice:
              decoded[6] !== undefined ? ethers.formatEther(decoded[6]) : "0.0",
            buyNowPrice:
              decoded[7] !== undefined ? ethers.formatEther(decoded[7]) : "0.0",
            // Default values for missing fields
            currentPrice: "0.0",
            startTime: 0,
            endTime: 0,
            bidIncrement: "0.0",
            highestBidder: "0x0000000000000000000000000000000000000000",
            highestBid: "0.0",
            status: 0,
            allowPartialFulfillment: false,
            minBidders: 0,
            totalBidders: 0,
            isSettled: false,
            extensionThreshold: "0.0",
            extensionDuration: 0,
          };

          console.log(`✅ Decoded auction ${i}:`, auctionData);

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
            tokenId: auctionData.tokenId,
            nftContract: auctionData.nftContract,
            isSettled: auctionData.isSettled,
            startTime: new Date(auctionData.startTime * 1000).toISOString(),
            endTime: new Date(auctionData.endTime * 1000).toISOString(),
            startingPrice: auctionData.startingPrice,
            reservePrice: auctionData.reservePrice,
            highestBid: auctionData.highestBid,
            timeRemaining: auctionData.endTime - Math.floor(Date.now() / 1000),
            timeRemainingMinutes: Math.round(
              (auctionData.endTime - Math.floor(Date.now() / 1000)) / 60
            ),
            isExpired: Math.floor(Date.now() / 1000) >= auctionData.endTime,
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
