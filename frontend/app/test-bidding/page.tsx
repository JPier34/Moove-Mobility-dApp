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
      // Detailed logging before bid
      console.log("🔍 PRE-BID ANALYSIS:");
      console.log("📊 Selected auction data:", {
        auctionId: selectedAuction.auctionId,
        auctionIdType: typeof selectedAuction.auctionId,
        currentBid: selectedAuction.currentBid,
        currentBidType: typeof selectedAuction.currentBid,
        bidIncrement: selectedAuction.bidIncrement,
        bidIncrementType: typeof selectedAuction.bidIncrement,
        highestBidder: selectedAuction.highestBidder,
        status: selectedAuction.status,
        endTime: selectedAuction.endTime,
      });

      console.log("💰 Bid parameters:", {
        bidAmount: bidAmount,
        bidAmountType: typeof bidAmount,
        parsedBidAmount: parseFloat(bidAmount),
        auctionIdForBid: parseInt(selectedAuctionId),
        auctionIdType: typeof parseInt(selectedAuctionId),
      });

      // Verify bid amount is valid
      const currentBidValue = parseFloat(
        typeof selectedAuction.currentBid === "string" &&
          selectedAuction.currentBid.includes(".")
          ? selectedAuction.currentBid
          : ethers.formatEther(selectedAuction.currentBid || "0")
      );

      const bidIncrementValue = parseFloat(
        typeof selectedAuction.bidIncrement === "string" &&
          selectedAuction.bidIncrement.includes(".")
          ? selectedAuction.bidIncrement
          : ethers.formatEther(selectedAuction.bidIncrement || "0")
      );

      const bidValidation = {
        bidAmountValid: parseFloat(bidAmount) > 0,
        bidAmountSufficient:
          parseFloat(bidAmount) >= currentBidValue + bidIncrementValue,
        auctionActive: selectedAuction.status === 1, // ACTIVE (corrected to match contract)
        auctionNotEnded: new Date(selectedAuction.endTime) > new Date(),
        bidderNotHighest:
          selectedAuction.highestBidder?.toLowerCase() !==
          address.toLowerCase(),
        // Additional debug info
        currentBidValue,
        bidIncrementValue,
        requiredMinimumBid: currentBidValue + bidIncrementValue,
        actualBidAmount: parseFloat(bidAmount),
      };

      console.log("🔍 BID VALIDATION:", bidValidation);

      // Check if bid is sufficient - allow bid if it's at least the current bid + increment
      // OR if it's higher than current bid (for cases where increment might be wrong)
      const isBidSufficient =
        parseFloat(bidAmount) >= currentBidValue + bidIncrementValue ||
        parseFloat(bidAmount) > currentBidValue;

      console.log("💰 Bid sufficiency check:", {
        currentBid: currentBidValue,
        bidIncrement: bidIncrementValue,
        requiredMinimum: currentBidValue + bidIncrementValue,
        actualBid: parseFloat(bidAmount),
        isSufficient: isBidSufficient,
        alternativeCheck: parseFloat(bidAmount) > currentBidValue,
      });

      const coreValidations = {
        bidAmountValid: bidValidation.bidAmountValid,
        auctionActive: bidValidation.auctionActive,
        auctionNotEnded: bidValidation.auctionNotEnded,
        bidderNotHighest: bidValidation.bidderNotHighest,
        bidAmountSufficient: isBidSufficient,
      };

      console.log("📈 Core validations:", coreValidations);
      console.log(
        "📈 All core validations passed:",
        Object.values(coreValidations).every((check) => check)
      );

      const success = await placeBid(parseInt(selectedAuctionId), bidAmount);

      if (success) {
        console.log("✅ Bid placed successfully!");
        console.log("📊 Post-bid verification needed - check auction data");
        setResult(
          `✅ Bid of ${bidAmount} ETH placed successfully on Auction ${selectedAuctionId}! Check console for detailed logs.`
        );
      } else {
        setResult(`❌ Failed to place bid on Auction ${selectedAuctionId}.`);
      }
    } catch (error) {
      console.error("❌ Error placing bid:", error);
      console.error("🔍 Error details:", {
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });
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

          {/* Post-bid verification section */}
          {result && result.startsWith("✅") && selectedAuctionId && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                🔍 Post-Bid Verification
              </h3>
              <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
                Check the browser console for detailed logs about:
              </p>
              <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                <li>• Raw contract data structure and types</li>
                <li>• Data mapping from contract to frontend format</li>
                <li>• Type compatibility verification</li>
                <li>• Data integrity checks</li>
                <li>• Bid validation results</li>
              </ul>
              <button
                onClick={() => {
                  console.log("🔄 Refreshing auction data for verification...");
                  // Trigger a refresh of the auction data
                  window.location.reload();
                }}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Refresh & Verify Data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
