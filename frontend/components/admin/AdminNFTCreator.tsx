"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { useSecureNFTAuctionFlow } from "@/hooks/useSecureNFTAuction";
import { useIPFSUnified } from "@/hooks/useIPFSUnified";
import { useNFTValidationAPI } from "@/hooks/useNFTValidationAPI";
import { useWalletPersistence } from "@/hooks/useWalletPersistence";
import { useUserRoles } from "@/hooks/useContract";
import { AuctionType } from "@/types/auction";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ethers } from "ethers";
// import DynamicAuctionForm from "./DynamicAuctionForm"; // DISABLED: Uses old modular system
import AuctionValidationModal from "./AuctionValidationModal";
import { ErrorBoundary, useLastError } from "./ErrorBoundary";
// Re-enabled with simple, safe modular hooks
import {
  useAuctionValidationModular,
  AuctionFormData,
} from "@/hooks/useAuctionValidationModular";
import { useAuctionFormValidation } from "@/hooks/useAuctionFormValidation";

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

function AdminNFTCreatorContent() {
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
            <div className="space-y-2 text-sm">
              <p>
                <strong>Time:</strong> {lastError.timestamp}
              </p>
              <p>
                <strong>Error:</strong> {lastError.error.message}
              </p>
              <p>
                <strong>Name:</strong> {lastError.error.name}
              </p>
              {lastError.error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium">
                    Stack Trace
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                    {lastError.error.stack}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex space-x-2 mt-4">
              <button
                onClick={clearError}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear Error & Continue
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
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

  // All other hooks AFTER early returns
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

  // Auction validation hooks (MODULAR - SIMPLIFIED)
  const {
    formData: auctionFormData,
    isValid: isAuctionValid,
    updateField,
    validateForTransaction,
  } = useAuctionValidationModular();

  const { areRequiredFieldsFilled, getValidationSummary } =
    useAuctionFormValidation(auctionFormData);

  // SIMPLIFIED State management for debugging
  const [step, setStep] = useState<"nft" | "auction">("nft");

  // NFT Form Data State (RESTORED - was missing!)
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
      maxTextLength: "50",
    },
  });

  // Modal states (RESTORED - were missing!)
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);

  // Validation and success data states (RESTORED - were missing!)
  const [validationResult, setValidationResult] = useState<any>(null);
  const [successData, setSuccessData] = useState<any>(null);

  // Get individual field validation errors
  const getFieldErrors = useMemo(() => {
    const errors = {
      name: [] as string[],
      description: [] as string[],
      image: [] as string[],
    };

    // Name validation
    if (nftData.name) {
      const name = nftData.name.trim();

      if (name.length < 3) {
        errors.name.push("Nome deve essere di almeno 3 caratteri");
      }
      if (name.length > 50) {
        errors.name.push("Nome deve essere di massimo 50 caratteri");
      }

      const invalidChars = /[<>:"/\\|?*]/;
      if (invalidChars.test(name)) {
        errors.name.push("Nome contiene caratteri non validi");
      }
    }

    // Description validation
    if (nftData.description) {
      const description = nftData.description.trim();

      if (description.length < 10) {
        errors.description.push(
          "Descrizione deve essere di almeno 10 caratteri"
        );
      }
      if (description.length > 500) {
        errors.description.push(
          "Descrizione deve essere di massimo 500 caratteri"
        );
      }
    }

    // Image validation
    if (nftData.image) {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

      if (!validTypes.includes(nftData.image.type)) {
        errors.image.push("Tipo immagine non supportato (PNG, JPG, GIF, WEBP)");
      }
    }

    return errors;
  }, [nftData]);

  // Get all validation errors for the summary display
  const getAllValidationErrors = useMemo(() => {
    const allErrors = [
      ...getFieldErrors.name,
      ...getFieldErrors.description,
      ...getFieldErrors.image,
    ];
    return allErrors;
  }, [getFieldErrors]);

  // Check if NFT form is valid
  const isNFTFormValid = useMemo(() => {
    return (
      getAllValidationErrors.length === 0 &&
      nftData.name &&
      nftData.description &&
      nftData.image
    );
  }, [getAllValidationErrors, nftData]);

  // Check if there are any validation errors
  const hasValidationErrors = useMemo(() => {
    if (!validationResult?.errors) return false;

    // useNFTValidationAPI returns errors as strings, not objects with severity
    return validationResult.errors.length > 0;
  }, [validationResult]);

  // Overall validation state (MODULAR)
  const isFormCompletelyValid = useMemo(() => {
    return (
      isNFTFormValid &&
      isAuctionValid &&
      !hasValidationErrors &&
      areRequiredFieldsFilled
    );
  }, [
    isNFTFormValid,
    isAuctionValid,
    hasValidationErrors,
    areRequiredFieldsFilled,
  ]);

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    setNftData((prev) => ({ ...prev, image: file }));
    toast.success("Image uploaded successfully!");
  };

  const removeImage = () => {
    setNftData((prev) => ({ ...prev, image: null }));
    toast.success("Image removed");
  };

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
    console.log("🚀 Starting secure creation process...");
    console.log("📊 Current state:", {
      isConnected,
      address,
      isAuctionValid,
      auctionFormData: {
        ...auctionFormData,
        auctionType: auctionFormData.auctionType,
        auctionTypeName:
          auctionFormData.auctionType === 0
            ? "TRADITIONAL"
            : auctionFormData.auctionType === 1
            ? "ENGLISH"
            : auctionFormData.auctionType === 2
            ? "DUTCH"
            : auctionFormData.auctionType === 3
            ? "SEALED_BID"
            : "UNKNOWN",
      },
      nftData: {
        name: nftData.name,
        hasImage: !!nftData.image,
        rarity: nftData.rarity,
      },
    });

    // Check environment variables

    if (!isConnected || !address) {
      console.error("❌ Wallet not connected");
      toast.error("Wallet not connected. Please connect and try again.");
      return;
    }

    if (!isAuctionValid) {
      console.error("❌ Auction validation failed");
      toast.error("Please fix auction validation errors before proceeding.");
      return;
    }

    try {
      console.log("✅ Pre-checks passed, starting creation...");
      // Upload image to IPFS
      if (!nftData.image) {
        console.error("❌ No image provided");
        toast.error("Please upload an image first");
        return;
      }

      console.log("📤 Uploading image to IPFS...");
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
        console.error("❌ IPFS upload failed:", ipfsResult);
        toast.error("Failed to upload image to IPFS");
        return;
      }

      console.log("✅ Image uploaded to IPFS:", ipfsResult.imageUrl);
      console.log("📝 Creating NFT metadata...");

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
      console.log("📤 Uploading metadata to IPFS...");
      console.log("📝 Metadata to upload:", nftMetadata);

      const metadataBlob = new Blob([JSON.stringify(nftMetadata, null, 2)], {
        type: "application/json",
      });

      const metadataFormData = new FormData();
      metadataFormData.append("file", metadataBlob, "metadata.json");

      console.log("🌐 Calling API route: /api/upload-ipfs");
      const metadataResponse = await fetch("/api/upload-ipfs", {
        method: "POST",
        body: metadataFormData,
      });

      if (!metadataResponse.ok) {
        console.error(
          "❌ Metadata upload failed:",
          metadataResponse.status,
          metadataResponse.statusText
        );
        throw new Error("Failed to upload metadata to IPFS");
      }

      const metadataResult = await metadataResponse.json();
      console.log("📊 Metadata upload response:", metadataResult);

      const metadataUrl = `https://ipfs.io/ipfs/${
        metadataResult.hash || metadataResult.IpfsHash
      }`;
      console.log("✅ Metadata uploaded to IPFS:", metadataUrl);

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

      // Validate duration
      const minDuration = 3600; // 1 hour
      const maxDuration = 30 * 24 * 3600; // 30 days

      if (durationInSeconds < minDuration) {
        throw new Error(
          `Duration must be at least 1 hour (${minDuration} seconds)`
        );
      }

      if (durationInSeconds > maxDuration) {
        throw new Error(
          `Duration cannot exceed 30 days (${maxDuration} seconds)`
        );
      }

      // Validate minimum values
      const minPrice = ethers.parseEther("0.000001"); // 0.000001 ETH
      const startPriceWei = ethers.parseEther(auctionFormData.startPrice);

      if (startPriceWei < minPrice) {
        throw new Error(
          `Start price must be at least ${ethers.formatEther(minPrice)} ETH`
        );
      }

      // Prepare reservePrice based on auction type
      let reservePrice = 0n;

      console.log("🔍 Reserve price preparation:", {
        auctionType: auctionFormData.auctionType,
        auctionTypeString: typeof auctionFormData.auctionType,
        DUTCH_VALUE: AuctionType.DUTCH,
        ENGLISH_VALUE: AuctionType.ENGLISH,
        userReservePrice: auctionFormData.reservePrice,
        startPriceWei: startPriceWei.toString(),
        isDutch: auctionFormData.auctionType === AuctionType.DUTCH,
        isEnglish: auctionFormData.auctionType === AuctionType.ENGLISH,
        hasReservePrice: !!auctionFormData.reservePrice,
        reservePriceLength: auctionFormData.reservePrice?.length || 0,
      });

      if (auctionFormData.auctionType === AuctionType.DUTCH) {
        // Dutch auctions: reservePrice is optional, but if provided must be < startPrice
        console.log("🔧 Dutch auction detected, processing reserve price...");
        if (
          auctionFormData.reservePrice &&
          auctionFormData.reservePrice.trim() !== "" &&
          !isNaN(parseFloat(auctionFormData.reservePrice)) &&
          parseFloat(auctionFormData.reservePrice) > 0
        ) {
          const userReservePrice = ethers.parseEther(
            auctionFormData.reservePrice
          );
          // Validate that user's reserve price is less than start price
          if (userReservePrice < startPriceWei) {
            reservePrice = userReservePrice;
            console.log(
              "✅ Using user's reserve price:",
              ethers.formatEther(reservePrice)
            );
          } else {
            // If user's reserve price is >= start price, set to 0 (no reserve)
            reservePrice = 0n;
            console.warn(
              "⚠️ User's reserve price >= start price, setting to 0 (no reserve)"
            );
          }
        } else {
          // No reserve price provided - allowed for Dutch auctions
          console.log(
            "🔧 No reserve price provided - allowed for Dutch auctions"
          );
          reservePrice = 0n;
        }
      } else if (auctionFormData.auctionType === AuctionType.ENGLISH) {
        // English auctions: reservePrice is optional but must be > startPrice if provided
        console.log("🔧 English auction detected, processing reserve price...");
        if (
          auctionFormData.reservePrice &&
          auctionFormData.reservePrice.trim() !== "" &&
          !isNaN(parseFloat(auctionFormData.reservePrice)) &&
          parseFloat(auctionFormData.reservePrice) > 0
        ) {
          const userReservePrice = ethers.parseEther(
            auctionFormData.reservePrice
          );
          if (userReservePrice > startPriceWei) {
            reservePrice = userReservePrice;
            console.log(
              "✅ Using English reserve price:",
              ethers.formatEther(reservePrice)
            );
          } else {
            console.warn(
              "⚠️ English reserve price must be > start price, skipping"
            );
          }
        } else {
          console.log("🔧 No English reserve price provided, using 0");
        }
      } else if (auctionFormData.auctionType === AuctionType.SEALED_BID) {
        // Sealed bid auctions: reservePrice is optional but must be > startPrice if provided
        console.log(
          "🔧 Sealed bid auction detected, processing reserve price..."
        );
        if (
          auctionFormData.reservePrice &&
          auctionFormData.reservePrice.trim() !== "" &&
          !isNaN(parseFloat(auctionFormData.reservePrice)) &&
          parseFloat(auctionFormData.reservePrice) > 0
        ) {
          const userReservePrice = ethers.parseEther(
            auctionFormData.reservePrice
          );
          if (userReservePrice > startPriceWei) {
            reservePrice = userReservePrice;
            console.log(
              "✅ Using sealed bid reserve price:",
              ethers.formatEther(reservePrice)
            );
          } else {
            console.warn(
              "⚠️ Sealed bid reserve price must be > start price, skipping"
            );
          }
        } else {
          console.log("🔧 No sealed bid reserve price provided, using 0");
        }
      } else if (auctionFormData.auctionType === AuctionType.RESERVE) {
        // Traditional auctions: reservePrice is optional but must be > startPrice if provided
        console.log(
          "🔧 Traditional auction detected, processing reserve price..."
        );
        if (
          auctionFormData.reservePrice &&
          auctionFormData.reservePrice.trim() !== "" &&
          !isNaN(parseFloat(auctionFormData.reservePrice)) &&
          parseFloat(auctionFormData.reservePrice) > 0
        ) {
          const userReservePrice = ethers.parseEther(
            auctionFormData.reservePrice
          );
          if (userReservePrice > startPriceWei) {
            reservePrice = userReservePrice;
            console.log(
              "✅ Using traditional reserve price:",
              ethers.formatEther(reservePrice)
            );
          } else {
            console.warn(
              "⚠️ Traditional reserve price must be > start price, skipping"
            );
          }
        } else {
          console.log("🔧 No traditional reserve price provided, using 0");
        }
      }

      // Prepare buyNowPrice based on auction type
      let buyNowPrice = 0n;

      console.log("🔍 Buy now price preparation:", {
        auctionType: auctionFormData.auctionType,
        userBuyNowPrice: auctionFormData.buyNowPrice,
        startPriceWei: startPriceWei.toString(),
        isDutch: auctionFormData.auctionType === AuctionType.DUTCH,
        hasBuyNowPrice: !!auctionFormData.buyNowPrice,
        buyNowPriceLength: auctionFormData.buyNowPrice?.length || 0,
      });

      if (auctionFormData.auctionType === AuctionType.DUTCH) {
        // Dutch auctions: buyNowPrice can now be >= startPrice (contract allows it)
        // We'll set it to reservePrice to reflect the actual final price
        console.log(
          "🔄 Dutch auction: buyNowPrice set to reservePrice (final price)"
        );
        buyNowPrice = reservePrice; // For Dutch auctions, buyNowPrice = reservePrice (correct logic)
      } else if (
        auctionFormData.buyNowPrice &&
        auctionFormData.buyNowPrice.trim() !== "" &&
        !isNaN(parseFloat(auctionFormData.buyNowPrice)) &&
        parseFloat(auctionFormData.buyNowPrice) > 0
      ) {
        // Other auction types: buyNowPrice must be > startPrice if provided
        const userBuyNowPrice = ethers.parseEther(auctionFormData.buyNowPrice);
        if (userBuyNowPrice > startPriceWei) {
          buyNowPrice = userBuyNowPrice;
          console.log(
            "✅ Using buy now price for other auction type:",
            ethers.formatEther(buyNowPrice)
          );
        } else {
          console.warn(
            "⚠️ buyNowPrice must be greater than startPrice for this auction type"
          );
        }
      }

      // Handle bidIncrement for Dutch auctions (price decrease rate)
      let bidIncrementWei: bigint;
      if (auctionFormData.auctionType === AuctionType.DUTCH) {
        // For Dutch auctions, calculate optimal decrease rate for 20-minute intervals
        const totalDecrease = startPriceWei - reservePrice;
        const intervals20min = Math.floor(durationInSeconds / 1200); // 1200 seconds = 20 minutes
        const calculatedRate =
          intervals20min > 0
            ? totalDecrease / BigInt(intervals20min)
            : totalDecrease;

        // Use user's input if provided and valid, otherwise use calculated rate
        const userRate = ethers.parseEther(auctionFormData.bidIncrement);

        // Ensure the rate is reasonable (not too aggressive)
        const maxReasonableRate = totalDecrease / 2n; // Max 50% of total decrease per interval
        const minReasonableRate = totalDecrease / 5n; // Min 20% of total decrease per interval (more flexible)

        if (
          userRate > 0n &&
          userRate <= maxReasonableRate &&
          userRate >= minReasonableRate
        ) {
          bidIncrementWei = userRate;
        } else if (
          calculatedRate <= maxReasonableRate &&
          calculatedRate >= minReasonableRate
        ) {
          bidIncrementWei = calculatedRate;
        } else {
          // Fallback to a safe default (2% of start price per interval, but not more than 50% of total decrease)
          const fallbackRate = startPriceWei / 50n; // 2% of start price
          const maxFallbackRate = totalDecrease / 2n; // 50% of total decrease
          bidIncrementWei =
            fallbackRate < maxFallbackRate ? fallbackRate : maxFallbackRate;
        }

        console.log("🔄 Dutch auction price decrease calculation:", {
          startPrice: ethers.formatEther(startPriceWei),
          reservePrice: ethers.formatEther(reservePrice),
          totalDecrease: ethers.formatEther(totalDecrease),
          duration: durationInSeconds,
          intervals20min: intervals20min,
          calculatedRate: ethers.formatEther(calculatedRate),
          userRate: ethers.formatEther(userRate),
          maxReasonableRate: ethers.formatEther(maxReasonableRate),
          minReasonableRate: ethers.formatEther(minReasonableRate),
          finalRate: ethers.formatEther(bidIncrementWei),
          description: `Price decreases by ${ethers.formatEther(
            bidIncrementWei
          )} ETH every 20 minutes`,
          totalDecreaseTime: `${intervals20min * 20} minutes`,
        });
      } else {
        bidIncrementWei = ethers.parseEther(auctionFormData.bidIncrement);
      }

      const auctionParams = {
        auctionType: auctionFormData.auctionType,
        startPrice: startPriceWei,
        reservePrice: reservePrice,
        buyNowPrice: buyNowPrice,
        duration: durationInSeconds,
        bidIncrement: bidIncrementWei,
      };

      console.log("📋 Parameters prepared:", {
        mintParams,
        auctionParams: {
          ...auctionParams,
          auctionType: auctionParams.auctionType,
          auctionTypeName:
            auctionParams.auctionType === 0
              ? "TRADITIONAL"
              : auctionParams.auctionType === 1
              ? "ENGLISH"
              : auctionParams.auctionType === 2
              ? "DUTCH"
              : auctionParams.auctionType === 3
              ? "SEALED_BID"
              : "UNKNOWN",
          startPrice: auctionParams.startPrice.toString(),
          reservePrice: auctionParams.reservePrice.toString(),
          buyNowPrice: auctionParams.buyNowPrice.toString(),
          bidIncrement: auctionParams.bidIncrement.toString(),
        },
      });

      // Pre-transaction validation
      console.log("🔍 Pre-transaction validation:", {
        auctionType: auctionFormData.auctionType,
        startPrice: ethers.formatEther(auctionParams.startPrice),
        reservePrice: ethers.formatEther(auctionParams.reservePrice),
        buyNowPrice: ethers.formatEther(auctionParams.buyNowPrice),
        duration: auctionParams.duration,
        bidIncrement: ethers.formatEther(auctionParams.bidIncrement),
      });

      // Pre-transaction validation (MODULAR)
      const transactionValidation = validateForTransaction();
      if (!transactionValidation.isValid) {
        throw new Error(
          transactionValidation.error || "Transaction validation failed"
        );
      }

      // Execute secure flow
      console.log("🚀 Executing secure flow...");
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
        console.log("✅ Creation successful:", secureResult);
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

        // Show success modal first
        setSuccessData(nftCreationData);
        setShowSuccessModal(true);

        // Navigate to success page after 3 seconds
        setTimeout(() => {
          router.push(`/admin/nft-success/${secureResult.nft.transactionHash}`);
        }, 3000);
      } else {
        console.log("⚠️ No secure result, but no error either");
        toast.success("NFT and auction created! Check the auctions page.");
        setTimeout(() => {
          window.location.href = "/auctions";
        }, 2000);
      }
    } catch (error) {
      console.error("❌ Creation failed with error:", error);
      console.error("❌ Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      });
      toast.error(
        `Creation failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const handleAuctionDataChange = React.useCallback(
    (data: AuctionFormData) => {
      // Update each field in the hook to trigger re-render
      Object.entries(data).forEach(([key, value]) => {
        updateField(
          key as keyof AuctionFormData,
          value as string | AuctionType
        );
      });
    },
    [updateField]
  );

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

          {/* Overall Validation Status */}
          {step === "auction" && !isFormCompletelyValid && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center justify-center space-x-2">
                <svg
                  className="w-5 h-5 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                  Complete all required fields to enable creation
                </span>
              </div>
            </div>
          )}
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                NFT Details
              </h2>
              {/* Form validation status indicator */}
              <div className="flex items-center space-x-2">
                {isNFTFormValid ? (
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <svg
                      className="w-5 h-5 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm font-medium">Valid form</span>
                  </div>
                ) : (
                  <div className="flex items-center text-amber-600 dark:text-amber-400">
                    <svg
                      className="w-5 h-5 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Complete fields</span>
                  </div>
                )}
              </div>
            </div>

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
                    getFieldErrors.name.length > 0
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Enter NFT name"
                />
                {/* Name validation errors */}
                {getFieldErrors.name.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {getFieldErrors.name.map((error, index) => (
                      <p
                        key={index}
                        className="text-sm text-red-600 dark:text-red-400"
                      >
                        {error}
                      </p>
                    ))}
                  </div>
                )}
                {/* Name character count and validation status */}
                {nftData.name && (
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {nftData.name.trim().length}/50 characters
                    </p>
                    {getFieldErrors.name.length === 0 &&
                      nftData.name.trim().length >= 3 && (
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-xs">Valid</span>
                        </div>
                      )}
                  </div>
                )}
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
                    getFieldErrors.description.length > 0
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Enter NFT description"
                />
                {/* Description validation errors */}
                {getFieldErrors.description.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {getFieldErrors.description.map((error, index) => (
                      <p
                        key={index}
                        className="text-sm text-red-600 dark:text-red-400"
                      >
                        {error}
                      </p>
                    ))}
                  </div>
                )}
                {/* Description character count and validation status */}
                {nftData.description && (
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {nftData.description.trim().length}/500 characters
                    </p>
                    {getFieldErrors.description.length === 0 &&
                      nftData.description.trim().length >= 10 && (
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-xs">Valid</span>
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Image Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 ${
                    getFieldErrors.image.length > 0
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {/* Image validation errors */}
                {getFieldErrors.image.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {getFieldErrors.image.map((error, index) => (
                      <p
                        key={index}
                        className="text-sm text-red-600 dark:text-red-400"
                      >
                        {error}
                      </p>
                    ))}
                  </div>
                )}
                {/* Image info */}
                {nftData.image && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(nftData.image)}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {nftData.image.name} (
                          {(nftData.image.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                        {getFieldErrors.image.length === 0 && (
                          <div className="flex items-center text-green-600 dark:text-green-400">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span className="text-xs">Valid</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={removeImage}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Validation Errors Display */}
            {getAllValidationErrors.length > 0 && (
              <div className="mb-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-red-600 mt-0.5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                        Validation Errors Summary:
                      </h3>
                      <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                        {getAllValidationErrors.map((error, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col items-end space-y-2 mt-6">
              {/* Required Fields Status */}
              {(!nftData.name || !nftData.description || !nftData.image) && (
                <div className="text-sm text-amber-600 dark:text-amber-400 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <span>
                      {!nftData.name && "Required name"}
                      {nftData.name &&
                        !nftData.description &&
                        "Required description"}
                      {nftData.name &&
                        nftData.description &&
                        !nftData.image &&
                        "Required image"}
                    </span>
                  </div>
                </div>
              )}

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
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700">
                ⚠️ DynamicAuctionForm temporarily disabled - uses old modular
                system
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep("nft")}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Back to NFT
              </button>

              <div className="flex flex-col items-end space-y-2">
                {/* Validation Status Indicator */}
                {!isFormCompletelyValid && (
                  <div className="text-sm text-red-600 dark:text-red-400 text-right">
                    {!isNFTFormValid && "Complete NFT details first"}
                    {isNFTFormValid &&
                      !areRequiredFieldsFilled &&
                      "Fill all required auction fields"}
                    {isNFTFormValid &&
                      areRequiredFieldsFilled &&
                      hasValidationErrors &&
                      "Fix validation errors"}
                    {isNFTFormValid &&
                      areRequiredFieldsFilled &&
                      !hasValidationErrors &&
                      !isAuctionValid &&
                      "Auction validation failed"}
                  </div>
                )}

                <button
                  onClick={() => setShowValidationModal(true)}
                  disabled={!isFormCompletelyValid || isSecureProcessing}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isSecureProcessing ? "Creating..." : "Create NFT & Auction"}
                </button>
              </div>
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

        {/* NFT Creation Success Modal */}
        {showSuccessModal && successData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  🎉 NFT Created Successfully!
                </h3>

                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 mb-6">
                  <div className="flex justify-between">
                    <span>Token ID:</span>
                    <span className="font-mono font-semibold">
                      #{successData.tokenId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auction ID:</span>
                    <span className="font-mono font-semibold">
                      #{successData.auctionId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction:</span>
                    <span className="font-mono text-xs">
                      {successData.transactionHash.slice(0, 8)}...
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Redirecting to success page in 3 seconds...
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push(
                      `/admin/nft-success/${successData.transactionHash}`
                    );
                  }}
                  className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                >
                  View Full Details →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminNFTCreator() {
  return (
    <ErrorBoundary>
      <AdminNFTCreatorContent />
    </ErrorBoundary>
  );
}
