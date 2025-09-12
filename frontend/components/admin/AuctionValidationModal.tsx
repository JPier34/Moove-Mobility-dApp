"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuctionType } from "@/types/auction";
import { AuctionFormData } from "@/hooks/useAuctionValidationModular";
import { ethers } from "ethers";

interface AuctionValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formData: AuctionFormData;
  address: string;
  isProcessing: boolean;
}

export default function AuctionValidationModal({
  isOpen,
  onClose,
  onConfirm,
  formData,
  address,
  isProcessing,
}: AuctionValidationModalProps) {
  const [validationResult, setValidationResult] = React.useState<{
    isValid: boolean;
    error?: string;
  } | null>(null);
  const [isValidating, setIsValidating] = React.useState(false);

  // Run validation when modal opens
  React.useEffect(() => {
    if (isOpen) {
      runValidation();
    }
  }, [isOpen, formData]);

  const runValidation = async () => {
    setIsValidating(true);
    try {
      // Simple validation for now - just check required fields
      const isValid = !!(formData.startPrice && formData.duration);
      const result = {
        isValid,
        error: isValid
          ? undefined
          : "Missing required fields (startPrice, duration)",
      };
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        isValid: false,
        error: error instanceof Error ? error.message : "Validation failed",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirm = () => {
    if (validationResult?.isValid) {
      onConfirm();
    }
  };

  const getAuctionTypeName = (type: AuctionType): string => {
    const names = {
      [AuctionType.RESERVE]: "Reserve",
      [AuctionType.ENGLISH]: "English",
      [AuctionType.DUTCH]: "Dutch",
      [AuctionType.SEALED_BID]: "Sealed Bid",
    };
    return names[type] || "Unknown";
  };

  const formatPrice = (price: string): string => {
    const numPrice = parseFloat(price);
    return isNaN(numPrice) ? "0" : numPrice.toFixed(6);
  };

  const formatDuration = (
    duration: string,
    unit: "minutes" | "hours"
  ): string => {
    const numDuration = parseInt(duration);
    if (isNaN(numDuration)) return "0";

    if (unit === "minutes") {
      const hours = Math.floor(numDuration / 60);
      const minutes = numDuration % 60;
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    } else {
      return `${numDuration}h`;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              🔍 Auction Validation
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={isProcessing}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Validation Status */}
          <div className="mb-6">
            {isValidating ? (
              <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-700 dark:text-blue-300">
                  Validating auction parameters...
                </span>
              </div>
            ) : validationResult ? (
              <div
                className={`p-4 rounded-lg ${
                  validationResult.isValid
                    ? "bg-green-50 dark:bg-green-900/20"
                    : "bg-red-50 dark:bg-red-900/20"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {validationResult.isValid ? (
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                  <span
                    className={`font-medium ${
                      validationResult.isValid
                        ? "text-green-700 dark:text-green-300"
                        : "text-red-700 dark:text-red-300"
                    }`}
                  >
                    {validationResult.isValid
                      ? "Validation passed!"
                      : "Validation failed"}
                  </span>
                </div>
                {validationResult.error && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {validationResult.error}
                  </p>
                )}
              </div>
            ) : null}
          </div>

          {/* Auction Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📋 Auction Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Auction Type
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {getAuctionTypeName(formData.auctionType)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Start Price
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {formatPrice(formData.startPrice)} ETH
                  </p>
                </div>
                {formData.reservePrice && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Reserve Price
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {formatPrice(formData.reservePrice)} ETH
                    </p>
                  </div>
                )}
                {formData.buyNowPrice && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Buy Now Price
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {formatPrice(formData.buyNowPrice)} ETH
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Duration
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {formatDuration(formData.duration, formData.durationUnit)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Bid Increment
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {formatPrice(formData.bidIncrement)} ETH
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Wallet
                  </label>
                  <p className="text-gray-900 dark:text-white font-mono text-sm">
                    {address
                      ? `${address.slice(0, 6)}...${address.slice(-4)}`
                      : "Not connected"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gas Estimation */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ⛽ Estimated Gas Cost
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Creating an auction typically costs 0.001-0.005 ETH in gas fees.
              Make sure you have sufficient ETH in your wallet.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!validationResult?.isValid || isProcessing}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                validationResult?.isValid && !isProcessing
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                "Create Auction"
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
