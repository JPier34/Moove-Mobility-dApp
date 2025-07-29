"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ============= TYPES =============
interface RentalPass {
  id: string;
  tokenId: string;
  vehicleType: "bike" | "scooter" | "monopattino";
  purchaseDate: Date;
  expiryDate: Date;
  status: "active" | "expired" | "used";
  cityId: string;
  cityName: string;
  price: number;
  transactionHash: string;
  usageStats: {
    totalRides: number;
    totalDistance: number;
    totalTime: number;
    lastUsed?: Date;
  };
}

interface DecorativeNFT {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  image: string;
  category: "sticker" | "avatar" | "badge" | "skin";
  rarity: "common" | "rare" | "epic" | "legendary";
  purchaseDate: Date;
  price: number;
  transactionHash: string;
  auctionWon?: {
    auctionId: string;
    finalBid: number;
    bidders: number;
  };
}

interface FilterOptions {
  type: "all" | "rentals" | "decoratives";
  status: "all" | "active" | "expired";
  vehicleType: "all" | "bike" | "scooter" | "monopattino";
  rarity: "all" | "common" | "rare" | "epic" | "legendary";
}

// ============= DATA =============
const VEHICLE_CONFIG = {
  bike: {
    name: "E-Bike Pass",
    icon: "🚲",
    gradient: "from-green-400 to-emerald-600",
  },
  scooter: {
    name: "E-Scooter Pass",
    icon: "🛴",
    gradient: "from-blue-400 to-indigo-600",
  },
  monopattino: {
    name: "Monopattino Pass",
    icon: "🛵",
    gradient: "from-purple-400 to-pink-600",
  },
};

const RARITY_CONFIG = {
  common: { color: "gray", emoji: "⚪", gradient: "from-gray-400 to-gray-600" },
  rare: { color: "blue", emoji: "🔵", gradient: "from-blue-400 to-blue-600" },
  epic: {
    color: "purple",
    emoji: "🟣",
    gradient: "from-purple-400 to-purple-600",
  },
  legendary: {
    color: "yellow",
    emoji: "🟡",
    gradient: "from-yellow-400 to-orange-600",
  },
};

// Mock data - rental passes
const mockRentalPasses: RentalPass[] = [
  {
    id: "1",
    tokenId: "1001",
    vehicleType: "bike",
    purchaseDate: new Date("2024-01-15"),
    expiryDate: new Date("2024-02-15"),
    status: "active",
    cityId: "rome",
    cityName: "Rome",
    price: 27,
    transactionHash: "0x123...",
    usageStats: {
      totalRides: 15,
      totalDistance: 87.5,
      totalTime: 12.3,
      lastUsed: new Date("2024-01-28"),
    },
  },
  {
    id: "2",
    tokenId: "1002",
    vehicleType: "scooter",
    purchaseDate: new Date("2024-01-10"),
    expiryDate: new Date("2024-01-25"),
    status: "expired",
    cityId: "milan",
    cityName: "Milan",
    price: 37,
    transactionHash: "0x456...",
    usageStats: {
      totalRides: 8,
      totalDistance: 45.2,
      totalTime: 6.7,
      lastUsed: new Date("2024-01-24"),
    },
  },
];

