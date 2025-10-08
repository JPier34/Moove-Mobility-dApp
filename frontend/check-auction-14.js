const { ethers } = require("ethers");

async function checkAuction14() {
  const provider = new ethers.JsonRpcProvider(
    "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
  );

  const auctionContract = new ethers.Contract(
    "0xE8f6836A0054B83b9a952e8B62D92e62f5c67606",
    [
      "function getAuction(uint256 auctionId) view returns (tuple(uint256 auctionId, address nftContract, uint256 tokenId, address seller, uint8 auctionType, uint256 startingPrice, uint256 reservePrice, uint256 buyNowPrice, uint256 currentPrice, uint256 startTime, uint256 endTime, uint256 bidIncrement, address highestBidder, uint256 highestBid, uint8 status, bool allowPartialFulfillment, uint256 minBidders, uint256 totalBidders, bool isSettled, uint256 extensionThreshold, uint256 extensionDuration, uint256 revealEndTime, bool revealPhaseStarted))",
    ],
    provider
  );

  try {
    console.log("🔍 Checking Auction 14 Contract State...");
    const auctionData = await auctionContract.getAuction(14);

    console.log("\n📊 Auction 14 Details:");
    console.log("Auction ID:", auctionData.auctionId.toString());
    console.log("NFT Contract:", auctionData.nftContract);
    console.log("Token ID:", auctionData.tokenId.toString());
    console.log("Seller:", auctionData.seller);
    console.log("Auction Type:", auctionData.auctionType);
    console.log("Status:", auctionData.status);
    console.log("Is Settled:", auctionData.isSettled);

    console.log(
      "Starting Price:",
      ethers.formatEther(auctionData.startingPrice),
      "ETH"
    );
    console.log(
      "Current Price:",
      ethers.formatEther(auctionData.currentPrice),
      "ETH"
    );
    console.log(
      "Highest Bid:",
      ethers.formatEther(auctionData.highestBid),
      "ETH"
    );
    console.log("Highest Bidder:", auctionData.highestBidder);
    console.log("Total Bidders:", auctionData.totalBidders.toString());

    // Check times
    const currentTime = Math.floor(Date.now() / 1000);
    const startTime = Number(auctionData.startTime);
    const endTime = Number(auctionData.endTime);

    console.log("\n⏰ Time Information:");
    console.log("Current Time:", new Date().toISOString());

    if (startTime > 0 && startTime < 2000000000) {
      console.log("Start Time:", new Date(startTime * 1000).toISOString());
    } else {
      console.log("Start Time: Invalid/Corrupted");
    }

    if (endTime > 0 && endTime < 2000000000) {
      console.log("End Time:", new Date(endTime * 1000).toISOString());
      console.log(
        "Time Remaining:",
        Math.max(0, endTime - currentTime),
        "seconds"
      );
      console.log(
        "Time Remaining:",
        Math.max(0, Math.floor((endTime - currentTime) / 60)),
        "minutes"
      );

      if (currentTime >= endTime) {
        console.log("🕐 Auction has ENDED!");
      } else {
        console.log("🕐 Auction is still ACTIVE");
      }
    } else {
      console.log("End Time: Invalid/Corrupted");
    }

    // Check if user is winner
    const userAddress = "0xa70e3fA6D66Ec3aa94de67C10c5Ddbeea9bF44A6";
    const isUserWinner =
      auctionData.highestBidder.toLowerCase() === userAddress.toLowerCase();

    console.log("\n🎯 Winner Analysis:");
    console.log("Your Address:", userAddress);
    console.log("Highest Bidder:", auctionData.highestBidder);
    console.log("Are you the winner?", isUserWinner ? "✅ YES" : "❌ NO");
  } catch (error) {
    console.error("❌ Error checking auction:", error);
  }
}

checkAuction14();
