"use client";

import React, { useState, useEffect } from "react";
import { Auction, AuctionType, AuctionStatus } from "../../types/auction";
import { useAccount } from "wagmi";
import { shortenAddress } from "../../utils/shortenAddress";
import { useCurrentDutchPrice, useBuyNowDutch } from "@/hooks/useAuction";
import { useDutchAuction } from "../../hooks/useDutchAuction";
import { useDutchPrice } from "@/hooks/useDutchPrice";
import DutchAuctionSuccessModal from "./DutchAuctionSuccessModal";
import { formatEther, parseEther } from "viem";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { useAuctionRefresh } from "@/hooks/useAuctionRefresh";

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
    name: "Reserve",
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
  // Special debug for auction #31 (Reserve Auction issue)
  if (auction.auctionId === "31") {
    console.log("🔍 [AUCTION CARD DEBUG] Auction #31 (Reserve Auction) data:", {
      auctionId: auction.auctionId,
      auctionType: auction.auctionType,
      auctionTypeNumber: Number(auction.auctionType),
      auctionTypeString: typeof auction.auctionType,
      reservePrice: auction.reservePrice,
      startPrice: auction.startPrice,
      bidIncrement: auction.bidIncrement,
    });
  }

  const { address, isConnected } = useAccount();
  const [timeLeft, setTimeLeft] = useState("");
  const [localAuction, setLocalAuction] = useState<Auction>(auction);

  // Use the global auction refresh system
  const { auctions, refreshTrigger, triggerRefresh } = useAuctionRefresh();

  // DISABLED: Automatic refresh system to prevent infinite loops
  // The auction data will be updated only when explicitly triggered by user actions
  // (like placing a bid, claiming, etc.)

  // Listen for manual refresh events
  useEffect(() => {
    const handleManualRefresh = () => {
      const updatedAuction = auctions.find(
        (a) => a.auctionId === auction.auctionId
      );
      if (updatedAuction) {
        console.log(
          `🔄 [AuctionCard ${auction.auctionId}] Manual refresh triggered`
        );
        setLocalAuction(updatedAuction);
      }
    };

    // Listen for custom refresh events
    window.addEventListener("auction-refresh", handleManualRefresh);
    return () =>
      window.removeEventListener("auction-refresh", handleManualRefresh);
  }, [auctions, auction.auctionId]);

  // Use the unified Dutch price hook with local auction
  const { currentPrice: currentDutchPrice, isActive: isDutchActive } =
    useDutchPrice(localAuction, 5000);

  // Hooks for auction interactions
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
      const endTime = new Date(localAuction.endTime).getTime();
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
  }, [localAuction.endTime]);

  // Dutch price calculation is now handled by useDutchPrice hook

  const handleQuickAction = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isConnected) {
      toast.error("Connect wallet to participate");
      return;
    }

    try {
      if (localAuction.auctionType === AuctionType.DUTCH) {
        // Use the improved Dutch auction handler with success callback
        const success = await handleDutchAuction(
          parseInt(localAuction.auctionId),
          parseFloat(currentDutchPrice),
          () => {
            // Success callback - refresh data
            console.log(
              "Dutch auction purchase successful, refreshing data..."
            );
            triggerRefresh();
          }
        );
        if (!success) {
          console.log("Dutch auction failed or was cancelled");
        }
      } else {
        // For other auction types, just log for now
        console.log(
          "Quick action for auction:",
          localAuction.auctionId,
          "Type:",
          localAuction.auctionType
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
    // If explicitly showing ended state, show as ended
    if (showEndedState) {
      return { color: "text-gray-500", label: "Ended", canExtend: false };
    }

    const now = new Date().getTime();
    // ✅ FIX: Handle both Date objects and ISO strings
    const endTime =
      typeof localAuction.endTime === "string"
        ? new Date(localAuction.endTime).getTime()
        : localAuction.endTime.getTime();
    const difference = endTime - now;
    const isTimeExpired = difference <= 0;
    const isStatusActive = Number(localAuction.status) === AuctionStatus.ACTIVE;

    // ✅ DEBUG: Log for auction #4
    if (localAuction.auctionId === "4") {
      console.log("🔍 [AuctionCard #4] getTimeStatus debug:", {
        auctionId: localAuction.auctionId,
        status: Number(localAuction.status),
        statusType: typeof localAuction.status,
        AuctionStatusACTIVE: AuctionStatus.ACTIVE,
        AuctionStatusACTIVEType: typeof AuctionStatus.ACTIVE,
        isStatusActive: isStatusActive,
        now: now,
        endTime: endTime,
        endTimeString: localAuction.endTime,
        difference: difference,
        isTimeExpired: isTimeExpired,
        showEndedState: showEndedState,
      });
    }

    // ✅ IMPROVED: Better logic for auction status
    if (!isStatusActive) {
      // Status is not ACTIVE (ENDED, SETTLED, CANCELLED, etc.)
      if (localAuction.auctionId === "4") {
        console.log("🔍 [AuctionCard #4] Status not active, showing Ended");
      }
      return { color: "text-gray-500", label: "Ended", canExtend: false };
    }

    if (isTimeExpired) {
      // Status is ACTIVE but time expired - auction ended naturally
      if (localAuction.auctionId === "4") {
        console.log("🔍 [AuctionCard #4] Time expired, showing Ended");
      }
      return { color: "text-gray-500", label: "Ended", canExtend: false };
    }

    // English auction specific logic
    if (localAuction.auctionType === AuctionType.ENGLISH) {
      // Convert extensionThreshold from minutes to milliseconds
      const extensionThresholdMinutes =
        localAuction.extensionThresholdMinutes || 5; // Default 5 minutes
      const extensionThreshold = extensionThresholdMinutes * 60 * 1000; // Convert to milliseconds

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
  const typeInfo = auctionTypeInfo[localAuction.auctionType];

  // Debug typeInfo for auction #31
  if (auction.auctionId === "31") {
    console.log("🔍 [AUCTION CARD DEBUG] Auction #31 typeInfo:", {
      auctionType: localAuction.auctionType,
      typeInfo: typeInfo,
      typeInfoExists: !!typeInfo,
      typeInfoEmoji: typeInfo?.emoji,
      typeInfoName: typeInfo?.name,
    });
  }

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

          {Number(localAuction.status) === AuctionStatus.PENDING && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium animate-pulse">
              🔓 Sealed Bid Reveal
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
            {localAuction.auctionType === AuctionType.ENGLISH &&
              timeStatus.isExtensionZone && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium animate-pulse">
                  🔄 Auto-extend zone
                </span>
              )}
          </div>
          <span className="text-xs text-gray-500">
            #{localAuction.auctionId}
          </span>
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
        {Number(auction.bidCount) > 0 && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium text-gray-700">
            🔥 {Number(auction.bidCount)} bid
            {Number(auction.bidCount) !== 1 ? "s" : ""}
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
                {Number(auction.status) === AuctionStatus.PENDING
                  ? "Hidden Bids"
                  : "Starting Price"}
              </div>
              <div className="text-xl font-bold text-gray-900">
                {Number(auction.status) === AuctionStatus.PENDING
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
                {auction.currentBid === "0"
                  ? "Starting Price"
                  : auction.highestBidder &&
                    auction.highestBidder.toLowerCase() ===
                      address?.toLowerCase()
                  ? "Your Bid"
                  : "Current Bid"}
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
                {/* <span>
                   {auction.currentBid !== "0"
                    ? `Next: ${(
                        parseFloat(auction.currentBid) +
                        parseFloat(auction.bidIncrement)
                      ).toFixed(6)} ETH`
                    : `Min bid: ${auction.startPrice} ETH`}
                </span> */}
                {/* Extension info for English auctions */}
                {timeStatus.isExtensionZone && (
                  <span className="text-orange-600 font-medium">
                    +{localAuction.extensionDurationMinutes || 10}min on bid
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
                {auction.currentBid === "0"
                  ? "Starting Price"
                  : auction.highestBidder &&
                    auction.highestBidder.toLowerCase() ===
                      address?.toLowerCase()
                  ? "Your Bid"
                  : "Current Bid"}
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
          Number(auction.status) === AuctionStatus.ACTIVE &&
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
