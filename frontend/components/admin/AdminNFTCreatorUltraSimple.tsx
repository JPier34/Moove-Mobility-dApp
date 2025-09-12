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

  // STATI DI VALIDAZIONE
  const [nftValidated, setNftValidated] = React.useState(false);
  const [auctionValidated, setAuctionValidated] = React.useState(false);
  const [priceErrors, setPriceErrors] = React.useState<string[]>([]);

  // FUNZIONI DI VALIDAZIONE
  const validateNFT = React.useCallback(() => {
    const isValid =
      nftName.length >= 3 && nftDescription.length >= 10 && nftImage !== null;
    setNftValidated(isValid);
    return isValid;
  }, [nftName, nftDescription, nftImage]);

  const validatePriceConcordance = React.useCallback(() => {
    const errors: string[] = [];
    const startPriceNum = parseFloat(startPrice) || 0;
    const reservePriceNum = parseFloat(reservePrice) || 0;
    const buyNowPriceNum = parseFloat(buyNowPrice) || 0;
    const bidIncrementNum = parseFloat(bidIncrement) || 0;

    // Controlli comuni
    if (startPriceNum <= 0) {
      errors.push("Start Price must be greater than 0");
    }

    // Controlli specifici per tipo auction
    switch (auctionType) {
      case AuctionType.ENGLISH:
        if (reservePrice && reservePriceNum > startPriceNum) {
          errors.push(
            "Reserve Price cannot be higher than Start Price for English auctions"
          );
        }
        if (buyNowPrice && buyNowPriceNum <= startPriceNum) {
          errors.push("Buy Now Price must be higher than Start Price");
        }
        break;

      case AuctionType.DUTCH:
        if (!bidIncrement || bidIncrementNum <= 0) {
          errors.push(
            "Price Decrease Rate is required and must be greater than 0 for Dutch auctions"
          );
        }
        if (reservePrice && reservePriceNum >= startPriceNum) {
          errors.push(
            "Reserve Price must be lower than Start Price for Dutch auctions"
          );
        }
        if (bidIncrementNum >= startPriceNum) {
          errors.push(
            "Price Decrease Rate cannot be equal or higher than Start Price"
          );
        }
        break;

      case AuctionType.SEALED_BID:
        if (bidIncrement && bidIncrementNum > startPriceNum) {
          errors.push("Minimum Bid cannot be higher than Start Price");
        }
        break;

      case AuctionType.RESERVE:
        if (reservePrice && reservePriceNum > startPriceNum) {
          errors.push(
            "Reserve Price should not exceed Start Price for Reserve auctions"
          );
        }
        break;
    }

    setPriceErrors(errors);
    const isValid = errors.length === 0;
    setAuctionValidated(isValid);
    return isValid;
  }, [auctionType, startPrice, reservePrice, buyNowPrice, bidIncrement]);

  // Auto-validazione quando cambiano i valori
  React.useEffect(() => {
    validateNFT();
  }, [validateNFT]);

  React.useEffect(() => {
    validatePriceConcordance();
  }, [validatePriceConcordance]);

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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  NFT Details
                </h2>
                <div className="flex items-center space-x-2">
                  {nftValidated ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      ✅ NFT Validated
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                      ⏳ Validation Pending
                    </span>
                  )}
                  <button
                    onClick={() => validateNFT()}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                  >
                    Check NFT
                  </button>
                </div>
              </div>
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Auction Details
                </h2>
                <div className="flex items-center space-x-2">
                  {auctionValidated ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      ✅ Prices Valid
                    </span>
                  ) : priceErrors.length > 0 ? (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      ❌ Price Errors
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                      ⏳ Checking Prices
                    </span>
                  )}
                  <button
                    onClick={() => validatePriceConcordance()}
                    className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors"
                  >
                    Check Prices
                  </button>
                </div>
              </div>

              {/* Price Errors Display */}
              {priceErrors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-red-800 mb-2">
                    💰 Price Validation Errors:
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {priceErrors.map((error, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-1">•</span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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
                  !nftValidated ||
                  !auctionValidated ||
                  !startPrice ||
                  !duration ||
                  priceErrors.length > 0
                }
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {!nftValidated
                  ? "⏳ Validate NFT First"
                  : !auctionValidated || priceErrors.length > 0
                  ? "⏳ Fix Price Errors"
                  : !startPrice || !duration
                  ? "⏳ Complete Required Fields"
                  : "✅ Create NFT & Auction"}
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
                  <strong>NFT Validation:</strong>{" "}
                  {nftValidated ? "✅ Valid" : "❌ Invalid"}
                </p>
                <p>
                  <strong>Price Validation:</strong>{" "}
                  {auctionValidated
                    ? "✅ Valid"
                    : priceErrors.length > 0
                    ? "❌ Errors"
                    : "⏳ Pending"}
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
                <p>
                  <strong>Ready to Submit:</strong>{" "}
                  {nftValidated &&
                  auctionValidated &&
                  startPrice &&
                  duration &&
                  priceErrors.length === 0
                    ? "✅ Yes"
                    : "❌ No"}
                </p>
                {priceErrors.length > 0 && (
                  <p className="text-red-600 text-xs">
                    <strong>⚠️ {priceErrors.length} price error(s)</strong> -
                    Check above for details
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
