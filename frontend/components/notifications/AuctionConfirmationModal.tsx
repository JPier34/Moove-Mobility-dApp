"use client";

import React from "react";
import { WonAuction } from "@/hooks/useWonAuctions";
import { X, AlertTriangle, CheckCircle } from "lucide-react";

interface AuctionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  auction: WonAuction | null;
  isProcessing: boolean;
}

export default function AuctionConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  auction,
  isProcessing,
}: AuctionConfirmationModalProps) {
  if (!isOpen || !auction) return null;

  // Debug log to see what data we're receiving
  console.log("🔔 AuctionConfirmationModal received auction data:", auction);

  const getAuctionTypeInfo = (auctionType: number) => {
    switch (auctionType) {
      case 0:
        return { type: "English Auction", description: "Highest bidder wins" };
      case 1:
        return {
          type: "Dutch Auction",
          description: "Price decreases over time",
        };
      case 2:
        return { type: "Sealed Bid", description: "Private bidding" };
      case 3:
        return {
          type: "Reserve Auction",
          description: "Minimum price required",
        };
      default:
        return { type: "Auction", description: "NFT auction" };
    }
  };

  const auctionInfo =
    auction.auctionType !== undefined
      ? getAuctionTypeInfo(auction.auctionType)
      : { type: "Unknown", description: "Unknown auction type" };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Confirm Auction Settlement
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Auction Details */}
        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <img
                src={auction.image || "/images/default-nft.svg"}
                alt={auction.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-900">{auction.name}</h3>
                <p className="text-sm text-gray-600">
                  Auction #{auction.auctionId}
                </p>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Important</h4>
                <p className="text-sm text-amber-700 mt-1">
                  You are about to settle this auction and claim your NFT. This
                  action will:
                </p>
                <ul className="text-sm text-amber-700 mt-2 space-y-1">
                  <li>• Transfer the NFT to your wallet</li>
                  <li>• Pay the final bid amount</li>
                  <li>• Complete the auction process</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Confirm & Claim</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
