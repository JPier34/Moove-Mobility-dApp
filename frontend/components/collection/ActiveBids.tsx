"use client";

import React, { useState, useEffect } from "react";
import Button from "../ui/Button";
import { AuctionType } from "../../types/auction";

interface ActiveBid {
  auctionId: string;
  nftName: string;
  nftImage: string;
  myBidAmount: string;
  currentHighestBid: string;
  isWinning: boolean | null;
  endTime: Date;
  auctionType: AuctionType;
}

interface ActiveBidsProps {
  bids: ActiveBid[];
}

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

export default function ActiveBids({ bids }: ActiveBidsProps) {
  const [timeLeftMap, setTimeLeftMap] = useState<Record<string, string>>({});

  // Calculate time remaining for each bid
  useEffect(() => {
    const updateTimes = () => {
      const newTimeMap: Record<string, string> = {};

      bids.forEach((bid) => {
        const now = new Date().getTime();
        const endTime = new Date(bid.endTime).getTime();
        const difference = endTime - now;

        if (difference > 0) {
          const hours = Math.floor(difference / (1000 * 60 * 60));
          const minutes = Math.floor(
            (difference % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);

          if (hours > 0) {
            newTimeMap[bid.auctionId] = `${hours}h ${minutes}m`;
          } else {
            newTimeMap[bid.auctionId] = `${minutes}m ${seconds}s`;
          }
        } else {
          newTimeMap[bid.auctionId] = "Ended";
        }
      });

      setTimeLeftMap(newTimeMap);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, [bids]);

  const handleViewAuction = (auctionId: string) => {
    // TODO: Navigate to auction detail
    window.location.href = `/auctions/${auctionId}`;
  };

  const handleIncreaseBid = (bid: ActiveBid) => {
    // TODO: Implement increase bid logic
    console.log("Increasing bid for auction:", bid.auctionId);
    alert(`Aumentando offerta per ${bid.nftName}...`);
  };

  if (bids.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔥</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Nessuna offerta attiva
        </h3>
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          Non hai offerte attive al momento. Partecipa alle aste per iniziare a
          fare offerte!
        </p>
        <Button onClick={() => (window.location.href = "/auctions")}>
          Vai alle Aste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bids.map((bid) => {
        const typeInfo = auctionTypeInfo[bid.auctionType];
        const timeLeft = timeLeftMap[bid.auctionId] || "Calculating...";
        const isEnding = timeLeft.includes("m") && !timeLeft.includes("h");

        return (
          <div
            key={bid.auctionId}
            className={`border rounded-xl p-4 transition-all ${
              bid.isWinning
                ? "border-green-200 bg-green-50"
                : bid.isWinning === false
                ? "border-red-200 bg-red-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Left side - NFT info */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-moove-primary to-moove-secondary rounded-xl flex items-center justify-center text-2xl text-white">
                  🛴
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {bid.nftName}
                  </h3>
                  <div className="flex items-center space-x-2 mb-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}
                    >
                      {typeInfo.emoji} {typeInfo.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      #{bid.auctionId}
                    </span>
                  </div>

                  {/* Bid status */}
                  <div className="flex items-center space-x-2">
                    {bid.isWinning === true && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                        🏆 Stai vincendo
                      </span>
                    )}
                    {bid.isWinning === false && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                        📉 Superato
                      </span>
                    )}
                    {bid.isWinning === null && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                        🔒 Sigillata
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Center - Bid info */}
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">La mia offerta</div>
                <div className="text-lg font-bold text-gray-900">
                  {bid.myBidAmount} ETH
                </div>
                {bid.auctionType !== AuctionType.SEALED_BID && (
                  <div className="text-sm text-gray-500 mt-1">
                    Attuale: {bid.currentHighestBid} ETH
                  </div>
                )}
              </div>

              {/* Right side - Time and actions */}
              <div className="text-right">
                <div
                  className={`text-sm font-medium mb-2 ${
                    isEnding ? "text-red-600" : "text-gray-600"
                  }`}
                >
                  ⏰ {timeLeft}
                </div>

                <div className="space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewAuction(bid.auctionId)}
                  >
                    Visualizza
                  </Button>

                  {bid.isWinning === false &&
                    bid.auctionType !== AuctionType.SEALED_BID && (
                      <Button
                        size="sm"
                        onClick={() => handleIncreaseBid(bid)}
                        className="w-full"
                      >
                        Rilancia
                      </Button>
                    )}

                  {bid.auctionType === AuctionType.SEALED_BID &&
                    timeLeft !== "Ended" && (
                      <Button size="sm" variant="secondary" className="w-full">
                        Rivela
                      </Button>
                    )}
                </div>
              </div>
            </div>

            {/* Additional info for ending soon */}
            {isEnding && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="text-orange-800 text-sm font-medium flex items-center">
                  ⚠️ Asta in scadenza - Agisci rapidamente!
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
