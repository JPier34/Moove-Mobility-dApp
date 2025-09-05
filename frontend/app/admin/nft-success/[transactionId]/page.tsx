"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { CurrencyConverter } from "@/utils/currencyConverter";

// ============= TYPES =============
interface NFTCreationDetails {
  id: string;
  nftName: string;
  nftDescription: string;
  nftImage: string;
  tokenId: string;
  transactionHash: string;
  creationDate: Date;
  price: number;
  gasFee?: number;
  totalCost?: number;
  auctionCreated: boolean;
  auctionType?: string;
  auctionId?: string;
  status: "confirmed" | "pending" | "failed" | "loading" | "unknown";
  ipfsHash?: string;
}

// ============= COMPONENTS =============

function SuccessAnimation() {
  return (
    <motion.div
      className="text-center mb-12"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.2,
      }}
    >
      <motion.div
        className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mb-6 shadow-2xl"
        animate={{
          rotate: [0, 10, -10, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        <motion.span
          className="text-6xl"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          🎨
        </motion.span>
      </motion.div>

      <motion.h1
        className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        NFT Created Successfully! 🎉
      </motion.h1>

      <motion.p
        className="text-xl text-gray-600 dark:text-gray-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        Your NFT has been minted and is ready for auction
      </motion.p>
    </motion.div>
  );
}

function PriceBreakdown({ nft }: { nft: NFTCreationDetails }) {
  const [eurTotal, setEurTotal] = useState<number | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const totalCost = nft.totalCost || nft.price + (nft.gasFee || 0);

  // Convert to EUR when component mounts or totalCost changes
  useEffect(() => {
    const convertToEur = async () => {
      setIsConverting(true);
      try {
        const eurAmount = await CurrencyConverter.convertEthToEur(totalCost);
        setEurTotal(eurAmount);
      } catch (error) {
        console.error("EUR conversion failed:", error);
        setEurTotal(null);
      } finally {
        setIsConverting(false);
      }
    };

    convertToEur();
  }, [totalCost]);

  return (
    <motion.div
      className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl p-6 mb-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.9 }}
    >
      <div className="text-center mb-6">
        <motion.div
          className="text-4xl mb-4"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          💰
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Creation Costs
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Total cost of NFT creation and auction setup
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">
              Minting Fee:
            </span>
            <span className="font-mono font-semibold text-gray-900 dark:text-white">
              {nft.price.toFixed(8)} ETH
            </span>
          </div>

          {nft.gasFee && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Gas Fee:</span>
              <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                {nft.gasFee.toFixed(8)} ETH
              </span>
            </div>
          )}

          <hr className="border-gray-200 dark:border-gray-600" />

          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900 dark:text-white">
              Total Cost:
            </span>
            <div className="text-right">
              <div className="font-mono font-bold text-lg text-gray-900 dark:text-white">
                {totalCost.toFixed(8)} ETH
              </div>
              <div className="text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                {isConverting ? (
                  <span className="animate-pulse">Converting...</span>
                ) : eurTotal ? (
                  `≈ €${eurTotal.toFixed(2)}`
                ) : (
                  <span className="text-gray-400">EUR unavailable</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function NFTCard({ nft }: { nft: NFTCreationDetails }) {
  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl mb-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <motion.div
            className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl mr-6 flex items-center justify-center text-3xl shadow-lg"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            🎨
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {nft.nftName}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Token ID: #{nft.tokenId}
            </p>
            {nft.ipfsHash && nft.ipfsHash !== "No IPFS hash" && (
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                IPFS: {String(nft.ipfsHash).substring(0, 20)}...
              </p>
            )}
          </div>
        </div>

        <motion.div
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            nft.status === "confirmed"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
          }`}
          whileHover={{ scale: 1.05 }}
        >
          {nft.status === "confirmed" ? "✅ Confirmed" : "⏳ Pending"}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Creation Date
            </h4>
            <p className="text-gray-900 dark:text-white">
              {nft.creationDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Description
            </h4>
            <p className="text-gray-900 dark:text-white text-sm">
              {nft.nftDescription}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Transaction Hash
            </h4>
            <div className="flex items-center gap-2">
              <p className="text-gray-900 dark:text-white font-mono text-sm">
                {nft.transactionHash.substring(0, 10)}...
                {nft.transactionHash.substring(56)}
              </p>
              <motion.button
                className="text-blue-500 hover:text-blue-600"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() =>
                  navigator.clipboard.writeText(nft.transactionHash)
                }
                title="Copy transaction hash"
              >
                📋
              </motion.button>
              <motion.a
                href={`https://sepolia.etherscan.io/tx/${nft.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="View on Etherscan"
              >
                🔗
              </motion.a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AuctionStatus({ nft }: { nft: NFTCreationDetails }) {
  return (
    <motion.div
      className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-3xl p-8 mb-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.0 }}
    >
      <div className="text-center mb-8">
        <motion.div
          className="text-4xl mb-4"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {nft.auctionCreated ? "🏆" : "⏳"}
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {nft.auctionCreated ? "Auction Created!" : "Auction Pending"}
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          {nft.auctionCreated
            ? "Your NFT is now live in the auction marketplace"
            : "Your NFT has been minted and is ready for auction setup"}
        </p>
      </div>

      {nft.auctionCreated && nft.auctionType && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Auction Type
              </h4>
              <p className="text-gray-900 dark:text-white font-semibold">
                {nft.auctionType}
              </p>
            </div>
            {nft.auctionId && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Auction ID
                </h4>
                <p className="text-gray-900 dark:text-white font-mono text-sm">
                  #{nft.auctionId}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ActionButtons({ nft }: { nft: NFTCreationDetails }) {
  return (
    <motion.div
      className="flex flex-col sm:flex-row gap-4 justify-center"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.2 }}
    >
      <Link href="/auctions">
        <motion.button
          className="bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="flex items-center">
            🏆 View Auctions
            <motion.span
              className="ml-2"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </span>
        </motion.button>
      </Link>

      <Link href="/admin">
        <motion.button
          className="bg-white dark:bg-gray-800 border-2 border-purple-500 text-purple-600 dark:text-purple-400 font-semibold py-4 px-8 rounded-2xl hover:bg-purple-50 dark:hover:bg-gray-700 transition-all duration-300"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          🎨 Create Another NFT
        </motion.button>
      </Link>
    </motion.div>
  );
}

