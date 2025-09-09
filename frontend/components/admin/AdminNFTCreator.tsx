"use client";

import React, { useState, useMemo } from "react";
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
import DynamicAuctionForm from "./DynamicAuctionForm";
import AuctionValidationModal from "./AuctionValidationModal";
import { ErrorBoundary, useLastError } from "./ErrorBoundary";
import {
  useAuctionValidation,
  AuctionFormData,
} from "@/hooks/useAuctionValidation";

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

  // Check if NFT form is valid
  const isNFTFormValid = useMemo(() => {
    return !!(
      nftData.name &&
      nftData.description &&
      nftData.image &&
      nftData.name.trim().length > 0 &&
      nftData.description.trim().length > 0
    );
  }, [nftData]);

  // Check if there are any validation errors
  const hasValidationErrors = useMemo(() => {
    return validationResult?.errors?.length > 0 || false;
  }, [validationResult]);

  // Check if all required fields are filled
  const areRequiredFieldsFilled = useMemo(() => {
    // Basic check for required fields based on auction type
    const requiredFields = ["startPrice", "duration", "bidIncrement"];

    // Dutch auctions also require buyNowPrice
    if (auctionFormData.auctionType === AuctionType.DUTCH) {
      requiredFields.push("buyNowPrice");
    }

    // Check required fields
    for (const field of requiredFields) {
      const value = auctionFormData[field as keyof AuctionFormData];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        return false;
      }
    }

    return true;
  }, [auctionFormData]);

  // Overall validation state
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

  // Show last error if available
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
      auctionFormData,
      nftData: {
        name: nftData.name,
        hasImage: !!nftData.image,
        rarity: nftData.rarity,
      },
    });

    // Check environment variables
    console.log("🔧 Environment check:", {
      hasPinataApiKey: !!process.env.NEXT_PUBLIC_PINATA_API_KEY,
      hasPinataSecretKey: !!process.env.NEXT_PUBLIC_PINATA_SECRET_KEY,
      hasServerPinataApiKey: !!process.env.PINATA_API_KEY,
      hasServerPinataSecretKey: !!process.env.PINATA_SECRET_KEY,
    });

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
      console.log("🔧 Preparing mint parameters...");
      const mintParams = [
        address,
        metadataUrl,
        nftData.isLimitedEdition ? parseInt(nftData.editionSize) : 1,
      ];

      // Prepare auction parameters
      console.log("🔧 Preparing auction parameters...");
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
        userReservePrice: auctionFormData.reservePrice,
        startPriceWei: startPriceWei.toString(),
        isDutch: auctionFormData.auctionType === AuctionType.DUTCH,
        hasReservePrice: !!auctionFormData.reservePrice,
        reservePriceLength: auctionFormData.reservePrice?.length || 0,
      });

      if (auctionFormData.auctionType === AuctionType.DUTCH) {
        // Dutch auctions: reservePrice must be > 0 and < startPrice
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
            // If user's reserve price is >= start price, use 50% of start price
            reservePrice = startPriceWei / 2n;
            console.warn(
              "⚠️ User's reserve price >= start price, using 50% of start price"
            );
          }
        } else {
          // Set a default reserve price that's 50% of start price
          console.log("🔧 No valid reserve price provided, using default...");
          reservePrice = startPriceWei / 2n;
          console.log(
            "✅ Using default reserve price (50% of start):",
            ethers.formatEther(reservePrice)
          );
        }
      } else {
        console.log("🔧 Not a Dutch auction, skipping reserve price logic");
      }

      if (
        auctionFormData.reservePrice &&
        parseFloat(auctionFormData.reservePrice) > 0
      ) {
        // Other auction types: reservePrice is optional but must be > startPrice if provided
        reservePrice = ethers.parseEther(auctionFormData.reservePrice);
        console.log(
          "✅ Using reserve price for other auction type:",
          ethers.formatEther(reservePrice)
        );
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
        // Dutch auctions: No fixed buyNowPrice - users buy at current decreasing price
        console.log(
          "🔄 Dutch auction: No fixed buy now price - users buy at current price"
        );
        buyNowPrice = 0n; // No buy now price for Dutch auctions
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
        bidIncrementWei = userRate > 0n ? userRate : calculatedRate;

        console.log("🔄 Dutch auction price decrease calculation:", {
          startPrice: ethers.formatEther(startPriceWei),
          reservePrice: ethers.formatEther(reservePrice),
          totalDecrease: ethers.formatEther(totalDecrease),
          duration: durationInSeconds,
          intervals20min: intervals20min,
          calculatedRate: ethers.formatEther(calculatedRate),
          userRate: ethers.formatEther(userRate),
          finalRate: ethers.formatEther(bidIncrementWei),
          description: `Price decreases by ${ethers.formatEther(
            bidIncrementWei
          )} ETH every 20 minutes`,
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

      // Type-specific validation
      if (auctionFormData.auctionType === AuctionType.DUTCH) {
        const isValidDutch =
          auctionParams.reservePrice > 0n &&
          auctionParams.reservePrice < auctionParams.startPrice &&
          auctionParams.buyNowPrice > 0n &&
          auctionParams.buyNowPrice < auctionParams.startPrice;

        console.log("🔍 Dutch auction validation:", {
          reservePrice: ethers.formatEther(auctionParams.reservePrice),
          buyNowPrice: ethers.formatEther(auctionParams.buyNowPrice),
          reserveLessThanStart:
            auctionParams.reservePrice < auctionParams.startPrice,
          buyNowLessThanStart:
            auctionParams.buyNowPrice < auctionParams.startPrice,
          isValid: isValidDutch,
        });

        if (!isValidDutch) {
          throw new Error(
            "Dutch auction validation failed: reservePrice and buyNowPrice must be > 0 and < startPrice"
          );
        }
      } else if (
        auctionFormData.auctionType === AuctionType.ENGLISH ||
        auctionFormData.auctionType === AuctionType.SEALED_BID ||
        auctionFormData.auctionType === AuctionType.TRADITIONAL
      ) {
        // For other auction types, if reservePrice is provided, it must be > startPrice
        if (
          auctionParams.reservePrice > 0n &&
          auctionParams.reservePrice <= auctionParams.startPrice
        ) {
          throw new Error(
            `${auctionFormData.auctionType} auction validation failed: reservePrice must be greater than startPrice`
          );
        }

        // For other auction types, if buyNowPrice is provided, it must be > startPrice
        if (
          auctionParams.buyNowPrice > 0n &&
          auctionParams.buyNowPrice <= auctionParams.startPrice
        ) {
          throw new Error(
            `${auctionFormData.auctionType} auction validation failed: buyNowPrice must be greater than startPrice`
          );
        }
      }

      // Execute secure flow
      console.log("🚀 Executing secure flow...");
      await executeSecureFlow(mintParams, auctionParams);

      // Wait for result
      console.log("⏳ Waiting for result...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("📊 Secure flow result:", {
        secureResult,
        secureError,
        isSecureProcessing,
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

        // Navigate to success page
        router.push(`/admin/nft-success/${secureResult.nft.transactionHash}`);
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
                  onChange={handleImageUpload}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500"
                />
                {nftData.image && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(nftData.image)}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={removeImage}
                      className="mt-2 text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove Image
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col items-end space-y-2 mt-6">
              {/* NFT Form Validation Status */}
              {(!nftData.name || !nftData.description || !nftData.image) && (
                <div className="text-sm text-red-600 dark:text-red-400 text-right">
                  {!nftData.name && "Name is required"}
                  {nftData.name &&
                    !nftData.description &&
                    "Description is required"}
                  {nftData.name &&
                    nftData.description &&
                    !nftData.image &&
                    "Image is required"}
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
            <DynamicAuctionForm onDataChange={handleAuctionDataChange} />

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
