"use client";

import React from "react";
import { motion } from "framer-motion";
import AuctionGrid from "@/components/auctions/AuctionGrid";
import { AuctionType } from "@/types/auction";
import { useAuctionsEnhanced as useAuctions } from "@/hooks/enhanced-auction-utils";
import { useAuctionExtensionEvents } from "@/hooks/useAuctionExtensionEvents";

// ============= TYPES =============

interface FilterOptions {
  type: AuctionType | "all";
  status: "active" | "ended" | "all";
  category: string;
  priceRange: {
    min: number;
    max: number;
  };
  sortBy: "price" | "time" | "bids";
  sortOrder: "asc" | "desc";
}

const AUCTION_TYPE_CONFIG = {
  [AuctionType.RESERVE]: {
    name: "Traditional",
    icon: "🏛️",
    description: "Classic fixed-duration auction. Highest bid wins.",
    gradient: "from-gray-400 to-gray-600",
  },
  [AuctionType.ENGLISH]: {
    name: "English",
    icon: "⬆️",
    description: "Start with set price, bidders compete upwards.",
    gradient: "from-green-400 to-green-600",
  },
  [AuctionType.DUTCH]: {
    name: "Dutch",
    icon: "⬇️",
    description: "Price decreases over time. First to buy wins.",
    gradient: "from-orange-400 to-red-600",
  },
  [AuctionType.SEALED_BID]: {
    name: "Sealed Bid",
    icon: "🔒",
    description: "Hidden bids revealed after 24 hours.",
    gradient: "from-purple-400 to-purple-600",
  },
};

// ============= COMPONENTS =============

