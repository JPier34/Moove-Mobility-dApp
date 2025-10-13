"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Gift, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useAuctionClaim } from "@/hooks/useAuctionClaim";

interface AuctionClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctionId: string;
  auctionName: string;
  auctionImage: string;
  finalBid: number;
}

export default function AuctionClaimModal({
  isOpen,
  onClose,
  auctionId,
  auctionName,
  auctionImage,
  finalBid,
}: AuctionClaimModalProps) {
  const { claimAuction, isProcessing, error, step } = useAuctionClaim();

  const handleClaim = async () => {
    const success = await claimAuction(auctionId);
    if (success) {
      // Close modal after successful claim
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isProcessing}
          >
            <X size={24} />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Status Icon */}
            <motion.div
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              {step === "success" ? (
                <div className="w-full h-full bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={40} className="text-green-600" />
                </div>
              ) : step === "error" ? (
                <div className="w-full h-full bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle size={40} className="text-red-600" />
                </div>
              ) : isProcessing ? (
                <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock size={40} className="text-blue-600 animate-spin" />
                </div>
              ) : (
                <div className="w-full h-full bg-yellow-100 rounded-full flex items-center justify-center">
                  <Trophy size={40} className="text-yellow-600" />
                </div>
              )}
            </motion.div>

            {/* Title */}
            <motion.h2
              className="text-2xl font-bold mb-2 text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {step === "success"
                ? "🎉 Claim Successful!"
                : step === "error"
                ? "❌ Claim Failed"
                : isProcessing
                ? "⏳ Processing..."
                : "🏆 Claim Your NFT"}
            </motion.h2>

            <motion.p
              className="text-gray-600 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {step === "success"
                ? "Your NFT has been successfully claimed and added to your collection!"
                : step === "error"
                ? error || "An error occurred during the claim process."
                : isProcessing
                ? `Step ${step === "settling" ? "1" : "2"}: ${
                    step === "settling"
                      ? "Settling auction..."
                      : "Claiming NFT..."
                  }`
                : "You won this auction! Click below to claim your NFT."}
            </motion.p>

            {/* NFT Preview */}
            <motion.div
              className="bg-gray-50 rounded-2xl p-6 mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-xl flex items-center justify-center">
                {auctionImage ? (
                  <img
                    src={auctionImage}
                    alt={auctionName}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <Gift size={40} className="text-gray-400" />
                )}
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900">
                {auctionName}
              </h3>
              <div className="flex justify-center space-x-4 text-sm text-gray-600">
                <span>💰 {finalBid} ETH</span>
                <span>🏆 Won</span>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              className="flex space-x-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {step === "success" ? (
                <button
                  onClick={onClose}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-xl transition-colors"
                >
                  Close
                </button>
              ) : step === "error" ? (
                <>
                  <button
                    onClick={onClose}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleClaim}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-colors"
                  >
                    Retry
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClaim}
                    disabled={isProcessing}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-xl transition-colors"
                  >
                    {isProcessing ? "Processing..." : "Claim NFT"}
                  </button>
                </>
              )}
            </motion.div>

            {/* Processing Steps */}
            {isProcessing && (
              <motion.div
                className="mt-4 text-sm text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      step === "settling" ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                  <span>Settle Auction</span>
                  <div className="w-4 h-px bg-gray-300" />
                  <div
                    className={`w-2 h-2 rounded-full ${
                      step === "claiming" ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                  <span>Claim NFT</span>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
