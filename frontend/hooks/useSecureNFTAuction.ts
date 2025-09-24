"use client";

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { AuctionType } from "@/types/auction";
import { contracts } from "@/utils/contracts";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface MintResult {
  tokenId: bigint;
  transactionHash: string;
  blockNumber: number;
  owner: string;
}

interface AuctionParams {
  nftContract: string;
  tokenId: bigint;
  auctionType: number;
  startPrice: bigint;
  reservePrice: bigint;
  buyNowPrice: bigint;
  duration: number;
  bidIncrement: bigint;
  extensionThreshold: number; // Required by contract
  extensionDuration: number; // Required by contract
}

interface FlowResult {
  nft: {
    tokenId: bigint;
    transactionHash: string;
    owner: string;
  };
  auction: {
    auctionId: bigint;
    transactionHash: string;
  };
}

// ============================================================================
// SECURE NFT MINTING WITH EVENT PARSING
// ============================================================================

/**
 * Mint NFT e ottieni l'ID reale dagli eventi blockchain
 */
async function secureNFTMint(
  nftContract: ethers.Contract,
  mintParams: any[]
): Promise<MintResult> {
  console.log("🎨 Starting secure NFT mint...");

  try {
    // 0. Check if caller has MINTER_ROLE
    console.log("🔍 Checking MINTER_ROLE...");
    const callerAddress = mintParams[0];

    // Get access control contract
    if (!window.ethereum) {
      throw new Error("No ethereum provider available");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const accessControlContract = new ethers.Contract(
      contracts.MooveAccessControl.address,
      contracts.MooveAccessControl.abi,
      provider
    );

    // Check MINTER_ROLE and MASTER_ADMIN_ROLE
    const MINTER_ROLE = await accessControlContract.MINTER_ROLE();
    const MASTER_ADMIN_ROLE = await accessControlContract.MASTER_ADMIN_ROLE();

    const hasMinterRole = await accessControlContract.hasRole(
      MINTER_ROLE,
      callerAddress
    );
    const hasMasterAdminRole = await accessControlContract.hasRole(
      MASTER_ADMIN_ROLE,
      callerAddress
    );

    console.log("📋 Role check result:", {
      callerAddress,
      MINTER_ROLE,
      MASTER_ADMIN_ROLE,
      hasMinterRole,
      hasMasterAdminRole,
      accessControlAddress: contracts.MooveAccessControl.address,
    });

    if (!hasMinterRole && !hasMasterAdminRole) {
      throw new Error(
        `Account ${callerAddress} does not have MINTER_ROLE or MASTER_ADMIN_ROLE. Cannot mint NFT.`
      );
    }

    console.log("✅ MINTER_ROLE confirmed, proceeding with mint...");

    // 1. Esegui la transazione di mint
    // La funzione mintNFT richiede: to (address) e metadataURI (string)
    const tx = await nftContract.mintNFT(
      mintParams[0] || "", // to: indirizzo del chiamante
      mintParams[1] || "" // metadataURI: URL dei metadati
    );
    console.log("📡 Mint transaction sent:", tx.hash);

    // 2. Aspetta la conferma della transazione
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);

    // 3. Parsing sicuro degli eventi per ottenere l'ID reale
    console.log("🔍 Total logs in receipt:", receipt.logs.length);
    console.log("📋 All logs:", receipt.logs);

    const transferEvents = receipt.logs
      .map((log: any) => {
        try {
          const parsed = nftContract.interface.parseLog(log);
          console.log("✅ Parsed log:", parsed);
          return parsed;
        } catch (error) {
          console.log("❌ Failed to parse log:", log, "Error:", error);
          return null;
        }
      })
      .filter((event: any) => {
        console.log("🔍 Checking event:", event);
        if (event?.name === "Transfer") {
          console.log("📤 Transfer event found:", event);
          console.log("📤 From:", event.args.from);
          console.log("📤 To:", event.args.to);
          console.log("📤 TokenId:", event.args.tokenId);
          console.log("📤 ZeroAddress:", ethers.ZeroAddress);
          console.log(
            "📤 Is mint event:",
            event.args.from === ethers.ZeroAddress
          );
        }
        return (
          event?.name === "Transfer" && event.args.from === ethers.ZeroAddress
        ); // Mint event
      });

    if (transferEvents.length === 0) {
      throw new Error("No Transfer event found in transaction");
    }

    // 4. Estrai l'ID del token dall'evento
    const transferEvent = transferEvents[0];
    const tokenId = transferEvent.args.tokenId;
    const owner = transferEvent.args.to;

    console.log("🆔 Real token ID from blockchain:", tokenId.toString());
    console.log("👤 Token owner:", owner);

    // 5. Verifica doppia che il token esista effettivamente
    const actualOwner = await nftContract.ownerOf(tokenId);
    if (actualOwner !== owner) {
      throw new Error(`Owner mismatch: expected ${owner}, got ${actualOwner}`);
    }

    // 6. Verifica i metadati del token
    try {
      const tokenURI = await nftContract.tokenURI(tokenId);
      console.log("🔗 Token URI:", tokenURI);
    } catch (error) {
      console.warn("⚠️ Could not fetch token URI:", error);
    }

    // 7. Emit custom event to prevent duplicate notifications
    // This ensures the notification system knows this is a mint, not a transfer
    const mintEvent = new CustomEvent("nftMinted", {
      detail: {
        tokenId: tokenId.toString(),
        owner: owner,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        isMint: true, // Flag to distinguish from transfers
      },
    });
    window.dispatchEvent(mintEvent);

    return {
      tokenId,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      owner,
    };
  } catch (error) {
    console.error("❌ Secure NFT mint failed:", error);
    throw error;
  }
}

