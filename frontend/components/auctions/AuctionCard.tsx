"use client";

import React, { useState, useEffect } from "react";
import { Auction, AuctionType, AuctionStatus } from "../../types/auction";
import Button from "../ui/Button";
import { useWeb3Context } from "../../providers/Web3Provider";
import { shortenAddress } from "../../utils/shortenAddress";

interface AuctionCardProps {
  auction: Auction;
  onClick?: () => void;
  showEndedState?: boolean;
}

// Category emojis mapping
const categoryEmojis = {
  scooter: "🛴",
  bike: "🚲",
  skateboard: "🛹",
  moped: "🛵",
};

// Auction type info
const auctionTypeInfo = {
  [AuctionType.TRADITIONAL]: {
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
  const { isConnected } = useWeb3Context();
  const [timeLeft, setTimeLeft] = useState("");
  const [currentDutchPrice, setCurrentDutchPrice] = useState(
    auction.currentBid
  );

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

  // Calculate Dutch auction current price
  useEffect(() => {
    if (
      auction.auctionType === AuctionType.DUTCH &&
      auction.status === AuctionStatus.ACTIVE
    ) {
      const updateDutchPrice = () => {
        const now = new Date().getTime();
        const startTime = new Date(auction.startTime).getTime();
        const endTime = new Date(auction.endTime).getTime();
        const elapsed = now - startTime;
        const duration = endTime - startTime;

        if (elapsed <= 0) {
          setCurrentDutchPrice(auction.startPrice);
          return;
        }

        if (elapsed >= duration) {
          setCurrentDutchPrice(auction.reservePrice);
          return;
        }

        const startPrice = parseFloat(auction.startPrice);
        const reservePrice = parseFloat(auction.reservePrice);
        const priceReduction =
          ((startPrice - reservePrice) * elapsed) / duration;
        const currentPrice = startPrice - priceReduction;

        setCurrentDutchPrice(Math.max(currentPrice, reservePrice).toFixed(6));
      };

      updateDutchPrice();
      const interval = setInterval(updateDutchPrice, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [
    auction.auctionType,
    auction.startPrice,
    auction.reservePrice,
    auction.startTime,
    auction.endTime,
    auction.status,
  ]);

  const handleQuickAction = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isConnected) {
      alert("Connect wallet to participate");
      return;
    }

    // TODO: Implement actual bidding logic. Optional
    console.log(
      "Quick action for auction:",
      auction.auctionId,
      "Type:",
      auction.auctionType
    );
  };

  const getActionButton = () => {
    if (showEndedState || auction.status !== AuctionStatus.ACTIVE) {
      return null;
    }

    switch (auction.auctionType) {
      case AuctionType.DUTCH:
        return (
          <Button
            size="sm"
            onClick={handleQuickAction}
            disabled={!isConnected}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Buy Now ({currentDutchPrice} ETH)
          </Button>
        );

      case AuctionType.SEALED_BID:
        return (auction.status as AuctionStatus) === AuctionStatus.REVEALING ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleQuickAction}
            disabled={!isConnected}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Reveal Bid
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleQuickAction}
            disabled={!isConnected}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Submit Sealed Bid
          </Button>
        );

      default: // TRADITIONAL and ENGLISH
        return (
          <Button
            size="sm"
            onClick={handleQuickAction}
            disabled={!isConnected}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isConnected ? "Place Bid" : "Connect Wallet"}
          </Button>
        );
    }
  };

  const getTimeStatus = () => {
    if (showEndedState || auction.status !== AuctionStatus.ACTIVE) {
      return { color: "text-gray-500", label: "Ended" };
    }

    const now = new Date().getTime();
    const endTime = new Date(auction.endTime).getTime();
    const difference = endTime - now;

    if (difference <= 0) {
      return { color: "text-gray-500", label: "Ended" };
    } else if (difference <= 60000) {
      // 1 minute
      return { color: "text-red-600", label: timeLeft };
    } else if (difference <= 300000) {
      // 5 minutes
      return { color: "text-orange-600", label: timeLeft };
    } else if (difference <= 3600000) {
      // 1 hour
      return { color: "text-yellow-600", label: timeLeft };
    } else {
      return { color: "text-green-600", label: timeLeft };
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

          {(auction.status as AuctionStatus) === AuctionStatus.REVEALING && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium animate-pulse">
              🔓 Apertura buste
            </span>
          )}
        </div>

        {/* Time remaining */}
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${timeStatus.color}`}>
            ⏰ {timeStatus.label}
          </span>
          <span className="text-xs text-gray-500">#{auction.auctionId}</span>
        </div>
      </div>

      {/* NFT Image */}
      <div className="relative aspect-square bg-gradient-to-br from-moove-50 to-moove-100 p-6">
        <div className="w-full h-full bg-gradient-to-br from-moove-primary to-moove-secondary rounded-xl flex items-center justify-center text-6xl text-white">
          {categoryEmojis[auction.nftCategory as keyof typeof categoryEmojis] ||
            "🚗"}
        </div>

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
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="flex items-center space-x-1">
            <span className="text-gray-500">🔋</span>
            <span className="text-gray-700">{auction.attributes.range}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-500">⚡</span>
            <span className="text-gray-700">{auction.attributes.speed}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-500">⭐</span>
            <span className="text-gray-700">
              {auction.attributes.condition}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-500">🔧</span>
            <span className="text-gray-700">{auction.attributes.battery}</span>
          </div>
        </div>

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
              <div className="text-xs text-gray-500">Prezzo corrente</div>
              <div className="text-xl font-bold text-gray-900">
                {currentDutchPrice}{" "}
                <span className="text-sm text-gray-600">
                  {auction.currency}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Prezzo di partenza: {auction.startPrice} ETH • Riserva{" "}
                {auction.reservePrice} ETH
              </div>
            </div>
          ) : auction.auctionType === AuctionType.SEALED_BID ? (
            <div>
              <div className="text-xs text-gray-500">
                {auction.status === AuctionStatus.REVEALING
                  ? "Hidden Bids"
                  : "Starting Price"}
              </div>
              <div className="text-xl font-bold text-gray-900">
                {auction.status === AuctionStatus.REVEALING
                  ? "???"
                  : auction.startPrice}
                <span className="text-sm text-gray-600 ml-1">
                  {auction.currency}
                </span>
              </div>
            </div>
          ) : (
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
              {auction.currentBid !== "0" && (
                <div className="text-xs text-gray-500">
                  Next bid:{" "}
                  {(
                    parseFloat(auction.currentBid) +
                    parseFloat(auction.bidIncrement)
                  ).toFixed(4)}{" "}
                  ETH
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action button */}
        <div className="flex justify-end">{getActionButton()}</div>
      </div>
    </div>
  );
}
