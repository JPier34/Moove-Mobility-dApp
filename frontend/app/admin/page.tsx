"use client";

import React from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { useUserRoles } from "@/hooks/useContract";
import AdminNFTCreatorUltraSimple from "@/components/admin/AdminNFTCreatorUltraSimple";
import AdminGuard from "@/components/admin/AdminGuard";
import EnvironmentSetupGuide from "@/components/admin/EnvironmentSetupGuide";
import AuctionIdRangeChecker from "@/components/admin/AuctionIdRangeChecker";
import ServerSideAuctionManager from "@/components/admin/ServerSideAuctionManager";

export default function AdminPage() {
  const { address } = useAccount();
  const { isMasterAdmin, canMint } = useUserRoles(address);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-900/20">
        <div className="max-w-7xl mx-auto px-6 py-20">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Admin
              </span>{" "}
              Panel
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              Manage NFTs, auctions, and platform settings
            </p>

            {/* Admin Status */}
            <div className="inline-flex items-center bg-green-500/10 backdrop-blur-sm border border-green-500/20 text-green-600 dark:text-green-400 px-6 py-3 rounded-full text-lg font-medium">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              Admin Access Granted
            </div>
          </motion.div>

          {/* Temporarily disabled Failed Auction Handler to prevent loops */}
          {/* <FailedAuctionHandler
            isHandlingFailedAuctions={isHandlingFailedAuctions}
            processedFailedAuctions={processedFailedAuctions}
            onRefresh={refetchAuctions}
          /> */}

          {/* Admin Debug Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          ></motion.div>

          {/* Admin Stats */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Admin Level
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isMasterAdmin ? "Master" : "Minter"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👑</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Permissions
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isMasterAdmin ? "Full" : "Limited"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🔐</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Wallet
                  </p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💼</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* NFT Creator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <AdminNFTCreatorUltraSimple />
          </motion.div>

          {/* Environment Setup Guide */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <EnvironmentSetupGuide />
          </motion.div>

          {/* Auction ID Range Checker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <AuctionIdRangeChecker />
          </motion.div>

          {/* Server-Side Auction Manager */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <ServerSideAuctionManager />
          </motion.div>

          {/* Environment Debugger - Temporarily disabled */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 2.0 }}
          >
            <EnvironmentDebugger />
          </motion.div> */}

          {/* Debug components removed */}
        </div>
      </div>
    </AdminGuard>
  );
}