// ============================================================================
// OWNERSHIP VERIFICATION BEFORE OPERATIONS
// ============================================================================

/**
 * Verifica ownership di un NFT prima di operazioni critiche
 */
async function verifyNFTOwnership(
  nftContract: ethers.Contract,
  tokenId: bigint,
  expectedOwner: string
): Promise<boolean> {
  try {
    console.log("🔒 Verifying NFT ownership...", {
      tokenId: tokenId.toString(),
      expectedOwner,
    });

    const actualOwner = await nftContract.ownerOf(tokenId);
    const isOwner = actualOwner.toLowerCase() === expectedOwner.toLowerCase();

    console.log("🔍 Ownership check result:", {
      actualOwner,
      expectedOwner,
      isOwner,
    });

    return isOwner;
  } catch (error) {
    console.error("❌ Ownership verification failed:", error);
    return false;
  }
}

// ============================================================================
// SECURE APPROVAL PROCESS
// ============================================================================

/**
 * Approva un NFT per il contratto asta con verifiche di sicurezza
 */
async function secureNFTApproval(
  nftContract: ethers.Contract,
  tokenId: bigint,
  auctionContractAddress: string,
  ownerAddress: string
): Promise<string> {
  console.log("🔐 Starting secure NFT approval...");

  // 1. Verifica ownership prima dell'approvazione
  const isOwner = await verifyNFTOwnership(nftContract, tokenId, ownerAddress);
  if (!isOwner) {
    throw new Error(`Cannot approve: you don't own token ${tokenId}`);
  }

  // 2. Controlla se è già approvato
  const currentApproval = await nftContract.getApproved(tokenId);
  if (currentApproval.toLowerCase() === auctionContractAddress.toLowerCase()) {
    console.log("✅ NFT already approved for auction contract");
    return "already-approved";
  }

  // 3. Esegui l'approvazione
  try {
    console.log("🔄 Sending approval transaction...");
    const tx = await nftContract.approve(auctionContractAddress, tokenId);
    console.log("📡 Approval transaction sent:", tx.hash);

    console.log("⏳ Waiting for approval confirmation...");
    const receipt = await tx.wait();
    console.log("✅ Approval confirmed in block:", receipt.blockNumber);

    // 4. Verifica che l'approvazione sia effettiva
    console.log("🔍 Verifying approval...");
    const newApproval = await nftContract.getApproved(tokenId);
    console.log("📊 Approval verification:", {
      newApproval,
      auctionContractAddress,
      isApproved:
        newApproval.toLowerCase() === auctionContractAddress.toLowerCase(),
    });

    if (newApproval.toLowerCase() !== auctionContractAddress.toLowerCase()) {
      throw new Error("Approval verification failed");
    }

    console.log("✅ NFT successfully approved for auction");
    return receipt.hash;
  } catch (error) {
    console.error("❌ NFT approval failed:", error);
    throw error;
  }
}

