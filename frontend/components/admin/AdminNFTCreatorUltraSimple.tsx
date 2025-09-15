"use client";

import React, { useState, useMemo } from "react";
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
// import DynamicAuctionForm from "./DynamicAuctionForm"; // DISABLED: Uses old modular system
import AuctionValidationModal from "./AuctionValidationModal";
import {
  useAuctionValidationModular,
  AuctionFormData,
} from "@/hooks/useAuctionValidationModular";
import { useAuctionFormValidation } from "@/hooks/useAuctionFormValidation";
import { useUserRoles } from "@/hooks/useContract";
import { ErrorBoundary, useLastError } from "./ErrorBoundary";

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

function AdminNFTCreatorUltraSimpleContent() {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const { address } = useAccount();
  const { canMint, isMasterAdmin, isLoading } = useUserRoles(address);
  const { error: lastError, clearError } = useLastError();

  // Secure NFT-Auction flow hook
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

  // Auction validation hook (MODULAR)
  const {
    formData: auctionFormData,
    isValid: isAuctionValid,
    updateField,
    validateForTransaction,
  } = useAuctionValidationModular();

  // Form validation hook (MODULAR)
  const { areRequiredFieldsFilled } = useAuctionFormValidation(auctionFormData);

  // Auto-adjust prices when auction type changes
  const handleAuctionTypeChange = (newType: AuctionType) => {
    updateField("auctionType", newType);

    // Set appropriate default values based on auction type
    switch (newType) {
      case AuctionType.DUTCH:
        // Dutch auction: start high, end low
        updateField("startPrice", "0.01");
        updateField("reservePrice", "0.001");
        updateField("buyNowPrice", ""); // Not used in Dutch auctions
        updateField("bidIncrement", "0.001"); // Price decrease rate
        break;
      case AuctionType.ENGLISH:
        // English auction: start low, go high - NO reserve needed (start price is the minimum)
        updateField("startPrice", "0.001");
        updateField("reservePrice", ""); // Not used - start price is the minimum
        updateField("buyNowPrice", "0.01"); // Higher than start
        updateField("bidIncrement", "0.001");
        // Set extension defaults
        updateField("extensionThresholdMinutes", "5");
        updateField("extensionDurationMinutes", "10");
        break;
      case AuctionType.SEALED_BID:
        // Sealed bid: similar to English - NO reserve needed
        updateField("startPrice", "0.001");
        updateField("reservePrice", ""); // Not used - start price is the minimum
        updateField("buyNowPrice", ""); // Not typically used
        updateField("bidIncrement", "0"); // Sealed bid doesn't use bid increment
        break;
      case AuctionType.RESERVE:
        // Reserve auction: reserve required
        updateField("startPrice", "0.001");
        updateField("reservePrice", "0.005"); // Required, higher than start
        updateField("buyNowPrice", "0.01"); // Higher than reserve
        updateField("bidIncrement", "0.001");
        break;
    }
  };

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

  // Auction type info with emojis (consistent with AuctionCard.tsx)
  const auctionTypeInfo = {
    [AuctionType.RESERVE]: { emoji: "🏛️", name: "Reserve" },
    [AuctionType.ENGLISH]: { emoji: "⬆️", name: "English" },
    [AuctionType.DUTCH]: { emoji: "⬇️", name: "Dutch" },
    [AuctionType.SEALED_BID]: { emoji: "🔒", name: "Sealed Bid" },
  };

  // Price validation rules for each auction type
  const getPriceValidationErrors = useMemo(() => {
    const errors: string[] = [];
    const startPrice = parseFloat(auctionFormData.startPrice);
    const reservePrice = parseFloat(auctionFormData.reservePrice);
    const buyNowPrice = parseFloat(auctionFormData.buyNowPrice);
    const bidIncrement = parseFloat(auctionFormData.bidIncrement);

    // Skip validation if basic fields are empty
    // Note: bidIncrement is not required for Sealed Bid auctions
    const bidIncrementRequired =
      auctionFormData.auctionType !== AuctionType.SEALED_BID;
    if (
      !auctionFormData.startPrice ||
      (bidIncrementRequired && !auctionFormData.bidIncrement)
    ) {
      return errors;
    }

    // Basic validations for all auction types
    if (isNaN(startPrice) || startPrice <= 0) {
      errors.push("Start price must be a positive number");
    }
    // Bid increment validation (not required for Sealed Bid)
    if (auctionFormData.auctionType !== AuctionType.SEALED_BID) {
      if (isNaN(bidIncrement) || bidIncrement <= 0) {
        errors.push("Bid increment must be a positive number");
      }
    }

    // Auction type specific validations
    switch (auctionFormData.auctionType) {
      case AuctionType.DUTCH:
        // Dutch auction: price decreases from start to reserve
        if (auctionFormData.reservePrice && !isNaN(reservePrice)) {
          if (reservePrice >= startPrice) {
            errors.push(
              "Dutch auction: Reserve price must be LESS than start price (price decreases)"
            );
          }
        }
        // For Dutch auctions, buyNowPrice should equal reservePrice (final price)
        if (
          auctionFormData.buyNowPrice &&
          !isNaN(buyNowPrice) &&
          auctionFormData.reservePrice &&
          !isNaN(reservePrice)
        ) {
          if (Math.abs(buyNowPrice - reservePrice) > 0.000001) {
            errors.push(
              "Dutch auction: Buy Now price should equal Reserve price (final price)"
            );
          }
        }
        break;

      case AuctionType.ENGLISH:
        // English auction: start price IS the minimum, no reserve needed
        if (auctionFormData.buyNowPrice && !isNaN(buyNowPrice)) {
          if (buyNowPrice < startPrice) {
            errors.push(
              "English auction: Buy Now price must be GREATER than or equal to start price"
            );
          }
        }
        // Note: Reserve price not used in English auctions - start price is the minimum
        break;

      case AuctionType.SEALED_BID:
        // Sealed bid: start price IS the minimum, no reserve needed
        // Note: Reserve price not used in Sealed Bid auctions - start price is the minimum
        break;

      case AuctionType.RESERVE:
        // Reserve auction: reserve price is required and must be >= start price
        if (!auctionFormData.reservePrice || isNaN(reservePrice)) {
          errors.push("Reserve auction: Reserve price is REQUIRED");
        } else if (reservePrice < startPrice) {
          errors.push(
            "Reserve auction: Reserve price must be GREATER than or equal to start price"
          );
        }
        if (auctionFormData.buyNowPrice && !isNaN(buyNowPrice)) {
          if (buyNowPrice < Math.max(startPrice, reservePrice)) {
            errors.push(
              "Reserve auction: Buy Now price must be greater than reserve price"
            );
          }
        }
        break;
    }

    // Bid increment should be reasonable compared to start price
    if (
      auctionFormData.auctionType !== AuctionType.SEALED_BID &&
      !isNaN(startPrice) &&
      !isNaN(bidIncrement) &&
      bidIncrement > startPrice
    ) {
      errors.push(
        "Bid increment should not exceed start price (consider a smaller increment)"
      );
    }

    return errors;
  }, [auctionFormData]);

  // Check if auction form is valid (including price concordance)
  const isAuctionFormValid = useMemo(() => {
    return areRequiredFieldsFilled && getPriceValidationErrors.length === 0;
  }, [areRequiredFieldsFilled, getPriceValidationErrors]);

  // NFT Validation Logic
  const getNFTValidationErrors = useMemo(() => {
    const errors = {
      name: [] as string[],
      description: [] as string[],
      image: [] as string[],
    };

    // Name validation
    if (nftData.name) {
      const name = nftData.name.trim();
      if (name.length < 3) {
        errors.name.push("At least 3 characters");
      }
      if (name.length > 50) {
        errors.name.push("Maximum 50 characters");
      }
      const invalidChars = /[<>:"/\\|?*]/;
      if (invalidChars.test(name)) {
        errors.name.push("Invalid characters");
      }
    }

    // Description validation
    if (nftData.description) {
      const description = nftData.description.trim();
      if (description.length < 10) {
        errors.description.push("At least 10 characters");
      }
      if (description.length > 500) {
        errors.description.push("Maximum 500 characters");
      }
    }

    // Image validation
    if (nftData.image) {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(nftData.image.type)) {
        errors.image.push("Unsupported image type (PNG, JPG, GIF, WEBP)");
      }
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (nftData.image.size > maxSize) {
        errors.image.push("Image too large (max 10MB)");
      }
    }

    return errors;
  }, [nftData]);

  // Check if NFT form is valid
  const isNFTFormValid = useMemo(() => {
    const allErrors = [
      ...getNFTValidationErrors.name,
      ...getNFTValidationErrors.description,
      ...getNFTValidationErrors.image,
    ];
    return (
      allErrors.length === 0 &&
      nftData.name.trim().length >= 3 &&
      nftData.description.trim().length >= 10 &&
      nftData.image !== null
    );
  }, [getNFTValidationErrors, nftData]);

  // Master admin wallet - always has access
  const MASTER_WALLET = "0x777382955f33Bb8540602E914D9b650C962EF6Cc";
  const isMasterWallet = address?.toLowerCase() === MASTER_WALLET.toLowerCase();
  const hasAdminAccess = isMasterWallet || canMint || isMasterAdmin;

  // CONDITIONAL RETURNS AFTER ALL HOOKS
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

  // NFT validation handler
  const handleNFTValidation = async () => {
    if (!nftData.image) {
      toast.error("Please upload an image first.");
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

      // Clear validation result when NFT validation passes
      setValidationResult(null);
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
      console.log("📤 Uploading NFT metadata to IPFS:", nftMetadata);
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
        const errorText = await metadataResponse.text();
        console.error("❌ Metadata upload failed:", {
          status: metadataResponse.status,
          statusText: metadataResponse.statusText,
          error: errorText,
        });
        throw new Error(
          `Failed to upload metadata to IPFS: ${metadataResponse.status} - ${errorText}`
        );
      }

      const metadataResult = await metadataResponse.json();
      console.log("✅ Metadata upload result:", metadataResult);

      // Check for hash in different possible field names
      const ipfsHash =
        metadataResult.IpfsHash || metadataResult.hash || metadataResult.Hash;

      if (!ipfsHash) {
        console.error(
          "❌ No IPFS hash returned from metadata upload:",
          metadataResult
        );
        throw new Error("Invalid metadata upload response - no IPFS hash");
      }

      const metadataUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
      console.log("🔗 Final metadata URL:", metadataUrl);

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

      console.log("🎯 SecureResult received:", secureResult);

      if (secureResult) {
        console.log("✅ SecureResult is truthy, proceeding with success flow");
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

        const successUrl = `/admin/nft-success/${secureResult.nft.transactionHash}`;
        console.log("🎯 Navigating to success page:", successUrl);

        // Try router.push first, fallback to window.location
        try {
          router.push(successUrl);
          console.log("✅ Router.push executed successfully");
        } catch (error) {
          console.error("❌ Router.push failed, using window.location:", error);
          window.location.href = successUrl;
        }
      } else {
        console.log("❌ SecureResult is falsy, using fallback redirect");
        toast.success(
          "NFT and auction created! Redirecting to auctions page..."
        );
        setTimeout(() => {
          console.log("🎯 Executing fallback redirect to /auctions");
          router.push("/auctions");
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
            Create NFT & Auction (Ultra Simple)
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
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 ${
                    getNFTValidationErrors.name.length > 0
                      ? "border-red-500 dark:border-red-400"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Enter NFT name (min 3 chars)"
                />
                {getNFTValidationErrors.name.map((error, index) => (
                  <p key={index} className="text-red-500 text-xs mt-1">
                    {error}
                  </p>
                ))}
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
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 ${
                    getNFTValidationErrors.description.length > 0
                      ? "border-red-500 dark:border-red-400"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Enter NFT description (min 10 chars)"
                />
                <div className="flex justify-between items-center mt-1">
                  <div>
                    {getNFTValidationErrors.description.map((error, index) => (
                      <p key={index} className="text-red-500 text-xs">
                        {error}
                      </p>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    {nftData.description.length}/500
                  </span>
                </div>
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
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 ${
                    getNFTValidationErrors.image.length > 0
                      ? "border-red-500 dark:border-red-400"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {getNFTValidationErrors.image.map((error, index) => (
                  <p key={index} className="text-red-500 text-xs mt-1">
                    {error}
                  </p>
                ))}
                {nftData.image && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(nftData.image)}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Size: {(nftData.image.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end mt-6">
              <button
                onClick={handleNFTValidation}
                disabled={!isNFTFormValid || isValidatingNFT}
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Auction Settings
            </h2>

            <div className="space-y-6">
              {/* Auction Type and Start Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Auction Type *
                  </label>
                  <select
                    value={auctionFormData.auctionType}
                    onChange={(e) =>
                      handleAuctionTypeChange(
                        parseInt(e.target.value) as AuctionType
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500"
                  >
                    <option value={AuctionType.ENGLISH}>
                      {auctionTypeInfo[AuctionType.ENGLISH].emoji} English
                      Auction
                    </option>
                    <option value={AuctionType.DUTCH}>
                      {auctionTypeInfo[AuctionType.DUTCH].emoji} Dutch Auction
                    </option>
                    <option value={AuctionType.SEALED_BID}>
                      {auctionTypeInfo[AuctionType.SEALED_BID].emoji} Sealed Bid
                      Auction
                    </option>
                    <option value={AuctionType.RESERVE}>
                      {auctionTypeInfo[AuctionType.RESERVE].emoji} Reserve
                      Auction
                    </option>
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500"
                    placeholder="0.001"
                  />
                </div>
              </div>

              {/* Duration and Bid Increment */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={auctionFormData.duration}
                    onChange={(e) => updateField("duration", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500"
                    placeholder="24"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unit
                  </label>
                  <select
                    value={auctionFormData.durationUnit}
                    onChange={(e) =>
                      updateField("durationUnit", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500"
                  >
                    <option value="hours">Hours</option>
                    <option value="minutes">Minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {auctionFormData.auctionType === AuctionType.DUTCH
                      ? "Price Decrease Rate (ETH) *"
                      : "Bid Increment (ETH) *"}
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={auctionFormData.bidIncrement}
                    onChange={(e) =>
                      updateField("bidIncrement", e.target.value)
                    }
                    disabled={
                      auctionFormData.auctionType === AuctionType.SEALED_BID
                    }
                    className={`w-full px-4 py-2 border rounded-lg text-gray-900 dark:text-white focus:border-purple-500 ${
                      auctionFormData.auctionType === AuctionType.SEALED_BID
                        ? "bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600 cursor-not-allowed opacity-50"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder={
                      auctionFormData.auctionType === AuctionType.SEALED_BID
                        ? "Not applicable"
                        : "0.0001"
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {auctionFormData.auctionType === AuctionType.DUTCH &&
                      "🔻 How much price decreases every 20 minutes"}
                    {(auctionFormData.auctionType === AuctionType.ENGLISH ||
                      auctionFormData.auctionType === AuctionType.RESERVE) &&
                      "📈 Minimum amount each bid must increase"}
                  </p>
                  {auctionFormData.auctionType === AuctionType.SEALED_BID && (
                    <p className="text-xs text-orange-600 mt-1">
                      🔒 Sealed bid auctions don't use bid increments - bidders
                      submit any amount
                    </p>
                  )}
                </div>
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reserve Price - Only show for Dutch and Reserve auctions */}
                {(auctionFormData.auctionType === AuctionType.DUTCH ||
                  auctionFormData.auctionType === AuctionType.RESERVE) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reserve Price (ETH)
                      {auctionFormData.auctionType === AuctionType.RESERVE ? (
                        <span className="text-sm text-red-500 ml-1">
                          (Required)
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500 ml-1">
                          (Optional)
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={auctionFormData.reservePrice}
                      onChange={(e) =>
                        updateField("reservePrice", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500"
                      placeholder={
                        auctionFormData.auctionType === AuctionType.DUTCH
                          ? "0.001 (final price)"
                          : "0.01 (minimum price)"
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {auctionFormData.auctionType === AuctionType.DUTCH &&
                        "🔻 Final price when auction ends (must be < start price)"}
                      {auctionFormData.auctionType === AuctionType.RESERVE &&
                        "🏛️ Required minimum price (must be ≥ start price)"}
                    </p>
                  </div>
                )}

                {/* Buy Now Price - Only show for English and Reserve auctions */}
                {(auctionFormData.auctionType === AuctionType.ENGLISH ||
                  auctionFormData.auctionType === AuctionType.RESERVE) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Buy Now Price (ETH)
                      <span className="text-sm text-gray-500 ml-1">
                        (Optional)
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={auctionFormData.buyNowPrice}
                      onChange={(e) =>
                        updateField("buyNowPrice", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500"
                      placeholder="0.1"
                    />
                  </div>
                )}

                {/* English Auction Extension Settings - Only show for English auctions */}
                {auctionFormData.auctionType === AuctionType.ENGLISH && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Extension Threshold (minutes)
                        <span className="text-sm text-gray-500 ml-1">
                          (Auto-extend trigger)
                        </span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={auctionFormData.extensionThresholdMinutes}
                        onChange={(e) =>
                          updateField(
                            "extensionThresholdMinutes",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500"
                        placeholder="5"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        ⏰ Extend auction if bid is placed in the last X minutes
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Extension Duration (minutes)
                        <span className="text-sm text-gray-500 ml-1">
                          (How much to extend)
                        </span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={auctionFormData.extensionDurationMinutes}
                        onChange={(e) =>
                          updateField(
                            "extensionDurationMinutes",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500"
                        placeholder="10"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        ⏱️ Add X minutes to auction when late bid is placed
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Auction Type Info */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                  {auctionFormData.auctionType === AuctionType.ENGLISH &&
                    `${
                      auctionTypeInfo[AuctionType.ENGLISH].emoji
                    } English Auction`}
                  {auctionFormData.auctionType === AuctionType.DUTCH &&
                    `${auctionTypeInfo[AuctionType.DUTCH].emoji} Dutch Auction`}
                  {auctionFormData.auctionType === AuctionType.SEALED_BID &&
                    `${
                      auctionTypeInfo[AuctionType.SEALED_BID].emoji
                    } Sealed Bid Auction`}
                  {auctionFormData.auctionType === AuctionType.RESERVE &&
                    `${
                      auctionTypeInfo[AuctionType.RESERVE].emoji
                    } Reserve Auction`}
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {auctionFormData.auctionType === AuctionType.ENGLISH &&
                    `Bidders compete by placing increasingly higher bids. The auction automatically extends by ${
                      auctionFormData.extensionDurationMinutes || 10
                    } minutes when bids are placed in the last ${
                      auctionFormData.extensionThresholdMinutes || 5
                    } minutes.`}
                  {auctionFormData.auctionType === AuctionType.DUTCH &&
                    "The price starts high and decreases every 20 minutes by the specified rate until someone buys at the current price or it reaches the reserve price."}
                  {auctionFormData.auctionType === AuctionType.SEALED_BID &&
                    "Bidders submit secret bids without knowing others' bids. The highest bid wins after a reveal phase."}
                  {auctionFormData.auctionType === AuctionType.RESERVE &&
                    "Like an English auction, but with a minimum price that must be met for the item to sell."}
                </p>
              </div>

              {/* English Auction Timer Info */}
              {auctionFormData.auctionType === AuctionType.ENGLISH && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 mb-4">
                  <p className="text-green-800 dark:text-green-300 text-sm font-medium mb-1">
                    ✅ English Auction Auto-Extension
                  </p>
                  <p className="text-green-700 dark:text-green-400 text-xs">
                    Auction automatically extends by{" "}
                    {auctionFormData.extensionDurationMinutes || 10} minutes
                    when bids are placed in the last{" "}
                    {auctionFormData.extensionThresholdMinutes || 5} minutes -
                    ensuring fair bidding as per original specifications.
                  </p>
                </div>
              )}

              {/* Validation Errors */}
              {(!areRequiredFieldsFilled ||
                getPriceValidationErrors.length > 0) && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  {!areRequiredFieldsFilled && (
                    <p className="text-red-700 dark:text-red-400 text-sm mb-2">
                      ⚠️ Please fill in all required fields: Start Price,
                      Duration, and Bid Increment
                    </p>
                  )}
                  {getPriceValidationErrors.map((error, index) => (
                    <p
                      key={index}
                      className="text-red-700 dark:text-red-400 text-sm mb-1"
                    >
                      💰 {error}
                    </p>
                  ))}
                </div>
              )}
            </div>

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
                disabled={!isAuctionFormValid || isSecureProcessing}
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

export default function AdminNFTCreatorUltraSimple() {
  return (
    <ErrorBoundary>
      <AdminNFTCreatorUltraSimpleContent />
    </ErrorBoundary>
  );
}