// ============= MAIN COMPONENT =============
export default function NFTSuccessPage() {
  const params = useParams();
  const transactionId = params?.transactionId as string;
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get NFT creation data from localStorage (set during creation)
  const getDefaultNFTCreationData = (): NFTCreationDetails => {
    return {
      id: `nft_${Date.now()}`,
      nftName: "Loading...",
      nftDescription: "Loading NFT data...",
      nftImage: "/images/default-nft.png",
      tokenId: "0",
      transactionHash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      creationDate: new Date(),
      price: 0,
      gasFee: 0,
      totalCost: 0,
      auctionCreated: false,
      status: "loading",
      ipfsHash: "Loading...",
    };
  };

  const getNFTCreationData = (): NFTCreationDetails => {
    // Check if we're on the client side
    if (!isClient) {
      return getDefaultNFTCreationData();
    }

    // Try to get from localStorage first
    const storedData = localStorage.getItem(`nft_creation_${transactionId}`);
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        return {
          ...parsed,
          creationDate: new Date(parsed.creationDate),
        };
      } catch (e) {
        console.error("Error parsing stored NFT creation data:", e);
      }
    }

    // No fallback data - return empty state
    return {
      id: transactionId,
      nftName: "Unknown NFT",
      nftDescription: "NFT data not found",
      nftImage: "",
      tokenId: "0",
      transactionHash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      creationDate: new Date(),
      price: 0,
      gasFee: 0,
      totalCost: 0,
      auctionCreated: false,
      auctionType: "Unknown",
      auctionId: "0",
      status: "unknown",
      ipfsHash: "",
    };
  };

  const nftData = getNFTCreationData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-900/20">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <SuccessAnimation />

        <NFTCard nft={nftData} />

        <PriceBreakdown nft={nftData} />

        <AuctionStatus nft={nftData} />

        <ActionButtons nft={nftData} />

        {/* Success Tips */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              💡 Next Steps
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center">
                <span className="mr-2">🏆</span>
                Monitor auction progress
              </div>
              <div className="flex items-center">
                <span className="mr-2">📊</span>
                Track bidding activity
              </div>
              <div className="flex items-center">
                <span className="mr-2">💰</span>
                Collect proceeds when sold
              </div>
              <div className="flex items-center">
                <span className="mr-2">🎨</span>
                Create more NFTs
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
