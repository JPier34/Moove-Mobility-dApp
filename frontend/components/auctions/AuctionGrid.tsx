"use client";

import React, { useState } from "react";
import AuctionCard from "components/auctions/AuctionCard";
import AuctionModal from "components/auctions/AuctionModal";
import { AuctionType, type Auction } from "../../types/auction";

// Interface for auction grid props
interface AuctionGridProps {
  auctions: Auction[];
  isLoading?: boolean;
  showEndedState?: boolean;
}

export default function AuctionGrid({
  auctions,
  isLoading = false,
  showEndedState = false,
}: AuctionGridProps) {
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            {/* Header skeleton */}
            <div className="flex justify-between items-center mb-4">
              <div className="h-6 bg-gray-200 rounded w-24"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>

            {/* Image skeleton */}
            <div className="aspect-square bg-gray-200 rounded-xl mb-4"></div>

            {/* Content skeleton */}
            <div className="space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (auctions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">{showEndedState ? "⏰" : "🔍"}</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {showEndedState ? "No ended auctions" : "No active auctions"}
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {showEndedState
            ? "There are no recently ended auctions. Check active auctions!"
            : "No active auctions at the moment. Come back later for new opportunities!"}
        </p>
      </div>
    );
  }

  // Group auctions by type for better visualization
  const groupedAuctions = auctions.reduce((groups, auction) => {
    const type = auction.auctionType;
    if (!groups[type]) groups[type] = [];
    groups[type].push(auction);
    return groups;
  }, {} as Record<AuctionType, Auction[]>);

  // Auction type names
  const typeNames = {
    [AuctionType.TRADITIONAL]: "Traditional",
    [AuctionType.ENGLISH]: "English",
    [AuctionType.DUTCH]: "Dutch",
    [AuctionType.SEALED_BID]: "Sealed Bid",
  };

  // Type emojis
  const typeEmojis = {
    [AuctionType.TRADITIONAL]: "🏛️",
    [AuctionType.ENGLISH]: "⬆️",
    [AuctionType.DUTCH]: "⬇️",
    [AuctionType.SEALED_BID]: "🔒",
  };

  return (
    <>
      {/* If not grouping, show normal grid */}
      {!showEndedState &&
      Object.keys(groupedAuctions).length === auctions.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <AuctionCard
              key={auction.auctionId}
              auction={auction}
              onClick={() => setSelectedAuction(auction)}
              showEndedState={showEndedState}
            />
          ))}
        </div>
      ) : (
        /* Grouped visualization by type */
        <div className="space-y-8">
          {Object.entries(groupedAuctions).map(([typeStr, typeAuctions]) => {
            const type = parseInt(typeStr) as AuctionType;
            return (
              <div key={type} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">{typeEmojis[type]}</span>
                  {typeNames[type]} ({typeAuctions.length})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {typeAuctions.map((auction) => (
                    <AuctionCard
                      key={auction.auctionId}
                      auction={auction}
                      onClick={() => setSelectedAuction(auction)}
                      showEndedState={showEndedState}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Auction details modal */}
      {selectedAuction && (
        <AuctionModal
          auction={selectedAuction}
          isOpen={!!selectedAuction}
          onClose={() => setSelectedAuction(null)}
        />
      )}
    </>
  );
}
