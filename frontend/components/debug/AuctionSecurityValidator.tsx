"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

interface AuctionSecurityTest {
  auctionId: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  details: {
    exists: boolean;
    seller: string;
    nftContract: string;
    tokenId: string;
    auctionType: number;
    status: number;
    startingPrice: string;
    reservePrice: string;
    buyNowPrice: string;
    duration: number;
    bidIncrement: string;
    startTime: number;
    endTime: number;
    highestBid: string;
    highestBidder: string;
    totalBidders: number;
    isSettled: boolean;
    revealPhaseStarted: boolean;
  };
}

/**
 * 🔒 AUCTION SECURITY VALIDATOR
 *
 * Tests auction security requirements based on smart contract validation:
 * 1. ✅ Auction exists and is valid
 * 2. ✅ NFT ownership and approval
 * 3. ✅ Parameter validation by auction type
 * 4. ✅ Status consistency
 * 5. ✅ Time constraints
 * 6. ✅ Price relationships
 */
export default function AuctionSecurityValidator() {
  const { address, isConnected } = useAccount();
  const [auctionId, setAuctionId] = useState<string>("");
  const [testResult, setTestResult] = useState<AuctionSecurityTest | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const validateAuction = async () => {
    if (!auctionId || !isConnected) return;

    setIsLoading(true);
    setError("");
    setTestResult(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      // Get auction data
      const auctionData = await auctionContract.getAuction(auctionId);

      const errors: string[] = [];
      const warnings: string[] = [];
      let isValid = true;

      // Convert BigInt values to readable format
      const details = {
        exists: true,
        seller: auctionData.seller,
        nftContract: auctionData.nftContract,
        tokenId: auctionData.tokenId.toString(),
        auctionType: Number(auctionData.auctionType),
        status: Number(auctionData.status),
        startingPrice: ethers.formatEther(auctionData.startingPrice),
        reservePrice: ethers.formatEther(auctionData.reservePrice),
        buyNowPrice: ethers.formatEther(auctionData.buyNowPrice),
        duration: Number(auctionData.duration),
        bidIncrement: ethers.formatEther(auctionData.bidIncrement),
        startTime: Number(auctionData.startTime),
        endTime: Number(auctionData.endTime),
        highestBid: ethers.formatEther(auctionData.highestBid),
        highestBidder: auctionData.highestBidder,
        totalBidders: Number(auctionData.totalBidders),
        isSettled: auctionData.isSettled,
        revealPhaseStarted: auctionData.revealPhaseStarted,
      };

      // ✅ SECURITY CHECK 1: Basic validation
      if (details.startingPrice === "0.0") {
        errors.push("❌ Starting price must be greater than 0");
        isValid = false;
      }

      if (details.duration < 60 || details.duration > 30 * 24 * 3600) {
        errors.push("❌ Duration must be between 1 minute and 30 days");
        isValid = false;
      }

      // ✅ SECURITY CHECK 2: Auction type specific validation
      if (details.auctionType === 3) {
        // RESERVE
        if (
          parseFloat(details.reservePrice) <= parseFloat(details.startingPrice)
        ) {
          errors.push(
            "❌ Reserve price must be > starting price for Reserve auctions"
          );
          isValid = false;
        }
        if (details.buyNowPrice !== "0.0") {
          errors.push("❌ Reserve auctions don't support buy now price");
          isValid = false;
        }
      } else if (details.auctionType === 1) {
        // DUTCH
        if (
          parseFloat(details.reservePrice) <= 0 ||
          parseFloat(details.reservePrice) >= parseFloat(details.startingPrice)
        ) {
          errors.push("❌ Dutch auction needs valid reserve < starting price");
          isValid = false;
        }
        if (
          details.buyNowPrice !== "0.0" &&
          details.buyNowPrice !== details.reservePrice
        ) {
          errors.push("❌ Dutch auction buyNowPrice must equal reservePrice");
          isValid = false;
        }
      } else if (details.auctionType === 0) {
        // ENGLISH
        if (details.buyNowPrice !== "0.0") {
          if (
            parseFloat(details.buyNowPrice) <= parseFloat(details.startingPrice)
          ) {
            errors.push("❌ Buy now price must be > starting price");
            isValid = false;
          }
          if (
            details.reservePrice !== "0.0" &&
            parseFloat(details.buyNowPrice) < parseFloat(details.reservePrice)
          ) {
            errors.push("❌ Buy now price must be >= reserve price");
            isValid = false;
          }
        }
      } else if (details.auctionType === 2) {
        // SEALED_BID
        if (details.buyNowPrice !== "0.0") {
          errors.push("❌ Sealed bid auctions don't support buy now price");
          isValid = false;
        }
      }

      // ✅ SECURITY CHECK 3: Status consistency
      const now = Math.floor(Date.now() / 1000);
      if (details.status === 1 && now > details.endTime) {
        warnings.push(
          "⚠️ Auction is ACTIVE but time has expired - should be ENDED"
        );
      }

      if (details.status === 3 && now <= details.endTime) {
        warnings.push("⚠️ Auction is ENDED but time hasn't expired yet");
      }

      // ✅ SECURITY CHECK 4: NFT ownership verification
      try {
        const nftContract = new ethers.Contract(
          details.nftContract,
          contracts.MooveNFT.abi,
          provider
        );
        const owner = await nftContract.ownerOf(details.tokenId);
        const isApproved = await nftContract.isApprovedForAll(
          details.seller,
          contracts.MooveAuction.address
        );

        if (owner !== details.seller) {
          errors.push("❌ NFT owner mismatch - seller doesn't own the NFT");
          isValid = false;
        }

        if (!isApproved) {
          warnings.push("⚠️ NFT not approved for auction contract");
        }
      } catch (nftError) {
        warnings.push("⚠️ Could not verify NFT ownership/approval");
      }

      // ✅ SECURITY CHECK 5: Bid validation
      if (details.totalBidders > 0) {
        if (
          details.highestBidder === "0x0000000000000000000000000000000000000000"
        ) {
          errors.push("❌ Has bidders but no highest bidder");
          isValid = false;
        }
        if (details.highestBid === "0.0") {
          errors.push("❌ Has bidders but no highest bid");
          isValid = false;
        }
      }

      setTestResult({
        auctionId,
        isValid,
        errors,
        warnings,
        details,
      });
    } catch (err) {
      setError(
        `Error validating auction: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getAuctionTypeName = (type: number) => {
    const types = ["ENGLISH", "DUTCH", "SEALED_BID", "RESERVE"];
    return types[type] || "UNKNOWN";
  };

  const getStatusName = (status: number) => {
    const statuses = [
      "PENDING",
      "ACTIVE",
      "REVEAL",
      "ENDED",
      "SETTLED",
      "CANCELLED",
    ];
    return statuses[status] || "UNKNOWN";
  };

  return (
    <div className="fixed bottom-4 right-4 z-[99999] bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-6 w-96 max-h-[600px] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">
          🔒 Auction Security Validator
        </h2>
        <button
          onClick={() => setTestResult(null)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Auction ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={auctionId}
              onChange={(e) => setAuctionId(e.target.value)}
              placeholder="Enter auction ID"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={validateAuction}
              disabled={!auctionId || !isConnected || isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading ? "..." : "Test"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {testResult && (
          <div className="space-y-3">
            <div
              className={`p-3 rounded-lg ${
                testResult.isValid
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-lg ${
                    testResult.isValid ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {testResult.isValid ? "✅" : "❌"}
                </span>
                <span
                  className={`font-bold ${
                    testResult.isValid ? "text-green-800" : "text-red-800"
                  }`}
                >
                  Auction #{testResult.auctionId} -{" "}
                  {testResult.isValid ? "SECURE" : "INSECURE"}
                </span>
              </div>

              <div className="text-sm space-y-1">
                <p>
                  <strong>Type:</strong>{" "}
                  {getAuctionTypeName(testResult.details.auctionType)}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {getStatusName(testResult.details.status)}
                </p>
                <p>
                  <strong>Seller:</strong>{" "}
                  {testResult.details.seller.slice(0, 6)}...
                  {testResult.details.seller.slice(-4)}
                </p>
                <p>
                  <strong>Starting Price:</strong>{" "}
                  {testResult.details.startingPrice} ETH
                </p>
                <p>
                  <strong>Reserve Price:</strong>{" "}
                  {testResult.details.reservePrice} ETH
                </p>
                <p>
                  <strong>Buy Now Price:</strong>{" "}
                  {testResult.details.buyNowPrice} ETH
                </p>
                <p>
                  <strong>Duration:</strong>{" "}
                  {Math.floor(testResult.details.duration / 60)} minutes
                </p>
                <p>
                  <strong>Total Bidders:</strong>{" "}
                  {testResult.details.totalBidders}
                </p>
                <p>
                  <strong>Highest Bid:</strong> {testResult.details.highestBid}{" "}
                  ETH
                </p>
              </div>
            </div>

            {testResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h4 className="font-bold text-red-800 mb-2">
                  ❌ Security Errors:
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {testResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {testResult.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="font-bold text-yellow-800 mb-2">⚠️ Warnings:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {testResult.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}





