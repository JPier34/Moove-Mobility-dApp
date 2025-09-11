"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Gift, Sparkles, CheckCircle } from "lucide-react";

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
          className="relative w-full max-w-md bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-3xl p-8 shadow-2xl"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          {/* Content */}
          <div className="text-center text-white">
            {/* Success Icon */}
            <motion.div
              className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle size={40} className="text-white" />
            </motion.div>

            {/* Title */}
            <motion.h2
              className="text-3xl font-bold mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              🎉 Purchase Successful!
            </motion.h2>

            <motion.p
              className="text-lg mb-6 opacity-90"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              You've successfully purchased the Dutch auction!
            </motion.p>

            {/* Auction Details */}
            <motion.div
              className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-white/30 rounded-xl flex items-center justify-center">
                <Gift size={32} className="text-white/80" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                Auction #{auctionId}
              </h3>
              <div className="mt-3 flex justify-center space-x-4 text-sm">
                <span>💰 {price} ETH</span>
                <span>✅ Completed</span>
              </div>
            </motion.div>

            {/* Description */}
            <motion.p
              className="text-sm mb-8 opacity-90"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              The NFT has been transferred to your wallet and added to your
              collection. You can view it in "My Collection".
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              className="flex space-x-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <button
                onClick={onClose}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-6 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.location.href = "/my-collection";
                }}
                className="flex-1 bg-white/30 hover:bg-white/40 text-white font-medium py-3 px-6 rounded-xl transition-colors"
              >
                View Collection
              </button>
            </motion.div>

            {/* Transaction Hash */}
            {transactionHash && (
              <motion.div
                className="mt-4 text-xs opacity-70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <p>
                  Transaction: {transactionHash.slice(0, 10)}...
                  {transactionHash.slice(-8)}
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
