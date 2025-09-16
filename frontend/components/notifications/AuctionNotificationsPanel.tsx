"use client";

import React from "react";
import { WonAuction } from "@/hooks/useWonAuctions";
import { X, Clock, Trophy, ExternalLink } from "lucide-react";

interface AuctionNotificationsPanelProps {
  unsettledAuctions: WonAuction[];
  isOpen: boolean;
  onClose: () => void;
  onSettleAuction: (auctionId: string, auction: WonAuction) => void;
  isSettling: boolean;
}

export default function AuctionNotificationsPanel({
  unsettledAuctions,
  isOpen,
  onClose,
  onSettleAuction,
  isSettling,
}: AuctionNotificationsPanelProps) {
  const handleAuctionClick = (auction: WonAuction) => {
    console.log("🔔 Auction clicked:", auction);
    // Use the global modal system instead of local modal
    // The global system will handle the modal display
    onSettleAuction(auction.auctionId, auction);
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 3:
        return "Ready to claim";
      case 4:
        return "Settled";
      default:
        return "Pending";
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 3:
        return "text-green-600 bg-green-100";
      case 4:
        return "text-blue-600 bg-blue-100";
      default:
        return "text-yellow-600 bg-yellow-100";
    }
  };

  if (!isOpen) return null;

  console.log("🔔 AuctionNotificationsPanel rendering:", {
    isOpen,
    unsettledAuctionsCount: unsettledAuctions.length,
    unsettledAuctions: unsettledAuctions.map((a) => ({
      auctionId: a.auctionId,
      nftId: a.nftId,
      name: a.name,
      status: a.status,
      isSettled: a.isSettled,
    })),
  });

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-20 right-4 w-96 max-h-[calc(100vh-6rem)] bg-white rounded-lg shadow-xl z-[9999] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5" />
            <h3 className="font-semibold">Your Winnings</h3>
            <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-sm">
              {unsettledAuctions.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
          {unsettledAuctions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No winnings to claim</p>
            </div>
          ) : (
            <div className="p-2">
              {unsettledAuctions.map((auction, index) => (
                <div
                  key={`auction-${auction.auctionId || index}-${auction.nftId}`}
                  className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleAuctionClick(auction)}
                >
                  <div className="flex items-start space-x-3">
                    {/* NFT Image */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      {auction.image &&
                      auction.image !== "/images/default-nft.png" ? (
                        <img
                          src={auction.image}
                          alt={auction.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src="/images/default-nft.svg"
                          alt="Default NFT"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Auction Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {auction.name}
                        </h4>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span className="font-medium text-green-600">
                          {auction.finalBid.toFixed(4)} ETH
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            auction.status
                          )}`}
                        >
                          {getStatusText(auction.status)}
                        </span>
                      </div>

                      {auction.endTime && (
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>Finished: {formatTime(auction.endTime)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {unsettledAuctions.length > 0 && (
          <div className="p-3 border-t bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              Click on an NFT to claim it
            </p>
          </div>
        )}
      </div>

      {/* Modal is now handled by the global system */}
    </>
  );
}
