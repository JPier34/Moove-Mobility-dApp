"use client";

import React, { useState, useEffect } from "react";
import { Auction, AuctionType, AuctionStatus } from "../../types/auction";
import { useAccount } from "wagmi";
import { shortenAddress } from "../../utils/shortenAddress";
import {
  useCurrentDutchPrice,
  useCommitToBuyDutch,
  useBuyNowDutch,
} from "@/hooks/useAuction";
import { useDutchAuction } from "../../hooks/useDutchAuction";
import { useDutchPrice } from "@/hooks/useDutchPrice";
import DutchAuctionSuccessModal from "./DutchAuctionSuccessModal";
import { formatEther, parseEther } from "viem";
import { ethers } from "ethers";
import toast from "react-hot-toast";

interface AuctionCardProps {
  auction: Auction;
  onClick?: () => void;
  showEndedState?: boolean;
}

// Category emojis mapping
const categoryEmojis = {
  sticker: "🏷️",
  scooter: "🛴",
  bike: "🚲",
  skateboard: "🛹",
  moped: "🛵",
};

// Auction type info
const auctionTypeInfo = {
  [AuctionType.RESERVE]: {
    emoji: "🏛️",
    name: "Traditional",
    color: "bg-blue-100 text-blue-800",
  },
  [AuctionType.ENGLISH]: {
    emoji: "⬆️",
    name: "English",
    color: "bg-green-100 text-green-800",
  },
  [AuctionType.DUTCH]: {
    emoji: "⬇️",
    name: "Dutch",
    color: "bg-purple-100 text-purple-800",
  },
  [AuctionType.SEALED_BID]: {
    emoji: "🔒",
    name: "Sealed",
    color: "bg-yellow-100 text-yellow-800",
  },
};

