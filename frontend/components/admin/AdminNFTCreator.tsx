"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useCreateAuction } from "@/hooks/useAuction";
import { useWriteMooveStickerNFT } from "@/hooks/useContract";
import { AuctionType } from "@/types/auction";
import { toast } from "react-hot-toast";

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

interface AuctionFormData {
  auctionType: AuctionType;
  startPrice: string;
  reservePrice: string;
  buyNowPrice: string;
  duration: string;
  durationUnit: "minutes" | "hours";
  bidIncrement: string;
}

export default function AdminNFTCreator() {
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
  const [auctionData, setAuctionData] = useState<AuctionFormData>({
    auctionType: AuctionType.ENGLISH,
    startPrice: "0.000001", // 1 gwei per testing
    reservePrice: "",
    buyNowPrice: "",
    duration: "5", // 5 minuti per testing
    durationUnit: "minutes",
    bidIncrement: "0.000001", // 1 gwei per testing
  });

  const {
    writeMooveStickerNFT,
    isPending: isMinting,
    isConfirming: isConfirmingMint,
  } = useWriteMooveStickerNFT();
  const {
    createAuction,
    isPending: isCreatingAuction,
    isConfirming: isConfirmingAuction,
  } = useCreateAuction();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSetImage(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      validateAndSetImage(file);
    }
  };

  const validateAndSetImage = (file: File) => {
    // Validazione tipo file
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validazione dimensione (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    // Validazione dimensioni immagine
    const img = new Image();
    img.onload = () => {
      if (img.width < 200 || img.height < 200) {
        toast.error("Image must be at least 200x200 pixels");
        return;
      }
      if (img.width > 4000 || img.height > 4000) {
        toast.error("Image must be less than 4000x4000 pixels");
        return;
      }

      setNftData((prev) => ({ ...prev, image: file }));
      toast.success("Image uploaded successfully!");
    };
    img.onerror = () => {
      toast.error("Invalid image file");
    };
    img.src = URL.createObjectURL(file);
  };

  const removeImage = () => {
    setNftData((prev) => ({ ...prev, image: null }));
    toast.success("Image removed");
  };

  const validateNFTCreation = () => {
    const errors: string[] = [];

    // Validazione nome
    if (!nftData.name.trim()) {
      errors.push("Name is required");
    } else if (nftData.name.length < 3) {
      errors.push("Name must be at least 3 characters");
    } else if (nftData.name.length > 50) {
      errors.push("Name must be less than 50 characters");
    }

    // Validazione descrizione
    if (!nftData.description.trim()) {
      errors.push("Description is required");
    } else if (nftData.description.length < 10) {
      errors.push("Description must be at least 10 characters");
    } else if (nftData.description.length > 500) {
      errors.push("Description must be less than 500 characters");
    }

    // Validazione immagine
    if (!nftData.image) {
      errors.push("Image is required");
    }

    // Validazione edizione limitata
    if (nftData.isLimitedEdition) {
      const editionSize = parseInt(nftData.editionSize);
      if (!editionSize || editionSize < 1) {
        errors.push("Edition size must be at least 1");
      } else if (editionSize > 10000) {
        errors.push("Edition size must be less than 10,000");
      }

      if (!nftData.editionName.trim()) {
        errors.push("Edition name is required for limited editions");
      }
    }

    // Validazione opzioni di personalizzazione
    if (nftData.customizationOptions.allowTextChange) {
      const maxLength = parseInt(nftData.customizationOptions.maxTextLength);
      if (!maxLength || maxLength < 1) {
        errors.push("Max text length must be at least 1");
      } else if (maxLength > 1000) {
        errors.push("Max text length must be less than 1,000");
      }
    }

    return errors;
  };

  const handleNFTCreation = async () => {
    const validationErrors = validateNFTCreation();
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    try {
      // TODO: Upload image to IPFS and get hash
      // For now, we'll use a placeholder
      const imageHash = "QmPlaceholderHash";

      // TODO: Create metadata JSON and upload to IPFS
      const metadataURI = "ipfs://QmMetadataHash";

      // Convert rarity string to enum value (0-5)
      const rarityMap = {
        COMMON: 0,
        UNCOMMON: 1,
        RARE: 2,
        EPIC: 3,
        LEGENDARY: 4,
        MYTHIC: 5,
      };

      // Mint Sticker NFT with all required parameters
      writeMooveStickerNFT("mintStickerNFT", [
        "0x0000000000000000000000000000000000000000", // to (will be set by contract)
        nftData.name,
        metadataURI,
        0, // category (VEHICLE_DECORATION = 0)
        rarityMap[nftData.rarity],
        nftData.isLimitedEdition,
        nftData.isLimitedEdition ? BigInt(nftData.editionSize) : BigInt(0),
        {
          allowColorChange: nftData.customizationOptions.allowColorChange,
          allowTextChange: nftData.customizationOptions.allowTextChange,
          allowSizeChange: nftData.customizationOptions.allowSizeChange,
          allowEffectsChange: nftData.customizationOptions.allowEffectsChange,
          availableColors: nftData.customizationOptions.availableColors,
          maxTextLength: BigInt(nftData.customizationOptions.maxTextLength),
        },
        nftData.editionName || nftData.name,
        "0x0000000000000000000000000000000000000000", // royaltyRecipient
        500, // royaltyPercentage (5%)
      ]);

      toast.success("NFT creation initiated!");
      setStep("auction");
    } catch (error) {
      console.error("Error creating NFT:", error);
      toast.error("Failed to create NFT");
    }
  };

  const validateAuctionCreation = () => {
    const errors: string[] = [];

    // Validazione prezzo iniziale
    const startPrice = parseFloat(auctionData.startPrice);
    if (!auctionData.startPrice || isNaN(startPrice) || startPrice <= 0) {
      errors.push("Start price must be greater than 0");
    } else if (startPrice < 0.000001) {
      // 0.000001 ETH = 1 gwei (per testing)
      errors.push("Start price must be at least 0.000001 ETH (1 gwei)");
    } else if (startPrice > 1000) {
      errors.push("Start price must be less than 1000 ETH");
    }

    // Validazione durata
    const duration = parseInt(auctionData.duration);
    const durationUnit = auctionData.durationUnit || "hours";

    if (!auctionData.duration || isNaN(duration) || duration <= 0) {
      errors.push("Duration is required and must be greater than 0");
    } else if (durationUnit === "minutes") {
      if (duration < 1) {
        errors.push("Duration must be at least 1 minute");
      } else if (duration > 43200) {
        // 30 days = 43200 minutes
        errors.push("Duration must be less than 43200 minutes (30 days)");
      }
    } else if (durationUnit === "hours") {
      if (duration < 1) {
        errors.push("Duration must be at least 1 hour");
      } else if (duration > 720) {
        // 30 days = 720 hours
        errors.push("Duration must be less than 720 hours (30 days)");
      }
    }

    // Validazione prezzo riserva (se specificato)
    if (auctionData.reservePrice) {
      const reservePrice = parseFloat(auctionData.reservePrice);
      if (isNaN(reservePrice) || reservePrice <= 0) {
        errors.push("Reserve price must be greater than 0");
      } else if (reservePrice < startPrice) {
        errors.push(
          "Reserve price must be greater than or equal to start price"
        );
      } else if (reservePrice > 1000) {
        errors.push("Reserve price must be less than 1000 ETH");
      }
    }

    // Validazione buy now price (se specificato)
    if (auctionData.buyNowPrice) {
      const buyNowPrice = parseFloat(auctionData.buyNowPrice);
      if (isNaN(buyNowPrice) || buyNowPrice <= 0) {
        errors.push("Buy now price must be greater than 0");
      } else if (buyNowPrice < startPrice) {
        errors.push(
          "Buy now price must be greater than or equal to start price"
        );
      } else if (buyNowPrice > 1000) {
        errors.push("Buy now price must be less than 1000 ETH");
      }
    }

    // Validazione bid increment
    if (auctionData.bidIncrement) {
      const bidIncrement = parseFloat(auctionData.bidIncrement);
      if (isNaN(bidIncrement) || bidIncrement <= 0) {
        errors.push("Bid increment must be greater than 0");
      } else if (bidIncrement < 0.000001) {
        // 0.000001 ETH = 1 gwei (per testing)
        errors.push("Bid increment must be at least 0.000001 ETH (1 gwei)");
      } else if (bidIncrement > startPrice) {
        errors.push("Bid increment must be less than start price");
      }
    }

    // Validazioni specifiche per tipo di asta
    if (auctionData.auctionType === AuctionType.DUTCH) {
      if (!auctionData.buyNowPrice) {
        errors.push("Dutch auctions require a buy now price");
      }
    }

    if (auctionData.auctionType === AuctionType.SEALED_BID) {
      if (auctionData.bidIncrement) {
        errors.push("Sealed bid auctions don't use bid increments");
      }
    }

    return errors;
  };

  const handleAuctionCreation = async () => {
    const validationErrors = validateAuctionCreation();
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    try {
      // TODO: Get the minted NFT ID from the previous transaction
      const nftId = 1; // Placeholder
      const nftContract = "0x..."; // Placeholder for NFT contract address

      // Convert duration to seconds based on unit
      const durationInSeconds =
        auctionData.durationUnit === "minutes"
          ? parseInt(auctionData.duration) * 60
          : parseInt(auctionData.duration) * 3600;

      createAuction(
        nftId,
        nftContract,
        auctionData.auctionType,
        BigInt(parseFloat(auctionData.startPrice) * 1e18),
        BigInt(parseFloat(auctionData.reservePrice || "0") * 1e18),
        BigInt(parseFloat(auctionData.buyNowPrice || "0") * 1e18),
        durationInSeconds,
        BigInt(parseFloat(auctionData.bidIncrement) * 1e18)
      );

      toast.success("Auction creation initiated!");
    } catch (error) {
      console.error("Error creating auction:", error);
      toast.error("Failed to create auction");
    }
  };

  const isProcessing =
    isMinting || isConfirmingMint || isCreatingAuction || isConfirmingAuction;

  // Controllo campi obbligatori per NFT
  const isNFTCreationReady = () => {
    return (
      nftData.name.trim().length >= 3 &&
      nftData.description.trim().length >= 10 &&
      nftData.image !== null &&
      (!nftData.isLimitedEdition ||
        (nftData.editionSize &&
          parseInt(nftData.editionSize) >= 1 &&
          parseInt(nftData.editionSize) <= 10000 &&
          nftData.editionName.trim().length > 0)) &&
      // Controllo nome unico (da implementare con smart contract)
      !isDuplicateName(nftData.name.trim()) &&
      // Controllo caratteri speciali
      !hasInvalidCharacters(nftData.name.trim())
    );
  };

  // Controllo nome duplicato (placeholder - da implementare con smart contract)
  const isDuplicateName = (name: string) => {
    // TODO: Implementare controllo con smart contract
    // Per ora, controlliamo nomi comuni che potrebbero essere duplicati
    const commonNames = ["Test Sticker", "Sample NFT", "Demo Sticker"];
    return commonNames.includes(name);
  };

  // Controllo caratteri speciali nel nome
  const hasInvalidCharacters = (name: string) => {
    // Permette lettere, numeri, spazi, trattini, underscore
    const validPattern = /^[a-zA-Z0-9\s\-_]+$/;
    return !validPattern.test(name);
  };

  // Controllo dimensioni immagine ottimali
  const isImageSizeOptimal = (file: File | null) => {
    if (!file) return true; // Non controllare se non c'è immagine
    // Dimensioni ottimali per NFT: 512x512, 1024x1024, 2048x2048
    return new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const isSquare = img.width === img.height;
        const isPowerOfTwo = [512, 1024, 2048].includes(img.width);
        resolve(isSquare && isPowerOfTwo);
      };
      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });
  };

  // Controllo prezzo ragionevole per rarità
  const isPriceReasonableForRarity = (price: number, rarity: string) => {
    const rarityMultipliers = {
      COMMON: { min: 0.000001, max: 0.001 },
      UNCOMMON: { min: 0.001, max: 0.01 },
      RARE: { min: 0.01, max: 0.1 },
      EPIC: { min: 0.1, max: 1 },
      LEGENDARY: { min: 1, max: 10 },
      MYTHIC: { min: 10, max: 100 },
    };

    const range = rarityMultipliers[rarity as keyof typeof rarityMultipliers];
    return range ? price >= range.min && price <= range.max : true;
  };

  // Controllo durata aste per tipo
  const isDurationAppropriateForType = (
    duration: number,
    unit: string,
    type: AuctionType
  ) => {
    const durationInHours = unit === "minutes" ? duration / 60 : duration;

    const typeRecommendations = {
      [AuctionType.ENGLISH]: { min: 1, max: 168 }, // 1 ora - 1 settimana
      [AuctionType.DUTCH]: { min: 0.5, max: 24 }, // 30 min - 1 giorno
      [AuctionType.TRADITIONAL]: { min: 24, max: 720 }, // 1 giorno - 1 mese
      [AuctionType.SEALED_BID]: { min: 24, max: 168 }, // 1 giorno - 1 settimana
    };

    const range = typeRecommendations[type];
    return range
      ? durationInHours >= range.min && durationInHours <= range.max
      : true;
  };

  // Controllo campi obbligatori per Auction
  const isAuctionCreationReady = () => {
    const startPrice = parseFloat(auctionData.startPrice);
    const duration = parseInt(auctionData.duration);
    const durationUnit = auctionData.durationUnit || "hours";

    const basicValidation =
      auctionData.startPrice &&
      !isNaN(startPrice) &&
      startPrice >= 0.000001 &&
      auctionData.duration &&
      !isNaN(duration) &&
      duration >= 1;

    // Validazioni specifiche per tipo di asta
    if (auctionData.auctionType === AuctionType.DUTCH) {
      const buyNowPrice = parseFloat(auctionData.buyNowPrice);
      return (
        basicValidation &&
        auctionData.buyNowPrice &&
        !isNaN(buyNowPrice) &&
        buyNowPrice >= startPrice
      );
    }

    return basicValidation;
  };

  // Handler per alert campi mancanti NFT
  const handleNFTCreationWithAlert = () => {
    if (!isNFTCreationReady()) {
      const missingFields = [];
      if (nftData.name.trim().length < 3)
        missingFields.push("Name (min 3 characters)");
      if (nftData.description.trim().length < 10)
        missingFields.push("Description (min 10 characters)");
      if (!nftData.image) missingFields.push("Image");
      if (nftData.isLimitedEdition) {
        if (!nftData.editionSize || parseInt(nftData.editionSize) < 1)
          missingFields.push("Edition Size");
        if (!nftData.editionName.trim()) missingFields.push("Edition Name");
      }
      if (isDuplicateName(nftData.name.trim())) {
        missingFields.push("Name already exists");
      }
      if (hasInvalidCharacters(nftData.name.trim())) {
        missingFields.push("Name contains invalid characters");
      }

      toast.error(`Missing required fields: ${missingFields.join(", ")}`);
      return;
    }
    handleNFTCreation();
  };

  // Handler per alert campi mancanti Auction
  const handleAuctionCreationWithAlert = () => {
    if (!isAuctionCreationReady()) {
      const missingFields = [];
      if (
        !auctionData.startPrice ||
        parseFloat(auctionData.startPrice) < 0.000001
      ) {
        missingFields.push("Start Price (min 0.000001 ETH)");
      }
      if (!auctionData.duration || parseInt(auctionData.duration) < 1) {
        missingFields.push("Duration (min 1 minute/hour)");
      }
      if (auctionData.auctionType === AuctionType.DUTCH) {
        if (
          !auctionData.buyNowPrice ||
          parseFloat(auctionData.buyNowPrice) <
            parseFloat(auctionData.startPrice || "0")
        ) {
          missingFields.push("Buy Now Price (required for Dutch auctions)");
        }
      }

      toast.error(`Missing required fields: ${missingFields.join(", ")}`);
      return;
    }
    handleAuctionCreation();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🎨 Create NFT for Auction
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Create a new decorative NFT and set it up for auction
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === "nft"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              1
            </div>
            <div
              className={`w-16 h-1 mx-2 ${
                step === "auction" ? "bg-purple-600" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === "auction"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              2
            </div>
          </div>
        </div>

        {step === "nft" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              NFT Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={nftData.name}
                    onChange={(e) =>
                      setNftData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      nftData.name.length > 0 &&
                      (nftData.name.length < 3 ||
                        isDuplicateName(nftData.name.trim()) ||
                        hasInvalidCharacters(nftData.name.trim()))
                        ? "border-red-500 focus:border-red-500"
                        : nftData.name.length >= 3 &&
                          nftData.name.length <= 50 &&
                          !isDuplicateName(nftData.name.trim()) &&
                          !hasInvalidCharacters(nftData.name.trim())
                        ? "border-green-500 focus:border-green-500"
                        : nftData.name.length > 50
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:border-purple-500"
                    }`}
                    placeholder="Enter NFT name (3-50 characters)"
                    maxLength={50}
                  />
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {nftData.name.length}/50 characters
                    {nftData.name.length > 0 && nftData.name.length < 3 && (
                      <span className="text-red-500 ml-2">Too short</span>
                    )}
                    {nftData.name.length > 50 && (
                      <span className="text-red-500 ml-2">Too long</span>
                    )}
                    {nftData.name.length >= 3 &&
                      isDuplicateName(nftData.name.trim()) && (
                        <span className="text-red-500 ml-2">
                          Name already exists
                        </span>
                      )}
                    {nftData.name.length >= 3 &&
                      hasInvalidCharacters(nftData.name.trim()) && (
                        <span className="text-red-500 ml-2">
                          Invalid characters (use letters, numbers, spaces, -,
                          _)
                        </span>
                      )}
                    {nftData.name.length >= 3 &&
                      nftData.name.length <= 50 &&
                      !isDuplicateName(nftData.name.trim()) &&
                      !hasInvalidCharacters(nftData.name.trim()) && (
                        <span className="text-green-500 ml-2">
                          ✓ Valid unique name
                        </span>
                      )}
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
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      nftData.description.length > 0 &&
                      nftData.description.length < 10
                        ? "border-red-500 focus:border-red-500"
                        : nftData.description.length >= 10 &&
                          nftData.description.length <= 500
                        ? "border-green-500 focus:border-green-500"
                        : nftData.description.length > 500
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:border-purple-500"
                    }`}
                    placeholder="Enter NFT description (10-500 characters)"
                    maxLength={500}
                  />
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {nftData.description.length}/500 characters
                    {nftData.description.length > 0 &&
                      nftData.description.length < 10 && (
                        <span className="text-red-500 ml-2">Too short</span>
                      )}
                    {nftData.description.length > 500 && (
                      <span className="text-red-500 ml-2">Too long</span>
                    )}
                    {nftData.description.length >= 10 &&
                      nftData.description.length <= 500 && (
                        <span className="text-green-500 ml-2">✓ Good</span>
                      )}
                  </div>
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="COMMON">🟢 Common</option>
                    <option value="UNCOMMON">🔵 Uncommon</option>
                    <option value="RARE">🟣 Rare</option>
                    <option value="EPIC">🟠 Epic</option>
                    <option value="LEGENDARY">🟡 Legendary</option>
                    <option value="MYTHIC">🔴 Mythic</option>
                  </select>
                </div>

                {/* Limited Edition Settings */}
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Limited Edition Settings
                  </h3>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isLimitedEdition"
                      checked={nftData.isLimitedEdition}
                      onChange={(e) =>
                        setNftData((prev) => ({
                          ...prev,
                          isLimitedEdition: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label
                      htmlFor="isLimitedEdition"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      This is a limited edition
                    </label>
                  </div>

                  {nftData.isLimitedEdition && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Edition Size
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10000"
                          value={nftData.editionSize}
                          onChange={(e) =>
                            setNftData((prev) => ({
                              ...prev,
                              editionSize: e.target.value,
                            }))
                          }
                          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                            nftData.editionSize &&
                            (parseInt(nftData.editionSize) < 1 ||
                              parseInt(nftData.editionSize) > 10000)
                              ? "border-red-500 focus:border-red-500"
                              : nftData.editionSize &&
                                parseInt(nftData.editionSize) >= 1 &&
                                parseInt(nftData.editionSize) <= 10000
                              ? "border-green-500 focus:border-green-500"
                              : "border-gray-300 dark:border-gray-600 focus:border-purple-500"
                          }`}
                          placeholder="e.g., 100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Edition Name
                        </label>
                        <input
                          type="text"
                          value={nftData.editionName}
                          onChange={(e) =>
                            setNftData((prev) => ({
                              ...prev,
                              editionName: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="e.g., Genesis Collection"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Customization Options */}
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Customization Options
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="allowColorChange"
                        checked={nftData.customizationOptions.allowColorChange}
                        onChange={(e) =>
                          setNftData((prev) => ({
                            ...prev,
                            customizationOptions: {
                              ...prev.customizationOptions,
                              allowColorChange: e.target.checked,
                            },
                          }))
                        }
                        className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label
                        htmlFor="allowColorChange"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Allow Color Change
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="allowTextChange"
                        checked={nftData.customizationOptions.allowTextChange}
                        onChange={(e) =>
                          setNftData((prev) => ({
                            ...prev,
                            customizationOptions: {
                              ...prev.customizationOptions,
                              allowTextChange: e.target.checked,
                            },
                          }))
                        }
                        className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label
                        htmlFor="allowTextChange"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Allow Text Change
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="allowSizeChange"
                        checked={nftData.customizationOptions.allowSizeChange}
                        onChange={(e) =>
                          setNftData((prev) => ({
                            ...prev,
                            customizationOptions: {
                              ...prev.customizationOptions,
                              allowSizeChange: e.target.checked,
                            },
                          }))
                        }
                        className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label
                        htmlFor="allowSizeChange"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Allow Size Change
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="allowEffectsChange"
                        checked={
                          nftData.customizationOptions.allowEffectsChange
                        }
                        onChange={(e) =>
                          setNftData((prev) => ({
                            ...prev,
                            customizationOptions: {
                              ...prev.customizationOptions,
                              allowEffectsChange: e.target.checked,
                            },
                          }))
                        }
                        className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label
                        htmlFor="allowEffectsChange"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Allow Effects Change
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Text Length
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={nftData.customizationOptions.maxTextLength}
                      onChange={(e) =>
                        setNftData((prev) => ({
                          ...prev,
                          customizationOptions: {
                            ...prev.customizationOptions,
                            maxTextLength: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., 100"
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image *
                  </label>
                  <div
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center transition-colors hover:border-purple-400 dark:hover:border-purple-500"
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />

                    {nftData.image ? (
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(nftData.image)}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg mb-2"
                        />
                        <button
                          onClick={removeImage}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          title="Remove image"
                        >
                          ×
                        </button>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          <p className="font-medium">{nftData.image.name}</p>
                          <p className="text-xs">
                            {(nftData.image.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer block"
                      >
                        <div className="text-4xl mb-2">📷</div>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                          Click to upload or drag & drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          PNG, JPG, GIF up to 10MB (min 200x200px)
                        </p>
                        <p className="text-xs text-blue-500 mt-1">
                          💡 Optimal: 512x512, 1024x1024, or 2048x2048 (square)
                        </p>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={handleNFTCreationWithAlert}
                disabled={isProcessing}
                className={`px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                  isNFTCreationReady()
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating NFT...
                  </>
                ) : (
                  <>
                    {!isNFTCreationReady() && (
                      <span className="text-yellow-300 mr-2">⚠️</span>
                    )}
                    Create NFT & Continue
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === "auction" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Auction Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Auction Type
                </label>
                <select
                  value={auctionData.auctionType}
                  onChange={(e) =>
                    setAuctionData((prev) => ({
                      ...prev,
                      auctionType: e.target.value as AuctionType,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={AuctionType.ENGLISH}>
                    ⬆️ English Auction
                  </option>
                  <option value={AuctionType.DUTCH}>⬇️ Dutch Auction</option>
                  <option value={AuctionType.TRADITIONAL}>
                    🏛️ Traditional
                  </option>
                  <option value={AuctionType.SEALED_BID}>🔒 Sealed Bid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={auctionData.duration}
                    onChange={(e) =>
                      setAuctionData((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    className={`flex-1 px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      auctionData.duration &&
                      ((auctionData.durationUnit === "minutes" &&
                        (parseInt(auctionData.duration) < 1 ||
                          parseInt(auctionData.duration) > 43200)) ||
                        (auctionData.durationUnit === "hours" &&
                          (parseInt(auctionData.duration) < 1 ||
                            parseInt(auctionData.duration) > 720)))
                        ? "border-red-500 focus:border-red-500"
                        : auctionData.duration &&
                          ((auctionData.durationUnit === "minutes" &&
                            parseInt(auctionData.duration) >= 1 &&
                            parseInt(auctionData.duration) <= 43200) ||
                            (auctionData.durationUnit === "hours" &&
                              parseInt(auctionData.duration) >= 1 &&
                              parseInt(auctionData.duration) <= 720))
                        ? "border-green-500 focus:border-green-500"
                        : "border-gray-300 dark:border-gray-600 focus:border-purple-500"
                    }`}
                    placeholder="5"
                    min="1"
                    max="720"
                  />
                  <select
                    value={auctionData.durationUnit || "hours"}
                    onChange={(e) =>
                      setAuctionData((prev) => ({
                        ...prev,
                        durationUnit: e.target.value as "minutes" | "hours",
                      }))
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {auctionData.duration &&
                    parseInt(auctionData.duration) < 1 && (
                      <span className="text-red-500">
                        Minimum: 1 minute (testing) or 1 hour (production)
                      </span>
                    )}
                  {auctionData.duration &&
                    parseInt(auctionData.duration) > 720 && (
                      <span className="text-red-500">
                        Maximum: 720 hours (30 days)
                      </span>
                    )}
                  {auctionData.duration &&
                    parseInt(auctionData.duration) >= 1 &&
                    parseInt(auctionData.duration) <= 720 && (
                      <span className="text-green-500">✓ Valid duration</span>
                    )}
                  <div className="mt-1">
                    <span className="text-blue-500">
                      💡 Testing: Use 5-10 minutes | Production: Use 1+ hours
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Price (ETH) *
                </label>
                <input
                  type="number"
                  step="0.000001"
                  min="0.000001"
                  max="1000"
                  value={auctionData.startPrice}
                  onChange={(e) =>
                    setAuctionData((prev) => ({
                      ...prev,
                      startPrice: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    auctionData.startPrice &&
                    (parseFloat(auctionData.startPrice) < 0.000001 ||
                      parseFloat(auctionData.startPrice) > 1000)
                      ? "border-red-500 focus:border-red-500"
                      : auctionData.startPrice &&
                        parseFloat(auctionData.startPrice) >= 0.000001 &&
                        parseFloat(auctionData.startPrice) <= 1000
                      ? "border-green-500 focus:border-green-500"
                      : "border-gray-300 dark:border-gray-600 focus:border-purple-500"
                  }`}
                  placeholder="0.000001"
                />
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {auctionData.startPrice &&
                    parseFloat(auctionData.startPrice) < 0.000001 && (
                      <span className="text-red-500">
                        Minimum: 0.000001 ETH (1 gwei)
                      </span>
                    )}
                  {auctionData.startPrice &&
                    parseFloat(auctionData.startPrice) > 1000 && (
                      <span className="text-red-500">Maximum: 1000 ETH</span>
                    )}
                  {auctionData.startPrice &&
                    parseFloat(auctionData.startPrice) >= 0.000001 &&
                    parseFloat(auctionData.startPrice) <= 1000 && (
                      <span className="text-green-500">✓ Valid price</span>
                    )}
                  <div className="mt-1">
                    <span className="text-blue-500 text-xs">
                      💡 Price suggestions: Common (0.000001-0.001), Rare
                      (0.01-0.1), Epic (0.1-1), Legendary (1-10)
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reserve Price (ETH)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  min="0.000001"
                  max="1000"
                  value={auctionData.reservePrice}
                  onChange={(e) =>
                    setAuctionData((prev) => ({
                      ...prev,
                      reservePrice: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    auctionData.reservePrice &&
                    (parseFloat(auctionData.reservePrice) <
                      parseFloat(auctionData.startPrice || "0") ||
                      parseFloat(auctionData.reservePrice) > 1000)
                      ? "border-red-500 focus:border-red-500"
                      : auctionData.reservePrice &&
                        parseFloat(auctionData.reservePrice) >=
                          parseFloat(auctionData.startPrice || "0") &&
                        parseFloat(auctionData.reservePrice) <= 1000
                      ? "border-green-500 focus:border-green-500"
                      : "border-gray-300 dark:border-gray-600 focus:border-purple-500"
                  }`}
                  placeholder="0.0015"
                />
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {auctionData.reservePrice &&
                    parseFloat(auctionData.reservePrice) <
                      parseFloat(auctionData.startPrice || "0") && (
                      <span className="text-red-500">
                        Must be ≥ start price
                      </span>
                    )}
                  {auctionData.reservePrice &&
                    parseFloat(auctionData.reservePrice) > 1000 && (
                      <span className="text-red-500">Maximum: 1000 ETH</span>
                    )}
                  {auctionData.reservePrice &&
                    parseFloat(auctionData.reservePrice) >=
                      parseFloat(auctionData.startPrice || "0") &&
                    parseFloat(auctionData.reservePrice) <= 1000 && (
                      <span className="text-green-500">
                        ✓ Valid reserve price
                      </span>
                    )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buy Now Price (ETH)
                  {auctionData.auctionType === AuctionType.DUTCH && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.000001"
                  min="0.000001"
                  max="1000"
                  value={auctionData.buyNowPrice}
                  onChange={(e) =>
                    setAuctionData((prev) => ({
                      ...prev,
                      buyNowPrice: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    auctionData.buyNowPrice &&
                    (parseFloat(auctionData.buyNowPrice) <
                      parseFloat(auctionData.startPrice || "0") ||
                      parseFloat(auctionData.buyNowPrice) > 1000)
                      ? "border-red-500 focus:border-red-500"
                      : auctionData.buyNowPrice &&
                        parseFloat(auctionData.buyNowPrice) >=
                          parseFloat(auctionData.startPrice || "0") &&
                        parseFloat(auctionData.buyNowPrice) <= 1000
                      ? "border-green-500 focus:border-green-500"
                      : "border-gray-300 dark:border-gray-600 focus:border-purple-500"
                  }`}
                  placeholder="0.003"
                />
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {auctionData.auctionType === AuctionType.DUTCH && (
                    <span className="text-orange-500">
                      Required for Dutch auctions
                    </span>
                  )}
                  {auctionData.buyNowPrice &&
                    parseFloat(auctionData.buyNowPrice) <
                      parseFloat(auctionData.startPrice || "0") && (
                      <span className="text-red-500">
                        Must be ≥ start price
                      </span>
                    )}
                  {auctionData.buyNowPrice &&
                    parseFloat(auctionData.buyNowPrice) > 1000 && (
                      <span className="text-red-500">Maximum: 1000 ETH</span>
                    )}
                  {auctionData.buyNowPrice &&
                    parseFloat(auctionData.buyNowPrice) >=
                      parseFloat(auctionData.startPrice || "0") &&
                    parseFloat(auctionData.buyNowPrice) <= 1000 && (
                      <span className="text-green-500">
                        ✓ Valid buy now price
                      </span>
                    )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bid Increment (ETH)
                  {auctionData.auctionType === AuctionType.SEALED_BID && (
                    <span className="text-gray-500 ml-1">(Not used)</span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.000001"
                  min="0.000001"
                  value={auctionData.bidIncrement}
                  onChange={(e) =>
                    setAuctionData((prev) => ({
                      ...prev,
                      bidIncrement: e.target.value,
                    }))
                  }
                  disabled={auctionData.auctionType === AuctionType.SEALED_BID}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    auctionData.auctionType === AuctionType.SEALED_BID
                      ? "opacity-50 cursor-not-allowed"
                      : auctionData.bidIncrement &&
                        (parseFloat(auctionData.bidIncrement) < 0.000001 ||
                          parseFloat(auctionData.bidIncrement) >
                            parseFloat(auctionData.startPrice || "0"))
                      ? "border-red-500 focus:border-red-500"
                      : auctionData.bidIncrement &&
                        parseFloat(auctionData.bidIncrement) >= 0.000001 &&
                        parseFloat(auctionData.bidIncrement) <=
                          parseFloat(auctionData.startPrice || "0")
                      ? "border-green-500 focus:border-green-500"
                      : "border-gray-300 dark:border-gray-600 focus:border-purple-500"
                  }`}
                  placeholder="0.000001"
                />
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {auctionData.auctionType === AuctionType.SEALED_BID && (
                    <span className="text-gray-500">
                      Not applicable for sealed bid auctions
                    </span>
                  )}
                  {auctionData.auctionType !== AuctionType.SEALED_BID &&
                    auctionData.bidIncrement &&
                    parseFloat(auctionData.bidIncrement) < 0.000001 && (
                      <span className="text-red-500">
                        Minimum: 0.000001 ETH (1 gwei)
                      </span>
                    )}
                  {auctionData.auctionType !== AuctionType.SEALED_BID &&
                    auctionData.bidIncrement &&
                    parseFloat(auctionData.bidIncrement) >
                      parseFloat(auctionData.startPrice || "0") && (
                      <span className="text-red-500">
                        Must be ≤ start price
                      </span>
                    )}
                  {auctionData.auctionType !== AuctionType.SEALED_BID &&
                    auctionData.bidIncrement &&
                    parseFloat(auctionData.bidIncrement) >= 0.000001 &&
                    parseFloat(auctionData.bidIncrement) <=
                      parseFloat(auctionData.startPrice || "0") && (
                      <span className="text-green-500">
                        ✓ Valid bid increment
                      </span>
                    )}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep("nft")}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600"
              >
                ← Back to NFT
              </button>
              <button
                onClick={handleAuctionCreationWithAlert}
                disabled={isProcessing}
                className={`px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                  isAuctionCreationReady()
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Auction...
                  </>
                ) : (
                  <>
                    {!isAuctionCreationReady() && (
                      <span className="text-yellow-300 mr-2">⚠️</span>
                    )}
                    Create Auction
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
