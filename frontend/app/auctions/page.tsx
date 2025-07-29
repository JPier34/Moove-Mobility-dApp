"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AuctionFilters from "@/components/auctions/AuctionFilters";
import AuctionGrid from "@/components/auctions/AuctionGrid";
import { AuctionType, AuctionStatus, type Auction } from "@/types/auction";

// ============= TYPES =============
interface FilterOptions {
  status: "all" | "active" | "ended" | "revealing";
  type: "all" | "traditional" | "english" | "dutch" | "sealed";
  category: "all" | "bike" | "scooter" | "skateboard" | "moped";
  priceRange: "all" | "low" | "medium" | "high";
}

// ============= DATA =============
const MOCK_AUCTIONS: Auction[] = [
  {
    auctionId: "1",
    nftId: "1",
    nftName: "Sunset Rome Sticker",
    nftImage: "/api/placeholder/300/300",
    nftCategory: "sticker",
    seller: "0x1234567890abcdef1234567890abcdef12345678",
    auctionType: AuctionType.ENGLISH,
    status: AuctionStatus.ACTIVE,
    startPrice: "0.001",
    reservePrice: "0.0015",
    buyNowPrice: "0.003",
    currentBid: "0.0018",
    highestBidder: "0x9876543210fedcba9876543210fedcba98765432",
    bidCount: 5,
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 45 * 60 * 1000),
    bidIncrement: "0.0001",
    currency: "ETH",
    attributes: {
      rarity: "rare",
      designer: "ArtMoove",
      collection: "City Views",
      edition: "Limited",
      range: "",
      speed: "",
      battery: "",
      condition: "",
    },
  },
  {
    auctionId: "2",
    nftId: "2",
    nftName: "Neon Lightning Badge",
    nftImage: "/api/placeholder/300/300",
    nftCategory: "badge",
    seller: "0x5555555555555555555555555555555555555555",
    auctionType: AuctionType.DUTCH,
    status: AuctionStatus.ACTIVE,
    startPrice: "0.005",
    reservePrice: "0.001",
    buyNowPrice: null,
    currentBid: "0.003",
    highestBidder: null,
    bidCount: 0,
    startTime: new Date(Date.now() - 30 * 60 * 1000),
    endTime: new Date(Date.now() + 30 * 60 * 1000),
    bidIncrement: "0",
    currency: "ETH",
    attributes: {
      rarity: "epic",
      achievement: "Eco Warrior",
      requirement: "100kg CO₂ saved",
      holders: "47",
      range: "",
      speed: "",
      battery: "",
      condition: "",
    },
  },
  {
    auctionId: "3",
    nftId: "3",
    nftName: "Cyber Punk Vehicle Skin",
    nftImage: "/api/placeholder/300/300",
    nftCategory: "skin",
    seller: "0x7777777777777777777777777777777777777777",
    auctionType: AuctionType.TRADITIONAL,
    status: AuctionStatus.ACTIVE,
    startPrice: "0.002",
    reservePrice: "0.0025",
    buyNowPrice: "0.006",
    currentBid: "0.0032",
    highestBidder: "0x3333333333333333333333333333333333333333",
    bidCount: 8,
    startTime: new Date(Date.now() - 60 * 60 * 1000),
    endTime: new Date(Date.now() + 25 * 60 * 1000),
    bidIncrement: "0.0002",
    currency: "ETH",
    attributes: {
      rarity: "legendary",
      effects: "RGB Animation",
      compatibility: "All Vehicles",
      designer: "CyberDesign",
      range: "",
      speed: "",
      battery: "",
      condition: "",
    },
  },
  {
    auctionId: "4",
    nftId: "4",
    nftName: "Golden Moove Avatar",
    nftImage: "/api/placeholder/300/300",
    nftCategory: "avatar",
    seller: "0x9999999999999999999999999999999999999999",
    auctionType: AuctionType.SEALED_BID,
    status: AuctionStatus.REVEALING,
    startPrice: "0.0015",
    reservePrice: "0.002",
    buyNowPrice: null,
    currentBid: "???",
    highestBidder: "???",
    bidCount: 3,
    startTime: new Date(Date.now() - 25 * 60 * 1000),
    endTime: new Date(Date.now() + 5 * 60 * 1000),
    bidIncrement: "0.0001",
    currency: "ETH",
    attributes: {
      rarity: "legendary",
      special: "Animated",
      traits: "Golden Glow",
      supply: "1/1",
      range: "",
      speed: "",
      battery: "",
      condition: "",
    },
  },
  {
    auctionId: "5",
    nftId: "5",
    nftName: "Venice Sunset Sticker",
    nftImage: "/api/placeholder/300/300",
    nftCategory: "sticker",
    seller: "0x1111111111111111111111111111111111111111",
    auctionType: AuctionType.ENGLISH,
    status: AuctionStatus.ENDED,
    startPrice: "0.003",
    reservePrice: "0.004",
    buyNowPrice: "0.008",
    currentBid: "0.0055",
    highestBidder: "0x2222222222222222222222222222222222222222",
    bidCount: 12,
    startTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 30 * 60 * 1000),
    bidIncrement: "0.0002",
    currency: "ETH",
    attributes: {
      rarity: "rare",
      designer: "ItalianArt",
      collection: "Italian Cities",
      edition: "3/50",
      range: "",
      speed: "",
      battery: "",
      condition: "",
    },
  },
  {
    auctionId: "6",
    nftId: "6",
    nftName: "Mystery Eco Badge",
    nftImage: "/api/placeholder/300/300",
    nftCategory: "badge",
    seller: "0x8888888888888888888888888888888888888888",
    auctionType: AuctionType.SEALED_BID,
    status: AuctionStatus.ACTIVE,
    startPrice: "0.002",
    reservePrice: "0.003",
    buyNowPrice: null,
    currentBid: "???",
    highestBidder: null,
    bidCount: 1,
    startTime: new Date(Date.now() - 10 * 60 * 1000),
    endTime: new Date(Date.now() + 20 * 60 * 1000),
    bidIncrement: "0.0001",
    currency: "ETH",
    attributes: {
      rarity: "epic",
      mystery: "Unknown Power",
      unlocks: "Special Features",
      community: "Green Warriors",
      range: "",
      speed: "",
      battery: "",
      condition: "",
    },
  },
];

