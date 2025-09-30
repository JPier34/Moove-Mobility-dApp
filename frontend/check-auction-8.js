const { ethers } = require("ethers");

async function checkAuction() {
  const provider = new ethers.JsonRpcProvider(
    "https://ethereum-sepolia.publicnode.com"
  );

  const auctionABI = [
    "function getAuction(uint256 auctionId) view returns (tuple(uint256 auctionId, address nftContract, uint256 tokenId, address seller, uint8 auctionType, uint256 startingPrice, uint256 reservePrice, uint256 buyNowPrice, uint256 currentPrice, uint256 startTime, uint256 endTime, uint256 bidIncrement, address highestBidder, uint256 highestBid, uint8 status, bool allowPartialFulfillment, uint256 minBidders, uint256 totalBidders, bool isSettled, uint256 extensionThreshold, uint256 extensionDuration, uint256 revealEndTime, bool revealPhaseStarted))",
  ];

  const auctionContract = new ethers.Contract(
    "0x463a4fff0796AF7C69788463629AeF046A2fc211",
    auctionABI,
    provider
  );

  try {
    console.log("🔍 Checking Auction 8 Contract State...");
    const auctionData = await auctionContract.getAuction(8);

    console.log("\n📊 Auction 8 Details:");
    console.log("Auction ID:", auctionData.auctionId.toString());
    console.log("NFT Contract:", auctionData.nftContract);
    console.log("Token ID:", auctionData.tokenId.toString());
    console.log("Seller:", auctionData.seller);
    console.log("Auction Type:", auctionData.auctionType);
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
    try {
      console.log(
        "Start Time:",
        auctionData.startTime > 0
          ? new Date(Number(auctionData.startTime) * 1000).toISOString()
          : "Invalid"
      );
    } catch (e) {
      console.log("Start Time: Invalid");
    }
    try {
      console.log(
        "End Time:",
        auctionData.endTime > 0
          ? new Date(Number(auctionData.endTime) * 1000).toISOString()
          : "Invalid"
      );
    } catch (e) {
      console.log("End Time: Invalid");
    }
    console.log(
      "Bid Increment:",
      ethers.formatEther(auctionData.bidIncrement),
      "ETH"
    );
    console.log("Highest Bidder:", auctionData.highestBidder);
    console.log(
      "Highest Bid:",
      ethers.formatEther(auctionData.highestBid),
      "ETH"
    );
    console.log("Status:", auctionData.status);
    console.log("Is Settled:", auctionData.isSettled);
    console.log("Total Bidders:", auctionData.totalBidders.toString());

    // Check if the auction should be claimable
    const userAddress = "0xa70e3fA6D66Ec3aa94de67C10c5Ddbeea9bF44A6";
    const isUserWinner =
      auctionData.highestBidder.toLowerCase() === userAddress.toLowerCase();
    const isEnded =
      auctionData.endTime > 0 &&
      Number(auctionData.endTime) < Math.floor(Date.now() / 1000);

    console.log("\n🎯 Claim Analysis:");
    console.log("User Address:", userAddress);
    console.log("Is User Winner:", isUserWinner);
    console.log("Is Auction Ended:", isEnded);
    console.log(
      "Should Be Claimable:",
      isUserWinner && isEnded && auctionData.isSettled
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkAuction();

async function checkAuction() {
  const provider = new ethers.JsonRpcProvider(
    "https://ethereum-sepolia.publicnode.com"
  );

  const auctionABI = [
    "function getAuction(uint256 auctionId) view returns (tuple(uint256 auctionId, address nftContract, uint256 tokenId, address seller, uint8 auctionType, uint256 startingPrice, uint256 reservePrice, uint256 buyNowPrice, uint256 currentPrice, uint256 startTime, uint256 endTime, uint256 bidIncrement, address highestBidder, uint256 highestBid, uint8 status, bool allowPartialFulfillment, uint256 minBidders, uint256 totalBidders, bool isSettled, uint256 extensionThreshold, uint256 extensionDuration, uint256 revealEndTime, bool revealPhaseStarted))",
  ];

  const auctionContract = new ethers.Contract(
    "0x463a4fff0796AF7C69788463629AeF046A2fc211",
    auctionABI,
    provider
  );

  try {
    console.log("🔍 Checking Auction 8 Contract State...");
    const auctionData = await auctionContract.getAuction(8);

    console.log("\n📊 Auction 8 Details:");
    console.log("Auction ID:", auctionData.auctionId.toString());
    console.log("NFT Contract:", auctionData.nftContract);
    console.log("Token ID:", auctionData.tokenId.toString());
    console.log("Seller:", auctionData.seller);
    console.log("Auction Type:", auctionData.auctionType);
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
    try {
      console.log(
        "Start Time:",
        auctionData.startTime > 0
          ? new Date(Number(auctionData.startTime) * 1000).toISOString()
          : "Invalid"
      );
    } catch (e) {
      console.log("Start Time: Invalid");
    }
    try {
      console.log(
        "End Time:",
        auctionData.endTime > 0
          ? new Date(Number(auctionData.endTime) * 1000).toISOString()
          : "Invalid"
      );
    } catch (e) {
      console.log("End Time: Invalid");
    }
    console.log(
      "Bid Increment:",
      ethers.formatEther(auctionData.bidIncrement),
      "ETH"
    );
    console.log("Highest Bidder:", auctionData.highestBidder);
    console.log(
      "Highest Bid:",
      ethers.formatEther(auctionData.highestBid),
      "ETH"
    );
    console.log("Status:", auctionData.status);
    console.log("Is Settled:", auctionData.isSettled);
    console.log("Total Bidders:", auctionData.totalBidders.toString());

    // Check if the auction should be claimable
    const userAddress = "0xa70e3fA6D66Ec3aa94de67C10c5Ddbeea9bF44A6";
    const isUserWinner =
      auctionData.highestBidder.toLowerCase() === userAddress.toLowerCase();
    const isEnded =
      auctionData.endTime > 0 &&
      Number(auctionData.endTime) < Math.floor(Date.now() / 1000);

    console.log("\n🎯 Claim Analysis:");
    console.log("User Address:", userAddress);
    console.log("Is User Winner:", isUserWinner);
    console.log("Is Auction Ended:", isEnded);
    console.log(
      "Should Be Claimable:",
      isUserWinner && isEnded && auctionData.isSettled
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkAuction();
