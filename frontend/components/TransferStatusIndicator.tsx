"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import { useNFTTransferNotifications } from "@/providers/NFTTransferNotificationsProvider";

export default function TransferStatusIndicator() {
  const { isTransferConfirmed, transferTokenId, transferRecipient } =
    useNFTTransferNotifications();

  if (!isTransferConfirmed || !transferTokenId || !transferRecipient)
    return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.9 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[99998]"
      >
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-2xl border border-blue-400 px-6 py-4 flex items-center space-x-4 min-w-[320px]">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
          <div className="flex items-center space-x-3">
            <span className="text-lg font-semibold text-white">
              Transferring NFT #{transferTokenId}
            </span>
            <ArrowRight className="w-4 h-4 text-blue-200" />
            <span className="text-sm text-blue-100 font-mono">
              {transferRecipient.slice(0, 6)}...{transferRecipient.slice(-4)}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