// ============================================================================
// PARAMETER VALIDATION
// ============================================================================

function validateAuctionParams(params: AuctionParams): void {
  // Validazione tipo asta (ENGLISH=0, DUTCH=1, SEALED_BID=2, RESERVE=3)
  if (params.auctionType < 0 || params.auctionType > 3) {
    throw new Error(`Invalid auction type: ${params.auctionType}`);
  }

  // Validazione prezzi base
  if (params.startPrice <= 0n) {
    throw new Error("Start price must be greater than 0");
  }

  // Validazione durata
  if (params.duration < 60) {
    throw new Error("Duration must be at least 1 minute");
  }
  if (params.duration > 30 * 24 * 3600) {
    throw new Error("Duration cannot exceed 30 days");
  }

  // Validazione bid increment (solo per tipi di asta che lo usano)
  console.log(
    "🔍 [VALIDATION DEBUG] Auction type:",
    params.auctionType,
    "Bid increment:",
    params.bidIncrement
  );
  if (params.auctionType !== 2 && params.auctionType !== 1) {
    // Non SEALED_BID (2) and non DUTCH (1) - only English (0) and Reserve (3)
    if (params.bidIncrement <= 0n) {
      throw new Error("Bid increment must be greater than 0");
    }
    if (params.bidIncrement > params.startPrice) {
      throw new Error("Bid increment cannot exceed start price");
    }
  } else {
    console.log(
      "✅ [VALIDATION DEBUG] Skipping bidIncrement validation for SEALED_BID or DUTCH auction"
    );
  }

  // ========================================
  // VALIDAZIONI SPECIFICHE PER TIPO ASTA
  // ========================================

  // DUTCH AUCTION (tipo 1)
  if (params.auctionType === 1) {
    // Dutch auctions don't use reserve price or buy now price
    // They start high and decrease to 0 or until someone buys
    // No validation needed for Dutch auctions
    console.log(
      "✅ [VALIDATION DEBUG] Dutch auction - no additional validation needed"
    );
  }

  // ENGLISH AUCTION (tipo 0)
  else if (params.auctionType === 0) {
    // Se reserve price è fornito, deve essere >= start price
    if (params.reservePrice > 0n && params.reservePrice < params.startPrice) {
      throw new Error("English auction reserve price must be >= start price");
    }
    // Se buyNowPrice è fornito, deve essere >= start price
    if (params.buyNowPrice > 0n && params.buyNowPrice < params.startPrice) {
      throw new Error("English auction buyNowPrice must be >= start price");
    }
  }

  // SEALED_BID AUCTION (tipo 2)
  else if (params.auctionType === 2) {
    // Non dovrebbe avere reserve price o buyNowPrice
    if (params.reservePrice > 0n) {
      throw new Error("Sealed bid auction should not have reserve price");
    }
    if (params.buyNowPrice > 0n) {
      throw new Error("Sealed bid auction should not have buy now price");
    }
  }

  // RESERVE AUCTION (tipo 3)
  else if (params.auctionType === 3) {
    // Reserve price è obbligatorio e deve essere >= start price
    if (params.reservePrice <= 0n) {
      throw new Error("Reserve auction requires reserve price");
    }
    if (params.reservePrice < params.startPrice) {
      throw new Error("Reserve auction reserve price must be >= start price");
    }
    // Se buyNowPrice è fornito, deve essere >= start price
    if (params.buyNowPrice > 0n && params.buyNowPrice < params.startPrice) {
      throw new Error("Reserve auction buyNowPrice must be >= start price");
    }
  }
}