// Mock data - decorative NFTs
const mockDecorativeNFTs: DecorativeNFT[] = [
  {
    id: "d1",
    tokenId: "2001",
    name: "Sunset Rome Sticker",
    description:
      "Beautiful sunset view of the Colosseum with vibrant orange and pink gradients",
    image: "/images/stickers/sunset-rome.png",
    category: "sticker",
    rarity: "rare",
    purchaseDate: new Date("2024-01-20"),
    price: 15,
    transactionHash: "0x789...",
    auctionWon: {
      auctionId: "auction_001",
      finalBid: 15,
      bidders: 8,
    },
  },
  {
    id: "d2",
    tokenId: "2002",
    name: "Electric Lightning Badge",
    description:
      "Exclusive achievement badge for eco-warriors who saved 100kg+ CO₂",
    image: "/images/badges/eco-warrior.png",
    category: "badge",
    rarity: "epic",
    purchaseDate: new Date("2024-01-18"),
    price: 45,
    transactionHash: "0xabc...",
    auctionWon: {
      auctionId: "auction_002",
      finalBid: 45,
      bidders: 15,
    },
  },
  {
    id: "d3",
    tokenId: "2003",
    name: "Neon Cyber Skin",
    description: "Futuristic neon-lit vehicle skin with animated RGB effects",
    image: "/images/skins/neon-cyber.png",
    category: "skin",
    rarity: "legendary",
    purchaseDate: new Date("2024-01-22"),
    price: 120,
    transactionHash: "0xdef...",
    auctionWon: {
      auctionId: "auction_003",
      finalBid: 120,
      bidders: 23,
    },
  },
];

// ============= COMPONENTS =============

