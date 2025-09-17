"use client";

import React from "react";
import { useAccount } from "wagmi";
import { useUserRoles } from "@/hooks/useContract";
import { ErrorBoundary, useLastError } from "./ErrorBoundary";
import { useSecureNFTAuctionFlow } from "@/hooks/useSecureNFTAuction";
import { useRouter } from "next/navigation";
import { useIPFSUnified } from "@/hooks/useIPFSUnified";
import { useNFTValidationAPI } from "@/hooks/useNFTValidationAPI";
import { useWalletPersistence } from "@/hooks/useWalletPersistence";
import { useAuctionValidationModular } from "@/hooks/useAuctionValidationModular";
import { useAuctionFormValidation } from "@/hooks/useAuctionFormValidation";
import { AuctionType } from "@/types/auction";

function AdminNFTCreatorWorkingContent() {
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

  // All hooks AFTER early returns
  const {
    executeFlow: executeSecureFlow,
    isProcessing: isSecureProcessing,
    currentPhase: securePhase,
    result: secureResult,
    error: secureError,
  } = useSecureNFTAuctionFlow();

  const router = useRouter();
  const {
    uploadNFT,
    isUploading: isUploadingToIPFS,
    uploadProgress,
  } = useIPFSUnified();
  const { validateNFT, isValidating: isValidatingNFT } = useNFTValidationAPI();
  const { isConnected } = useWalletPersistence();

  // Simple, safe modular hooks
  const {
    formData: auctionFormData,
    isValid: isAuctionValid,
    updateField,
    validateForTransaction,
  } = useAuctionValidationModular();

  const { areRequiredFieldsFilled, getValidationSummary } =
    useAuctionFormValidation(auctionFormData);

  // NFT Form Data State
  const [nftData, setNftData] = React.useState({
    name: "",
    description: "",
    rarity: "COMMON" as const,
    image: null as File | null,
  });

  // Step management
  const [step, setStep] = React.useState<"nft" | "auction">("nft");

  // Validation
  const isNFTValid =
    nftData.name.length >= 3 &&
    nftData.description.length >= 10 &&
    nftData.image !== null;

  const handleCreateNFTAndAuction = async () => {
    if (!isNFTValid || !areRequiredFieldsFilled) {
      alert("Please fill all required fields");
      return;
    }

    try {
      // This is where you'd call your secure flow
      console.log("Creating NFT and Auction:", { nftData, auctionFormData });
      alert("NFT and Auction creation would happen here!");
    } catch (error) {
      console.error("Error creating NFT and auction:", error);
      alert("Error creating NFT and auction");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            🎯 Create NFT & Auction
          </h1>

          {/* Step Indicator */}
          <div className="flex items-center mb-8">
            <div
              className={`flex items-center ${
                step === "nft" ? "text-purple-600" : "text-green-600"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full ${
                  step === "nft" ? "bg-purple-600" : "bg-green-600"
                } text-white flex items-center justify-center text-sm font-bold`}
              >
                1
              </div>
              <span className="ml-2 font-medium">NFT Creation</span>
            </div>
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600 mx-4"></div>
            <div
              className={`flex items-center ${
                step === "auction" ? "text-purple-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full ${
                  step === "auction" ? "bg-purple-600" : "bg-gray-300"
                } text-white flex items-center justify-center text-sm font-bold`}
              >
                2
              </div>
              <span className="ml-2 font-medium">Auction Setup</span>
            </div>
          </div>

          {/* NFT Step */}
          {step === "nft" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    NFT Name *
                  </label>
                  <input
                    type="text"
                    value={nftData.name}
                    onChange={(e) =>
                      setNftData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter NFT name (min 3 chars)"
                  />
                  {nftData.name.length > 0 && nftData.name.length < 3 && (
                    <p className="text-red-500 text-xs mt-1">
                      Name must be at least 3 characters
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rarity
                  </label>
                  <select
                    value={nftData.rarity}
                    onChange={(e) =>
                      setNftData((prev) => ({
                        ...prev,
                        rarity: e.target.value as any,
                      }))
                    }
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={nftData.description}
                  onChange={(e) =>
                    setNftData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe your NFT (min 10 chars)"
                />
                {nftData.description.length > 0 &&
                  nftData.description.length < 10 && (
                    <p className="text-red-500 text-xs mt-1">
                      Description must be at least 10 characters
                    </p>
                  )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setNftData((prev) => ({
                      ...prev,
                      image: e.target.files?.[0] || null,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {nftData.image && (
                  <p className="text-green-500 text-xs mt-1">
                    ✅ Image selected: {nftData.image.name}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep("auction")}
                  disabled={!isNFTValid}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Next: Setup Auction →
                </button>
              </div>
            </div>
          )}

          {/* Auction Step */}
          {step === "auction" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Auction Type
                  </label>
                  <select
                    value={auctionFormData.auctionType}
                    onChange={(e) => updateField("auctionType", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={AuctionType.ENGLISH}>English Auction</option>
                    <option value={AuctionType.DUTCH}>Dutch Auction</option>
                    <option value={AuctionType.RESERVE}>Reserve Auction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Price (ETH) *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={auctionFormData.startPrice}
                    onChange={(e) => updateField("startPrice", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0.001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      min="1"
                      value={auctionFormData.duration}
                      onChange={(e) => updateField("duration", e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="24"
                    />
                    <select
                      value={auctionFormData.durationUnit}
                      onChange={(e) =>
                        updateField("durationUnit", e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="hours">Hours</option>
                      <option value="minutes">Minutes</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bid Increment (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={auctionFormData.bidIncrement}
                    onChange={(e) =>
                      updateField("bidIncrement", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0.0001"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep("nft")}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ← Back to NFT
                </button>
                <button
                  onClick={handleCreateNFTAndAuction}
                  disabled={!areRequiredFieldsFilled || !isNFTValid}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Create NFT & Auction
                </button>
              </div>
            </div>
          )}

          {/* Status Info */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
              📊 Status
            </h3>
            <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <p>
                <strong>Step:</strong>{" "}
                {step === "nft" ? "NFT Creation" : "Auction Setup"}
              </p>
              <p>
                <strong>NFT Ready:</strong> {isNFTValid ? "✅" : "❌"}
              </p>
              <p>
                <strong>Auction Valid:</strong>{" "}
                {areRequiredFieldsFilled ? "✅" : "❌"}
              </p>
              <p>
                <strong>Connected:</strong> {isConnected ? "✅" : "❌"}
              </p>
              <p>
                <strong>Can Create:</strong>{" "}
                {isNFTValid && areRequiredFieldsFilled ? "✅" : "❌"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminNFTCreatorWorking() {
  return (
    <ErrorBoundary>
      <AdminNFTCreatorWorkingContent />
    </ErrorBoundary>
  );
}




