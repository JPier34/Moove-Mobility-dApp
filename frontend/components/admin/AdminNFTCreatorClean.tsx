"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { useSecureNFTAuctionFlow } from "@/hooks/useSecureNFTAuction";
import { useIPFSUnified } from "@/hooks/useIPFSUnified";
import { useNFTValidationAPI } from "@/hooks/useNFTValidationAPI";
import { useWalletPersistence } from "@/hooks/useWalletPersistence";
import { AuctionType } from "@/types/auction";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ethers } from "ethers";
import DynamicAuctionForm from "./DynamicAuctionForm";
import AuctionValidationModal from "./AuctionValidationModal";
import {
  useAuctionValidation,
  AuctionFormData,
} from "@/hooks/useAuctionValidation";
import { useUserRoles } from "@/hooks/useContract";

interface NFTFormData {
  name: string;
  description: string;
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC";
  image: File | null;
  isLimitedEdition: boolean;
  editionSize: string;
  editionName: string;
  customizationOptions: {
    allowColorChange: boolean;
    allowTextChange: boolean;
    allowSizeChange: boolean;
    allowEffectsChange: boolean;
    availableColors: string[];
    maxTextLength: string;
  };
}

export default function AdminNFTCreatorClean() {
  const { address } = useAccount();
  const { canMint, isMasterAdmin, isLoading } = useUserRoles(address);

  // Secure NFT-Auction flow hook
  const {
    executeFlow: executeSecureFlow,
    isProcessing: isSecureProcessing,
    currentPhase: securePhase,
    result: secureResult,
    error: secureError,
  } = useSecureNFTAuctionFlow();

  // Master admin wallet - always has access
  const MASTER_WALLET = "0x777382955f33Bb8540602E914D9b650C962EF6Cc";
  const isMasterWallet = address?.toLowerCase() === MASTER_WALLET.toLowerCase();
  const hasAdminAccess = isMasterWallet || canMint || isMasterAdmin;

  const router = useRouter();
  const {
    uploadNFT,
    isUploading: isUploadingToIPFS,
    uploadProgress,
  } = useIPFSUnified();
  const { validateNFT, isValidating: isValidatingNFT } = useNFTValidationAPI();
  const { isConnected } = useWalletPersistence();

  // Auction validation hook
  const { formData: auctionFormData, isValid: isAuctionValid } =
    useAuctionValidation();

  // State management
  const [step, setStep] = useState<"nft" | "auction">("nft");
  const [nftData, setNftData] = useState<NFTFormData>({
    name: "",
    description: "",
    rarity: "COMMON",
    image: null,
    isLimitedEdition: false,
    editionSize: "1",
    editionName: "",
    customizationOptions: {
      allowColorChange: false,
      allowTextChange: false,
      allowSizeChange: false,
      allowEffectsChange: false,
      availableColors: [],
      maxTextLength: "100",
    },
  });

  const [validationResult, setValidationResult] = useState<any>(null);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Access control
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

  // NFT validation handler
  const handleNFTValidation = async () => {
    if (!nftData.image) {
      toast.error("Please upload an image first");
      return;
    }

    try {
      const realTimeValidation = await validateNFT(
        nftData.name,
        nftData.description,
        nftData.image,
        nftData.rarity
      );

      if (!realTimeValidation.isValid) {
        setValidationResult(realTimeValidation);
        setShowFailureModal(true);
        return;
      }

      toast.success("NFT validation passed! Configure auction settings.");
      setStep("auction");
    } catch (error) {
      toast.error("Validation failed. Please try again.");
    }
  };

  // Secure creation handler
  const handleSecureCreation = async () => {
    if (!isConnected || !address) {
      toast.error("Wallet not connected. Please connect and try again.");
      return;
    }

    if (!isAuctionValid) {
      toast.error("Please fix auction validation errors before proceeding.");
      return;
    }

    try {
      // Upload image to IPFS
      if (!nftData.image) {
        toast.error("Please upload an image first");
        return;
      }

      const ipfsResult = await uploadNFT(nftData.image, {
        name: nftData.name,
        description: nftData.description,
        rarity: nftData.rarity,
        isLimitedEdition: nftData.isLimitedEdition,
        editionSize: parseInt(nftData.editionSize) || 1,
        editionNumber: 1,
        customizationOptions: {
          ...nftData.customizationOptions,
          maxTextLength:
            parseInt(nftData.customizationOptions.maxTextLength) || 100,
        },
        creator: address || "",
      });

      if (!ipfsResult.imageUrl) {
        toast.error("Failed to upload image to IPFS");
        return;
      }

      // Create NFT metadata
      const nftMetadata = {
        name: nftData.name,
        description: nftData.description,
        image: ipfsResult.imageUrl,
        external_url: `https://moove-mobility.com/nft/${Date.now()}`,
        attributes: [
          { trait_type: "Rarity", value: nftData.rarity },
          { trait_type: "Category", value: "VEHICLE_DECORATION" },
          { trait_type: "Designer", value: "Moove" },
          {
            trait_type: "Collection",
            value: nftData.isLimitedEdition ? nftData.editionName : "Genesis",
          },
          { trait_type: "Range", value: "100" },
          { trait_type: "Speed", value: "50" },
          { trait_type: "Battery", value: "80" },
          { trait_type: "Condition", value: "New" },
        ],
      };

      // Upload metadata to IPFS
      const metadataBlob = new Blob([JSON.stringify(nftMetadata, null, 2)], {
        type: "application/json",
      });

      const metadataFormData = new FormData();
      metadataFormData.append("file", metadataBlob, "metadata.json");

      const metadataResponse = await fetch("/api/upload-ipfs", {
        method: "POST",
        body: metadataFormData,
      });

      if (!metadataResponse.ok) {
        throw new Error("Failed to upload metadata to IPFS");
      }

      const metadataResult = await metadataResponse.json();
      const metadataUrl = `https://ipfs.io/ipfs/${metadataResult.IpfsHash}`;

      // Prepare mint parameters
      const mintParams = [
        address,
        metadataUrl,
        nftData.isLimitedEdition ? parseInt(nftData.editionSize) : 1,
      ];

      // Prepare auction parameters
      const durationInSeconds =
        auctionFormData.durationUnit === "minutes"
          ? parseInt(auctionFormData.duration) * 60
          : parseInt(auctionFormData.duration) * 3600;

      const auctionParams = {
        auctionType: auctionFormData.auctionType,
        startPrice: ethers.parseEther(auctionFormData.startPrice),
        reservePrice: auctionFormData.reservePrice
          ? ethers.parseEther(auctionFormData.reservePrice)
          : 0n,
        buyNowPrice: auctionFormData.buyNowPrice
          ? ethers.parseEther(auctionFormData.buyNowPrice)
          : 0n,
        duration: durationInSeconds,
        bidIncrement: ethers.parseEther(auctionFormData.bidIncrement),
      };

      // Execute secure flow
      await executeSecureFlow(mintParams, auctionParams);

      // Wait for processing to complete instead of fixed timeout
      console.log("⏳ Waiting for processing to complete...");
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max (50 * 100ms)

      while (isSecureProcessing && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
        console.log(`⏳ Processing check ${attempts}/${maxAttempts}...`);
      }

      console.log("📊 Secure flow result:", {
        secureResult,
        secureError,
        isSecureProcessing,
        attempts,
      });

      if (secureResult) {
        toast.success("NFT and auction created successfully!");

        // Clear cache
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("auction_")) {
            localStorage.removeItem(key);
          }
        });

        // Save creation data
        const nftCreationData = {
          id: `nft_${Date.now()}`,
          nftName: nftData.name,
          nftDescription: nftData.description,
          nftImage: ipfsResult.imageUrl,
          tokenId: secureResult.nft.tokenId.toString(),
          transactionHash: secureResult.nft.transactionHash,
          creationDate: new Date().toISOString(),
          auctionId: secureResult.auction.auctionId.toString(),
          status: "confirmed",
          ipfsHash: ipfsResult.imageUrl,
        };

        localStorage.setItem(
          `nft_creation_${secureResult.nft.transactionHash}`,
          JSON.stringify(nftCreationData)
        );

        // Navigate to success page
        router.push(`/admin/nft-success/${secureResult.nft.transactionHash}`);
      } else {
        toast.success("NFT and auction created! Check the auctions page.");
        setTimeout(() => {
          window.location.href = "/auctions";
        }, 2000);
      }
    } catch (error) {
      toast.error(
        `Creation failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const handleAuctionDataChange = (data: AuctionFormData) => {
    // Data is automatically managed by the hook
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create NFT & Auction
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create a new NFT and configure its auction settings
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div
              className={`flex items-center ${
                step === "nft" ? "text-purple-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "nft"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                1
              </div>
              <span className="ml-2 font-medium">NFT Details</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
            <div
              className={`flex items-center ${
                step === "auction" ? "text-purple-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "auction"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                2
              </div>
              <span className="ml-2 font-medium">Auction Settings</span>
            </div>
          </div>
        </div>

        {/* NFT Form Step */}
        {step === "nft" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              NFT Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* NFT Name */}
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500"
                  placeholder="Enter NFT name"
                />
              </div>

              {/* Rarity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rarity *
                </label>
                <select
                  value={nftData.rarity}
                  onChange={(e) =>
                    setNftData((prev) => ({
                      ...prev,
                      rarity: e.target.value as any,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500"
                >
                  <option value="COMMON">Common</option>
                  <option value="UNCOMMON">Uncommon</option>
                  <option value="RARE">Rare</option>
                  <option value="EPIC">Epic</option>
                  <option value="LEGENDARY">Legendary</option>
                  <option value="MYTHIC">Mythic</option>
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
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
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500"
                  placeholder="Enter NFT description"
                />
              </div>

              {/* Image Upload */}
              <div className="md:col-span-2">
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500"
                />
                {nftData.image && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(nftData.image)}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end mt-6">
              <button
                onClick={handleNFTValidation}
                disabled={
                  !nftData.name ||
                  !nftData.description ||
                  !nftData.image ||
                  isValidatingNFT
                }
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isValidatingNFT ? "Validating..." : "Validate & Continue"}
              </button>
            </div>
          </motion.div>
        )}

        {/* Auction Form Step */}
        {step === "auction" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <DynamicAuctionForm onDataChange={handleAuctionDataChange} />

            {/* Action Buttons */}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep("nft")}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Back to NFT
              </button>
              <button
                onClick={() => setShowValidationModal(true)}
                disabled={!isAuctionValid || isSecureProcessing}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSecureProcessing ? "Creating..." : "Create NFT & Auction"}
              </button>
            </div>
          </motion.div>
        )}

        {/* Processing Status */}
        {isSecureProcessing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Creating NFT & Auction
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {securePhase}
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full animate-pulse"
                    style={{ width: "60%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Validation Modal */}
        <AuctionValidationModal
          isOpen={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          onConfirm={handleSecureCreation}
          formData={auctionFormData}
          address={address || ""}
          isProcessing={isSecureProcessing}
        />

        {/* Failure Modal */}
        {showFailureModal && validationResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Validation Failed
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {validationResult.errors?.[0]?.message ||
                    "Unknown validation error"}
                </p>
                <button
                  onClick={() => setShowFailureModal(false)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