function CollectionHeader({ stats }: { stats: any }) {
  return (
    <motion.div
      className="text-center mb-16"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
        My{" "}
        <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Collection
        </span>
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
        Manage your rental passes, showcase your decorative NFTs, and track your
        achievements
      </p>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          whileHover={{
            y: -5,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          <div className="text-3xl font-bold text-green-600 mb-2">
            {stats.totalRentals}
          </div>
          <div className="text-gray-600 dark:text-gray-300">Rental Passes</div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          whileHover={{
            y: -5,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {stats.totalDecorative}
          </div>
          <div className="text-gray-600 dark:text-gray-300">
            Decorative NFTs
          </div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          whileHover={{
            y: -5,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {stats.auctionsWon}
          </div>
          <div className="text-gray-600 dark:text-gray-300">Auctions Won</div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          whileHover={{
            y: -5,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          <div className="text-3xl font-bold text-orange-600 mb-2">
            €{stats.totalValue}
          </div>
          <div className="text-gray-600 dark:text-gray-300">Total Value</div>
        </motion.div>
      </div>
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
        {/* Collection Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Collection Type
          </label>
          <select
            value={filters.type}
            onChange={(e) =>
              onFilterChange({ ...filters, type: e.target.value as any })
            }
            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Items</option>
            <option value="rentals">🎫 Rental Passes</option>
            <option value="decoratives">🎨 Decorative NFTs</option>
          </select>
        </div>

        {/* Status Filter (for rentals) */}
        {(filters.type === "all" || filters.type === "rentals") && (
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
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        )}

        {/* Vehicle Type Filter (for rentals) */}
        {(filters.type === "all" || filters.type === "rentals") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vehicle Type
            </label>
            <select
              value={filters.vehicleType}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  vehicleType: e.target.value as any,
                })
              }
              className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Vehicles</option>
              <option value="bike">🚲 E-Bikes</option>
              <option value="scooter">🛴 E-Scooters</option>
              <option value="monopattino">🛵 Monopattinos</option>
            </select>
          </div>
        )}

        {/* Rarity Filter (for decoratives) */}
        {(filters.type === "all" || filters.type === "decoratives") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rarity
            </label>
            <select
              value={filters.rarity}
              onChange={(e) =>
                onFilterChange({ ...filters, rarity: e.target.value as any })
              }
              className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Rarities</option>
              <option value="common">⚪ Common</option>
              <option value="rare">🔵 Rare</option>
              <option value="epic">🟣 Epic</option>
              <option value="legendary">🟡 Legendary</option>
            </select>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function RentalPassCard({
  pass,
  onGenerateCode,
}: {
  pass: RentalPass;
  onGenerateCode: (passId: string) => void;
}) {
  const config = VEHICLE_CONFIG[pass.vehicleType];
  const isActive = pass.status === "active";
  const daysLeft = Math.ceil(
    (pass.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      className={`bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden ${
        !isActive ? "opacity-75" : ""
      }`}
    >
      {/* Header with Badge */}
      <div
        className={`bg-gradient-to-r ${config.gradient} p-6 text-white relative overflow-hidden`}
      >
        <div className="absolute top-2 right-2">
          <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
            🎫 RENTAL
          </span>
        </div>

        <div className="relative z-10 flex items-center">
          <motion.div
            className="text-4xl mr-4"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {config.icon}
          </motion.div>
          <div>
            <h3 className="text-xl font-bold">{config.name}</h3>
            <p className="text-white/80">Token #{pass.tokenId}</p>
          </div>
        </div>

        <div className="mt-4">
          <motion.div
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              isActive
                ? "bg-green-500/20 text-green-100 border border-green-400/30"
                : "bg-red-500/20 text-red-100 border border-red-400/30"
            }`}
            whileHover={{ scale: 1.05 }}
          >
            {isActive ? `${daysLeft} days left` : "Expired"}
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">City</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {pass.cityName}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Price Paid
            </p>
            <p className="font-semibold text-gray-900 dark:text-white">
              €{pass.price}
            </p>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {pass.usageStats.totalRides}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Rides
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {pass.usageStats.totalDistance}km
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Distance
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">
                {pass.usageStats.totalTime}h
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Time
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <motion.button
          onClick={() => onGenerateCode(pass.id)}
          disabled={!isActive}
          className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
            isActive
              ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg hover:shadow-xl`
              : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          }`}
          whileHover={isActive ? { scale: 1.02 } : {}}
          whileTap={isActive ? { scale: 0.98 } : {}}
        >
          {isActive ? "🔐 Generate Code" : "❌ Expired"}
        </motion.button>
      </div>
    </motion.div>
  );
}

function DecorativeNFTCard({ nft }: { nft: DecorativeNFT }) {
  const rarityConfig = RARITY_CONFIG[nft.rarity];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5, rotateY: 5 }}
      className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group perspective-1000"
    >
      {/* Header with Rarity */}
      <div
        className={`bg-gradient-to-r ${rarityConfig.gradient} p-4 text-white relative overflow-hidden`}
      >
        <div className="flex items-center justify-between">
          <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
            🎨 NFT
          </span>
          <motion.div
            className="flex items-center space-x-1"
            whileHover={{ scale: 1.1 }}
          >
            <span className="text-lg">{rarityConfig.emoji}</span>
            <span className="text-xs font-medium uppercase">{nft.rarity}</span>
          </motion.div>
        </div>
      </div>

      {/* Image/Preview */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Placeholder for actual NFT image */}
          <div className="w-32 h-32 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl border border-white/20 flex items-center justify-center">
            <motion.div
              className="text-4xl"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {nft.category === "sticker"
                ? "🏷️"
                : nft.category === "badge"
                ? "🏆"
                : nft.category === "skin"
                ? "🎨"
                : "👤"}
            </motion.div>
          </div>
        </div>

        {/* Auction Won Badge */}
        {nft.auctionWon && (
          <div className="absolute top-4 left-4">
            <motion.div
              className="bg-yellow-500 text-yellow-900 px-2 py-1 rounded-lg text-xs font-bold shadow-lg"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🏆 AUCTION WON
            </motion.div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all duration-300">
          {nft.name}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {nft.description}
        </p>

        {/* Auction Details */}
        {nft.auctionWon && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-yellow-700 dark:text-yellow-300">
                Final Bid:
              </span>
              <span className="font-bold text-yellow-800 dark:text-yellow-200">
                €{nft.auctionWon.finalBid}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              <span>Outbid {nft.auctionWon.bidders - 1} other bidders</span>
              <span>🎯</span>
            </div>
          </div>
        )}

        {/* Purchase Info */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span>Acquired: {nft.purchaseDate.toLocaleDateString()}</span>
          <span>#{nft.tokenId}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <motion.button
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            👁️ View Details
          </motion.button>

          <motion.button
            onClick={() =>
              window.open(`https://opensea.io/assets/${nft.tokenId}`, "_blank")
            }
            className="bg-blue-500 text-white py-2 px-4 rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            🔗 OpenSea
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ type }: { type: "all" | "rentals" | "decoratives" }) {
  const content = {
    all: {
      emoji: "🎫",
      title: "No Items Yet",
      description:
        "Start your collection by purchasing rental passes or bidding on decorative NFTs",
      buttons: [
        { text: "🛒 Browse Marketplace", href: "/marketplace" },
        { text: "🎨 Check Auctions", href: "/auctions" },
      ],
    },
    rentals: {
      emoji: "🚲",
      title: "No Rental Passes",
      description:
        "Purchase your first access pass to start your sustainable mobility journey",
      buttons: [{ text: "🛒 Browse Rental Passes", href: "/marketplace" }],
    },
    decoratives: {
      emoji: "🎨",
      title: "No Decorative NFTs",
      description:
        "Participate in auctions to win unique stickers, badges, and skins",
      buttons: [{ text: "🎨 Browse Auctions", href: "/auctions" }],
    },
  };

  const config = content[type];

  return (
    <motion.div
      className="text-center py-20"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="text-8xl mb-6"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, -5, 5, 0],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {config.emoji}
      </motion.div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {config.title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
        {config.description}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {config.buttons.map((button, index) => (
          <Link key={index} href={button.href}>
            <motion.button
              className={`font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${
                index === 0
                  ? "bg-gradient-to-r from-green-500 to-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 border-2 border-green-500 text-green-600 dark:text-green-400"
              }`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {button.text}
            </motion.button>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

// Code Generation Modal (stesso del precedente)
function CodeGenerationModal({
  isOpen,
  onClose,
  passId,
  vehicleType,
}: {
  isOpen: boolean;
  onClose: () => void;
  passId: string;
  vehicleType: string;
}) {
  const [accessCode, setAccessCode] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const generateCode = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    setAccessCode(code);
    setExpiresAt(expires);
    setIsGenerating(false);
  };

  useEffect(() => {
    if (isOpen && !accessCode) {
      generateCode();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <motion.div
            className="text-6xl mb-4"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🔐
          </motion.div>

          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Code Generated
          </h3>

          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Use this code to unlock any compatible {vehicleType}
          </p>

          {isGenerating ? (
            <div className="flex items-center justify-center py-8">
              <motion.div
                className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <span className="ml-3 text-gray-600 dark:text-gray-300">
                Generating...
              </span>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 mb-6">
              <motion.div
                className="text-4xl font-mono font-bold text-blue-600 dark:text-blue-400 mb-2 tracking-wider"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                {accessCode}
              </motion.div>
              {expiresAt && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Expires at {expiresAt.toLocaleTimeString()}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <motion.button
              onClick={() => navigator.clipboard.writeText(accessCode)}
              disabled={!accessCode}
              className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              📋 Copy Code
            </motion.button>

            <motion.button
              onClick={onClose}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Close
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============= MAIN COMPONENT =============
export default function MyCollection() {
  const [rentalPasses] = useState<RentalPass[]>(mockRentalPasses);
  const [decorativeNFTs] = useState<DecorativeNFT[]>(mockDecorativeNFTs);
  const [filters, setFilters] = useState<FilterOptions>({
    type: "all",
    status: "all",
    vehicleType: "all",
    rarity: "all",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPassId, setSelectedPassId] = useState<string>("");

  // Filter items based on current filters
  const filteredRentals = rentalPasses.filter((pass) => {
    if (filters.status !== "all" && pass.status !== filters.status)
      return false;
    if (
      filters.vehicleType !== "all" &&
      pass.vehicleType !== filters.vehicleType
    )
      return false;
    return true;
  });

  const filteredDecorative = decorativeNFTs.filter((nft) => {
    if (filters.rarity !== "all" && nft.rarity !== filters.rarity) return false;
    return true;
  });

  // Combine and filter items based on type
  const getFilteredItems = () => {
    if (filters.type === "rentals")
      return { rentals: filteredRentals, decoratives: [] };
    if (filters.type === "decoratives")
      return { rentals: [], decoratives: filteredDecorative };
    return { rentals: filteredRentals, decoratives: filteredDecorative };
  };

  const { rentals, decoratives } = getFilteredItems();
  const hasItems = rentals.length > 0 || decoratives.length > 0;

  // Calculate stats
  const stats = {
    totalRentals: rentalPasses.length,
    totalDecorative: decorativeNFTs.length,
    auctionsWon: decorativeNFTs.filter((nft) => nft.auctionWon).length,
    totalValue:
      rentalPasses.reduce((sum, pass) => sum + pass.price, 0) +
      decorativeNFTs.reduce((sum, nft) => sum + nft.price, 0),
  };

  const handleGenerateCode = (passId: string) => {
    const pass = rentalPasses.find((p) => p.id === passId);
    if (pass && pass.status === "active") {
      setSelectedPassId(passId);
      setModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <CollectionHeader stats={stats} />

        {rentalPasses.length > 0 || decorativeNFTs.length > 0 ? (
          <>
            <FilterBar filters={filters} onFilterChange={setFilters} />

            <AnimatePresence mode="wait">
              {hasItems ? (
                <div className="space-y-12">
                  {/* Rental Passes Section */}
                  {rentals.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                    >
                      <div className="flex items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          🎫 Rental Passes
                        </h2>
                        <span className="ml-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                          {rentals.length} passes
                        </span>
                      </div>

                      <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        layout
                      >
                        {rentals.map((pass) => (
                          <RentalPassCard
                            key={pass.id}
                            pass={pass}
                            onGenerateCode={handleGenerateCode}
                          />
                        ))}
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Decorative NFTs Section */}
                  {decoratives.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <div className="flex items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          🎨 Decorative NFTs
                        </h2>
                        <span className="ml-3 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm font-medium">
                          {decoratives.length} NFTs
                        </span>
                        <span className="ml-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium">
                          {decoratives.filter((nft) => nft.auctionWon).length}{" "}
                          from auctions
                        </span>
                      </div>

                      <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        layout
                      >
                        {decoratives.map((nft) => (
                          <DecorativeNFTCard key={nft.id} nft={nft} />
                        ))}
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <motion.div
                  className="text-center py-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    No items match your filters
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Try adjusting your search criteria
                  </p>
                  <motion.button
                    onClick={() =>
                      setFilters({
                        type: "all",
                        status: "all",
                        vehicleType: "all",
                        rarity: "all",
                      })
                    }
                    className="bg-blue-500 text-white py-3 px-6 rounded-xl hover:bg-blue-600 transition-colors font-semibold"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Clear All Filters
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <EmptyState type={filters.type} />
        )}

        {/* Achievement Showcase */}
        {decorativeNFTs.some((nft) => nft.auctionWon) && (
          <motion.div
            className="mt-20 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-3xl p-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="text-center">
              <motion.div
                className="text-6xl mb-4"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                🏆
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Auction Champion
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                You've won {stats.auctionsWon} auctions and earned exclusive
                NFTs worth €
                {decorativeNFTs
                  .filter((nft) => nft.auctionWon)
                  .reduce((sum, nft) => sum + nft.price, 0)}
              </p>

              <div className="flex justify-center gap-4">
                <Link href="/auctions">
                  <motion.button
                    className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    🎨 Browse New Auctions
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Code Generation Modal */}
      <AnimatePresence>
        {modalOpen && (
          <CodeGenerationModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            passId={selectedPassId}
            vehicleType={
              rentalPasses.find((p) => p.id === selectedPassId)?.vehicleType ||
              ""
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}
