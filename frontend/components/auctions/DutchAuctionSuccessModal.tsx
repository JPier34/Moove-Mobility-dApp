"use client";

import React from "react";
import { X, CheckCircle } from "lucide-react";

interface DutchAuctionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctionId: number;
  price: number;
  transactionHash?: string;
}

export default function DutchAuctionSuccessModal({
  isOpen,
  onClose,
  auctionId,
  price,
  transactionHash,
}: DutchAuctionSuccessModalProps) {
  // Auto-close modal after 5 seconds
  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="p-8">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle
                size={32}
                className="text-green-600 dark:text-green-400"
              />
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              🎉 Purchase Successful!
            </h3>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You've successfully purchased the Dutch auction!
            </p>

            {/* Auction Details */}
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 mb-6">
              <div className="flex justify-between">
                <span>Auction ID:</span>
                <span className="font-mono font-semibold">#{auctionId}</span>
              </div>
              <div className="flex justify-between">
                <span>Price Paid:</span>
                <span className="font-mono font-semibold">{price} ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  ✅ Completed
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                The NFT has been transferred to your wallet and added to your
                collection. You can view it in "My Collection".
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.location.href = "/my-collection";
                }}
                className="flex-1 bg-purple-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors"
              >
                View Collection
              </button>
            </div>

            {/* Transaction Hash */}
            {transactionHash && (
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                <p>
                  Transaction: {transactionHash.slice(0, 10)}...
                  {transactionHash.slice(-8)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
