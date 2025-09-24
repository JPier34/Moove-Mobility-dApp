"use client";

import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { useUserRoles } from "./useContract";
import { Auction, AuctionType } from "@/types/auction";
import { useActiveAuctions } from "./useAuction";
import { useSmartRefresh } from "./useSmartRefresh";
import { useAutoFailedAuctionHandler } from "./useFailedAuctionHandler";
// import { useAutoFailedAuctionHandler } from "./useFailedAuctionHandler"; // Temporarily disabled

// ============================================================================
// SECURE NFT-AUCTION FLOW ARCHITECTURE
// ============================================================================

// 1. SECURE NFT ID TRACKING
// Instead of relying on event listeners (which can fail), we use totalSupply
// to get the latest NFT count and track IDs securely
async function getSecureNFTCount(
  nftContract: ethers.Contract
): Promise<number> {
  try {
    console.log("🔒 Getting secure NFT count...");

    // Try totalSupply first (if available)
    try {
      const totalSupply = await nftContract.totalSupply();
      const count = Number(totalSupply);
      console.log(`🔒 Secure NFT count from totalSupply: ${count}`);
      return count;
    } catch (totalSupplyError) {
      console.log("⚠️ totalSupply not available, trying alternative method...");

      // Alternative: Use a reasonable upper bound and validate tokenId exists
      // We'll use a high number and let the validation happen in fetchAuctionFromContractCorrected
      const estimatedCount = 1000; // Reasonable upper bound
      console.log(`🔒 Using estimated NFT count: ${estimatedCount}`);
      return estimatedCount;
    }
  } catch (error) {
    console.error("❌ Failed to get secure NFT count:", error);
    return 1000; // Fallback to reasonable upper bound
  }
}

// 2. ROBUST ERROR HANDLING AND VALIDATION
interface ValidationResult {
  isValid: boolean;
  error?: string;
  data?: any;
}

function validateAuctionData(auctionData: any): ValidationResult {
  try {
    if (!auctionData) {
      return { isValid: false, error: "Auction data is null or undefined" };
    }

    const requiredFields = [
      "tokenId",
      "seller",
      "auctionType",
      "startTime",
      "endTime",
    ];
    for (const field of requiredFields) {
      if (auctionData[field] === undefined || auctionData[field] === null) {
        return { isValid: false, error: `Missing required field: ${field}` };
      }
    }

    // Validate tokenId
    const tokenId = Number(auctionData.tokenId);
    if (isNaN(tokenId) || tokenId < 0) {
      return { isValid: false, error: "Invalid tokenId" };
    }

    // Validate timestamps
    const startTime = Number(auctionData.startTime);
    const endTime = Number(auctionData.endTime);
    if (isNaN(startTime) || isNaN(endTime) || startTime >= endTime) {
      console.error("❌ Timestamp validation failed:", {
        startTime,
        endTime,
        startTimeType: typeof auctionData.startTime,
        endTimeType: typeof auctionData.endTime,
        rawData: auctionData,
      });
      return { isValid: false, error: "Invalid timestamps" };
    }

    return { isValid: true, data: auctionData };
  } catch (error) {
    return { isValid: false, error: `Validation error: ${error}` };
  }
}

// 3. ENHANCED IPFS GATEWAY FALLBACK SYSTEM
const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://dweb.link/ipfs/",
  "https://ipfs.infura.io/ipfs/",
  "https://gateway.ipfs.io/ipfs/",
  "https://nftstorage.link/ipfs/",
  "https://app.pinata.cloud/ipfs/", // Pinata Cloud direct access
  "https://gateway.pinata.cloud/ipfs/", // Pinata Gateway
  "https://ipfs.filebase.io/ipfs/",
  "https://gateway.optimism.io/ipfs/",
  "https://ipfs.fleek.co/ipfs/",
];

// 4. IPFS FILE TRACKING SYSTEM
interface IPFSFileLocation {
  hash: string;
  gateway: string;
  timestamp: number;
  source: "pinata" | "ipfs" | "local" | "unknown";
}

// Track where IPFS files are stored
const ipfsFileTracker = new Map<string, IPFSFileLocation>();

function trackIPFSFile(
  hash: string,
  gateway: string,
  source: "pinata" | "ipfs" | "local" | "unknown" = "unknown"
) {
  ipfsFileTracker.set(hash, {
    hash,
    gateway,
    timestamp: Date.now(),
    source,
  });
  console.log(
    `📍 [IPFS Tracker] File ${hash} tracked at ${gateway} (${source})`
  );
}

function getTrackedIPFSFile(hash: string): IPFSFileLocation | null {
  return ipfsFileTracker.get(hash) || null;
}

// Get all tracked IPFS files
function getAllTrackedIPFSFiles(): IPFSFileLocation[] {
  return Array.from(ipfsFileTracker.values());
}

