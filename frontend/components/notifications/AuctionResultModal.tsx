"use client";

import React from "react";
import { WonAuction } from "@/hooks/useWonAuctions";
import { X, CheckCircle, XCircle, ExternalLink, Copy } from "lucide-react";

interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
}

interface AuctionResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: WonAuction | null;
  result: TransactionResult | null;
}

export default function AuctionResultModal({
  isOpen,
  onClose,
  auction,
  result,
}: AuctionResultModalProps) {
  if (!isOpen || !auction || !result) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const openInExplorer = (hash: string) => {
    const explorerUrl = `https://sepolia.etherscan.io/tx/${hash}`;
    window.open(explorerUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {result.success ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              {result.success
                ? "Auction Settled Successfully!"
                : "Transaction Failed"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
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

          {/* Result Message */}
          <div
            className={`rounded-lg p-4 ${
              result.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-start space-x-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div>
                <h4
                  className={`font-medium ${
                    result.success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {result.success ? "Success!" : "Error"}
                </h4>
                <p
                  className={`text-sm mt-1 ${
                    result.success ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {result.success
                    ? "Your NFT has been successfully claimed and transferred to your wallet."
                    : result.error ||
                      "The transaction failed. Please try again."}
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Hash */}
          {result.success && result.hash && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">
                Transaction Details
              </h4>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded break-all">
                  {result.hash}
                </code>
                <button
                  onClick={() => copyToClipboard(result.hash!)}
                  className="p-1 text-blue-600 hover:text-blue-800"
                  title="Copy hash"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => openInExplorer(result.hash!)}
                  className="p-1 text-blue-600 hover:text-blue-800"
                  title="View on Etherscan"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-medium ${
              result.success
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {result.success ? "Great!" : "Try Again"}
          </button>
        </div>
      </div>
    </div>
  );
}
