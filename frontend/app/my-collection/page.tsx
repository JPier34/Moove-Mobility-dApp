"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSuperOptimizedNFTCollection } from "@/hooks/useSuperOptimizedNFTCollection";
import { useWonAuctions } from "@/hooks/useWonAuctions";
import { useMultipleNFTHistory } from "@/hooks/useNFTHistory";
import { useAccount } from "wagmi";
// Removed wallet debug - using Wagmi's built-in persistence
import { toast } from "react-hot-toast";
import OptimizedNFTImage from "@/components/collection/OptimizedNFTImage";
import TransferNFTModalV2 from "@/components/TransferNFTModalV2";
import CacheStats from "@/components/CacheStats";
import { nftEvents, NFTTransferEvent } from "@/utils/nftEvents";
import { WonAuction } from "@/types/user";
import { useNFTTransferNotifications } from "@/providers/NFTTransferNotificationsProvider";

// ============= TEST COMPONENT =============
function TestNotificationButton() {
  const { testReceivedNotification, createReceivedNotification } =
    useNFTTransferNotifications();

  return (
    <div className="text-center mb-8 space-x-4">
      <button
        onClick={testReceivedNotification}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
      >
        Test Received Notification
      </button>
      <button
        onClick={() =>
          createReceivedNotification(
            "36",
            "Ragdoll",
            "0x2425504422239c4e407fe37d367c290ea1858f4fa536956f2b176ce56439f8b5",
            "0xa70e3fA6D66Ec3aa94de67C10c5Ddbeea9bF44A6"
          )
        }
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
      >
        Test NFT #36 Notification
      </button>
    </div>
  );
}

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
  };
}

