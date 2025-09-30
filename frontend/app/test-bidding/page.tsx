"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { useEnglishAuction } from "../../hooks/useEnglishAuction";
import { useIncrementalAuctions } from "../../hooks/useIncrementalAuctions";
// Remove Auction import since we'll use AuctionData from useIncrementalAuctions

export default function TestBiddingPage() {
  const { address, isConnected } = useAccount();
  const { auctions, isLoading: isLoadingAuctions } = useIncrementalAuctions();
  const { placeBid, isProcessing: isBidding } = useEnglishAuction();

  const [selectedAuctionId, setSelectedAuctionId] = useState<string>("");
  const [bidAmount, setBidAmount] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [selectedAuction, setSelectedAuction] = useState<any | null>(null);

  const handleAuctionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedAuctionId(id);
    const auction = auctions.find((a) => a.auctionId === id);
    setSelectedAuction(auction || null);
    if (auction) {
      try {
        // Get current bid value
        let currentBidValue;
        if (
          typeof auction.currentBid === "string" &&
          auction.currentBid.includes(".")
        ) {
          currentBidValue = auction.currentBid;
        } else {
          currentBidValue = ethers.formatEther(auction.currentBid || "0");
        }

        // Get bid increment value
        let bidIncrementValue;
        if (
          typeof auction.bidIncrement === "string" &&
          auction.bidIncrement.includes(".")
        ) {
          bidIncrementValue = auction.bidIncrement;
        } else {
          bidIncrementValue = ethers.formatEther(auction.bidIncrement || "0");
        }

        // Calculate next bid amount
        const nextBid =
          parseFloat(currentBidValue) + parseFloat(bidIncrementValue);
        setBidAmount(nextBid.toString());
      } catch (error) {
        console.error("Error calculating bid amount:", error);
        setBidAmount("0.001");
      }
    } else {
      setBidAmount("");
    }
    setResult("");
  };

  const handlePlaceBid = async () => {
    if (!isConnected || !address) {
      setResult("❌ Wallet not connected");
      return;
    }
    if (!selectedAuctionId || !bidAmount) {
      setResult("❌ Please select an auction and enter a bid amount.");
      return;
    }
    if (!selectedAuction) {
      setResult("❌ Selected auction data not found.");
      return;
    }

    setResult("🚀 Placing bid...");

    try {
      const success = await placeBid(parseInt(selectedAuctionId), bidAmount);

      if (success) {
        setResult(
          `✅ Bid of ${bidAmount} ETH placed successfully on Auction ${selectedAuctionId}!`
        );
      } else {
        setResult(`❌ Failed to place bid on Auction ${selectedAuctionId}.`);
      }
    } catch (error) {
      console.error("❌ Error placing bid:", error);
      setResult(
        `❌ Error placing bid: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">🔌</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Wallet Not Connected
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please connect your wallet to test bidding.
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingAuctions) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading auctions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Test Bidding System
          </h1>

          <div className="mb-6">
            <label
              htmlFor="auction-select"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Select Auction
            </label>
            <select
              id="auction-select"
              value={selectedAuctionId}
              onChange={handleAuctionSelect}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">-- Select an auction --</option>
              {auctions.map((auction) => (
                <option key={auction.auctionId} value={auction.auctionId}>
                  ID: {auction.auctionId} - NFT: {auction.nftName} (Current Bid:{" "}
                  {(() => {
                    try {
                      // Check if currentBid is already a formatted string
                      if (
                        typeof auction.currentBid === "string" &&
                        auction.currentBid.includes(".")
                      ) {
                        return auction.currentBid;
                      }
                      // If it's a BigInt or number, format it
                      return ethers.formatEther(auction.currentBid || "0");
                    } catch {
                      return "0";
                    }
                  })()}{" "}
                  ETH)
                </option>
              ))}
            </select>
          </div>

          {selectedAuction && (
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Auction Details
              </h2>
              <p>
                <strong>NFT:</strong> {selectedAuction.nftName}
              </p>
              <p>
                <strong>Current Bid:</strong>{" "}
                {(() => {
                  try {
                    if (
                      typeof selectedAuction.currentBid === "string" &&
                      selectedAuction.currentBid.includes(".")
                    ) {
                      return selectedAuction.currentBid;
                    }
                    return ethers.formatEther(
                      selectedAuction.currentBid || "0"
                    );
                  } catch {
                    return "0";
                  }
                })()}{" "}
                ETH
              </p>
              <p>
                <strong>Bid Increment:</strong>{" "}
                {(() => {
                  try {
                    if (
                      typeof selectedAuction.bidIncrement === "string" &&
                      selectedAuction.bidIncrement.includes(".")
                    ) {
                      return selectedAuction.bidIncrement;
                    }
                    return ethers.formatEther(
                      selectedAuction.bidIncrement || "0"
                    );
                  } catch {
                    return "0";
                  }
                })()}{" "}
                ETH
              </p>
              <p>
                <strong>End Time:</strong>{" "}
                {selectedAuction.endTime.toLocaleString()}
              </p>
            </div>
          )}

          <div className="mb-6">
            <label
              htmlFor="bid-amount"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Bid Amount (ETH)
            </label>
            <input
              type="number"
              id="bid-amount"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="e.g., 0.0001"
              step="0.00001"
            />
          </div>

          <button
            onClick={handlePlaceBid}
            disabled={isBidding || !selectedAuctionId || !bidAmount}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium"
          >
            {isBidding ? "Bidding..." : "Place Bid"}
          </button>

          {result && (
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-x-auto">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Result
              </h2>
              <pre
                className={`text-sm ${
                  result.startsWith("✅")
                    ? "text-green-700 dark:text-green-300"
                    : "text-red-700 dark:text-red-300"
                }`}
              >
                {result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
