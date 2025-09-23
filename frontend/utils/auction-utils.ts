import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

export interface AuctionData {
  auctionId: number;
  nftContract: string;
  tokenId: number;
  seller: string;
  auctionType: number;
  startingPrice: bigint;
  reservePrice: bigint;
  buyNowPrice: bigint;
  currentPrice: bigint;
  startTime: number;
  endTime: number;
  bidIncrement: bigint;
  highestBidder: string;
  highestBid: bigint;
  status: number;
  allowPartialFulfillment: boolean;
  minBidders: number;
  totalBidders: number;
  isSettled: boolean;
  extensionThreshold: bigint;
  extensionDuration: bigint;
  lastBidTime: number;
  bidCount: number;
  hasReservePrice: boolean;
  isDutchAuction: boolean;
  dutchStartPrice: bigint;
  dutchEndPrice: bigint;
  dutchPriceDecrement: bigint;
  dutchTimeInterval: bigint;
  isSealedBid: boolean;
  sealedBidDeadline: number;
  isRevealPhase: boolean;
  revealDeadline: number;
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
      contracts.MooveAuction.address,
      contracts.MooveAuction.abi,
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
          auctionId: Number(debugAuctionData.auctionId),
          nftContract: debugAuctionData.nftContract,
          tokenId: Number(debugAuctionData.tokenId),
          seller: debugAuctionData.seller,
          auctionType: Number(debugAuctionData.auctionType),
          startingPrice: debugAuctionData.startingPrice.toString(),
          currentPrice: debugAuctionData.currentPrice.toString(),
          highestBid: debugAuctionData.highestBid.toString(),
          status: Number(debugAuctionData.status),
          highestBidder: debugAuctionData.highestBidder,
          endTime: Number(debugAuctionData.endTime),
          bidCount: Number(debugAuctionData.bidCount),
          isDutchAuction: debugAuctionData.isDutchAuction,
          isSealedBid: debugAuctionData.isSealedBid,
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
          auctionId: Number(auctionData.auctionId),
          nftContract: auctionData.nftContract,
          tokenId: Number(auctionData.tokenId),
          seller: auctionData.seller,
          auctionType: Number(auctionData.auctionType),
          startingPrice: auctionData.startingPrice.toString(),
          reservePrice: auctionData.reservePrice.toString(),
          buyNowPrice: auctionData.buyNowPrice.toString(),
          currentPrice: auctionData.currentPrice.toString(),
          startTime: Number(auctionData.startTime),
          endTime: Number(auctionData.endTime),
          bidIncrement: auctionData.bidIncrement.toString(),
          highestBidder: auctionData.highestBidder,
          highestBid: auctionData.highestBid.toString(),
          status: Number(auctionData.status),
          allowPartialFulfillment: auctionData.allowPartialFulfillment,
          minBidders: Number(auctionData.minBidders),
          totalBidders: Number(auctionData.totalBidders),
          isSettled: auctionData.isSettled,
          bidCount: Number(auctionData.bidCount),
          isDutchAuction: auctionData.isDutchAuction,
          isSealedBid: auctionData.isSealedBid,
        });

        // Check if this auction is for the NFT we're looking for
        if (Number(auctionData.tokenId) === tokenId) {
          console.log(`✅ Found auction #${auctionId} for NFT #${tokenId}`);

          return {
            auctionId,
            nftContract: auctionData.nftContract,
            tokenId: Number(auctionData.tokenId),
            seller: auctionData.seller,
            auctionType: Number(auctionData.auctionType),
            startingPrice: auctionData.startingPrice,
            reservePrice: auctionData.reservePrice,
            buyNowPrice: auctionData.buyNowPrice,
            currentPrice: auctionData.currentPrice,
            startTime: Number(auctionData.startTime),
            endTime: Number(auctionData.endTime),
            bidIncrement: auctionData.bidIncrement,
            highestBidder: auctionData.highestBidder,
            highestBid: auctionData.highestBid,
            status: Number(auctionData.status),
            allowPartialFulfillment: auctionData.allowPartialFulfillment,
            minBidders: Number(auctionData.minBidders),
            totalBidders: Number(auctionData.totalBidders),
            isSettled: auctionData.isSettled,
            extensionThreshold: auctionData.extensionThreshold,
            extensionDuration: auctionData.extensionDuration,
            lastBidTime: Number(auctionData.lastBidTime),
            bidCount: Number(auctionData.bidCount),
            hasReservePrice: auctionData.hasReservePrice,
            isDutchAuction: auctionData.isDutchAuction,
            dutchStartPrice: auctionData.dutchStartPrice,
            dutchEndPrice: auctionData.dutchEndPrice,
            dutchPriceDecrement: auctionData.dutchPriceDecrement,
            dutchTimeInterval: auctionData.dutchTimeInterval,
            isSealedBid: auctionData.isSealedBid,
            sealedBidDeadline: Number(auctionData.sealedBidDeadline),
            isRevealPhase: auctionData.isRevealPhase,
            revealDeadline: Number(auctionData.revealDeadline),
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
            nftContract: auctionData.nftContract,
            tokenId: Number(auctionData.tokenId),
            seller: auctionData.seller,
            auctionType: Number(auctionData.auctionType),
            startingPrice: auctionData.startingPrice,
            reservePrice: auctionData.reservePrice,
            buyNowPrice: auctionData.buyNowPrice,
            currentPrice: auctionData.currentPrice,
            startTime: Number(auctionData.startTime),
            endTime: Number(auctionData.endTime),
            bidIncrement: auctionData.bidIncrement,
            highestBidder: auctionData.highestBidder,
            highestBid: auctionData.highestBid,
            status: Number(auctionData.status),
            allowPartialFulfillment: auctionData.allowPartialFulfillment,
            minBidders: Number(auctionData.minBidders),
            totalBidders: Number(auctionData.totalBidders),
            isSettled: auctionData.isSettled,
            extensionThreshold: auctionData.extensionThreshold,
            extensionDuration: auctionData.extensionDuration,
            lastBidTime: Number(auctionData.lastBidTime),
            bidCount: Number(auctionData.bidCount),
            hasReservePrice: auctionData.hasReservePrice,
            isDutchAuction: auctionData.isDutchAuction,
            dutchStartPrice: auctionData.dutchStartPrice,
            dutchEndPrice: auctionData.dutchEndPrice,
            dutchPriceDecrement: auctionData.dutchPriceDecrement,
            dutchTimeInterval: auctionData.dutchTimeInterval,
            isSealedBid: auctionData.isSealedBid,
            sealedBidDeadline: Number(auctionData.sealedBidDeadline),
            isRevealPhase: auctionData.isRevealPhase,
            revealDeadline: Number(auctionData.revealDeadline),
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
      contracts.MooveAuction.address,
      contracts.MooveAuction.abi,
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
            nftContract: auctionData.nftContract,
            tokenId: Number(auctionData.tokenId),
            seller: auctionData.seller,
            auctionType: Number(auctionData.auctionType),
            startingPrice: auctionData.startingPrice,
            reservePrice: auctionData.reservePrice,
            buyNowPrice: auctionData.buyNowPrice,
            currentPrice: auctionData.currentPrice,
            startTime: Number(auctionData.startTime),
            endTime: Number(auctionData.endTime),
            bidIncrement: auctionData.bidIncrement,
            highestBidder: auctionData.highestBidder,
            highestBid: auctionData.highestBid,
            status: Number(auctionData.status),
            allowPartialFulfillment: auctionData.allowPartialFulfillment,
            minBidders: Number(auctionData.minBidders),
            totalBidders: Number(auctionData.totalBidders),
            isSettled: auctionData.isSettled,
            extensionThreshold: auctionData.extensionThreshold,
            extensionDuration: auctionData.extensionDuration,
            lastBidTime: Number(auctionData.lastBidTime),
            bidCount: Number(auctionData.bidCount),
            hasReservePrice: auctionData.hasReservePrice,
            isDutchAuction: auctionData.isDutchAuction,
            dutchStartPrice: auctionData.dutchStartPrice,
            dutchEndPrice: auctionData.dutchEndPrice,
            dutchPriceDecrement: auctionData.dutchPriceDecrement,
            dutchTimeInterval: auctionData.dutchTimeInterval,
            isSealedBid: auctionData.isSealedBid,
            sealedBidDeadline: Number(auctionData.sealedBidDeadline),
            isRevealPhase: auctionData.isRevealPhase,
            revealDeadline: Number(auctionData.revealDeadline),
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
