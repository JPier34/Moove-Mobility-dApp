"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

interface DutchAuctionCheckerProps {
  auctionId: number;
  buyerAddress?: string;
}

interface AuctionData {
  auctionId: string;
  nftContract: string;
  tokenId: string;
  seller: string;
  auctionType: number;
  status: number;
  isSettled: boolean;
  startTime: number;
  endTime: number;
  startingPrice: string;
  reservePrice: string;
  currentPrice: string;
}

export default function DutchAuctionChecker({
  auctionId,
  buyerAddress,
}: DutchAuctionCheckerProps) {
  const [auctionData, setAuctionData] = useState<AuctionData | null>(null);
  const [nftOwner, setNftOwner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAuctionStatus = async () => {
    if (!window.ethereum) {
      setError("MetaMask not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      const nftContract = new ethers.Contract(
        contracts.MooveNFT.address,
        contracts.MooveNFT.abi,
        provider
      );

      // Get auction data
      const rawAuctionData = await auctionContract.getAuction(auctionId);

      // Map raw contract data to correct fields
      const mappedData: AuctionData = {
        auctionId: rawAuctionData[0].toString(),
        nftContract: rawAuctionData[1],
        tokenId: rawAuctionData[2].toString(),
        seller: rawAuctionData[3],
        auctionType: Number(rawAuctionData[4]),
        status: Number(rawAuctionData[5]),
        isSettled: rawAuctionData[7],
        startTime: Number(rawAuctionData[15]),
        endTime: Number(rawAuctionData[16]),
        startingPrice: rawAuctionData[9].toString(),
        reservePrice: rawAuctionData[10].toString(),
        currentPrice: rawAuctionData[12].toString(),
      };

      setAuctionData(mappedData);

      // Get NFT owner
      const owner = await nftContract.ownerOf(mappedData.tokenId);
      setNftOwner(owner);
    } catch (err) {
      console.error("Error checking auction:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auctionId) {
      checkAuctionStatus();
    }
  }, [auctionId]);

  const getStatusText = (status: number) => {
    switch (status) {
      case 0:
        return "PENDING";
      case 1:
        return "ACTIVE";
      case 2:
        return "ENDED";
      case 3:
        return "CANCELLED";
      default:
        return "UNKNOWN";
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return "text-yellow-600";
      case 1:
        return "text-green-600";
      case 2:
        return "text-red-600";
      case 3:
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const formatPrice = (priceWei: string) => {
    const priceEth = (Number(priceWei) / 1e18).toFixed(6);
    return `${priceEth} ETH`;
  };

  const formatTimestamp = (timestamp: number) => {
    if (timestamp === 0) return "Not set";
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        🔍 Dutch Auction Checker
      </h2>

      <div className="mb-4">
        <button
          onClick={checkAuctionStatus}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
        >
          {loading ? "Checking..." : "🔄 Refresh Status"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          ❌ Error: {error}
        </div>
      )}

      {auctionData && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-700">Auction ID</h3>
              <p className="text-gray-600">{auctionData.auctionId}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">Status</h3>
              <p className={`font-bold ${getStatusColor(auctionData.status)}`}>
                {getStatusText(auctionData.status)}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">Token ID</h3>
              <p className="text-gray-600">#{auctionData.tokenId}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">Is Settled</h3>
              <p
                className={`font-bold ${
                  auctionData.isSettled ? "text-green-600" : "text-red-600"
                }`}
              >
                {auctionData.isSettled ? "✅ YES" : "❌ NO"}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">Starting Price</h3>
              <p className="text-gray-600">
                {formatPrice(auctionData.startingPrice)}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">Reserve Price</h3>
              <p className="text-gray-600">
                {formatPrice(auctionData.reservePrice)}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">Current Price</h3>
              <p className="text-gray-600">
                {formatPrice(auctionData.currentPrice)}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">Seller</h3>
              <p className="text-gray-600 font-mono text-sm">
                {auctionData.seller.slice(0, 6)}...
                {auctionData.seller.slice(-4)}
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-700 mb-2">Timestamps</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600">
                  Start Time
                </h4>
                <p className="text-gray-600">
                  {formatTimestamp(auctionData.startTime)}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600">End Time</h4>
                <p className="text-gray-600">
                  {formatTimestamp(auctionData.endTime)}
                </p>
              </div>
            </div>
          </div>

          {nftOwner && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-700 mb-2">
                NFT Ownership
              </h3>
              <div className="flex items-center space-x-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-600">
                    Current Owner
                  </h4>
                  <p className="text-gray-600 font-mono text-sm">
                    {nftOwner.slice(0, 6)}...{nftOwner.slice(-4)}
                  </p>
                </div>
                {buyerAddress && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-600">
                      Expected Buyer
                    </h4>
                    <p className="text-gray-600 font-mono text-sm">
                      {buyerAddress.slice(0, 6)}...{buyerAddress.slice(-4)}
                    </p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-600">
                    Purchase Status
                  </h4>
                  <p
                    className={`font-bold ${
                      buyerAddress &&
                      nftOwner.toLowerCase() === buyerAddress.toLowerCase()
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {buyerAddress &&
                    nftOwner.toLowerCase() === buyerAddress.toLowerCase()
                      ? "✅ PURCHASE SUCCESSFUL"
                      : "❌ NOT PURCHASED BY BUYER"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

