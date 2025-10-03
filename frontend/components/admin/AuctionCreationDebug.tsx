"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface CreationData {
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

export default function AuctionCreationDebug() {
  const [creationData, setCreationData] = useState<CreationData[]>([]);
  const [selectedData, setSelectedData] = useState<CreationData | null>(null);

  useEffect(() => {
    // Load all creation data from localStorage
    const loadCreationData = () => {
      const data: CreationData[] = [];

      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("nft_creation_")) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const parsed = JSON.parse(item);
              data.push(parsed);
            }
          } catch (error) {
            console.error("Error parsing creation data:", error);
          }
        }
      });

      // Sort by creation date (newest first)
      data.sort(
        (a, b) =>
          new Date(b.creationDate).getTime() -
          new Date(a.creationDate).getTime()
      );
      setCreationData(data);
    };

    loadCreationData();

    // Listen for new creations
    const handleStorageChange = () => {
      loadCreationData();
    };

    window.addEventListener("storage", handleStorageChange);

    // Also check periodically for new data
    const interval = setInterval(loadCreationData, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getAuctionTypeName = (auctionId: string) => {
    // This would need to be fetched from the contract
    return "Unknown";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        🔍 Auction Creation Debug
      </h2>

      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Visualizza tutti i dati delle aste create dall'admin panel
      </p>

      {creationData.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">📭</div>
          <p className="text-gray-600 dark:text-gray-400">
            Nessuna asta creata ancora
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {creationData.map((data) => (
            <motion.div
              key={data.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedData?.id === data.id
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
              onClick={() => setSelectedData(data)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
                    #{data.tokenId}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {data.nftName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Auction ID: {data.auctionId} • Created:{" "}
                      {formatDate(data.creationDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      data.status === "confirmed"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                    }`}
                  >
                    {data.status}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(data.transactionHash);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Copy transaction hash"
                  >
                    📋
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detailed View */}
      {selectedData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📊 Dettagli Asta #{selectedData.auctionId}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* NFT Data */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">
                NFT Data
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Token ID:
                  </span>
                  <span className="font-mono">{selectedData.tokenId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Name:
                  </span>
                  <span className="font-medium">{selectedData.nftName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Description:
                  </span>
                  <span className="text-right max-w-xs truncate">
                    {selectedData.nftDescription}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    IPFS Hash:
                  </span>
                  <span className="font-mono text-xs">
                    {selectedData.ipfsHash}
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction Data */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Transaction Data
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Auction ID:
                  </span>
                  <span className="font-mono">{selectedData.auctionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Status:
                  </span>
                  <span className="font-medium">{selectedData.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Created:
                  </span>
                  <span className="font-mono text-xs">
                    {formatDate(selectedData.creationDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    TX Hash:
                  </span>
                  <span className="font-mono text-xs">
                    {selectedData.transactionHash}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Image Preview */}
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Image Preview
            </h4>
            <div className="w-32 h-32 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <img
                src={selectedData.nftImage}
                alt={selectedData.nftName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove(
                    "hidden"
                  );
                }}
              />
              <div className="hidden w-full h-full bg-gray-100 dark:bg-gray-700 items-center justify-center text-gray-400">
                🖼️
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-4">
            <button
              onClick={() => copyToClipboard(selectedData.transactionHash)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              📋 Copy TX Hash
            </button>
            <button
              onClick={() =>
                window.open(
                  `https://sepolia.etherscan.io/tx/${selectedData.transactionHash}`,
                  "_blank"
                )
              }
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              🔍 View on Etherscan
            </button>
            <button
              onClick={() => setSelectedData(null)}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              ✕ Close
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