const AUCTION_TYPE_CONFIG = {
  [AuctionType.TRADITIONAL]: {
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
      className="text-center mb-16"
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
            {stats.totalVolume} ETH
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
            value={filters.priceRange}
            onChange={(e) =>
              onFilterChange({ ...filters, priceRange: e.target.value as any })
            }
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
  const [filters, setFilters] = useState<FilterOptions>({
    status: "all",
    type: "all",
    category: "all",
    priceRange: "all",
  });

  // Filter auctions based on current filters
  const filteredAuctions = MOCK_AUCTIONS.filter((auction) => {
    if (
      filters.status !== "all" &&
      String(auction.status).toLowerCase() !== filters.status
    )
      return false;
    if (
      filters.type !== "all" &&
      String(auction.auctionType).toLowerCase() !== filters.type
    )
      return false;
    if (filters.category !== "all" && auction.nftCategory !== filters.category)
      return false;

    // Price range filtering
    if (filters.priceRange !== "all") {
      const price = parseFloat(
        auction.currentBid === "???" ? auction.startPrice : auction.currentBid
      );
      if (filters.priceRange === "low" && price >= 0.001) return false;
      if (filters.priceRange === "medium" && (price < 0.001 || price > 0.005))
        return false;
      if (filters.priceRange === "high" && price <= 0.005) return false;
    }

    return true;
  });

  const activeAuctions = filteredAuctions.filter(
    (a) => a.status === AuctionStatus.ACTIVE
  );
  const endedAuctions = filteredAuctions.filter(
    (a) => a.status === AuctionStatus.ENDED
  );
  const revealingAuctions = filteredAuctions.filter(
    (a) => a.status === AuctionStatus.REVEALING
  );

  // Calculate stats
  const stats = {
    activeAuctions: MOCK_AUCTIONS.filter(
      (a) => a.status === AuctionStatus.ACTIVE
    ).length,
    totalBids: MOCK_AUCTIONS.reduce(
      (sum, auction) => sum + auction.bidCount,
      0
    ),
    endedAuctions: MOCK_AUCTIONS.filter((a) => a.status === AuctionStatus.ENDED)
      .length,
    totalVolume: "0.0287",
  };

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
            <AuctionGrid auctions={activeAuctions} />
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

        {/* Revealing Auctions Section */}
        {revealingAuctions.length > 0 && (
          <motion.section
            className="mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <SectionHeader
              title="Revealing Bids"
              count={revealingAuctions.length}
              icon="🔍"
            />
            <AuctionGrid auctions={revealingAuctions} />
          </motion.section>
        )}

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
            <AuctionGrid auctions={endedAuctions} showEndedState={true} />
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
