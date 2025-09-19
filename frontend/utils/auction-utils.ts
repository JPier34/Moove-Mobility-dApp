import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from "../lib/contracts";

export interface AuctionData {
  auctionId: number;
  tokenId: number;
  startingPrice: bigint;
  currentPrice: bigint;
  highestBid: bigint;
  endTime: number;
  status: number;
  seller: string;
  highestBidder: string;
  bidCount?: number; // Number of bidders in the auction
}

/**
 * Get auction data for a specific NFT token ID
 */
export async function getAuctionDataForNFT(
  tokenId: number,
  userAddress?: string
): Promise<AuctionData | null> {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      console.warn("⚠️ No ethereum provider available");
      return null;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const auctionContract = new ethers.Contract(
      CONTRACT_ADDRESSES.MooveAuction,
      CONTRACT_ABIS.MooveAuction,
      provider
    );

    // Get total auctions count
    const totalAuctions = await auctionContract.totalAuctions();
    const totalCount = Number(totalAuctions);

    console.log(
      `🔍 Searching for auction data for NFT #${tokenId} in ${totalCount} auctions...`
    );

    // Debug: Log all available auctions first
    console.log(`🔍 DEBUG: All available auctions:`);
    for (
      let debugAuctionId = 0;
      debugAuctionId < totalCount;
      debugAuctionId++
    ) {
      try {
        const debugAuctionData = await auctionContract.getAuction(
          debugAuctionId
        );
        console.log(`🔍 Auction #${debugAuctionId}:`, {
          tokenId: Number(debugAuctionData.tokenId),
          status: Number(debugAuctionData.status),
          highestBidder: debugAuctionData.highestBidder,
          endTime: Number(debugAuctionData.endTime),
          startingPrice: debugAuctionData.startingPrice.toString(),
        });
      } catch (error) {
        console.log(`❌ Auction #${debugAuctionId} error:`, error);
      }
    }

    // Search through all auctions to find one with matching tokenId
    for (let auctionId = 0; auctionId < totalCount; auctionId++) {
      try {
        const auctionData = await auctionContract.getAuction(auctionId);

        // Debug: Log all auction data
        console.log(`🔍 Auction #${auctionId}:`, {
          tokenId: Number(auctionData.tokenId),
          startingPrice: auctionData.startingPrice.toString(),
          currentPrice: auctionData.currentPrice.toString(),
          highestBid: auctionData.highestBid.toString(),
          status: Number(auctionData.status),
          seller: auctionData.seller,
          highestBidder: auctionData.highestBidder,
        });

        // Check if this auction is for the NFT we're looking for
        if (Number(auctionData.tokenId) === tokenId) {
          console.log(`✅ Found auction #${auctionId} for NFT #${tokenId}`);

          return {
            auctionId,
            tokenId: Number(auctionData.tokenId),
            startingPrice: auctionData.startingPrice,
            currentPrice: auctionData.currentPrice,
            highestBid: auctionData.highestBid,
            endTime: Number(auctionData.endTime),
            status: Number(auctionData.status),
            seller: auctionData.seller,
            highestBidder: auctionData.highestBidder,
            bidCount: 0, // TODO: Get real bid count from contract
          };
        }

        // If this is a settled auction and the current user is the highest bidder,
        // this NFT might have been won by them
        if (
          Number(auctionData.status) === 4 && // Status 4 = settled/ended
          auctionData.highestBidder &&
          userAddress &&
          auctionData.highestBidder.toLowerCase() === userAddress.toLowerCase()
        ) {
          console.log(
            `🎯 Found settled auction #${auctionId} won by current user for NFT #${auctionData.tokenId}`
          );

          // Return auction data even if tokenId doesn't match exactly
          // This helps with price reference for similar NFTs
          return {
            auctionId,
            tokenId: Number(auctionData.tokenId),
            startingPrice: auctionData.startingPrice,
            currentPrice: auctionData.currentPrice,
            highestBid: auctionData.highestBid,
            endTime: Number(auctionData.endTime),
            status: Number(auctionData.status),
            seller: auctionData.seller,
            highestBidder: auctionData.highestBidder,
            bidCount: 0, // TODO: Get real bid count from contract
          };
        }
      } catch (error) {
        console.warn(`⚠️ Error fetching auction ${auctionId}:`, error);
        continue;
      }
    }

    console.log(`ℹ️ No auction found for NFT #${tokenId}`);
    return null;
  } catch (error) {
    console.error(
      `❌ Error searching for auction data for NFT #${tokenId}:`,
      error
    );
    return null;
  }
}

/**
 * Get all auctions for a specific NFT token ID (in case there are multiple)
 */
export async function getAllAuctionsForNFT(
  tokenId: number
): Promise<AuctionData[]> {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      console.warn("⚠️ No ethereum provider available");
      return [];
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const auctionContract = new ethers.Contract(
      CONTRACT_ADDRESSES.MooveAuction,
      CONTRACT_ABIS.MooveAuction,
      provider
    );

    // Get total auctions count
    const totalAuctions = await auctionContract.totalAuctions();
    const totalCount = Number(totalAuctions);

    const auctions: AuctionData[] = [];

    // Search through all auctions to find ones with matching tokenId
    for (let auctionId = 0; auctionId < totalCount; auctionId++) {
      try {
        const auctionData = await auctionContract.getAuction(auctionId);

        // Check if this auction is for the NFT we're looking for
        if (Number(auctionData.tokenId) === tokenId) {
          auctions.push({
            auctionId,
            tokenId: Number(auctionData.tokenId),
            startingPrice: auctionData.startingPrice,
            currentPrice: auctionData.currentPrice,
            highestBid: auctionData.highestBid,
            endTime: Number(auctionData.endTime),
            status: Number(auctionData.status),
            seller: auctionData.seller,
            highestBidder: auctionData.highestBidder,
          });
        }
      } catch (error) {
        console.warn(`⚠️ Error fetching auction ${auctionId}:`, error);
        continue;
      }
    }

    console.log(`📊 Found ${auctions.length} auctions for NFT #${tokenId}`);
    return auctions;
  } catch (error) {
    console.error(
      `❌ Error searching for all auctions for NFT #${tokenId}:`,
      error
    );
    return [];
  }
}
