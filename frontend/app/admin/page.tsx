"use client";

import React from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { useUserRoles } from "@/hooks/useContract";
import AdminNFTCreator from "@/components/admin/AdminNFTCreator";
import { useRouteLoading } from "@/hooks/useRouteLoading";

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const {
    isMasterAdmin,
    canMint,
    isLoading: rolesLoading,
  } = useUserRoles(address);
  const { navigateWithLoading } = useRouteLoading();

  // Show loading state
  if (rolesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }

  // Check if user is connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Wallet Not Connected
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Please connect your wallet to access the admin panel
          </p>
          <button
            onClick={() => navigateWithLoading("/")}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Check admin permissions
  if (!isMasterAdmin && !canMint) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            You don't have permission to access the admin panel
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Connected wallet: {address}
          </div>
          <button
            onClick={() => navigateWithLoading("/")}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
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

        {/* Admin Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {isMasterAdmin ? "Master" : "Limited"}
            </div>
            <div className="text-gray-600 dark:text-gray-300">Admin Level</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {canMint ? "✅" : "❌"}
            </div>
            <div className="text-gray-600 dark:text-gray-300">
              Minting Rights
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">Active</div>
            <div className="text-gray-600 dark:text-gray-300">Status</div>
          </div>
        </motion.div>

        {/* Admin Actions */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              🎨 NFT Management
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Create new decorative NFTs and set them up for auction
            </p>
          </div>

          <AdminNFTCreator />
        </motion.div>

        {/* Future Admin Features */}
        <motion.div
          className="mt-12 bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              🚀 Coming Soon
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Additional admin features will be available soon
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                Analytics
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                View platform statistics and user activity
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                Settings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Configure platform parameters and fees
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                User Management
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Manage user roles and permissions
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