// ============================================================================
// SECURE AUCTION CREATION
// ============================================================================

/**
 * Crea un'asta con verifiche complete di sicurezza
 */
async function secureAuctionCreation(
  auctionContract: ethers.Contract,
  nftContract: ethers.Contract,
  params: AuctionParams,
  userAddress: string
): Promise<{ auctionId: bigint; transactionHash: string }> {
  console.log("🏆 Starting secure auction creation...");

  // 1. Verifica ownership del NFT
  const isOwner = await verifyNFTOwnership(
    nftContract,
    params.tokenId,
    userAddress
  );
  if (!isOwner) {
    throw new Error(
      `Cannot create auction: you don't own token ${params.tokenId}`
    );
  }

  // 2. Verifica approvazione
  const approved = await nftContract.getApproved(params.tokenId);
  const isApprovedForAll = await nftContract.isApprovedForAll(
    userAddress,
    auctionContract.target
  );

  if (approved !== auctionContract.target && !isApprovedForAll) {
    throw new Error("NFT not approved for auction contract");
  }

  // 3. Validazione parametri asta
  validateAuctionParams(params);

  // 4. Crea l'asta
  try {
    // First, let's test if the contract is accessible
    console.log("🔍 Testing contract accessibility...");
    try {
      const totalAuctions = await auctionContract.totalAuctions();
      console.log(
        "✅ Contract accessible, total auctions:",
        totalAuctions.toString()
      );
    } catch (testError) {
      console.error("❌ Contract not accessible:", testError);
      throw new Error(
        `Contract not accessible: ${
          testError instanceof Error ? testError.message : String(testError)
        }`
      );
    }

    // Test if createAuction function exists
    console.log("🔍 Testing createAuction function existence...");
    try {
      // Try to get the function signature
      const createAuctionFunction =
        auctionContract.interface.getFunction("createAuction");
      if (createAuctionFunction) {
        console.log(
          "✅ createAuction function exists:",
          createAuctionFunction.format()
        );
      }
    } catch (functionError) {
      console.error("❌ createAuction function not found:", functionError);

      // List all available functions
      console.log("🔍 Available functions in contract:");
      const functions = auctionContract.interface.fragments;
      Object.keys(functions).forEach((funcName) => {
        const fragment = (functions as any)[funcName];
        if (fragment && typeof fragment.format === "function") {
          console.log(`  - ${funcName}: ${fragment.format()}`);
        }
      });

      throw new Error(
        `createAuction function not found: ${
          functionError instanceof Error
            ? functionError.message
            : String(functionError)
        }`
      );
    }

    console.log("🔍 Calling createAuction with params:", {
      nftContract: params.nftContract,
      tokenId: params.tokenId.toString(),
      auctionType: params.auctionType,
      startPrice: params.startPrice.toString(),
      reservePrice: params.reservePrice.toString(),
      buyNowPrice: params.buyNowPrice.toString(),
      duration: params.duration.toString(),
      bidIncrement: params.bidIncrement.toString(),
      extensionThreshold: params.extensionThreshold.toString(),
      extensionDuration: params.extensionDuration.toString(),
    });

    // Test both 8 and 10 parameters to see which one works
    console.log("🔍 Testing createAuction with different parameter counts...");

    let tx;
    let successWith8Params = false;
    let successWith10Params = false;

    // Try with 8 parameters first (older contract version)
    try {
      console.log(
        "🔍 Trying createAuction with 8 parameters (older version)..."
      );
      tx = await auctionContract.createAuction(
        params.nftContract,
        params.tokenId,
        params.auctionType,
        params.startPrice,
        params.reservePrice,
        params.buyNowPrice,
        params.duration,
        params.bidIncrement
      );
      successWith8Params = true;
      console.log("✅ createAuction with 8 parameters succeeded!");
    } catch (error8) {
      console.log(
        "❌ createAuction with 8 parameters failed:",
        error8 instanceof Error ? error8.message : String(error8)
      );
    }

    // Try with 10 parameters (newer contract version)
    if (!successWith8Params) {
      try {
        console.log(
          "🔍 Trying createAuction with 10 parameters (newer version)..."
        );
        tx = await auctionContract.createAuction(
          params.nftContract,
          params.tokenId,
          params.auctionType,
          params.startPrice,
          params.reservePrice,
          params.buyNowPrice,
          params.duration,
          params.bidIncrement,
          params.extensionThreshold,
          params.extensionDuration
        );
        successWith10Params = true;
        console.log("✅ createAuction with 10 parameters succeeded!");
      } catch (error10) {
        console.log(
          "❌ createAuction with 10 parameters failed:",
          error10 instanceof Error ? error10.message : String(error10)
        );
      }
    }

    if (!successWith8Params && !successWith10Params) {
      throw new Error(
        "Both 8 and 10 parameter versions failed. Contract may not have createAuction function."
      );
    }

    console.log("✅ createAuction transaction sent successfully");

    console.log("📡 Auction creation transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("✅ Auction creation confirmed in block:", receipt.blockNumber);

    // 5. Estrai l'ID dell'asta dagli eventi
    const auctionCreatedEvents = receipt.logs
      .map((log: any) => {
        try {
          return auctionContract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .filter((event: any) => event?.name === "AuctionCreated");

    if (auctionCreatedEvents.length === 0) {
      throw new Error("No AuctionCreated event found");
    }

    const auctionId = auctionCreatedEvents[0].args.auctionId;

    console.log("🆔 Auction created with ID:", auctionId.toString());

    // 6. Se è un'asta sealed bid, aggiungila al monitoraggio automatico
    if (params.auctionType === AuctionType.SEALED_BID) {
      console.log(
        "🔓 Sealed bid auction created, adding to automatic monitoring"
      );

      // Emit custom event to trigger monitoring
      const monitoringEvent = new CustomEvent("sealedBidAuctionCreated", {
        detail: {
          auctionId: auctionId.toString(),
          auctionType: params.auctionType,
          endTime: params.duration,
          timestamp: new Date().toISOString(),
        },
      });
      window.dispatchEvent(monitoringEvent);

      console.log("📡 Sealed bid monitoring event dispatched");
    }

    return {
      auctionId,
      transactionHash: receipt.hash,
    };
  } catch (error) {
    console.error("❌ Auction creation failed:", error);
    throw error;
  }
}

// ============================================================================
// COMPLETE FLOW ORCHESTRATION
// ============================================================================

/**
 * Flusso completo: Mint NFT → Approve → Create Auction
 */
async function completeNFTAuctionFlow(
  nftContract: ethers.Contract,
  auctionContract: ethers.Contract,
  mintParams: any[],
  auctionParams: Omit<AuctionParams, "tokenId" | "nftContract">,
  userAddress: string
): Promise<FlowResult> {
  console.log("🚀 Starting complete NFT-Auction flow...");

  try {
    // Phase 1: Mint NFT con ID tracking sicuro
    console.log("📝 Phase 1: Minting NFT...");
    const mintResult = await secureNFTMint(nftContract, mintParams);

    console.log("✅ NFT minted successfully:", {
      tokenId: mintResult.tokenId.toString(),
      owner: mintResult.owner,
      txHash: mintResult.transactionHash,
    });

    // Phase 2: Approve NFT per auction contract
    console.log("🔐 Phase 2: Approving NFT...");
    await secureNFTApproval(
      nftContract,
      mintResult.tokenId,
      auctionContract.target as string,
      userAddress
    );

    // Phase 3: Create auction
    console.log("🏆 Phase 3: Creating auction...");
    const fullAuctionParams: AuctionParams = {
      ...auctionParams,
      tokenId: mintResult.tokenId,
      nftContract: nftContract.target as string,
    };

    const auctionResult = await secureAuctionCreation(
      auctionContract,
      nftContract,
      fullAuctionParams,
      userAddress
    );

    console.log("🎉 Complete flow finished successfully!");

    return {
      nft: {
        tokenId: mintResult.tokenId,
        transactionHash: mintResult.transactionHash,
        owner: mintResult.owner,
      },
      auction: {
        auctionId: auctionResult.auctionId,
        transactionHash: auctionResult.transactionHash,
      },
    };
  } catch (error) {
    console.error("❌ Complete flow failed:", error);
    throw error;
  }
}

// ============================================================================
// REACT HOOKS FOR SECURE FLOW
// ============================================================================

/**
 * Hook per il flusso completo con gestione stato React
 */
export function useSecureNFTAuctionFlow() {
  const { address } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>("");
  const [result, setResult] = useState<FlowResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeFlow = useCallback(
    async (
      mintParams: any[],
      auctionParams: Omit<AuctionParams, "tokenId" | "nftContract">
    ) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("Ethereum provider not available");
      }

      setIsProcessing(true);
      setError(null);
      setResult(null);

      try {
        // Setup contracts
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const nftContract = new ethers.Contract(
          contracts.MooveNFT.address,
          contracts.MooveNFT.abi,
          signer
        );

        // Use the complete ABI from JSON file
        const auctionContract = new ethers.Contract(
          contracts.MooveAuction.address,
          contracts.MooveAuction.abi,
          signer
        );

        setCurrentPhase("Minting NFT...");
        const result = await completeNFTAuctionFlow(
          nftContract,
          auctionContract,
          mintParams,
          auctionParams,
          address
        );

        setResult(result);
        setCurrentPhase("Completed successfully!");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setError(errorMessage);
        setCurrentPhase("Failed");
        console.error("❌ Flow execution failed:", error);
      } finally {
        setIsProcessing(false);
      }
    },
    [address]
  );

  return {
    executeFlow,
    isProcessing,
    currentPhase,
    result,
    error,
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook per verificare ownership di un NFT
 */
export function useNFTOwnershipVerification() {
  const { address } = useAccount();

  const verifyOwnership = useCallback(
    async (tokenId: bigint): Promise<boolean> => {
      if (!address || typeof window === "undefined" || !window.ethereum) {
        return false;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const nftContract = new ethers.Contract(
          contracts.MooveNFT.address,
          contracts.MooveNFT.abi,
          provider
        );

        return await verifyNFTOwnership(nftContract, tokenId, address);
      } catch (error) {
        console.error("❌ Ownership verification failed:", error);
        return false;
      }
    },
    [address]
  );

  return { verifyOwnership };
}

/**
 * Hook per approvare NFT per aste
 */
export function useNFTApproval() {
  const { address } = useAccount();

  const approveForAuction = useCallback(
    async (tokenId: bigint): Promise<string> => {
      if (!address || typeof window === "undefined" || !window.ethereum) {
        throw new Error("Wallet not connected");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const nftContract = new ethers.Contract(
        contracts.MooveNFT.address,
        contracts.MooveNFT.abi,
        signer
      );

      return await secureNFTApproval(
        nftContract,
        tokenId,
        contracts.MooveAuction.address,
        address
      );
    },
    [address]
  );

  return { approveForAuction };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  secureNFTMint,
  verifyNFTOwnership,
  secureNFTApproval,
  secureAuctionCreation,
  completeNFTAuctionFlow,
  validateAuctionParams,
  type MintResult,
  type AuctionParams,
  type FlowResult,
};