export default function AuctionCard({
  auction,
  onClick,
  showEndedState = false,
}: AuctionCardProps) {
  // Special debug for auction #12 (NFT #47)
  if (auction.auctionId === "12") {
    console.log("🔍 [AUCTION CARD DEBUG] Auction #12 (NFT #47) data:", {
      auctionId: auction.auctionId,
      nftId: auction.nftId,
      nftName: auction.nftName,
      nftImage: auction.nftImage,
      nftCategory: auction.nftCategory,
      isDefaultName: auction.nftName === `NFT #${auction.nftId}`,
      isDefaultImage: auction.nftImage === "/images/default-nft.png",
      hasImage: !!auction.nftImage,
    });
  }

  const { address, isConnected } = useAccount();
  const [timeLeft, setTimeLeft] = useState("");
  // Use the unified Dutch price hook
  const { currentPrice: currentDutchPrice, isActive: isDutchActive } =
    useDutchPrice(auction, 5000);

  // Hooks for auction interactions
  const { commitToBuyDutch } = useCommitToBuyDutch();
  const { buyNowDutch } = useBuyNowDutch();
  const {
    handleDutchAuction,
    isProcessing: isDutchProcessing,
    step: dutchStep,
    showSuccessModal,
    successData,
    closeSuccessModal,
  } = useDutchAuction();

  // Calculate time remaining
  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(auction.endTime).getTime();
      const difference = endTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${seconds}s`);
        }
      } else {
        setTimeLeft("Ended");
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [auction.endTime]);

  // Dutch price calculation is now handled by useDutchPrice hook

  const handleQuickAction = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isConnected) {
      toast.error("Connect wallet to participate");
      return;
    }

    try {
      if (auction.auctionType === AuctionType.DUTCH) {
        // Use the improved Dutch auction handler with success callback
        const success = await handleDutchAuction(
          parseInt(auction.auctionId),
          parseFloat(currentDutchPrice),
          () => {
            // Success callback - refresh data
            console.log(
              "Dutch auction purchase successful, refreshing data..."
            );
          }
        );
        if (!success) {
          console.log("Dutch auction failed or was cancelled");
        }
      } else {
        // For other auction types, just log for now
        console.log(
          "Quick action for auction:",
          auction.auctionId,
          "Type:",
          auction.auctionType
        );
      }
    } catch (error) {
      console.error("Error in quick action:", error);
      toast.error("Error processing action");
    }
  };

  // Removed hover action button - users can click the card to open modal
  // All auction interactions are handled in the modal

  const getTimeStatus = () => {
    if (showEndedState || auction.status !== AuctionStatus.ACTIVE) {
      return { color: "text-gray-500", label: "Ended", canExtend: false };
    }

    const now = new Date().getTime();
    const endTime = new Date(auction.endTime).getTime();
    const difference = endTime - now;

    if (difference <= 0) {
      return { color: "text-gray-500", label: "Ended", canExtend: false };
    }

    // English auction specific logic
    if (auction.auctionType === AuctionType.ENGLISH) {
      const extensionThreshold =
        (auction.extensionThresholdMinutes || 5) * 60 * 1000; // Convert to milliseconds

      if (difference <= 60000) {
        // Last minute - critical
        return {
          color: "text-red-600",
          label: timeLeft,
          canExtend: true,
          isExtensionZone: difference <= extensionThreshold,
        };
      } else if (difference <= extensionThreshold) {
        // In extension zone
        return {
          color: "text-orange-600",
          label: timeLeft,
          canExtend: true,
          isExtensionZone: true,
        };
      } else if (difference <= 3600000) {
        // 1 hour
        return {
          color: "text-yellow-600",
          label: timeLeft,
          canExtend: false,
          isExtensionZone: false,
        };
      } else {
        return {
          color: "text-green-600",
          label: timeLeft,
          canExtend: false,
          isExtensionZone: false,
        };
      }
    } else {
      // Other auction types
      if (difference <= 60000) {
        return { color: "text-red-600", label: timeLeft, canExtend: false };
      } else if (difference <= 300000) {
        return { color: "text-orange-600", label: timeLeft, canExtend: false };
      } else if (difference <= 3600000) {
        return { color: "text-yellow-600", label: timeLeft, canExtend: false };
      } else {
        return { color: "text-green-600", label: timeLeft, canExtend: false };
      }
    }
  };

  const timeStatus = getTimeStatus();
  const typeInfo = auctionTypeInfo[auction.auctionType];

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-moove-primary/30 transition-all duration-300 cursor-pointer group"
      onClick={onClick}
    >
      {/* Header with auction type and status */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}
          >
            {typeInfo.emoji} {typeInfo.name}
          </span>

          {(auction.status as AuctionStatus) === AuctionStatus.PENDING && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium animate-pulse">
              🔓 Apertura buste
            </span>
          )}
        </div>

        {/* Time remaining */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${timeStatus.color}`}>
              ⏰ {timeStatus.label}
            </span>
            {/* Extension zone indicator for English auctions */}
            {auction.auctionType === AuctionType.ENGLISH &&
              timeStatus.isExtensionZone && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium animate-pulse">
                  🔄 Auto-extend zone
                </span>
              )}
          </div>
          <span className="text-xs text-gray-500">#{auction.auctionId}</span>
        </div>
      </div>

      {/* NFT Image */}
      <div className="relative aspect-square bg-gradient-to-br from-moove-50 to-moove-100 p-6">
        {auction.nftImage && auction.nftImage !== "/images/default-nft.png" ? (
          <img
            src={auction.nftImage}
            alt={auction.nftName}
            className="w-full h-full object-cover rounded-xl"
            onError={(e) => {
              console.log("❌ Image failed to load:", auction.nftImage);
              e.currentTarget.style.display = "none";
            }}
            onLoad={() =>
              console.log("✅ Image loaded successfully:", auction.nftImage)
            }
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-moove-primary to-moove-secondary rounded-xl flex items-center justify-center text-6xl text-white">
            {categoryEmojis[
              auction.nftCategory as keyof typeof categoryEmojis
            ] || "🚗"}
          </div>
        )}

        {/* Bid count indicator */}
        {auction.bidCount > 0 && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium text-gray-700">
            🔥 {auction.bidCount} bid{auction.bidCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* NFT Name */}
        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-moove-primary transition-colors">
          {auction.nftName}
        </h3>

        {/* Attributes */}
        {/* Vehicle details removed - not applicable for stickers */}

        {/* Seller */}
        <div className="text-xs text-gray-500 mb-3">
          Seller:{" "}
          <span className="font-mono text-gray-700">
            {shortenAddress(auction.seller)}
          </span>
        </div>

        {/* Price information */}
        <div className="space-y-2 mb-4">
          {auction.auctionType === AuctionType.DUTCH ? (
            <div>
              <div className="text-xs text-gray-500">Current Price</div>
              <div className="text-xl font-bold text-gray-900">
                {currentDutchPrice}{" "}
                <span className="text-sm text-gray-600">
                  {auction.currency}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Start: {auction.startPrice} ETH • Reserve:{" "}
                {auction.reservePrice} ETH
              </div>
            </div>
          ) : auction.auctionType === AuctionType.SEALED_BID ? (
            <div>
              <div className="text-xs text-gray-500">
                {auction.status === AuctionStatus.PENDING
                  ? "Hidden Bids"
                  : "Starting Price"}
              </div>
              <div className="text-xl font-bold text-gray-900">
                {auction.status === AuctionStatus.PENDING
                  ? "???"
                  : auction.startPrice}
                <span className="text-sm text-gray-600 ml-1">
                  {auction.currency}
                </span>
              </div>
            </div>
          ) : auction.auctionType === AuctionType.ENGLISH ? (
            <div>
              <div className="text-xs text-gray-500">
                {auction.currentBid === "0" ? "Starting Price" : "Current Bid"}
              </div>
              <div className="text-xl font-bold text-gray-900">
                {auction.currentBid === "0"
                  ? auction.startPrice
                  : auction.currentBid}
                <span className="text-sm text-gray-600 ml-1">
                  {auction.currency}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  {auction.currentBid !== "0"
                    ? `Next: ${(
                        parseFloat(auction.currentBid) +
                        parseFloat(auction.bidIncrement)
                      ).toFixed(6)} ETH`
                    : `Min bid: ${auction.startPrice} ETH`}
                </span>
                {/* Extension info for English auctions */}
                {timeStatus.isExtensionZone && (
                  <span className="text-orange-600 font-medium">
                    +{auction.extensionDurationMinutes || 10}min on bid
                  </span>
                )}
              </div>
              {/* Buy Now price if available */}
              {auction.buyNowPrice && parseFloat(auction.buyNowPrice) > 0 && (
                <div className="text-xs text-blue-600 mt-1">
                  💰 Buy Now: {auction.buyNowPrice} ETH
                </div>
              )}
            </div>
          ) : (
            /* Reserve auction */
            <div>
              <div className="text-xs text-gray-500">
                {auction.currentBid === "0" ? "Starting Price" : "Current Bid"}
              </div>
              <div className="text-xl font-bold text-gray-900">
                {auction.currentBid === "0"
                  ? auction.startPrice
                  : auction.currentBid}
                <span className="text-sm text-gray-600 ml-1">
                  {auction.currency}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  {auction.currentBid !== "0"
                    ? `Next: ${(
                        parseFloat(auction.currentBid) +
                        parseFloat(auction.bidIncrement)
                      ).toFixed(6)} ETH`
                    : `Min bid: ${auction.startPrice} ETH`}
                </span>
                {/* Only show reserve price for Reserve auctions */}
                {auction.auctionType === AuctionType.RESERVE && (
                  <span className="text-purple-600">
                    Reserve: {auction.reservePrice} ETH
                  </span>
                )}
              </div>
              {/* Buy Now price if available */}
              {auction.buyNowPrice && parseFloat(auction.buyNowPrice) > 0 && (
                <div className="text-xs text-blue-600 mt-1">
                  💰 Buy Now: {auction.buyNowPrice} ETH
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Bid Button for English auctions with no bids */}
        {auction.auctionType === AuctionType.ENGLISH &&
          auction.status === AuctionStatus.ACTIVE &&
          (auction.currentBid === "0" ||
            parseFloat(auction.currentBid) === 0) && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (!isConnected) {
                  toast.error("Connect wallet to place bid");
                  return;
                }
                // Quick bid with start price - this will be handled in the modal
                if (onClick) onClick();
              }}
              className="w-full mt-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              🚀 Quick Bid: {auction.startPrice} ETH
            </button>
          )}
      </div>

      {/* Dutch Auction Success Modal */}
      {successData && (
        <DutchAuctionSuccessModal
          isOpen={showSuccessModal}
          onClose={closeSuccessModal}
          auctionId={successData.auctionId}
          price={successData.price}
          transactionHash={successData.transactionHash}
        />
      )}
    </div>
  );
}
