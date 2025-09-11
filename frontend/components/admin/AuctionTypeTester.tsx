"use client";

import React, { useState } from "react";
import { AuctionType } from "@/types/auction";
import { useAuctionHandler } from "@/hooks/useAuctionHandler";

interface TestAuction {
  auctionId: string;
  nftId: string;
  nftName: string;
  nftImage: string;
  nftCategory: string;
  seller: string;
  auctionType: AuctionType;
  status: number;
  startPrice: string;
  reservePrice: string;
  buyNowPrice: string | null;
  currentBid: string;
  highestBidder: string | null;
  bidCount: number;
  startTime: Date;
  endTime: Date;
  bidIncrement: string;
  currency: string;
  attributes: any;
}

export default function AuctionTypeTester() {
  const [selectedAuctionType, setSelectedAuctionType] = useState<AuctionType>(
    AuctionType.ENGLISH
  );
  const [bidAmount, setBidAmount] = useState("0.01");
  const [nonce, setNonce] = useState("12345");
  const [testResults, setTestResults] = useState<string[]>([]);

  const { handleAuctionAction, isProcessing, error, step } =
    useAuctionHandler();

  // Create test auctions for each type
  const testAuctions: Record<AuctionType, TestAuction> = {
    [AuctionType.ENGLISH]: {
      auctionId: "1",
      nftId: "1",
      nftName: "Test English NFT",
      nftImage: "/images/test-nft.jpg",
      nftCategory: "Vehicle",
      seller: "0x1234567890123456789012345678901234567890",
      auctionType: AuctionType.ENGLISH,
      status: 1, // ACTIVE
      startPrice: "0.001",
      reservePrice: "0.005",
      buyNowPrice: "0.01",
      currentBid: "0.002", // Simulate existing bids
      highestBidder: "0x0987654321098765432109876543210987654321",
      bidCount: 2,
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      bidIncrement: "0.001",
      currency: "ETH",
      attributes: {},
    },
    [AuctionType.DUTCH]: {
      auctionId: "2",
      nftId: "2",
      nftName: "Test Dutch NFT",
      nftImage: "/images/test-nft.jpg",
      nftCategory: "Vehicle",
      seller: "0x1234567890123456789012345678901234567890",
      auctionType: AuctionType.DUTCH,
      status: 1, // ACTIVE
      startPrice: "0.01",
      reservePrice: "0.001",
      buyNowPrice: "0.001",
      currentBid: "0.005",
      highestBidder: null,
      bidCount: 0,
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      bidIncrement: "0.001",
      currency: "ETH",
      attributes: {},
    },
    [AuctionType.SEALED_BID]: {
      auctionId: "3",
      nftId: "3",
      nftName: "Test Sealed Bid NFT",
      nftImage: "/images/test-nft.jpg",
      nftCategory: "Vehicle",
      seller: "0x1234567890123456789012345678901234567890",
      auctionType: AuctionType.SEALED_BID,
      status: 1, // ACTIVE
      startPrice: "0.001",
      reservePrice: "",
      buyNowPrice: null,
      currentBid: "0",
      highestBidder: null,
      bidCount: 0,
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      bidIncrement: "0.001",
      currency: "ETH",
      attributes: {},
    },
    [AuctionType.RESERVE]: {
      auctionId: "4",
      nftId: "4",
      nftName: "Test Reserve NFT",
      nftImage: "/images/test-nft.jpg",
      nftCategory: "Vehicle",
      seller: "0x1234567890123456789012345678901234567890",
      auctionType: AuctionType.RESERVE,
      status: 1, // ACTIVE
      startPrice: "0.001",
      reservePrice: "0.005",
      buyNowPrice: "0.01",
      currentBid: "0.002",
      highestBidder: "0x0987654321098765432109876543210987654321",
      bidCount: 2,
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      bidIncrement: "0.001",
      currency: "ETH",
      attributes: {},
    },
  };

  const currentAuction = testAuctions[selectedAuctionType];

  const addTestResult = (message: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const testBid = async () => {
    addTestResult(
      `Testing BID for ${AuctionType[selectedAuctionType]} auction...`
    );
    addTestResult(
      `Auction ID: ${currentAuction.auctionId}, Type: ${AuctionType[selectedAuctionType]} (${selectedAuctionType})`
    );

    // Validate bid amount before testing
    const bidAmountNum = parseFloat(bidAmount);
    const startPriceNum = parseFloat(currentAuction.startPrice);
    const currentBidNum = parseFloat(currentAuction.currentBid);
    const bidIncrementNum = parseFloat(currentAuction.bidIncrement);

    // Check if bid is valid
    if (currentBidNum === 0 && bidAmountNum < startPriceNum) {
      addTestResult(
        `❌ BID failed: Bid must be at least the start price of ${currentAuction.startPrice} ETH`
      );
      return;
    }

    if (currentBidNum > 0) {
      if (bidAmountNum <= currentBidNum) {
        addTestResult(
          `❌ BID failed: Bid must be higher than current bid of ${currentBidNum.toFixed(
            6
          )} ETH`
        );
        return;
      }
    }

    addTestResult(
      `Attempting to call placeBid with auctionId: ${currentAuction.auctionId}, amount: ${bidAmount} ETH`
    );

    const result = await handleAuctionAction(
      currentAuction,
      "bid",
      bidAmount,
      nonce
    );

    if (result.success) {
      addTestResult(`✅ BID successful: ${result.step}`);
    } else {
      addTestResult(`❌ BID failed: ${result.error}`);
    }
  };

  const testBuyNow = async () => {
    addTestResult(
      `Testing BUY NOW for ${AuctionType[selectedAuctionType]} auction...`
    );

    const buyNowPrice =
      currentAuction.buyNowPrice || currentAuction.reservePrice || "0.01";
    const result = await handleAuctionAction(
      currentAuction,
      "buyNow",
      buyNowPrice,
      nonce
    );

    if (result.success) {
      addTestResult(`✅ BUY NOW successful: ${result.step}`);
    } else {
      addTestResult(`❌ BUY NOW failed: ${result.error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getAuctionTypeInfo = (type: AuctionType) => {
    switch (type) {
      case AuctionType.ENGLISH:
        return {
          name: "English Auction",
          description: "Public auction with ascending bids",
          icon: "⬆️",
          color: "green",
        };
      case AuctionType.DUTCH:
        return {
          name: "Dutch Auction",
          description: "Price decreases over time - first to buy wins",
          icon: "⬇️",
          color: "orange",
        };
      case AuctionType.SEALED_BID:
        return {
          name: "Sealed Bid Auction",
          description: "Private bids revealed at the end",
          icon: "🔒",
          color: "purple",
        };
      case AuctionType.RESERVE:
        return {
          name: "Reserve Auction",
          description: "Auction with hidden minimum price",
          icon: "🏛️",
          color: "blue",
        };
      default:
        return {
          name: "Unknown",
          description: "Unknown auction type",
          icon: "❓",
          color: "gray",
        };
    }
  };

  const auctionInfo = getAuctionTypeInfo(selectedAuctionType);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        🧪 Auction Type Tester
      </h2>

      {/* Auction Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Auction Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.values(AuctionType)
            .filter((type) => typeof type === "number")
            .map((type) => {
              const info = getAuctionTypeInfo(type as AuctionType);
              return (
                <button
                  key={type}
                  onClick={() => setSelectedAuctionType(type as AuctionType)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedAuctionType === type
                      ? `border-${info.color}-500 bg-${info.color}-50 dark:bg-${info.color}-900/20`
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                  }`}
                >
                  <div className="text-2xl mb-2">{info.icon}</div>
                  <div className="text-sm font-medium">{info.name}</div>
                </button>
              );
            })}
        </div>
      </div>

      {/* Current Auction Info */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {auctionInfo.icon} {auctionInfo.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {auctionInfo.description}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Auction ID:</span>{" "}
            {currentAuction.auctionId}
          </div>
          <div>
            <span className="font-medium">Start Price:</span>{" "}
            {currentAuction.startPrice} ETH
          </div>
          <div>
            <span className="font-medium">Reserve Price:</span>{" "}
            {currentAuction.reservePrice || "None"} ETH
          </div>
          <div>
            <span className="font-medium">Buy Now:</span>{" "}
            {currentAuction.buyNowPrice || "None"} ETH
          </div>
          <div>
            <span className="font-medium">Current Bid:</span>{" "}
            {currentAuction.currentBid} ETH
          </div>
        </div>
        <div className="mt-3 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>⚠️ Note:</strong> The error "Invalid auction type for this
            bid method" means the auction ID {currentAuction.auctionId}
            in the contract is not of type {AuctionType[selectedAuctionType]}.
            Try different auction IDs or check the contract state.
          </p>
        </div>
      </div>

      {/* Test Controls */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bid Amount (ETH)
            </label>
            <input
              type="number"
              step="0.001"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {/* Minimum bid indicator */}
            {(() => {
              const bidAmountNum = parseFloat(bidAmount);
              const startPriceNum = parseFloat(currentAuction.startPrice);
              const currentBidNum = parseFloat(currentAuction.currentBid);
              const bidIncrementNum = parseFloat(currentAuction.bidIncrement);

              let minimumBid = 0;
              let isValid = true;

              // Check if this is the first bid (currentBid should be 0)
              const isFirstBid = currentBidNum === 0;

              if (isFirstBid) {
                minimumBid = startPriceNum;
                isValid = bidAmountNum >= startPriceNum;
              } else {
                minimumBid = currentBidNum;
                isValid = bidAmountNum > currentBidNum;
              }

              return (
                <div className="mt-1 text-xs space-y-1">
                  <div>
                    <span
                      className={`font-medium ${
                        isValid
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      Minimum bid: {minimumBid.toFixed(6)} ETH
                    </span>
                    {!isValid && (
                      <span className="ml-2 text-red-600 dark:text-red-400">
                        (Too low!)
                      </span>
                    )}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {isFirstBid
                      ? `First bid must be ≥ start price (${startPriceNum.toFixed(
                          6
                        )} ETH)`
                      : `Next bid must be > current bid (${currentBidNum.toFixed(
                          6
                        )} ETH)`}
                  </div>
                </div>
              );
            })()}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nonce (for Sealed Bid)
            </label>
            <input
              type="number"
              value={nonce}
              onChange={(e) => setNonce(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={testBid}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Test Bid"}
          </button>
          <button
            onClick={testBuyNow}
            disabled={isProcessing || !currentAuction.buyNowPrice}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Test Buy Now"}
          </button>
          <button
            onClick={() => setBidAmount(currentAuction.startPrice)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Set Start Price
          </button>
          <button
            onClick={() => {
              const currentBidNum = parseFloat(currentAuction.currentBid);
              const nextBid =
                currentBidNum === 0
                  ? parseFloat(currentAuction.startPrice)
                  : currentBidNum + 0.0001; // Just slightly higher than current bid
              setBidAmount(nextBid.toString());
            }}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Set Min Bid
          </button>
          <button
            onClick={() => setBidAmount("0.0021")}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Test 0.0021
          </button>
          <button
            onClick={() => setBidAmount("0.0029")}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Test 0.0029
          </button>
          <button
            onClick={() => {
              // Test with different auction IDs to find a valid one
              const newAuction = { ...currentAuction, auctionId: "2" };
              addTestResult(`Switching to auction ID 2 for testing...`);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Test ID 2
          </button>
          <button
            onClick={() => {
              // Test with different auction IDs to find a valid one
              const newAuction = { ...currentAuction, auctionId: "3" };
              addTestResult(`Switching to auction ID 3 for testing...`);
            }}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            Test ID 3
          </button>
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Status Display */}
      {(isProcessing || error) && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
            <span className="text-sm text-yellow-800 dark:text-yellow-200">
              {isProcessing ? `Processing: ${step}` : `Error: ${error}`}
            </span>
          </div>
        </div>
      )}

      {/* Test Results */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Test Results
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No tests run yet. Click "Test Bid" or "Test Buy Now" to start
              testing.
            </p>
          ) : (
            testResults.map((result, index) => (
              <div
                key={index}
                className={`text-sm p-2 rounded ${
                  result.includes("✅")
                    ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                    : result.includes("❌")
                    ? "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200"
                    : "bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
                }`}
              >
                {result}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
