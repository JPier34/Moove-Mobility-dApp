"use client";

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { contracts } from "@/utils/contracts";
import { AuctionType } from "@/types/auction";

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
    const transferEvents = receipt.logs
      .map((log: any) => {
        try {
          return nftContract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .filter(
        (event: any) =>
          event?.name === "Transfer" && event.args.from === ethers.ZeroAddress // Mint event
      );

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
    const tx = await nftContract.approve(auctionContractAddress, tokenId);
    console.log("📡 Approval transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("✅ Approval confirmed in block:", receipt.blockNumber);

    // 4. Verifica che l'approvazione sia effettiva
    const newApproval = await nftContract.getApproved(tokenId);
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
  // Validazione tipo asta
  if (params.auctionType < 0 || params.auctionType > 3) {
    throw new Error(`Invalid auction type: ${params.auctionType}`);
  }

  // Validazione prezzi
  if (params.startPrice <= 0n) {
    throw new Error("Start price must be greater than 0");
  }

  // Per le aste Dutch, il prezzo di riserva deve essere minore del prezzo di partenza
  if (
    params.auctionType === 2 &&
    params.reservePrice > 0n &&
    params.reservePrice >= params.startPrice
  ) {
    throw new Error("Dutch auction needs valid reserve < starting price");
  }

  // Per le aste tradizionali, il prezzo di riserva deve essere >= prezzo di partenza
  if (
    params.auctionType !== 2 &&
    params.reservePrice > 0n &&
    params.reservePrice < params.startPrice
  ) {
    throw new Error("Reserve price must be >= start price");
  }

  if (params.buyNowPrice > 0n && params.buyNowPrice < params.startPrice) {
    throw new Error("Buy now price must be >= start price");
  }

  // Validazione durata
  if (params.duration < 3600) {
    // Minimo 1 ora
    throw new Error("Duration must be at least 1 hour");
  }

  if (params.duration > 30 * 24 * 3600) {
    // Massimo 30 giorni
    throw new Error("Duration cannot exceed 30 days");
  }

  // Validazione bid increment
  if (params.bidIncrement <= 0n) {
    throw new Error("Bid increment must be greater than 0");
  }

  if (params.bidIncrement > params.startPrice) {
    throw new Error("Bid increment cannot exceed start price");
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
    const tx = await auctionContract.createAuction(
      params.nftContract,
      params.tokenId,
      params.auctionType,
      params.startPrice,
      params.reservePrice,
      params.buyNowPrice,
      params.duration,
      params.bidIncrement
    );

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
