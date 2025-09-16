"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Gift, Sparkles } from "lucide-react";
import { WonAuction } from "@/hooks/useWonAuctions";
import { useEffect } from "react";

interface CongratulationsModalProps {
  auction: WonAuction | null;
  isOpen: boolean;
  onClose: () => void;
  onSettle: (auctionId: string) => void;
  isSettling: boolean;
  transactionHash?: string | null;
  isWaitingForConfirmation?: boolean;
  onSettlementComplete?: () => void;
}

export default function CongratulationsModal({
  auction,
  isOpen,
  onClose,
  onSettle,
  isSettling,
  transactionHash,
  isWaitingForConfirmation,
  onSettlementComplete,
}: CongratulationsModalProps) {
  if (!auction) return null;

  // Don't auto-close the modal - let the parent component handle it
  // The modal should stay open until the transaction is confirmed

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
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
            onClick={
              isSettling || isWaitingForConfirmation ? undefined : onClose
            }
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
              onClick={
                isSettling || isWaitingForConfirmation ? undefined : onClose
              }
              disabled={isSettling || isWaitingForConfirmation}
              className={`absolute top-4 right-4 transition-colors ${
                isSettling || isWaitingForConfirmation
                  ? "text-white/40 cursor-not-allowed"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <X size={24} />
            </button>

            {/* Content */}
            <div className="text-center text-white">
              {/* Trophy Icon */}
              <motion.div
                className="mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Trophy size={80} className="mx-auto text-yellow-300" />
              </motion.div>

              {/* Title */}
              <motion.h2
                className="text-3xl font-bold mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                🎉 Congratulations!
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                className="text-lg mb-6 opacity-90"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {auction.status === 3
                  ? `You won auction #${auction.auctionId}`
                  : `You're leading auction #${auction.auctionId}`}
              </motion.p>

              {/* NFT Preview */}
              <motion.div
                className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="w-24 h-24 mx-auto mb-4 bg-white/30 rounded-xl flex items-center justify-center">
                  {auction.hasImage ? (
                    <img
                      src={auction.image}
                      alt={auction.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Gift size={40} className="text-white/80" />
                  )}
                </div>
                <h3 className="font-semibold text-lg mb-2">{auction.name}</h3>
                <p className="text-sm opacity-80 capitalize">
                  {auction.category}
                </p>
                <div className="mt-3 flex justify-center space-x-4 text-sm">
                  <span>💰 {auction.finalBid} ETH</span>
                  <span>👥 {auction.bidders} bidders</span>
                </div>
              </motion.div>

              {/* Description */}
              <motion.p
                className="text-sm mb-8 opacity-90"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {auction.status === 3
                  ? 'Click "Settle Auction" to transfer the NFT to your wallet and add it to your collection.'
                  : "Wait for the auction to end, then you can settle it to claim your NFT."}
              </motion.p>

              {/* Transaction Status */}
              {transactionHash && (
                <motion.div
                  className="mb-6 p-4 bg-white/10 rounded-xl border border-white/20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-white">
                      Transaction Submitted
                    </span>
                  </div>
                  <p className="text-xs text-white/70 font-mono break-all">
                    {transactionHash}
                  </p>
                  {isWaitingForConfirmation && (
                    <p className="text-xs text-yellow-300 mt-2">
                      ⏳ Waiting for confirmation...
                    </p>
                  )}
                </motion.div>
              )}

              {/* Action Buttons */}
              <motion.div
                className="flex space-x-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => onSettle(auction.auctionId)}
                  disabled={
                    isSettling ||
                    isWaitingForConfirmation ||
                    auction.status !== 3
                  }
                  className="flex-1 px-6 py-3 bg-white hover:bg-white/90 text-gray-900 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSettling ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      <span>Settling...</span>
                    </>
                  ) : isWaitingForConfirmation ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      <span>Confirming Transaction...</span>
                    </>
                  ) : auction.status === 3 ? (
                    <>
                      <Sparkles size={16} />
                      <span>Settle Auction</span>
                    </>
                  ) : (
                    <>
                      <span>⏳ Wait for End</span>
                    </>
                  )}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
