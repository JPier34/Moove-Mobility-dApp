"use client";

import React from "react";
import { useAccount } from "wagmi";
import { useUserRoles } from "@/hooks/useContract";
import { ErrorBoundary, useLastError } from "./ErrorBoundary";
import { useRouter } from "next/navigation";
import { AuctionType } from "@/types/auction";

function AdminNFTCreatorUltraSimpleContent() {
  const { address } = useAccount();
  const { canMint, isMasterAdmin, isLoading } = useUserRoles(address);
  const { error: lastError, clearError } = useLastError();

  // Master admin wallet - always has access
  const MASTER_WALLET = "0x777382955f33Bb8540602E914D9b650C962EF6Cc";
  const isMasterWallet = address?.toLowerCase() === MASTER_WALLET.toLowerCase();
  const hasAdminAccess = isMasterWallet || canMint || isMasterAdmin;

  // ALL EARLY RETURNS BEFORE ANY OTHER HOOKS
  if (lastError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-red-900 dark:text-red-300 mb-4">
              🚨 Last Error Detected
            </h2>
            <p className="text-red-700 dark:text-red-400">
              {lastError.error.message}
            </p>
            <button
              onClick={clearError}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear Error
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  // HOOK ROUTER (STEP 1 EXPANSION)
  const router = useRouter();

  // STATI SEMPLICI (ESPANSIONE GRADUALE - STEP 2)
  const [nftName, setNftName] = React.useState("");
  const [nftDescription, setNftDescription] = React.useState("");
  const [nftRarity, setNftRarity] = React.useState("COMMON");
  const [nftImage, setNftImage] = React.useState<File | null>(null);
  const [auctionType, setAuctionType] = React.useState(AuctionType.ENGLISH);
  const [startPrice, setStartPrice] = React.useState("");
  const [duration, setDuration] = React.useState("");
  const [bidIncrement, setBidIncrement] = React.useState("");
  const [reservePrice, setReservePrice] = React.useState("");
  const [buyNowPrice, setBuyNowPrice] = React.useState("");

  const handleSubmit = () => {
    console.log("Creating NFT and Auction:", {
      // NFT Data
      nftName,
      nftDescription,
      nftRarity,
      nftImage: nftImage ? nftImage.name : null,
      // Auction Data
      auctionType,
      startPrice,
      duration: `${duration} hours`,
      bidIncrement,
      reservePrice,
      buyNowPrice,
    });
    alert(
      "NFT and Auction creation would happen here!\nCheck console for full data."
    );

    // TEST: Prova a navigare dopo 2 secondi
    setTimeout(() => {
      router.push("/auctions");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            🎯 Create NFT & Auction (Step by Step)
          </h1>

          <div className="space-y-6">
            {/* NFT Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                NFT Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    NFT Name
                  </label>
                  <input
                    type="text"
                    value={nftName}
                    onChange={(e) => setNftName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter NFT name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rarity
                  </label>
                  <select
                    value={nftRarity}
                    onChange={(e) => setNftRarity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="COMMON">Common</option>
                    <option value="UNCOMMON">Uncommon</option>
                    <option value="RARE">Rare</option>
                    <option value="EPIC">Epic</option>
                    <option value="LEGENDARY">Legendary</option>
                    <option value="MYTHIC">Mythic</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={nftDescription}
                    onChange={(e) => setNftDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNftImage(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {nftImage && (
                    <p className="text-green-500 text-xs mt-1">
                      ✅ {nftImage.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Auction Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Auction Details
              </h2>

              {/* Auction Type Info */}
              {auctionType !== AuctionType.ENGLISH && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {auctionType === AuctionType.DUTCH && (
                      <>
                        <strong>🔥 Dutch Auction:</strong> Price starts high and
                        decreases over time. First bidder wins at current price.
                        <span className="text-red-600 font-medium">
                          {" "}
                          Price Decrease Rate is required.
                        </span>
                      </>
                    )}
                    {auctionType === AuctionType.SEALED_BID && (
                      <>
                        <strong>🔒 Sealed Bid:</strong> Bidders submit hidden
                        bids. Highest bid wins after reveal phase.
                      </>
                    )}
                    {auctionType === AuctionType.RESERVE && (
                      <>
                        <strong>💎 Reserve Auction:</strong> Like English
                        auction but with a hidden minimum price (reserve).
                      </>
                    )}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Auction Type
                  </label>
                  <select
                    value={auctionType}
                    onChange={(e) =>
                      setAuctionType(Number(e.target.value) as AuctionType)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={AuctionType.ENGLISH}>
                      🔥 English Auction
                    </option>
                    <option value={AuctionType.DUTCH}>⬇️ Dutch Auction</option>
                    <option value={AuctionType.SEALED_BID}>
                      🔒 Sealed Bid Auction
                    </option>
                    <option value={AuctionType.RESERVE}>
                      💎 Reserve Auction
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Price (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={startPrice}
                    onChange={(e) => setStartPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0.001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="24"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum: 1 hour</p>
                </div>
              </div>

              {/* Advanced Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {auctionType === AuctionType.DUTCH
                      ? "Price Decrease Rate (ETH) *"
                      : auctionType === AuctionType.SEALED_BID
                      ? "Minimum Bid (ETH)"
                      : "Bid Increment (ETH)"}
                    {auctionType === AuctionType.DUTCH && (
                      <span className="text-red-500 ml-1">*Required</span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={bidIncrement}
                    onChange={(e) => setBidIncrement(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={
                      auctionType === AuctionType.DUTCH
                        ? "0.000001 (Required)"
                        : auctionType === AuctionType.SEALED_BID
                        ? "0.001 (Optional)"
                        : "0.0001 (Optional)"
                    }
                    required={auctionType === AuctionType.DUTCH}
                  />
                  {auctionType === AuctionType.SEALED_BID && (
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum bid amount for sealed bid auction
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reserve Price (ETH){" "}
                    <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={reservePrice}
                    onChange={(e) => setReservePrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0.001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Buy Now Price (ETH){" "}
                    <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={buyNowPrice}
                    onChange={(e) => setBuyNowPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <button
                onClick={handleSubmit}
                disabled={
                  !nftName ||
                  !nftDescription ||
                  !startPrice ||
                  !duration ||
                  (auctionType === AuctionType.DUTCH && !bidIncrement)
                }
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Create NFT & Auction
              </button>
            </div>

            {/* Status Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                📊 Status
              </h3>
              <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                <p>
                  <strong>Connected:</strong> {address ? "✅" : "❌"}
                </p>
                <p>
                  <strong>Can Mint:</strong> {canMint ? "✅" : "❌"}
                </p>
                <p>
                  <strong>Form Valid:</strong>{" "}
                  {nftName &&
                  nftDescription &&
                  startPrice &&
                  duration &&
                  (auctionType !== AuctionType.DUTCH || bidIncrement)
                    ? "✅"
                    : "❌"}
                </p>
                <p>
                  <strong>Auction Type:</strong>{" "}
                  {auctionType === AuctionType.ENGLISH
                    ? "🔥 English"
                    : auctionType === AuctionType.DUTCH
                    ? "⬇️ Dutch"
                    : auctionType === AuctionType.SEALED_BID
                    ? "🔒 Sealed Bid"
                    : auctionType === AuctionType.RESERVE
                    ? "💎 Reserve"
                    : "Unknown"}
                </p>
                {auctionType === AuctionType.DUTCH && !bidIncrement && (
                  <p className="text-red-600">
                    <strong>⚠️ Missing:</strong> Price Decrease Rate (required
                    for Dutch)
                  </p>
                )}
                <p>
                  <strong>Address:</strong> {address || "Not connected"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminNFTCreatorUltraSimple() {
  return (
    <ErrorBoundary>
      <AdminNFTCreatorUltraSimpleContent />
    </ErrorBoundary>
  );
}
