/**
 * Debug utility to analyze auction and claim status
 */

import { ethers } from "ethers";
import { contracts } from "./contracts";

export interface AuctionDebugInfo {
  auctionId: number;
  contractData: {
    auctionId: string;
    seller: string;
    highestBidder: string;
    status: number;
    isSettled: boolean;
    endTime: number;
    auctionType: number;
    tokenId: string;
  };
  analysis: {
    isEnded: boolean;
    isSettled: boolean;
    isTimeExpired: boolean;
    hasValidWinner: boolean;
    canBeClaimed: boolean;
    claimRequirements: string[];
  };
}

/**
 * Analyzes a specific auction for claim status
 */
export async function analyzeAuctionForClaim(
  auctionId: number,
  userAddress: string
): Promise<AuctionDebugInfo> {
  try {
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_RPC_URL ||
        "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
    );

    const contractAddress = contracts.MooveAuction.address;
    const contractABI = contracts.MooveAuction.abi;
    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider
    );

    // Get auction data from contract
    const auctionData = await contract.getAuction(auctionId);

    const contractData = {
      auctionId: auctionData.auctionId.toString(),
      seller: auctionData.seller,
      highestBidder: auctionData.highestBidder,
      status: Number(auctionData.status),
      isSettled: auctionData.isSettled,
      endTime: Number(auctionData.endTime),
      auctionType: Number(auctionData.auctionType),
      tokenId: auctionData.tokenId.toString(),
    };

    // Analyze the auction
    const currentTime = Math.floor(Date.now() / 1000);
    const isEnded = contractData.status === 3; // ENDED
    const isSettled = contractData.status === 4; // SETTLED
    const isTimeExpired =
      contractData.status === 1 && currentTime >= contractData.endTime;

    // Check if auction is actually settled (regardless of status)
    const isActuallySettled = contractData.isSettled;

    const hasValidWinner =
      contractData.highestBidder &&
      contractData.highestBidder !==
        "0x0000000000000000000000000000000000000000" &&
      contractData.highestBidder.toLowerCase() === userAddress.toLowerCase();

    const claimRequirements: string[] = [];

    // Check claim requirements
    if (!hasValidWinner) {
      claimRequirements.push("User is not the winner");
    }

    if (!isEnded && !isActuallySettled && !isTimeExpired) {
      claimRequirements.push("Auction is not ended or settled");
    }

    if (isActuallySettled && !hasValidWinner) {
      claimRequirements.push("Auction is settled but user is not the winner");
    }

    // An auction can be claimed if:
    // 1. User is the winner AND
    // 2. Auction is ended (status 3) OR settled (isSettled true) OR time expired
    const canBeClaimed =
      hasValidWinner && (isEnded || isActuallySettled || isTimeExpired);

    const analysis = {
      isEnded,
      isSettled,
      isTimeExpired,
      hasValidWinner,
      canBeClaimed,
      claimRequirements,
    };

    return {
      auctionId,
      contractData,
      analysis,
    };
  } catch (error) {
    console.error(`❌ Error analyzing auction ${auctionId}:`, error);
    throw error;
  }
}

/**
 * Analyzes all auctions for a user
 */
export async function analyzeAllAuctionsForUser(
  userAddress: string
): Promise<AuctionDebugInfo[]> {
  try {
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_RPC_URL ||
        "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
    );

    const contractAddress = contracts.MooveAuction.address;
    const contractABI = contracts.MooveAuction.abi;
    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider
    );

    const totalAuctions = Number(await contract.totalAuctions());
    console.log(
      `🔍 Analyzing ${totalAuctions} auctions for user ${userAddress}`
    );

    const results: AuctionDebugInfo[] = [];

    for (let i = 0; i < totalAuctions; i++) {
      try {
        const analysis = await analyzeAuctionForClaim(i, userAddress);
        results.push(analysis);

        console.log(`📊 Auction ${i}:`, {
          status: analysis.contractData.status,
          isSettled: analysis.contractData.isSettled,
          highestBidder: analysis.contractData.highestBidder,
          hasValidWinner: analysis.analysis.hasValidWinner,
          canBeClaimed: analysis.analysis.canBeClaimed,
          requirements: analysis.analysis.claimRequirements,
        });
      } catch (error) {
        console.error(`❌ Error analyzing auction ${i}:`, error);
      }
    }

    const claimableAuctions = results.filter((r) => r.analysis.canBeClaimed);
    console.log(
      `🎯 Found ${claimableAuctions.length} claimable auctions out of ${totalAuctions}`
    );

    return results;
  } catch (error) {
    console.error("❌ Error analyzing all auctions:", error);
    throw error;
  }
}

/**
 * Checks NFT ownership for a specific token
 */
export async function checkNFTOwnership(
  tokenId: string,
  userAddress: string
): Promise<boolean> {
  try {
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_RPC_URL ||
        "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
    );

    const nftContract = new ethers.Contract(
      contracts.MooveNFT.address,
      contracts.MooveNFT.abi,
      provider
    );

    const owner = await nftContract.ownerOf(tokenId);
    const isOwner = owner.toLowerCase() === userAddress.toLowerCase();

    console.log(`🔍 NFT ${tokenId} ownership:`, {
      tokenId,
      owner,
      userAddress,
      isOwner,
    });

    return isOwner;
  } catch (error) {
    console.error(
      `❌ Error checking NFT ownership for token ${tokenId}:`,
      error
    );
    return false;
  }
}

