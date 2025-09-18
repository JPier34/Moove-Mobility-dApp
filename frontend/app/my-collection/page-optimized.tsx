"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useUserCollectionOptimized } from "@/hooks/useUserCollectionOptimized";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import OptimizedNFTImage from "@/components/collection/OptimizedNFTImage";

// ============= TYPES =============
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
    isClaimed?: boolean;
  };
}

interface FilterOptions {
  rarity: "all" | "common" | "rare" | "epic" | "legendary";
  category: "all" | "sticker" | "avatar" | "badge" | "skin";
  priceRange: "all" | "low" | "medium" | "high";
}

// ============= DATA =============
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

// ============= COMPONENTS =============

function FilterBar({
  filters,
  onFilterChange,
  stats,
}: {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  stats: { totalItems: number; totalValue: number };
}) {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 mb-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Stats */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Collection Stats
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-moove-primary">
                {stats.totalItems}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Items
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-moove-secondary">
                {stats.totalValue.toFixed(2)} ETH
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Value
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Filters
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rarity
              </label>
              <select
                value={filters.rarity}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    rarity: e.target.value as FilterOptions["rarity"],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moove-primary focus:border-transparent"
              >
                <option value="all">All Rarities</option>
                <option value="common">⚪ Common</option>
                <option value="rare">🔵 Rare</option>
                <option value="epic">🟣 Epic</option>
                <option value="legendary">🟡 Legendary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    category: e.target.value as FilterOptions["category"],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moove-primary focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="sticker">🏷️ Stickers</option>
                <option value="avatar">👤 Avatars</option>
                <option value="badge">🏆 Badges</option>
                <option value="skin">🎨 Skins</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price Range
              </label>
              <select
                value={filters.priceRange}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    priceRange: e.target.value as FilterOptions["priceRange"],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moove-primary focus:border-transparent"
              >
                <option value="all">All Prices</option>
                <option value="low">💰 Low (&lt; 0.01 ETH)</option>
                <option value="medium">💎 Medium (0.01 - 0.1 ETH)</option>
                <option value="high">👑 High (&gt; 0.1 ETH)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DecorativeNFTCard({ nft }: { nft: DecorativeNFT }) {
  const rarityConfig = RARITY_CONFIG[nft.rarity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -5 }}
      className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full bg-gradient-to-r ${rarityConfig.gradient}`}
            />
            {/*             <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {nft.category.toUpperCase()}
            </span> */}
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-lg">{rarityConfig.emoji}</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {nft.rarity.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Image */}
      <OptimizedNFTImage
        src={nft.image}
        alt={nft.name}
        category={nft.category}
      />

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {nft.name}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          {nft.description}
        </p>

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Final Bid
            </div>
            <div className="text-lg font-bold text-moove-primary">
              {nft.price.toFixed(4)} ETH
            </div>
          </div>
          {nft.auctionWon && (
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Bidders
              </div>
              <div className="text-lg font-bold text-moove-secondary">
                {nft.auctionWon.bidders}
              </div>
            </div>
          )}
        </div>

        {/* Auction Info */}
        {nft.auctionWon && (
          <div className="bg-gradient-to-r from-moove-primary/10 to-moove-secondary/10 rounded-lg p-3 mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Won from Auction #{nft.auctionWon.auctionId}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {new Date(nft.purchaseDate).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <button className="flex-1 bg-moove-primary hover:bg-moove-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            View Details
          </button>
          {nft.auctionWon && !nft.auctionWon.isClaimed && (
            <button className="bg-moove-secondary hover:bg-moove-secondary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Claim
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-moove-primary/20 to-moove-secondary/20 rounded-full flex items-center justify-center">
        <span className="text-4xl">🎨</span>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        No NFTs Yet
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
        You haven't won any auctions yet. Check out the marketplace to find
        amazing NFTs to bid on!
      </p>
      <div className="space-x-4">
        <Link
          href="/marketplace"
          className="inline-flex items-center px-6 py-3 bg-moove-primary hover:bg-moove-primary/90 text-white font-medium rounded-lg transition-colors"
        >
          Browse Marketplace
        </Link>
        <button
          onClick={onRefresh}
          className="inline-flex items-center px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

// ============= MAIN COMPONENT =============
export default function MyCollection() {
  const { wonAuctions, isLoading, error, refetch, totalValue, totalItems } =
    useUserCollectionOptimized();
  const { isConnected, address } = useAccount();

  const [filters, setFilters] = useState<FilterOptions>({
    rarity: "all",
    category: "all",
    priceRange: "all",
  });

  // Convert won auctions to decorative NFTs format
  const decorativeNFTs: DecorativeNFT[] = useMemo(() => {
    return wonAuctions.map((auction) => ({
      id: `auction-${auction.auctionId}`,
      tokenId: auction.tokenId,
      name: auction.nftName,
      description: `Won from auction #${auction.auctionId}`,
      image: auction.nftImage,
      category: auction.nftCategory as "sticker" | "avatar" | "badge" | "skin",
      rarity:
        (auction.nftRarity?.toLowerCase() as
          | "common"
          | "rare"
          | "epic"
          | "legendary") || "common",
      purchaseDate: new Date(auction.endTime),
      price: auction.finalBid,
      transactionHash: auction.transactionHash || "",
      auctionWon: {
        auctionId: auction.auctionId,
        finalBid: auction.finalBid,
        bidders: auction.bidders,
        isClaimed: auction.isClaimed,
      },
    }));
  }, [wonAuctions]);

  // Filter items based on current filters
  const filteredDecorative = useMemo(() => {
    return decorativeNFTs.filter((nft) => {
      // Filter by rarity
      if (filters.rarity !== "all" && nft.rarity !== filters.rarity)
        return false;
      // Filter by category
      if (filters.category !== "all" && nft.category !== filters.category)
        return false;
      // Filter by price range
      if (filters.priceRange !== "all") {
        const price = nft.price;
        if (filters.priceRange === "low" && price >= 0.01) return false;
        if (filters.priceRange === "medium" && (price < 0.01 || price >= 0.1))
          return false;
        if (filters.priceRange === "high" && price < 0.1) return false;
      }
      return true;
    });
  }, [decorativeNFTs, filters.rarity, filters.category, filters.priceRange]);

  const hasItems = filteredDecorative.length > 0;

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-moove-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 bg-moove-primary rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Loading Collection...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Fetching your NFT collection
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show not connected state
  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-moove-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-moove-primary/20 to-moove-secondary/20 rounded-full flex items-center justify-center">
              <span className="text-4xl">🔌</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Wallet Not Connected
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Please connect your wallet to view your NFT collection.
            </p>
            <Link
              href="/marketplace"
              className="inline-flex items-center px-6 py-3 bg-moove-primary hover:bg-moove-primary/90 text-white font-medium rounded-lg transition-colors"
            >
              Connect Wallet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-moove-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            My Collection
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Your NFT collection and auction wins
          </p>
        </div>

        {/* Filters */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          stats={{ totalItems, totalValue }}
        />

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <span className="text-red-700 dark:text-red-400">
                Error loading collection: {error}
              </span>
              <button
                onClick={refetch}
                className="ml-auto text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {hasItems ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredDecorative.map((nft) => (
                <DecorativeNFTCard key={nft.id} nft={nft} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <EmptyState onRefresh={refetch} />
        )}
      </div>
    </div>
  );
}
