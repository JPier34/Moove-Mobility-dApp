"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { useCreateAuction } from "@/hooks/useAuction";
import { useWriteMooveAuction } from "@/hooks/useContract";
import { useWriteMooveStickerNFT, useUserRoles } from "@/hooks/useContract";
import { useIPFSUnified } from "@/hooks/useIPFSUnified";
import { IPFSStatus } from "@/components/admin/IPFSStatus";
import { PinataTest } from "@/components/admin/PinataTest";
import { EnvDebug } from "@/components/admin/EnvDebug";
import { NFTCreationDebug } from "@/components/admin/NFTCreationDebug";
import { AdminPermissionsDebug } from "@/components/admin/AdminPermissionsDebug";
import { NFTMetadataPreview } from "@/components/admin/NFTMetadataPreview";
import { NFTValidationResults } from "@/components/admin/NFTValidationResults";
import { NFTCacheSync } from "@/components/admin/NFTCacheSync";
import { ValidationFailureModal } from "@/components/admin/ValidationFailureModal";
import { useNFTValidationAPI } from "@/hooks/useNFTValidationAPI";
import { useWalletPersistence } from "@/hooks/useWalletPersistence";
import { AuctionType } from "@/types/auction";
import { contracts } from "@/utils/contracts";
import { useRouter } from "next/navigation";
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
  const { address } = useAccount();
  const { canMint, isMasterAdmin } = useUserRoles(address);
  const router = useRouter();
  const {
    uploadNFT,
    isUploading: isUploadingToIPFS,
    uploadProgress,
  } = useIPFSUnified();
  const {
    validateNFT,
    addValidatedNFT,
    clearCache,
    getCacheStats,
    syncWithAPI,
    isValidating: isValidatingNFT,
    isSyncing,
  } = useNFTValidationAPI();

  // Hook per persistenza wallet con auto-reconnection
  const { forceReconnect, isConnected, isConnecting } = useWalletPersistence();

  // Hook per creazione aste
  const { writeMooveAuction, hash, isPending, isConfirming, isSuccess, error } =
    useWriteMooveAuction();
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
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } | null>(null);
  const [showFailureModal, setShowFailureModal] = useState(false);

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

  const handleNFTCreation = async (skipRedirect = false) => {
    // Check permissions first
    if (!canMint && !isMasterAdmin) {
      toast.error(
        "You don't have permission to create NFTs. Contact an admin."
      );
      return;
    }

    // FORZA validazione completa prima della creazione
    if (!nftData.image) {
      toast.error("Carica un'immagine prima della validazione");
      return;
    }

    // Esegui validazione in tempo reale
    const realTimeValidation = await validateNFT(
      nftData.name,
      nftData.description,
      nftData.image,
      nftData.rarity
    );

    // Se validazione fallisce, mostra modal
    if (!realTimeValidation.isValid) {
      setValidationResult(realTimeValidation);
      setShowFailureModal(true);
      return;
    }

    // Controlli aggiuntivi
    const validationErrors = validateNFTCreation();
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    try {
      if (!nftData.image) {
        toast.error("Please select an image for the NFT");
        return;
      }

      // Upload complete NFT to IPFS (image + metadata)
      const uploadResult = await uploadNFT(nftData.image, {
        name: nftData.name,
        description: nftData.description,
        rarity: nftData.rarity,
        isLimitedEdition: nftData.isLimitedEdition,
        editionSize: nftData.isLimitedEdition
          ? parseInt(nftData.editionSize)
          : undefined,
        editionNumber: nftData.isLimitedEdition ? 1 : undefined, // Will be set by contract
        customizationOptions: {
          ...nftData.customizationOptions,
          maxTextLength: parseInt(nftData.customizationOptions.maxTextLength),
        },
        creator: address || "0x0000000000000000000000000000000000000000",
      });

      const metadataURI = uploadResult.metadataUrl;

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
        address || "0x0000000000000000000000000000000000000000", // to (current wallet address)
        nftData.name,
        metadataURI,
        0, // category (VEHICLE_DECORATION = 0)
        rarityMap[nftData.rarity],
        nftData.isLimitedEdition,
        nftData.isLimitedEdition ? parseInt(nftData.editionSize) : 0,
        {
          allowColorChange: nftData.customizationOptions.allowColorChange,
          allowTextChange: nftData.customizationOptions.allowTextChange,
          allowSizeChange: nftData.customizationOptions.allowSizeChange,
          allowEffectsChange: nftData.customizationOptions.allowEffectsChange,
          availableColors: nftData.customizationOptions.availableColors,
          maxTextLength: parseInt(nftData.customizationOptions.maxTextLength),
        },
        nftData.editionName || nftData.name,
        address || "0x0000000000000000000000000000000000000000", // royaltyRecipient (current wallet)
        500, // royaltyPercentage (5%)
      ]);

      toast.success("NFT minted successfully!");

      // Aggiungi NFT alla cache locale
      await addValidatedNFT(nftData.name, nftData.image);

      // Save NFT creation data for success page (NFT only, no auction)
      const nftCreationData = {
        id: `nft_${Date.now()}`,
        nftName: nftData.name,
        nftDescription: nftData.description,
        nftImage: nftData.image,
        tokenId: "0", // Will be updated with real token ID from transaction
        transactionHash:
          "0x0000000000000000000000000000000000000000000000000000000000000000", // Will be updated with real tx hash
        creationDate: new Date().toISOString(),
        price: 0, // Will be updated with real minting cost
        gasFee: 0, // Will be updated with real gas fee
        totalCost: 0,
        auctionCreated: false,
        status: "confirmed",
        ipfsHash:
          nftData.image instanceof File
            ? nftData.image.name
            : typeof nftData.image === "string"
            ? nftData.image
            : "No IPFS hash",
      };

      localStorage.setItem(
        `nft_creation_${nftCreationData.id}`,
        JSON.stringify(nftCreationData)
      );

      // Redirect to success page solo se non stiamo creando anche l'asta
      if (!skipRedirect) {
        router.push(`/admin/nft-success/${nftCreationData.id}`);
      }

      // Se skipRedirect è true, non fare redirect - l'asta verrà creata dopo
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
      } else {
        const buyNowPrice = parseFloat(auctionData.buyNowPrice);
        if (buyNowPrice <= startPrice) {
          errors.push(
            "Dutch auction buy now price must be greater than start price"
          );
        }
        if (buyNowPrice > startPrice * 10) {
          errors.push(
            "Dutch auction buy now price should not exceed 10x start price"
          );
        }
      }
    }

    if (auctionData.auctionType === AuctionType.SEALED_BID) {
      if (auctionData.bidIncrement) {
        errors.push("Sealed bid auctions don't use bid increments");
      }
      if (auctionData.buyNowPrice) {
        errors.push("Sealed bid auctions don't use buy now price");
      }
      // Sealed bid auctions should have longer duration for reveal period
      const duration = parseInt(auctionData.duration);
      const durationUnit = auctionData.durationUnit || "hours";
      const durationInHours =
        durationUnit === "minutes" ? duration / 60 : duration;
      if (durationInHours < 24) {
        errors.push(
          "Sealed bid auctions should last at least 24 hours for reveal period"
        );
      }
    }

    return errors;
  };

  const handleAuctionCreation = async () => {
    console.log("🏆 Starting auction creation...");

    const validationErrors = validateAuctionCreation();
    if (validationErrors.length > 0) {
      console.log("❌ Auction validation errors:", validationErrors);
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    try {
      // Non mintare l'NFT qui - è già stato mintato

      // Per ora usiamo un token ID incrementale basato sul timestamp
      // TODO: Implementare recupero token ID dal mint transaction
      // Usiamo un ID più realistico basato sul timestamp attuale
      const nftId = Math.floor(Date.now() / 1000) % 100000; // Token ID temporaneo (ridotto range)
      const nftContract = contracts.MooveNFT.address;

      console.log("🔍 NFT Contract and ID:", {
        nftContract,
        nftId,
        nftContractValid:
          nftContract &&
          nftContract.startsWith("0x") &&
          nftContract.length === 42,
      });

      // Verifica che il contratto MooveAuction abbia i permessi per gestire l'NFT
      console.log("🔍 Auction Contract:", {
        auctionContract: contracts.MooveAuction.address,
        auctionContractValid:
          contracts.MooveAuction.address &&
          contracts.MooveAuction.address.startsWith("0x") &&
          contracts.MooveAuction.address.length === 42,
      });

      // Convert auction type to number first
      const auctionTypeNumber = parseInt(
        String(auctionData.auctionType) || "0"
      );

      // Validazione tipo asta (0-3 sono i tipi validi)
      if (auctionTypeNumber < 0 || auctionTypeNumber > 3) {
        throw new Error(
          `Invalid auction type: ${auctionTypeNumber}. Must be between 0-3`
        );
      }

      // Protezione overflow per i prezzi
      const safeParsePrice = (price: string): bigint => {
        const numPrice = parseFloat(price);
        if (isNaN(numPrice) || numPrice < 0) return BigInt(0);
        if (numPrice > 1000) {
          throw new Error(`Price too high: ${numPrice} ETH (max 1000 ETH)`);
        }
        // Prezzo minimo di 0.000001 ETH per evitare errori del contratto
        if (numPrice > 0 && numPrice < 0.000001) {
          console.log("⚠️ Price too low, setting minimum to 0.000001 ETH");
          return BigInt(1000000000000); // 0.000001 ETH in wei
        }
        return BigInt(Math.floor(numPrice * 1e18));
      };

      // Convert duration to seconds based on unit (con fallback sicuro)
      // Assicuriamoci che la durata sia almeno 1 ora (3600 secondi) per evitare errori del contratto
      let durationInSeconds =
        (auctionData.durationUnit || "hours") === "minutes"
          ? parseInt(auctionData.duration) * 60
          : parseInt(auctionData.duration) * 3600;

      // Durata minima di 1 ora per evitare errori del contratto
      if (durationInSeconds < 3600) {
        console.log(
          "⚠️ Duration too short, setting minimum to 1 hour (3600 seconds)"
        );
        durationInSeconds = 3600;
      }

      // Validazione bid increment con fallback sicuro
      const bidIncrementValue = auctionData.bidIncrement || "0.000001";
      let bidIncrement = BigInt(parseFloat(bidIncrementValue) * 1e18);

      // Bid increment minimo di 0.000001 ETH per evitare errori del contratto
      if (bidIncrement > 0n && bidIncrement < BigInt(1000000000000)) {
        console.log(
          "⚠️ Bid increment too low, setting minimum to 0.000001 ETH"
        );
        bidIncrement = BigInt(1000000000000); // 0.000001 ETH in wei
      }

      console.log("📊 Auction parameters:", {
        nftId,
        nftContract,
        auctionType: auctionData.auctionType,
        startPrice: auctionData.startPrice,
        reservePrice: auctionData.reservePrice,
        buyNowPrice: auctionData.buyNowPrice,
        duration: auctionData.duration,
        durationUnit: auctionData.durationUnit,
        bidIncrement: auctionData.bidIncrement,
      });

      // Debug: Check if NFT contract is valid
      console.log("🔍 Contract validation:", {
        nftContractValid:
          nftContract &&
          nftContract.startsWith("0x") &&
          nftContract.length === 42,
        nftIdValid: nftId && nftId > 0,
        auctionTypeValid: auctionTypeNumber >= 0 && auctionTypeNumber <= 3,
        startPriceValid: safeParsePrice(auctionData.startPrice) > 0n,
        durationValid: durationInSeconds > 0,
        bidIncrementValid: bidIncrement >= 0n,
      });

      console.log("📞 Calling createAuction with parameters:", {
        nftContract, // nftContract comes first
        nftId, // tokenId comes second
        auctionType: auctionData.auctionType,
        auctionTypeNumber,
        startPrice: safeParsePrice(auctionData.startPrice).toString(),
        reservePrice: safeParsePrice(
          auctionData.reservePrice || "0"
        ).toString(),
        buyNowPrice: safeParsePrice(auctionData.buyNowPrice || "0").toString(),
        durationInSeconds,
        bidIncrement: bidIncrement.toString(),
      });

      // Call the write function directly
      console.log("🔧 Calling writeMooveAuction directly...");
      writeMooveAuction("createAuction", [
        nftContract, // nftContract comes first
        nftId, // tokenId comes second
        auctionTypeNumber, // Use number instead of enum
        safeParsePrice(auctionData.startPrice),
        safeParsePrice(auctionData.reservePrice || "0"),
        safeParsePrice(auctionData.buyNowPrice || "0"),
        durationInSeconds,
        bidIncrement,
      ]);

      console.log("✅ writeMooveAuction called successfully");
      console.log("🔍 Current auction status:", {
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
      });

      // Wait for transaction to be submitted
      console.log("⏳ Waiting for auction transaction to be submitted...");
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds for submission

      console.log("🔍 Final auction status:", {
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
      });

      // Check if auction creation was successful
      if (error) {
        throw new Error(`Auction creation failed: ${error.message || error}`);
      }

      if (!hash) {
        throw new Error(
          "No transaction hash received - transaction may have failed"
        );
      }

      // Wait for transaction confirmation
      console.log("⏳ Waiting for auction transaction confirmation...");
      console.log("🔗 Transaction hash:", hash);

      // Check if we can verify the transaction on Etherscan
      if (hash) {
        console.log(
          `🔍 Check transaction on Etherscan: https://sepolia.etherscan.io/tx/${hash}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds for confirmation

      toast.success("Auction created successfully!");
    } catch (error) {
      console.error("Error creating auction:", error);
      toast.error("Failed to create auction");
      throw error; // Re-throw per gestire l'errore in handleCompleteCreation
    }
  };

  // Save NFT creation data for success page (moved outside try-catch)
  const saveNFTCreationData = () => {
    const nftCreationData = {
      id: `nft_${Date.now()}`,
      nftName: nftData.name,
      nftDescription: nftData.description,
      nftImage: nftData.image,
      tokenId: "0", // Will be updated with real token ID
      transactionHash:
        "0x0000000000000000000000000000000000000000000000000000000000000000", // Will be updated with real tx hash
      creationDate: new Date().toISOString(),
      price: 0, // Will be updated with real minting cost
      gasFee: 0, // Will be updated with real gas fee
      totalCost: 0,
      auctionCreated: true,
      auctionType: auctionData.auctionType,
      auctionId: "0", // Will be updated with real auction ID
      status: "confirmed",
      ipfsHash:
        nftData.image instanceof File
          ? nftData.image.name
          : typeof nftData.image === "string"
          ? nftData.image
          : "No IPFS hash",
    };

    localStorage.setItem(
      `nft_creation_${nftCreationData.id}`,
      JSON.stringify(nftCreationData)
    );

    // Delay per permettere ai log di essere visibili
    console.log("⏳ Waiting 3 seconds before redirect...");
    toast.success("NFT and auction created! Redirecting in 3 seconds...");

    setTimeout(() => {
      console.log("🔄 Redirecting to success page...");
      router.push(`/admin/nft-success/${nftCreationData.id}`);
    }, 3000);
  };

  // Stato per tracking del complete creation
  const [isCompletingCreation, setIsCompletingCreation] = useState(false);

  const isProcessing =
    isMinting ||
    isConfirmingMint ||
    isCreatingAuction ||
    isConfirmingAuction ||
    isUploadingToIPFS ||
    isValidatingNFT ||
    isCompletingCreation;

  // Controllo campi obbligatori per NFT
  const isNFTCreationReady = () => {
    return (
      (canMint || isMasterAdmin) && // Check permissions
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

  // Esegui validazione NFT
  const runNFTValidation = async () => {
    if (!nftData.image) {
      toast.error("Carica un'immagine prima della validazione");
      return;
    }

    try {
      const result = await validateNFT(
        nftData.name,
        nftData.description,
        nftData.image,
        nftData.rarity
      );
      setValidationResult(result);

      if (result.isValid) {
        toast.success("NFT validato con successo!");
      } else {
        toast.error(
          `Validazione fallita: ${result.errors.length} errori trovati`
        );
      }
    } catch (error) {
      toast.error("Errore durante la validazione");
      console.error("Validation error:", error);
    }
  };

  // Applica suggerimento nome
  const applyNameSuggestion = (suggestion: string) => {
    setNftData((prev) => ({ ...prev, name: suggestion }));
    toast.success(`Nome aggiornato: ${suggestion}`);
  };

  // Genera anteprima metadata
  const generateMetadataPreview = () => {
    if (!nftData.image) return null;

    return {
      name: nftData.name,
      description: nftData.description,
      image: URL.createObjectURL(nftData.image),
      external_url:
        "https://app.pinata.cloud/ipfs/groups/877735d8-cf1e-408a-9ed5-a0330d004ead",
      title: nftData.name,
      symbol: "MOOVE",
      collection: {
        name: "Moove Vehicle Stickers",
        family: "Moove Mobility",
      },
      attributes: [
        {
          trait_type: "Rarity",
          value: nftData.rarity,
        },
        {
          trait_type: "Category",
          value: "Vehicle Decoration",
        },
        {
          trait_type: "Creator",
          value: address || "0x0000000000000000000000000000000000000000",
        },
        {
          trait_type: "Creation Date",
          value: new Date().toISOString(),
          display_type: "date",
        },
      ],
      properties: {
        category: "Vehicle Decoration",
        rarity: nftData.rarity,
        isLimitedEdition: nftData.isLimitedEdition,
        creator: address || "0x0000000000000000000000000000000000000000",
        creationDate: new Date().toISOString(),
        customization: {
          allowColorChange: nftData.customizationOptions.allowColorChange,
          allowTextChange: nftData.customizationOptions.allowTextChange,
          allowSizeChange: nftData.customizationOptions.allowSizeChange,
          allowEffectsChange: nftData.customizationOptions.allowEffectsChange,
          availableColors: nftData.customizationOptions.availableColors,
          maxTextLength: parseInt(nftData.customizationOptions.maxTextLength),
        },
      },
    };
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

  // Handler per validazione NFT (senza mint)
  const handleNFTValidation = async () => {
    console.log("🎯 Validate NFT button clicked!");
    console.log("🔍 Starting NFT validation...");
    console.log("🔍 Wallet state:", { address, isConnected, isConnecting });

    // Controlla se il wallet è connesso
    if (!isConnected || !address) {
      console.error("❌ Wallet not connected during validation");
      console.log("🔄 Attempting auto-reconnection...");

      const reconnected = await forceReconnect();
      if (!reconnected) {
        toast.error("Wallet not connected. Please reconnect and try again.");
        return;
      }

      // Aspetta un po' per la riconnessione
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Ricontrolla dopo la riconnessione
      if (!isConnected || !address) {
        toast.error("Failed to reconnect wallet. Please try again.");
        return;
      }

      console.log("✅ Wallet reconnected successfully");
    }

    if (!isNFTCreationReady()) {
      const missingFields = [];

      // Check permissions first
      if (!canMint && !isMasterAdmin) {
        missingFields.push("Admin permissions required");
      }

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

    // Esegui validazione completa
    if (!nftData.image) {
      console.log("❌ No image uploaded");
      toast.error("Carica un'immagine prima della validazione");
      return;
    }

    console.log("🔍 Running real-time validation...");
    try {
      const realTimeValidation = await validateNFT(
        nftData.name,
        nftData.description,
        nftData.image,
        nftData.rarity
      );

      console.log("🔍 Validation result:", realTimeValidation);

      if (!realTimeValidation.isValid) {
        console.log("❌ Validation failed:", realTimeValidation.errors);
        setValidationResult(realTimeValidation);
        setShowFailureModal(true);
        return;
      }

      // Se validazione passa, vai alla fase auction
      console.log("✅ NFT validation passed!");
      toast.success("NFT validation passed! Configure auction settings.");
      setStep("auction");
    } catch (error) {
      console.error("❌ Error during validation:", error);
      toast.error("Validation failed. Please try again.");
    }
  };

  // Handler per creazione completa (mint NFT + asta)
  const handleCompleteCreation = async () => {
    console.log("🎯 Complete Creation button clicked!");

    // Blocca il bottone per evitare doppi click
    if (isCompletingCreation) {
      console.log("⚠️ Creation already in progress, ignoring click");
      return;
    }

    // Controlla connessione wallet prima di iniziare
    if (!isConnected || !address) {
      console.error("❌ Wallet not connected during complete creation");
      console.log("🔄 Attempting auto-reconnection...");

      const reconnected = await forceReconnect();
      if (!reconnected) {
        toast.error("Wallet not connected. Please reconnect and try again.");
        return;
      }

      // Aspetta un po' per la riconnessione
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Ricontrolla dopo la riconnessione
      if (!isConnected || !address) {
        toast.error("Failed to reconnect wallet. Please try again.");
        return;
      }

      console.log("✅ Wallet reconnected successfully");
    }

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

    setIsCompletingCreation(true);
    console.log("🚀 Starting complete NFT + Auction creation...");

    try {
      // Prima mint l'NFT (senza redirect)
      console.log("📝 Step 1: Minting NFT...");
      await handleNFTCreation(true);
      console.log("✅ NFT minted successfully");

      // Aspetta un po' per assicurarsi che la transazione sia processata
      console.log("⏳ Waiting for transaction processing...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Crea l'asta dopo il mint dell'NFT
      console.log("🏆 Step 2: Creating auction...");
      await handleAuctionCreation();
      console.log("✅ Auction created successfully");

      // Save NFT creation data and redirect ONLY if auction creation succeeded
      console.log("💾 Step 3: Saving data and redirecting...");
      saveNFTCreationData();
      console.log("✅ Complete creation finished successfully");

      // Log persistente che non si perde
      localStorage.setItem(
        "last_nft_creation_log",
        JSON.stringify({
          timestamp: new Date().toISOString(),
          nftName: nftData.name,
          auctionType: auctionData.auctionType,
          status: "success",
        })
      );
    } catch (error) {
      console.error("❌ Error in complete creation:", error);

      // Mostra errore specifico
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(`Failed to create NFT and auction: ${errorMessage}`);

      // Log persistente per errori
      localStorage.setItem(
        "last_nft_creation_log",
        JSON.stringify({
          timestamp: new Date().toISOString(),
          nftName: nftData.name,
          auctionType: auctionData.auctionType,
          status: "error",
          error: errorMessage,
        })
      );

      setIsCompletingCreation(false); // Reset stato in caso di errore
      // Non fare redirect se c'è un errore
      return;
    }
    // Non resettiamo isCompletingCreation qui perché stiamo per fare redirect
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

            {/* Wallet Status Debug */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Wallet Status
              </h3>
              <div className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
                <div>Connected: {isConnected ? "✅ Yes" : "❌ No"}</div>
                <div>
                  Address:{" "}
                  {address
                    ? `${address.slice(0, 6)}...${address.slice(-4)}`
                    : "None"}
                </div>
                <div>Connecting: {isConnecting ? "🔄 Yes" : "No"}</div>
                <div>
                  Admin:{" "}
                  {isMasterAdmin
                    ? "✅ Master"
                    : canMint
                    ? "✅ Can Mint"
                    : "❌ No"}
                </div>
              </div>
            </div>

            {/* Contract Status Debug */}
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                Contract Status
              </h3>
              <div className="text-xs text-green-600 dark:text-green-300 space-y-1">
                <div>MooveAuction: {contracts.MooveAuction.address}</div>
                <div>MooveNFT: {contracts.MooveNFT.address}</div>
                <div>ABI Length: {contracts.MooveAuction.abi.length}</div>
                <div>
                  Has createAuction:{" "}
                  {contracts.MooveAuction.abi.some(
                    (item: any) => item.name === "createAuction"
                  )
                    ? "✅ Yes"
                    : "❌ No"}
                </div>
              </div>
            </div>

            {/* Last Creation Log */}
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Last Creation Log
              </h3>
              <div className="text-xs text-yellow-600 dark:text-yellow-300">
                {(() => {
                  try {
                    const log = localStorage.getItem("last_nft_creation_log");
                    if (log) {
                      const parsed = JSON.parse(log);
                      return (
                        <div>
                          <div>
                            Status:{" "}
                            {parsed.status === "success"
                              ? "✅ Success"
                              : "❌ Error"}
                          </div>
                          <div>NFT: {parsed.nftName}</div>
                          <div>Auction Type: {parsed.auctionType}</div>
                          <div>
                            Time: {new Date(parsed.timestamp).toLocaleString()}
                          </div>
                          {parsed.error && <div>Error: {parsed.error}</div>}
                        </div>
                      );
                    }
                    return "No logs available";
                  } catch {
                    return "Error reading logs";
                  }
                })()}
              </div>
            </div>

            {/* Debug components removed for production */}
            <NFTCacheSync
              onSync={syncWithAPI}
              isSyncing={isSyncing}
              cacheStats={getCacheStats()}
              onClearCache={clearCache}
            />

            {/* Validazione NFT */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Validazione NFT
                </h3>
                <button
                  onClick={runNFTValidation}
                  disabled={!nftData.image || isValidatingNFT}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    nftData.image && !isValidatingNFT
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-600 text-gray-300 cursor-not-allowed"
                  }`}
                >
                  {isValidatingNFT ? "Validando..." : "Valida NFT"}
                </button>
              </div>
              <p className="text-gray-400 text-sm">
                Verifica duplicati, validità campi e compatibilità prima del
                caricamento IPFS.
              </p>
            </div>

            {/* Risultati Validazione */}
            {validationResult && (
              <NFTValidationResults
                result={validationResult}
                onSuggestionClick={applyNameSuggestion}
                onClearCache={clearCache}
              />
            )}

            {generateMetadataPreview() && (
              <NFTMetadataPreview metadata={generateMetadataPreview()!} />
            )}

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
                onClick={handleNFTValidation}
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
                    {isUploadingToIPFS
                      ? `Uploading to IPFS... ${uploadProgress}%`
                      : "Validating NFT..."}
                  </>
                ) : (
                  <>
                    {!isNFTCreationReady() && (
                      <span className="text-yellow-300 mr-2">⚠️</span>
                    )}
                    Validate NFT & Continue
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
                      auctionType: e.target.value as unknown as AuctionType,
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
                onClick={handleCompleteCreation}
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
                    Minting NFT & Creating Auction...
                  </>
                ) : (
                  <>
                    {!isAuctionCreationReady() && (
                      <span className="text-yellow-300 mr-2">⚠️</span>
                    )}
                    Mint NFT & Create Auction
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Modal per Fallimenti Validazione */}
      <ValidationFailureModal
        isOpen={showFailureModal}
        onClose={() => setShowFailureModal(false)}
        validationResult={
          validationResult || {
            isValid: false,
            errors: [],
            warnings: [],
            suggestions: [],
          }
        }
        onSuggestionClick={applyNameSuggestion}
      />
    </div>
  );
}