function AuctionsHeader({ stats }: { stats: any }) {
  return (
    <motion.div
      className="text-center m-20"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
        <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Moove
        </span>{" "}
        Auctions
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
        Participate in live auctions for exclusive decorative NFTs. Win unique
        stickers, badges, skins and avatars.
      </p>

      {/* Live Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          whileHover={{
            y: -5,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          <motion.div
            className="text-3xl font-bold text-green-600 mb-2"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {stats.activeAuctions}
          </motion.div>
          <div className="text-gray-600 dark:text-gray-300">
            🔥 Live Auctions
          </div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          whileHover={{
            y: -5,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {stats.totalBids}
          </div>
          <div className="text-gray-600 dark:text-gray-300">💰 Total Bids</div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          whileHover={{
            y: -5,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {stats.endedAuctions}
          </div>
          <div className="text-gray-600 dark:text-gray-300">✅ Completed</div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          whileHover={{
            y: -5,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {stats.totalVolume.toFixed(4)} ETH
          </div>
          <div className="text-gray-600 dark:text-gray-300">📊 Volume</div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function LiveIndicator() {
  return (
    <motion.div
      className="inline-flex items-center bg-red-500/10 backdrop-blur-sm border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-full text-sm font-medium"
      animate={{
        scale: [1, 1.05, 1],
        opacity: [0.8, 1, 0.8],
      }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <motion.div
        className="w-2 h-2 bg-red-500 rounded-full mr-2"
        animate={{ scale: [1, 1.5, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
      Live Updates Every 10s
    </motion.div>
  );
}

function AuctionTypeGuide() {
  return (
    <motion.div
      className="mt-20 bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
    >
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          🎯 Auction Types
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Choose the auction style that fits your bidding strategy
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(AUCTION_TYPE_CONFIG).map(([type, config], index) => (
          <motion.div
            key={type}
            className="text-center group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <motion.div
              className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${config.gradient} flex items-center justify-center text-3xl shadow-lg group-hover:shadow-xl transition-all duration-300`}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              {config.icon}
            </motion.div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">
              {config.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {config.description}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function SectionHeader({
  title,
  count,
  icon,
  rightContent,
}: {
  title: string;
  count: number;
  icon: string;
  rightContent?: React.ReactNode;
}) {
  return (
    <motion.div
      className="flex items-center justify-between mb-8"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center">
        <motion.span
          className="text-3xl mr-3"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {icon}
        </motion.span>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        <motion.span
          className="ml-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-lg font-semibold shadow-lg"
          whileHover={{ scale: 1.05 }}
        >
          {count}
        </motion.span>
      </div>
      {rightContent}
    </motion.div>
  );
}

function FilterBar({
  filters,
  onFilterChange,
}: {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}) {
  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex flex-wrap gap-6">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) =>
              onFilterChange({ ...filters, status: e.target.value as any })
            }
            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">🔥 Active</option>
            <option value="ended">✅ Ended</option>
            <option value="revealing">🔍 Revealing</option>
          </select>
        </div>

        {/* Auction Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Auction Type
          </label>
          <select
            value={filters.type}
            onChange={(e) =>
              onFilterChange({ ...filters, type: e.target.value as any })
            }
            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Types</option>
            <option value="traditional">🏛️ Traditional</option>
            <option value="english">⬆️ English</option>
            <option value="dutch">⬇️ Dutch</option>
            <option value="sealed">🔒 Sealed Bid</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) =>
              onFilterChange({ ...filters, category: e.target.value as any })
            }
            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Categories</option>
            <option value="sticker">🏷️ Stickers</option>
            <option value="badge">🏆 Badges</option>
            <option value="skin">🎨 Skins</option>
            <option value="avatar">👤 Avatars</option>
          </select>
        </div>

        {/* Price Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Price Range
          </label>
          <select
            value={
              filters.priceRange.min === 0 && filters.priceRange.max === 1000
                ? "all"
                : "custom"
            }
            onChange={(e) => {
              const value = e.target.value;
              if (value === "all") {
                onFilterChange({
                  ...filters,
                  priceRange: { min: 0, max: 1000 },
                });
              } else if (value === "low") {
                onFilterChange({
                  ...filters,
                  priceRange: { min: 0, max: 0.001 },
                });
              } else if (value === "medium") {
                onFilterChange({
                  ...filters,
                  priceRange: { min: 0.001, max: 0.005 },
                });
              } else if (value === "high") {
                onFilterChange({
                  ...filters,
                  priceRange: { min: 0.005, max: 1000 },
                });
              }
            }}
            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Prices</option>
            <option value="low">💰 Under 0.001 ETH</option>
            <option value="medium">💎 0.001 - 0.005 ETH</option>
            <option value="high">👑 Above 0.005 ETH</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
}

// ============= MAIN COMPONENT =============
export default function AuctionsPage() {
  const {
    auctions,
    activeAuctions,
    endedAuctions,
    stats,
    filters,
    setFilters,
    isLoading,
    error,
    isMasterAdmin,
    canMint,
    refetch,
    refreshAuctionCache,
  } = useAuctions();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Loading auctions...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error Loading Auctions
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-900/20">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <AuctionsHeader stats={stats} />

        <FilterBar filters={filters} onFilterChange={setFilters} />

        {/* Active Auctions Section */}
        <motion.section
          className="mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <SectionHeader
            title="Live Auctions"
            count={activeAuctions.length}
            icon="🔥"
            rightContent={<LiveIndicator />}
          />

          {activeAuctions.length > 0 ? (
            <>
              {console.log(
                "🎯 Passing to AuctionGrid:",
                activeAuctions.map((a) => ({
                  id: a.auctionId,
                  nftId: a.nftId,
                  name: a.nftName,
                  image: a.nftImage,
                  category: a.nftCategory,
                  status: a.status,
                }))
              )}
              <AuctionGrid
                auctions={activeAuctions}
                onRefresh={refetch}
                refreshAuctionCache={refreshAuctionCache}
              />
            </>
          ) : (
            <motion.div
              className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-6xl mb-4">⏰</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No Active Auctions
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Check back soon for new exciting auctions!
              </p>
            </motion.div>
          )}
        </motion.section>

        {/* Ended Auctions Section */}
        <motion.section
          className="mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <SectionHeader
            title="Completed Auctions"
            count={endedAuctions.length}
            icon="✅"
          />

          {endedAuctions.length > 0 ? (
            <AuctionGrid
              auctions={endedAuctions}
              showEndedState={true}
              onRefresh={refetch}
            />
          ) : (
            <motion.div
              className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-6xl mb-4">📜</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No Completed Auctions
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Auction history will appear here
              </p>
            </motion.div>
          )}
        </motion.section>

        <AuctionTypeGuide />
      </div>
    </div>
  );
}