async function fetchFromIPFSRobust(
  uri: string,
  timeout: number = 10000
): Promise<any | null> {
  if (!uri || uri === "undefined" || uri.includes("undefined")) {
    console.warn(`⚠️ Invalid IPFS URI: ${uri}`);
    return null;
  }

  let hash = uri;
  if (uri.startsWith("ipfs://")) {
    hash = uri.replace("ipfs://", "");
  }

  // Check if we have tracked this file before
  const trackedFile = getTrackedIPFSFile(hash);
  if (trackedFile) {
    console.log(
      `📍 [IPFS Tracker] Found tracked file ${hash} at ${trackedFile.gateway}`
    );
    // Try the tracked gateway first
    try {
      const url = `${trackedFile.gateway}${hash}`;
      console.log(`📥 Trying tracked gateway first: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json, text/plain, */*",
          "Cache-Control": "no-cache",
          "User-Agent": "Moove-dApp/1.0",
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const text = await response.text();
        if (text.trim().startsWith("{")) {
          try {
            const metadata = JSON.parse(text);
            console.log(`✅ Successfully fetched from tracked gateway`);
            return processIPFSMetadata(metadata);
          } catch (parseError) {
            console.warn(
              `⚠️ Failed to parse from tracked gateway, trying others...`
            );
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Tracked gateway failed, trying others...`);
    }
  }

  // Strategy 1: Try proxy server first (bypasses CORS)
  try {
    console.log(`🔄 Trying proxy server...`);
    const proxyUrl = `/api/ipfs-proxy?hash=${encodeURIComponent(hash)}`;
    const response = await fetch(proxyUrl, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
      },
      signal: AbortSignal.timeout(timeout),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Success with proxy server`);
      trackIPFSFile(hash, "proxy", "local");
      return processIPFSMetadata(data);
    }
  } catch (error) {
    console.log(`❌ Proxy server failed:`, error);
  }

  console.log(
    `🌐 Attempting to fetch from IPFS with ${IPFS_GATEWAYS.length} gateways...`
  );

  for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
    try {
      const url = `${IPFS_GATEWAYS[i]}${hash}`;
      console.log(`📥 Trying gateway ${i + 1}/${IPFS_GATEWAYS.length}: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json, text/plain, */*",
          "Cache-Control": "no-cache",
          "User-Agent": "Moove-dApp/1.0",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type") || "";
      console.log(`📄 Response content-type: ${contentType}`);

      // Try to parse as JSON regardless of content-type
      const text = await response.text();
      console.log(`📄 Response preview: ${text.substring(0, 200)}...`);

      if (text.trim().startsWith("{")) {
        try {
          const metadata = JSON.parse(text);
          console.log(`✅ Successfully parsed JSON from gateway ${i + 1}`);

          // Track this successful gateway
          const source = IPFS_GATEWAYS[i].includes("pinata")
            ? "pinata"
            : "ipfs";
          trackIPFSFile(hash, IPFS_GATEWAYS[i], source);

          return processIPFSMetadata(metadata);
        } catch (parseError) {
          console.error(
            `❌ Failed to parse JSON from gateway ${i + 1}:`,
            parseError
          );
        }
      }

      if (i < IPFS_GATEWAYS.length - 1) {
        console.log(`⏭️ Trying next gateway...`);
        continue;
      }

      throw new Error(`Invalid content type: ${contentType}`);
    } catch (error) {
      console.error(`❌ Gateway ${i + 1} failed:`, error);
      if (i === IPFS_GATEWAYS.length - 1) {
        console.error(`❌ All IPFS gateways failed for hash: ${hash}`);

        // Strategy 4: Fallback to mock data for testing
        console.warn(`⚠️ Using fallback data for hash: ${hash}`);
        return {
          name: `NFT #${hash.substring(0, 8)}`,
          description: "NFT metadata temporarily unavailable",
          image: "/images/default-nft.png",
          attributes: [
            { trait_type: "Category", value: "VEHICLE_DECORATION" },
            { trait_type: "Rarity", value: "Common" },
          ],
          properties: {
            category: "sticker",
            rarity: "common",
          },
        };
      }
    }
  }

  return null;
}

// ============================================================================
// COMPLETE METADATA FETCHING WITH MULTIPLE STRATEGIES
// ============================================================================

// 4. ENHANCED METADATA FETCHING WITH COMPREHENSIVE ERROR HANDLING
async function fetchNFTMetadataComplete(
  nftContract: ethers.Contract,
  tokenId: number
): Promise<any> {
  console.log(`🔍 Starting complete metadata fetch for NFT #${tokenId}`);

  // Special debug for NFT #47
  if (tokenId === 47) {
    console.log("🔍 [SPECIAL DEBUG] Starting NFT #47 metadata fetch...");
  }

  try {
    // Strategy 1: Try tokenURI from contract
    let tokenURI = null;
    try {
      tokenURI = await nftContract.tokenURI(tokenId);
      console.log(`📋 Contract tokenURI: ${tokenURI}`);
    } catch (error) {
      console.warn(`⚠️ Failed to get tokenURI from contract:`, error);
    }

    // Strategy 2: Try getStickerData if available
    let contractMetadata = null;
    try {
      contractMetadata = await nftContract.getStickerData(tokenId);
      console.log(`🏷️ Contract sticker data:`, contractMetadata);
    } catch (error) {
      console.log(`ℹ️ No getStickerData function available`);
    }

    // Strategy 3: Check localStorage for recently created NFTs
    let localMetadata = null;
    try {
      const keys = Object.keys(localStorage);
      const nftKeys = keys.filter((key) => key.startsWith("nft_creation_"));
      console.log(`🔍 Checking localStorage for NFT #${tokenId}:`, {
        totalKeys: keys.length,
        nftKeys: nftKeys.length,
        nftKeysList: nftKeys,
      });

      for (const key of nftKeys) {
        const data = JSON.parse(localStorage.getItem(key) || "{}");
        console.log(`🔍 Checking key ${key}:`, {
          dataTokenId: data.tokenId,
          dataNftId: data.nftId,
          targetTokenId: tokenId.toString(),
          matches:
            data.tokenId === tokenId.toString() ||
            data.nftId === tokenId.toString(),
        });

        if (
          data.tokenId === tokenId.toString() ||
          data.nftId === tokenId.toString()
        ) {
          localMetadata = {
            name: data.nftName,
            description: data.nftDescription,
            image: data.nftImage,
            ipfsHash: data.ipfsHash,
          };
          console.log(
            `💾 Found local metadata for NFT #${tokenId}:`,
            localMetadata
          );
          break;
        }
      }

      if (!localMetadata) {
        console.log(`ℹ️ No local metadata found for NFT #${tokenId}`);
      }
    } catch (error) {
      console.warn(`⚠️ Error checking localStorage:`, error);
    }

    // Strategy 4: Try fetching from IPFS if we have a valid URI
    let ipfsMetadata = null;
    if (
      tokenURI &&
      tokenURI !== "undefined" &&
      !tokenURI.includes("undefined")
    ) {
      ipfsMetadata = await fetchFromIPFSRobust(tokenURI);
    }

    // Strategy 5: Try alternative IPFS gateways for known hashes
    if (!ipfsMetadata && contractMetadata?.metadataURI) {
      ipfsMetadata = await fetchFromIPFSRobust(contractMetadata.metadataURI);
    }

    // Combine all sources with priority: IPFS > Local > Contract > Fallback
    const finalMetadata = {
      name:
        ipfsMetadata?.name ||
        localMetadata?.name ||
        contractMetadata?.name ||
        `NFT #${tokenId}`,

      description:
        ipfsMetadata?.description ||
        localMetadata?.description ||
        contractMetadata?.description ||
        `A unique NFT with token ID ${tokenId}`,

      image:
        ipfsMetadata?.image ||
        localMetadata?.image ||
        "/images/default-nft.png",

      attributes: ipfsMetadata?.attributes ||
        contractMetadata?.attributes || [
          {
            trait_type: "Token ID",
            value: tokenId.toString(),
          },
          {
            trait_type: "Type",
            value: "Genesis Collection",
          },
        ],

      properties: ipfsMetadata?.properties ||
        contractMetadata?.properties || {
          tokenId: tokenId.toString(),
          collection: "Genesis",
        },

      collection: ipfsMetadata?.collection ||
        contractMetadata?.collection || {
          name: "Genesis Collection",
          description: "The original collection of Moove NFTs",
        },
    };

    console.log(`✅ Final metadata for NFT #${tokenId}:`, finalMetadata);
    console.log(`🔍 Metadata sources used:`, {
      tokenURI,
      ipfsMetadata: ipfsMetadata ? "Found" : "Not found",
      localMetadata: localMetadata ? "Found" : "Not found",
      contractMetadata: contractMetadata ? "Found" : "Not found",
      finalName: finalMetadata.name,
      finalImage: finalMetadata.image,
    });

    // Special debug for NFT #47
    if (tokenId === 47) {
      console.log("🔍 [SPECIAL DEBUG] NFT #47 Final Metadata:", {
        finalName: finalMetadata.name,
        finalImage: finalMetadata.image,
        finalDescription: finalMetadata.description,
        attributesCount: finalMetadata.attributes?.length || 0,
        isUsingFallback: finalMetadata.name === `NFT #${tokenId}`,
        isDefaultImage: finalMetadata.image === "/images/default-nft.png",
        sources: {
          tokenURI,
          hasIpfsMetadata: !!ipfsMetadata,
          hasLocalMetadata: !!localMetadata,
          hasContractMetadata: !!contractMetadata,
        },
      });
    }
    return finalMetadata;
  } catch (error) {
    console.error(
      `❌ Complete metadata fetch failed for NFT #${tokenId}:`,
      error
    );
    return {
      name: `NFT #${tokenId}`,
      description: `A unique NFT with token ID ${tokenId}`,
      image: "/images/default-nft.png",
      attributes: [
        {
          trait_type: "Token ID",
          value: tokenId.toString(),
        },
        {
          trait_type: "Type",
          value: "Genesis Collection",
        },
      ],
      properties: {
        tokenId: tokenId.toString(),
        collection: "Genesis",
      },
      collection: {
        name: "Genesis Collection",
        description: "The original collection of Moove NFTs",
      },
    };
  }
}

// 5. LEGACY IPFS FETCHING (kept for backward compatibility)
async function fetchFromIPFS(uri: string): Promise<any | null> {
  return fetchFromIPFSRobust(uri);
}

// 3. PROCESS IPFS METADATA AND CONVERT IPFS URLS
function processIPFSMetadata(metadata: any): any {
  if (!metadata) return null;

  // Convert IPFS image URLs to HTTP
  let imageURL = metadata.image;
  if (imageURL && imageURL.startsWith("ipfs://")) {
    imageURL = imageURL.replace("ipfs://", "https://ipfs.io/ipfs/");
  }

  return {
    name: metadata.name || "",
    description: metadata.description || "",
    image: imageURL || "/images/default-nft.png",
    attributes: metadata.attributes || [],
    properties: metadata.properties || {},
    external_url: metadata.external_url || "",
    collection: metadata.collection || {},
  };
}

// 6. ENHANCED AUCTION CONSTRUCTION WITH COMPREHENSIVE VALIDATION
async function buildAuctionWithCompleteData(
  auctionId: number,
  auctionData: any,
  nftContract: ethers.Contract,
  auctionContract?: ethers.Contract
): Promise<Auction | null> {
  console.log(
    `🏗️ [BUILD] Starting buildAuctionWithCompleteData for auction ${auctionId}`
  );

  try {
    // Validate auction data first
    const validation = validateAuctionData(auctionData);
    if (!validation.isValid) {
      console.error(
        `❌ [Auction ${auctionId}] Invalid auction data:`,
        validation.error
      );
      return null;
    }

    const tokenId = Number(auctionData.tokenId);

    // Get complete metadata with enhanced error handling
    console.log(
      `🔍 [Auction ${auctionId}] Starting metadata fetch for token ${tokenId}`
    );

    // Special debug for NFT #47
    if (tokenId === 47) {
      console.log(
        "🔍 [SPECIAL DEBUG] About to call fetchNFTMetadataComplete for NFT #47"
      );
    }

    const metadata = await fetchNFTMetadataComplete(nftContract, tokenId);

    // Special debug for NFT #47
    if (tokenId === 47) {
      console.log(
        "🔍 [SPECIAL DEBUG] fetchNFTMetadataComplete returned for NFT #47:",
        metadata
      );
    }
    console.log(`📊 [Auction ${auctionId}] Metadata received:`, {
      name: metadata.name,
      image: metadata.image,
      attributesCount: metadata.attributes?.length || 0,
      hasCollection: !!metadata.collection,
    });

    // Fetch bid data if auction contract is available
    let bidCount = 0;
    if (auctionContract) {
      try {
        const bidData = await fetchAuctionBids(auctionContract, auctionId);
        bidCount = bidData.bidCount;
        console.log(`📊 [Auction ${auctionId}] Found ${bidCount} active bids`);
      } catch (error) {
        console.warn(
          `⚠️ [Auction ${auctionId}] Could not fetch bid data:`,
          error
        );
      }
    }

    // Use status directly from contract, but correct it based on auction type
    let status = Number(auctionData.status);
    const auctionType = Number(auctionData.auctionType);
    const startTime = Number(auctionData.startTime);
    const endTime = Number(auctionData.endTime);
    const currentTime = Math.floor(Date.now() / 1000);

    // CRITICAL FIX: REVEAL status should ONLY be for SEALED_BID auctions
    if (status === 2 && auctionType !== 2) {
      // AuctionType.SEALED_BID = 2
      // For non-sealed bid auctions, status 2 should be ENDED (3 in frontend)
      status = 3; // ENDED
      console.log(
        `🔧 [Auction ${auctionId}] Correcting invalid REVEAL status for ${
          auctionType === 0
            ? "English"
            : auctionType === 1
            ? "Dutch"
            : "Reserve"
        } auction -> ENDED`
      );
    }

    // Handle status transitions based on auction type and time
    if (status === 1 && currentTime >= endTime) {
      if (auctionType === 2) {
        // For SEALED_BID auctions, transition to REVEAL phase first
        status = 2; // REVEAL
        console.log(
          `🔓 [Auction ${auctionId}] Auto-correcting status: ACTIVE -> REVEAL (sealed bid phase)`
        );
      } else {
        // For other auction types, go directly to ENDED
        status = 3; // ENDED
        console.log(
          `🕐 [Auction ${auctionId}] Auto-correcting status: ACTIVE -> ENDED (time expired)`
        );
      }
    }

    // For SEALED_BID auctions, check if REVEAL phase should end
    if (status === 2 && auctionType === 2) {
      // Check if reveal phase has ended (typically 24 hours after commit phase)
      const revealEndTime = endTime + 24 * 60 * 60; // 24 hours after commit phase ends
      if (currentTime >= revealEndTime) {
        status = 3; // ENDED
        console.log(
          `🏁 [Auction ${auctionId}] Auto-correcting status: REVEAL -> ENDED (reveal phase expired)`
        );
      }
    }

    console.log(`🏗️ [Auction ${auctionId}] Using corrected status:`, {
      originalStatus: Number(auctionData.status),
      correctedStatus: status,
      startTime: new Date(startTime * 1000).toISOString(),
      endTime: new Date(endTime * 1000).toISOString(),
      currentTime: new Date().toISOString(),
      timeExpired: currentTime >= endTime,
    });

    console.log(
      `🏗️ [Auction ${auctionId}] Building auction with complete data:`,
      {
        tokenId,
        name: metadata.name,
        image: metadata.image,
        status,
        endTime: new Date(endTime * 1000).toISOString(),
        metadataSource:
          metadata.name === `NFT #${tokenId}` ? "FALLBACK" : "IPFS/LOCAL",
        isEnded: status === 3, // ENDED is now 3
        willBeEnded: currentTime >= endTime,
      }
    );

    // Map category correctly based on metadata with enhanced mapping
    let nftCategory = "sticker"; // Default for VEHICLE_DECORATION
    if (metadata.attributes && Array.isArray(metadata.attributes)) {
      const categoryAttr = metadata.attributes.find(
        (attr: { trait_type: string; value: string }) =>
          attr.trait_type === "Category"
      );
      if (categoryAttr) {
        switch (categoryAttr.value) {
          case "VEHICLE_DECORATION":
            nftCategory = "sticker";
            break;
          case "SCOOTER":
            nftCategory = "scooter";
            break;
          case "BIKE":
            nftCategory = "bike";
            break;
          case "SKATEBOARD":
            nftCategory = "skateboard";
            break;
          case "MOPED":
            nftCategory = "moped";
            break;
          default:
            nftCategory = "sticker"; // Default for unknown categories
        }
      }
    }

    // Build auction object with comprehensive error handling
    const auction: Auction = {
      auctionId: auctionId.toString(),
      nftId: tokenId.toString(),
      nftName: metadata.name || `NFT #${tokenId}`,
      nftImage: metadata.image || "/images/default-nft.png",
      nftCategory, // Use the correctly mapped category
      seller: auctionData.seller || ethers.ZeroAddress,
      auctionType: Number(auctionData.auctionType) || 0,
      status,
      startPrice: auctionData.startingPrice || "0",
      reservePrice: auctionData.reservePrice || "0",
      buyNowPrice: auctionData.buyNowPrice || "0",
      currentBid: auctionData.highestBid || "0",
      highestBidder: auctionData.highestBidder || ethers.ZeroAddress,
      bidCount: bidCount,
      startTime: new Date(startTime * 1000),
      endTime: new Date(endTime * 1000),
      bidIncrement: auctionData.bidIncrement || "0",
      currency: "ETH",
      isSettled: auctionData.isSettled || false, // Campo isSettled dal contratto
      transactionHash: undefined, // Non disponibile direttamente dal contratto
      // English auction extension settings (defaults)
      extensionThresholdMinutes:
        Number(auctionData.auctionType) === 0 ? 5 : undefined, // Only for English auctions
      extensionDurationMinutes:
        Number(auctionData.auctionType) === 0 ? 10 : undefined, // Only for English auctions
      attributes: {
        rarity:
          metadata.attributes?.find(
            (attr: { trait_type: string }) => attr.trait_type === "Rarity"
          )?.value || "COMMON",
        designer:
          metadata.attributes?.find(
            (attr: { trait_type: string }) => attr.trait_type === "Designer"
          )?.value || "Moove",
        collection: metadata.collection?.name || "Genesis",
      },
    };

    console.log(`✅ [Auction ${auctionId}] Successfully built auction:`, {
      id: auction.auctionId,
      nftId: auction.nftId,
      name: auction.nftName,
      image: auction.nftImage,
      category: auction.nftCategory,
      status: auction.status,
      auctionType: auction.auctionType,
      // Log English auction specific properties
      ...(auction.auctionType === 0 && {
        extensionThresholdMinutes: auction.extensionThresholdMinutes,
        extensionDurationMinutes: auction.extensionDurationMinutes,
      }),
    });

    // Special debug for NFT #47
    if (tokenId === 47) {
      console.log("🔍 [SPECIAL DEBUG] NFT #47 Details:", {
        tokenId,
        auctionId,
        nftName: auction.nftName,
        nftImage: auction.nftImage,
        nftCategory: auction.nftCategory,
        metadataName: metadata.name,
        metadataImage: metadata.image,
        attributes: metadata.attributes,
        isDefaultImage: auction.nftImage === "/images/default-nft.png",
        isDefaultName: auction.nftName === `NFT #${tokenId}`,
      });
    }

    return auction;
  } catch (error) {
    console.error(`❌ [Auction ${auctionId}] Failed to build auction:`, error);
    return null;
  }
}

// ============================================================================
// FIX DEFINITIVO PER STATUS CALCULATION
// ============================================================================

// 1. FIXED STATUS CALCULATION FUNCTION
function calculateAuctionStatusFixed(auctionData: any): number {
  const currentTime = Math.floor(Date.now() / 1000);
  const startTime = Number(auctionData.startTime);
  const endTime = Number(auctionData.endTime);
  const contractStatus = Number(auctionData.status);

  console.log(`⏰ Status calculation for auction:`, {
    currentTime,
    startTime,
    endTime,
    contractStatus,
    currentDate: new Date(currentTime * 1000).toISOString(),
    startDate: new Date(startTime * 1000).toISOString(),
    endDate: new Date(endTime * 1000).toISOString(),
    timeToEnd: endTime - currentTime,
    isAfterStart: currentTime >= startTime,
    isBeforeEnd: currentTime < endTime,
  });

  // Se il contratto dice che è cancellata/claimed, mappa correttamente
  if (contractStatus === 3) {
    console.log(
      `📋 Contract status: ${contractStatus} (CANCELLED/DESERTA) -> Frontend: CANCELLED (5)`
    );
    return 5; // CANCELLED nel frontend
  }
  if (contractStatus === 4) {
    console.log(
      `📋 Contract status: ${contractStatus} (SETTLED) -> Frontend: SETTLED (4)`
    );
    return 4; // SETTLED nel frontend
  }

  // Altrimenti calcola basato sui timestamp
  if (currentTime < startTime) {
    console.log(`⏳ Auction not started yet - PENDING`);
    return 0; // PENDING
  } else if (currentTime >= startTime && currentTime < endTime) {
    console.log(
      `🔥 Auction is ACTIVE - ends in ${endTime - currentTime} seconds`
    );
    return 1; // ACTIVE
  } else {
    console.log(`🏁 Auction has ended - ENDED`);
    return 3; // ENDED nel frontend (non 2!)
  }
}

// Function to fetch bid data for an auction
export const fetchAuctionBids = async (
  auctionContract: any,
  auctionId: number
): Promise<{ bidCount: number; bids: any[] }> => {
  try {
    console.log(`🔍 Fetching bids for auction ${auctionId}...`);

    // Call getAuctionBids function
    const bids = await auctionContract.getAuctionBids(auctionId);

    console.log(`📊 Found ${bids.length} bids for auction ${auctionId}:`, bids);

    // Filter out refunded bids and count active bids
    const activeBids = bids.filter((bid: any) => !bid.isRefunded);

    return {
      bidCount: activeBids.length,
      bids: activeBids,
    };
  } catch (error) {
    console.error(`❌ Error fetching bids for auction ${auctionId}:`, error);
    return {
      bidCount: 0,
      bids: [],
    };
  }
};

// 7. ENHANCED AUCTION FETCHING WITH SECURE NFT ID TRACKING
async function fetchAuctionFromContractCorrected(
  auctionId: number
): Promise<Auction | null> {
  try {
    console.log(`🔍 Fetching auction ${auctionId} with complete metadata...`);

    // Special debug for auction #12
    if (auctionId === 12) {
      console.log(
        "🔍 [SPECIAL DEBUG] Starting fetch for auction #12 (NFT #47)"
      );
    }

    if (typeof window === "undefined" || !window.ethereum) {
      console.warn("⚠️ No ethereum provider available");
      return null;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);

    const auctionContract = new ethers.Contract(
      contracts.MooveAuction.address,
      contracts.MooveAuction.abi,
      provider
    );

    const nftContract = new ethers.Contract(
      contracts.MooveNFT.address,
      contracts.MooveNFT.abi,
      provider
    );

    // Use direct contract call with proper ABI
    let auctionData;
    try {
      console.log(`🔍 Fetching auction ${auctionId} with proper ABI...`);

      // Create contract with full ABI for proper decoding
      const fullAuctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      auctionData = await fullAuctionContract.getAuction(auctionId);
      console.log(
        `✅ Auction data fetched successfully for auction ${auctionId}:`,
        auctionData
      );

      // Convert BigInt values to strings for frontend compatibility
      // Map array indices to struct fields based on Auction struct order:
      // 0: auctionId, 1: nftContract, 2: tokenId, 3: seller, 4: auctionType, 5: status,
      // 6: allowPartialFulfillment, 7: isSettled, 8: revealPhaseStarted, 9: startingPrice,
      // 10: reservePrice, 11: buyNowPrice, 12: currentPrice, 13: bidIncrement, 14: highestBid,
      // 15: startTime, 16: endTime, 17: extensionThreshold, 18: extensionDuration, 19: revealEndTime,
      // 20: highestBidder, 21: minBidders, 22: totalBidders
      auctionData = {
        auctionId: auctionData[0].toString(),
        nftContract: auctionData[1],
        tokenId: auctionData[2].toString(),
        seller: auctionData[3],
        auctionType: Number(auctionData[4]),
        status: Number(auctionData[5]),
        allowPartialFulfillment: auctionData[6],
        isSettled: auctionData[7],
        revealPhaseStarted: auctionData[8],
        startingPrice: ethers.formatEther(auctionData[9]),
        reservePrice: ethers.formatEther(auctionData[10]),
        buyNowPrice: ethers.formatEther(auctionData[11]),
        currentPrice: ethers.formatEther(auctionData[12]),
        bidIncrement: ethers.formatEther(auctionData[13]),
        highestBid: ethers.formatEther(auctionData[14]),
        startTime: Number(auctionData[15]),
        endTime: Number(auctionData[16]),
        extensionThreshold: ethers.formatEther(auctionData[17]),
        extensionDuration: Number(auctionData[18]),
        revealEndTime: Number(auctionData[19]),
        highestBidder: auctionData[20],
        minBidders: Number(auctionData[21]),
        totalBidders: Number(auctionData[22]),
      };

      console.log(
        `✅ Converted auction data for auction ${auctionId}:`,
        auctionData
      );
    } catch (error) {
      console.error(`❌ Failed to fetch auction ${auctionId}:`, error);
      return null;
    }

    // Validate auction data before processing
    if (!auctionData || auctionData.tokenId === undefined) {
      console.error(`❌ Auction ${auctionId} has invalid data:`, auctionData);
      return null;
    }

    // Validate tokenId exists by checking if tokenURI is accessible
    const tokenId = Number(auctionData.tokenId);
    try {
      const tokenURI = await nftContract.tokenURI(tokenId);
      if (!tokenURI || tokenURI === "") {
        console.error(
          `❌ Auction ${auctionId} references invalid tokenId ${tokenId} (no tokenURI)`
        );
        return null;
      }
      console.log(`✅ Token ${tokenId} exists with URI: ${tokenURI}`);
    } catch (tokenError) {
      console.error(
        `❌ Auction ${auctionId} references invalid tokenId ${tokenId}:`,
        tokenError
      );
      return null;
    }

    // Build auction with complete metadata
    const auction = await buildAuctionWithCompleteData(
      auctionId,
      auctionData,
      nftContract,
      auctionContract
    );

    if (!auction) {
      console.error(`❌ Failed to build auction ${auctionId}`);
      return null;
    }

    console.log(`✅ Complete auction ${auctionId} built:`, {
      id: auction.auctionId,
      name: auction.nftName,
      image: auction.nftImage,
      status: auction.status,
    });

    return auction;
  } catch (error) {
    console.error(
      `❌ Error fetching auction ${auctionId} with complete metadata:`,
      error
    );
    return null;
  }
}

// 8. ENHANCED HOOK WITH SECURE NFT ID TRACKING AND COMPREHENSIVE ERROR HANDLING
export function useAuctionsEnhanced(
  disableAutoRefresh = false,
  disableFailedAuctionHandling = false
) {
  const { address, isConnected } = useAccount();
  const { isMasterAdmin, canMint } = useUserRoles(address);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Temporarily disabled failed auction handling to prevent loops
  // const {
  //   checkAndHandleFailedAuctions,
  //   isProcessing: isHandlingFailed,
  //   processedCount,
  // } = useAutoFailedAuctionHandler();

  // Mock values for disabled failed auction handling
  const checkAndHandleFailedAuctions = () => {};
  const isHandlingFailed = false;
  const processedCount = 0;

  const fetchCorrectedAuctions = useCallback(async () => {
    console.log("🚀 fetchCorrectedAuctions called");

    try {
      setIsLoading(true);
      setError(null);

      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No ethereum provider available");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      console.log("📊 Contract addresses:", {
        auction: contracts.MooveAuction.address,
        nft: contracts.MooveNFT.address,
      });

      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      const nftContract = new ethers.Contract(
        contracts.MooveNFT.address,
        contracts.MooveNFT.abi,
        provider
      );

      console.log("✅ Contracts created successfully");

      // Get secure NFT count first
      const secureNFTCount = await getSecureNFTCount(nftContract);
      console.log(`🔒 Secure NFT count: ${secureNFTCount}`);

      // Get total auction count
      console.log("🔍 Getting total auction count...");
      const totalAuctions = await auctionContract.totalAuctions();
      const totalAuctionsCount = Number(totalAuctions);

      console.log(`📊 Total auctions in contract: ${totalAuctionsCount}`);

      if (totalAuctionsCount === 0) {
        console.log("⚠️ No auctions found");
        setAuctions([]);
        setLastFetchTime(Date.now());
        setIsLoading(false);
        return;
      }

      // Fetch all auctions with enhanced error handling
      const auctionPromises = [];
      for (let i = 0; i < totalAuctionsCount; i++) {
        auctionPromises.push(fetchAuctionFromContractCorrected(i));
      }

      const allAuctions = await Promise.all(auctionPromises);
      const validAuctions = allAuctions.filter(
        (auction) => auction !== null
      ) as Auction[];

      // Debug: Check status distribution
      const statusCounts = {
        pending: validAuctions.filter((a) => a.status === 0).length, // PENDING
        active: validAuctions.filter((a) => a.status === 1).length, // ACTIVE
        ended: validAuctions.filter((a) => a.status === 3).length, // ENDED
        cancelled: validAuctions.filter((a) => a.status === 5).length, // CANCELLED
        settled: validAuctions.filter((a) => a.status === 4).length, // SETTLED/CLAIMED
      };

      console.log(`📊 Status distribution after processing:`, statusCounts);

      // Debug: Check IPFS data for each status
      const ipfsDataByStatus = {
        pending: validAuctions.filter(
          (a) =>
            a.status === 0 &&
            a.nftImage &&
            a.nftImage !== "/images/default-nft.png"
        ).length,
        active: validAuctions.filter(
          (a) =>
            a.status === 1 &&
            a.nftImage &&
            a.nftImage !== "/images/default-nft.png"
        ).length,
        ended: validAuctions.filter(
          (a) =>
            a.status === 3 &&
            a.nftImage &&
            a.nftImage !== "/images/default-nft.png"
        ).length,
      };

      console.log(`📊 IPFS data by status:`, ipfsDataByStatus);

      console.log(`📊 Enhanced auction filtering results:`, {
        total: totalAuctionsCount,
        valid: validAuctions.length,
        failed: totalAuctionsCount - validAuctions.length,
        secureNFTCount,
        statusCounts,
        activeAuctions: validAuctions
          .filter((a) => a.status === 1)
          .map((a) => ({
            id: a.auctionId,
            nftId: a.nftId,
            name: a.nftName,
            image: a.nftImage,
            category: a.nftCategory,
            endTime: a.endTime.toISOString(),
          })),
        allAuctions: validAuctions.map((a) => ({
          id: a.auctionId,
          nftId: a.nftId,
          name: a.nftName,
          image: a.nftImage,
          category: a.nftCategory,
          status: a.status,
          statusName: ["PENDING", "ACTIVE", "ENDED", "CANCELLED", "SETTLED"][
            a.status
          ],
        })),
      });

      setAuctions(validAuctions);
      setLastFetchTime(Date.now());

      // Temporarily disabled failed auction processing to prevent loops
      // if (
      //   !disableFailedAuctionHandling &&
      //   isMasterAdmin &&
      //   validAuctions.length > 0
      // ) {
      //   console.log(
      //     "🔧 Admin detected - checking for failed auctions to handle"
      //   );
      //   // Small delay to ensure state is updated
      //   setTimeout(() => {
      //     checkAndHandleFailedAuctions(validAuctions);
      //   }, 1000);
      // }
    } catch (err) {
      console.error("Error fetching corrected auctions:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [isMasterAdmin]); // Removed failed auction dependencies to prevent loops

  // Use smart refresh hook for intelligent refresh management (only if not disabled)
  useSmartRefresh({
    refreshFunction: fetchCorrectedAuctions,
    intervalMs: 300000, // 5 minutes - ridotto frequenza per ottimizzare performance
    pauseOnModal: true,
    pauseOnHidden: true,
    disabled: disableAutoRefresh,
  });

  // Filter by status with enhanced filtering
  const activeAuctions = auctions.filter((auction) => {
    const isActive = auction.status === 1;
    const isNotExpired =
      !auction.endTime || new Date(auction.endTime).getTime() > Date.now();
    return isActive && isNotExpired;
  });
  const endedAuctions = auctions.filter((auction) => {
    const isEnded = auction.status === 3;
    const isTimeExpired =
      auction.status === 1 &&
      auction.endTime &&
      new Date(auction.endTime).getTime() <= Date.now();
    return isEnded || isTimeExpired;
  });
  const pendingAuctions = auctions.filter((auction) => auction.status === 0);

  // Debug logging removed to prevent excessive re-renders
  // Only log warnings for critical issues
  const endedWithIPFS = endedAuctions.filter(
    (a) =>
      a.nftImage &&
      a.nftImage !== "/images/default-nft.png" &&
      a.nftName &&
      a.nftName !== `NFT #${a.nftId}`
  );

  if (endedAuctions.length > 0 && endedWithIPFS.length === 0) {
    console.warn(
      `⚠️ No ended auctions have IPFS data! This suggests a problem with metadata fetching for ended auctions.`
    );
  }

  // Calculate enhanced stats
  const stats = {
    activeAuctions: activeAuctions.length,
    endedAuctions: endedAuctions.length,
    totalBids: auctions.reduce((sum, auction) => sum + auction.bidCount, 0),
    totalVolume: parseFloat(
      auctions
        .reduce((sum, auction) => {
          const volume =
            parseFloat(auction.currentBid) || parseFloat(auction.startPrice);
          return sum + volume;
        }, 0)
        .toFixed(4)
    ), // Limit to 4 decimal places
    lastFetchTime,
    totalAuctions: auctions.length,
  };

  // Enhanced filters state
  const [filters, setFilters] = useState({
    type: "all" as "all" | AuctionType,
    status: "all" as "all" | "active" | "ended",
    category: "all",
    priceRange: { min: 0, max: 1000 },
    sortBy: "time" as "price" | "time" | "bids",
    sortOrder: "desc" as "asc" | "desc",
  });

  // Enhanced refresh function with error handling
  const refreshAuctionCache = useCallback(async (auctionId: number) => {
    try {
      console.log(`🔄 Refreshing auction ${auctionId}...`);
      const freshAuction = await fetchAuctionFromContractCorrected(auctionId);
      if (freshAuction) {
        setAuctions((prev) =>
          prev.map((a) =>
            a.auctionId === auctionId.toString() ? freshAuction : a
          )
        );
        console.log(`✅ Auction ${auctionId} refreshed successfully`);
      } else {
        console.warn(`⚠️ Failed to refresh auction ${auctionId}`);
      }
    } catch (error) {
      console.error(`❌ Error refreshing auction ${auctionId}:`, error);
    }
  }, []);

  return {
    auctions,
    activeAuctions,
    endedAuctions,
    pendingAuctions,
    stats,
    filters,
    setFilters,
    isLoading: isLoading || isHandlingFailed,
    error,
    refetch: fetchCorrectedAuctions,
    refreshAuctionCache,
    lastFetchTime,
    isMasterAdmin,
    canMint,
    // Failed auction handling info
    isHandlingFailedAuctions: isHandlingFailed,
    processedFailedAuctions: processedCount,
  };
}

// 9. ENHANCED UTILITY FUNCTIONS
export function getAuctionStatusDebug(auctionId: number) {
  return {
    auctionId,
    statusNames: ["PENDING", "ACTIVE", "ENDED", "CANCELLED", "SETTLED"],
  };
}

// Enhanced metadata debugging utility
export function debugMetadataFetching(tokenId: number, metadata: any) {
  console.log(`🔍 [Debug] Metadata for token ${tokenId}:`, {
    name: metadata?.name,
    image: metadata?.image,
    attributesCount: metadata?.attributes?.length || 0,
    hasCollection: !!metadata?.collection,
    sources: {
      hasIPFS: !!metadata?.ipfsHash,
      hasLocal: !!metadata?.localStorage,
      hasContract: !!metadata?.contractData,
    },
  });
}

// Enhanced auction validation utility
export function validateAuction(auction: Auction): ValidationResult {
  try {
    if (!auction) {
      return { isValid: false, error: "Auction is null or undefined" };
    }

    const requiredFields = [
      "auctionId",
      "nftId",
      "nftName",
      "seller",
      "status",
    ];
    for (const field of requiredFields) {
      if (
        auction[field as keyof Auction] === undefined ||
        auction[field as keyof Auction] === null
      ) {
        return { isValid: false, error: `Missing required field: ${field}` };
      }
    }

    // Validate status
    if (auction.status < 0 || auction.status > 4) {
      return { isValid: false, error: "Invalid status value" };
    }

    // Validate timestamps
    if (auction.startTime >= auction.endTime) {
      return { isValid: false, error: "Invalid timestamps" };
    }

    return { isValid: true, data: auction };
  } catch (error) {
    return { isValid: false, error: `Validation error: ${error}` };
  }
}

// 10. IPFS FILE TRACKING UTILITIES
export function trackIPFSFileCreation(
  hash: string,
  gateway: string,
  source: "pinata" | "ipfs" | "local" = "pinata"
) {
  trackIPFSFile(hash, gateway, source);
  console.log(
    `🎯 [IPFS Tracker] New file created: ${hash} at ${gateway} (${source})`
  );
}

export function getIPFSTrackingInfo(): {
  totalFiles: number;
  files: IPFSFileLocation[];
} {
  const files = getAllTrackedIPFSFiles();
  return {
    totalFiles: files.length,
    files: files.sort((a, b) => b.timestamp - a.timestamp), // Most recent first
  };
}

export function clearIPFSTracking() {
  ipfsFileTracker.clear();
  console.log(`🧹 [IPFS Tracker] Cleared all tracking data`);
}

// Export the enhanced functions
export const fetchAuctionFromContractEnhanced =
  fetchAuctionFromContractCorrected;
export { getSecureNFTCount, validateAuctionData, fetchFromIPFSRobust };