interface NFTDetailsModalProps {
  nft: DecorativeNFT | null;
  isOpen: boolean;
  onClose: () => void;
  onTransferNFT?: (nft: DecorativeNFT) => void;
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

function NFTDetailsModal({
  nft,
  isOpen,
  onClose,
  onTransferNFT,
}: NFTDetailsModalProps) {
  if (!nft || !isOpen) return null;

  const rarityConfig = RARITY_CONFIG[nft.rarity];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              NFT Details:
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Image - Takes more space */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-center items-center aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                <OptimizedNFTImage
                  src={nft.image}
                  alt={nft.name}
                  containerClassName="relative w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 overflow-hidden"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Rarity Badge */}
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {rarityConfig.emoji} {nft.rarity.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {nft.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {nft.description}
                </p>
              </div>

              {/* Properties */}
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">
                    Token ID
                  </span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white">
                    #{nft.tokenId}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">
                    Purchase Date
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(nft.purchaseDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">
                    Final Bid
                  </span>
                  <span className="font-bold text-moove-primary">
                    {nft.price} ETH
                  </span>
                </div>
              </div>

              {/* Auction Info */}
              {nft.auctionWon && (
                <div className="bg-gradient-to-r from-moove-primary/10 to-moove-secondary/10 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Auction Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Auction ID
                      </span>
                      <span className="font-mono">
                        #{nft.auctionWon.auctionId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Total Bidders
                      </span>
                      <span>{nft.auctionWon.bidders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Status
                      </span>
                      <span className="font-medium text-green-600">✅ Won</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 
           
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Transaction Hash
                </h4>
                <p className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
                  {nft.transactionHash}
                </p>
              </div>  */}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex space-x-3">
            <button
              onClick={() => onTransferNFT?.(nft)}
              className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors"
            >
              Transfer NFT
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-moove-primary hover:bg-moove-primary/90 text-white font-medium rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

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
    <motion.div
      className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Stats */}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <span className="text-2xl mr-3">📊</span>
            Collection Overview
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <motion.div
              className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl"
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.totalItems}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Total Items
              </div>
            </motion.div>
            <motion.div
              className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl"
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.totalValue.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Total Value (ETH)
              </div>
            </motion.div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <span className="text-2xl mr-3">🔍</span>
            Filter Collection
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
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
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium"
              >
                <option value="all">All Rarities</option>
                <option value="common">⚪ Common</option>
                <option value="rare">🔵 Rare</option>
                <option value="epic">🟣 Epic</option>
                <option value="legendary">🟡 Legendary</option>
              </select>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
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
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium"
              >
                <option value="all">All Categories</option>
                <option value="sticker">🏷️ Stickers</option>
                <option value="avatar">👤 Avatars</option>
                <option value="badge">🏆 Badges</option>
                <option value="skin">🎨 Skins</option>
              </select>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
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
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 font-medium"
              >
                <option value="all">All Prices</option>
                <option value="low">💰 Low (&lt; 0.01 ETH)</option>
                <option value="medium">💎 Medium (0.01 - 0.1 ETH)</option>
                <option value="high">👑 High (&gt; 0.1 ETH)</option>
              </select>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DecorativeNFTCard({
  nft,
  onViewDetails,
}: {
  nft: DecorativeNFT;
  onViewDetails: (nft: DecorativeNFT) => void;
}) {
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
            <div />
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
              {nft.price} ETH
            </div>
          </div>
          {/* {nft.auctionWon && (
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Bidders
              </div>
              <div className="text-lg font-bold text-moove-secondary">
                {nft.auctionWon.bidders}
              </div>
            </div>
          )} */}
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
            {nft.transactionHash && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Transaction Hash:
                </div>
                <div className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">
                  {nft.transactionHash.slice(0, 10)}...
                  {nft.transactionHash.slice(-8)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => onViewDetails(nft)}
            className="flex-1 bg-moove-primary hover:bg-moove-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            View Details
          </button>
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
          href="/auctions"
          className="inline-flex items-center px-6 py-3 bg-moove-primary hover:bg-moove-primary/90 text-white font-medium rounded-lg transition-colors"
        >
          Browse Auctions
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
  const { address, isConnected } = useAccount();

  // Removed wallet debug - using Wagmi's built-in persistence

  // Use won auctions hook for real auction data
  const {
    allWonAuctions,
    isLoading: isLoadingAuctions,
    error: auctionError,
    refetch: refetchAuctions,
  } = useWonAuctions();

  // Debug: Log auction data
  console.log("🔍 DEBUG: useWonAuctions result:", {
    allWonAuctions,
    isLoadingAuctions,
    auctionError,
    allWonAuctionsLength: allWonAuctions?.length || 0,
  });

  // User's NFT collection (optimized with Wagmi + TanStack Query)
  const {
    userNFTs: userNFTCollection,
    isLoading: userNFTsLoading,
    error: userNFTsError,
    refetch: refetchUserNFTs,
    totalItems,
    totalValue,
    cacheStats,
  } = useSuperOptimizedNFTCollection();

  // Get NFT history for all user NFTs - MEMOIZED to prevent recursive calls
  const tokenIds = useMemo(() => {
    return userNFTCollection?.map((nft) => nft.tokenId) || [];
  }, [userNFTCollection]);

  const { histories: nftHistories, isLoading: isLoadingHistories } =
    useMultipleNFTHistory(tokenIds);

  const [filters, setFilters] = useState<FilterOptions>({
    rarity: "all",
    category: "all",
    priceRange: "all",
  });

  // Stats are now calculated in the hook

  // Modal state
  const [selectedNFT, setSelectedNFT] = useState<DecorativeNFT | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Transfer modal state
  const [selectedTransferNFT, setSelectedTransferNFT] =
    useState<WonAuction | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Anti-loop mechanism
  const [isDataReady, setIsDataReady] = useState(false);
  const [displayTimeout, setDisplayTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const lastDataRef = useRef<string>("");
  const renderCountRef = useRef(0);
  const maxRendersRef = useRef(10); // Maximum number of renders before stopping

  // Simplified anti-loop mechanism
  useEffect(() => {
    renderCountRef.current += 1;

    // If we've exceeded max renders, stop the loop immediately
    if (renderCountRef.current > maxRendersRef.current) {
      console.warn("🛑 Maximum render count exceeded, stopping loop");
      setIsDataReady(true);
      return;
    }

    // Simple timeout to stabilize data
    const timeout = setTimeout(() => {
      console.log("✅ Data ready, showing collection");
      setIsDataReady(true);
    }, 2000); // 2 second delay for stability

    return () => {
      clearTimeout(timeout);
    };
  }, [userNFTCollection?.length, userNFTsLoading]); // Simplified dependencies

  // Reset render count when data changes significantly
  useEffect(() => {
    if ((userNFTCollection?.length || 0) === 0 && !userNFTsLoading) {
      renderCountRef.current = 0;
    }
  }, [userNFTCollection?.length, userNFTsLoading]);

  // NO NFT TRANSFER LISTENERS HERE - Handled by NFTTransferNotificationsProvider
  // This prevents duplicate event handling and recursive calls

  // Handler functions
  const handleViewDetails = useCallback((nft: DecorativeNFT) => {
    setSelectedNFT(nft);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedNFT(null);
  }, []);

  // Transfer handler functions
  const handleTransferNFT = useCallback((nft: DecorativeNFT) => {
    // Convert DecorativeNFT to WonAuction for the transfer modal
    const wonAuction: WonAuction = {
      auctionId: nft.auctionWon?.auctionId || nft.id,
      nftId: nft.tokenId,
      name: nft.name,
      image: nft.image,
      category: nft.category,
      finalBid: nft.price,
      bidders: nft.auctionWon?.bidders || 0,
      endTime: nft.purchaseDate.getTime(),
      transactionHash: nft.transactionHash,
      status: 4, // SETTLED
      isSettled: true,
      hasImage: true,
      hasName: true,
      // Legacy fields for compatibility
      nftName: nft.name,
      nftImage: nft.image,
      isClaimed: true,
    };

    setSelectedTransferNFT(wonAuction);
    setIsTransferModalOpen(true);
  }, []);

  const handleCloseTransferModal = useCallback(() => {
    setIsTransferModalOpen(false);
    setSelectedTransferNFT(null);
  }, []);

  const handleTransferSuccess = useCallback(() => {
    // Refresh the collection after successful transfer
    refetchUserNFTs();
    toast.success("NFT transferred successfully!");
  }, [refetchUserNFTs]);

  // Convert user NFT collection to decorative NFTs format using real auction data
  const decorativeNFTs: DecorativeNFT[] = useMemo(() => {
    console.log("🔍 DEBUG: allWonAuctions data:", allWonAuctions);
    console.log("🔍 DEBUG: userNFTCollection data:", userNFTCollection);

    return userNFTCollection.map((nft) => {
      // Find matching auction data from allWonAuctions
      const matchingAuction = allWonAuctions.find(
        (auction) => auction.nftId === nft.tokenId
      );

      // Get NFT history
      const nftHistory = nftHistories.get(nft.tokenId);

      console.log(
        `🔍 DEBUG: NFT #${nft.tokenId} matching auction:`,
        matchingAuction
      );
      console.log(`🔍 DEBUG: NFT #${nft.tokenId} history:`, nftHistory);

      // Determine purchase date and transaction hash from history
      let purchaseDate = new Date();
      let transactionHash = "";

      if (matchingAuction?.endTime) {
        // NFT won from auction
        purchaseDate = new Date(matchingAuction.endTime);
        transactionHash = matchingAuction.transactionHash || "";
      } else if (nftHistory) {
        // Use history to determine when NFT was acquired
        const lastTransfer = nftHistory.history[nftHistory.history.length - 1];
        if (lastTransfer) {
          purchaseDate = new Date(lastTransfer.timestamp * 1000);
          transactionHash = lastTransfer.transactionHash;
        }
      }

      return {
        id: `nft-${nft.tokenId}`,
        tokenId: nft.tokenId,
        name: nft.name,
        description: nft.description,
        image: nft.image,
        category: nft.category as "sticker" | "avatar" | "badge" | "skin",
        rarity: "common", // Default rarity, can be enhanced later
        purchaseDate,
        price: matchingAuction?.finalBid || 0.001, // Default price if no auction
        transactionHash,
        auctionWon: matchingAuction
          ? {
              auctionId: matchingAuction.auctionId,
              finalBid: matchingAuction.finalBid,
              bidders: matchingAuction.bidders,
            }
          : undefined, // No auction info if NFT wasn't won from auction
      };
    });
  }, [userNFTCollection, allWonAuctions, nftHistories]);

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
  if (
    !isConnected ||
    userNFTsLoading ||
    isLoadingAuctions ||
    isLoadingHistories
  ) {
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
              Fetching your NFT collection and verifying ownership...
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40 dark:opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 via-purple-100/20 to-pink-100/20 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-pink-900/10"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="text-center m-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My
            </span>{" "}
            Collection
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Your exclusive NFT collection from auction wins. Discover unique
            stickers, badges, skins and avatars you've collected.
          </p>

          {/* Collection Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <motion.div
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
              whileHover={{
                y: -5,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className="text-3xl font-bold text-blue-600 mb-2"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {totalItems}
              </motion.div>
              <div className="text-gray-600 dark:text-gray-300">
                🎨 Total NFTs
              </div>
            </motion.div>

            <motion.div
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
              whileHover={{
                y: -5,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-3xl font-bold text-green-600 mb-2">
                {totalValue.toFixed(2)}
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                💰 Total Value (ETH)
              </div>
            </motion.div>

            <motion.div
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
              whileHover={{
                y: -5,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {
                  filteredDecorative.filter((nft) => nft.rarity === "legendary")
                    .length
                }
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                👑 Legendary
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Test Notification Button - Temporary */}
        <TestNotificationButton />

        {/* Won Auctions Section */}
        {userNFTsLoading || isLoadingAuctions || isLoadingHistories ? (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <div className="flex items-center justify-center">
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  Loading NFT collection and verifying ownership...
                </div>
              </div>
            </div>
          </motion.div>
        ) : userNFTCollection.filter(
            (nft) => nft.isFromAuction && nft.status === "3"
          ).length > 0 ? (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 mb-6">
              <div className="flex items-center mb-4">
                <div className="text-2xl mr-3">🏆</div>
                <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200">
                  Auctions to Claim
                </h2>
              </div>
              <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                You have won{" "}
                {
                  userNFTCollection.filter(
                    (nft) => nft.isFromAuction && nft.status === "3"
                  ).length
                }{" "}
                auction
                {userNFTCollection.filter(
                  (nft) => nft.isFromAuction && nft.status === "3"
                ).length > 1
                  ? "e"
                  : ""}{" "}
                that need to be claimed.
              </p>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">
                Use the notification bell in the top-right corner to claim your
                auctions.
              </div>
            </div>
          </motion.div>
        ) : null}

        {/* Filters */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          stats={{ totalItems, totalValue }}
        />

        {/* Error State */}
        {userNFTsError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <span className="text-red-700 dark:text-red-400">
                Error loading collection: {userNFTsError}
              </span>
              <button
                onClick={refetchUserNFTs}
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
                <DecorativeNFTCard
                  key={nft.id}
                  nft={nft}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <EmptyState onRefresh={refetchUserNFTs} />
        )}

        {/* NFT Details Modal */}
        <NFTDetailsModal
          nft={selectedNFT}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onTransferNFT={handleTransferNFT}
        />

        {/* Transfer NFT Modal */}
        <TransferNFTModalV2
          nft={selectedTransferNFT}
          isOpen={isTransferModalOpen}
          onClose={handleCloseTransferModal}
          onSuccess={handleTransferSuccess}
        />

        {/* Cache Performance Stats */}
        {cacheStats && <CacheStats stats={cacheStats} />}

        {/* Congratulations Modal is now handled globally by AuctionNotificationsProvider */}
      </div>
    </div>
  );
}
