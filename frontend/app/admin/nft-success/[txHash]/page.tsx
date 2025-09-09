"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

interface NFTCreationData {
  id: string;
  nftName: string;
  nftDescription: string;
  nftImage: string;
  tokenId: string;
  transactionHash: string;
  creationDate: string;
  auctionId: string;
  status: string;
  ipfsHash: string;
}

export default function NFTSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const [creationData, setCreationData] = useState<NFTCreationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const txHash = params.txHash as string;

  useEffect(() => {
    const loadCreationData = () => {
      try {
        const data = localStorage.getItem(`nft_creation_${txHash}`);
        if (data) {
          const parsedData = JSON.parse(data);
          setCreationData(parsedData);
        } else {
          setError("Creation data not found");
        }
      } catch (err) {
        setError("Failed to load creation data");
      } finally {
        setIsLoading(false);
      }
    };

    loadCreationData();
  }, [txHash]);

  const handleViewAuction = () => {
    router.push("/auctions");
  };

  const handleCreateAnother = () => {
    router.push("/admin/nft-creator");
  };

  const handleViewOnEtherscan = () => {
    window.open(`https://sepolia.etherscan.io/tx/${txHash}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !creationData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || "Creation data not found"}
          </p>
          <button
            onClick={() => router.push("/admin/nft-creator")}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Creator
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🎉 Success!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Your NFT and auction have been created successfully
          </p>
        </motion.div>

        {/* NFT Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-6">
            {/* NFT Image */}
            <div className="flex-shrink-0">
              <img
                src={creationData.nftImage}
                alt={creationData.nftName}
                className="w-64 h-64 object-cover rounded-lg"
              />
            </div>

            {/* NFT Details */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {creationData.nftName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {creationData.nftDescription}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Token ID</label>
                  <p className="text-gray-900 dark:text-white font-mono">{creationData.tokenId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Auction ID</label>
                  <p className="text-gray-900 dark:text-white font-mono">{creationData.auctionId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <p className="text-green-600 dark:text-green-400 font-medium capitalize">{creationData.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(creationData.creationDate).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Transaction Hash */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Transaction Hash</label>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-gray-900 dark:text-white font-mono text-sm break-all">
                    {creationData.transactionHash}
                  </p>
                  <button
                    onClick={handleViewOnEtherscan}
                    className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                    title="View on Etherscan"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={handleViewAuction}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            View Auction
          </button>
          <button
            onClick={handleCreateAnother}
            className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Create Another NFT
          </button>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
            What's Next?
          </h3>
          <ul className="text-blue-700 dark:text-blue-400 space-y-2">
            <li>• Your NFT is now live and available for bidding</li>
            <li>• Users can place bids on your auction</li>
            <li>• You'll receive notifications when someone bids</li>
            <li>• The highest bidder will win your NFT when the auction ends</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
