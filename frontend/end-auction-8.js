const { ethers } = require("ethers");

async function endAuction8() {
  const provider = new ethers.JsonRpcProvider("https://sepolia.drpc.org");

  const auctionABI = [
    "function endAuction(uint256 auctionId) external",
    "function getAuction(uint256 auctionId) view returns (tuple(uint256 auctionId, address nftContract, uint256 tokenId, address seller, uint8 auctionType, uint256 startingPrice, uint256 reservePrice, uint256 buyNowPrice, uint256 currentPrice, uint256 startTime, uint256 endTime, uint256 bidIncrement, address highestBidder, uint256 highestBid, uint8 status, bool allowPartialFulfillment, uint256 minBidders, uint256 totalBidders, bool isSettled, uint256 extensionThreshold, uint256 extensionDuration, uint256 revealEndTime, bool revealPhaseStarted))",
  ];

  const auctionContract = new ethers.Contract(
    "0x463a4fff0796AF7C69788463629AeF046A2fc211",
    auctionABI,
    provider
  );

  try {
    console.log("🔍 Checking Auction 8 status before endAuction...");
    const auctionData = await auctionContract.getAuction(8);

    console.log("📊 Auction 8 Status:", auctionData.status);
    console.log("📊 Auction 8 Is Settled:", auctionData.isSettled);
    console.log("📊 Auction 8 End Time:", auctionData.endTime);
    console.log("📊 Current Time:", Math.floor(Date.now() / 1000));
    console.log(
      "📊 Is Time Expired:",
      auctionData.endTime < Math.floor(Date.now() / 1000)
    );

    if (
      auctionData.status === 1 &&
      auctionData.endTime < Math.floor(Date.now() / 1000)
    ) {
      console.log("✅ Auction 8 is ready to be ended. Calling endAuction...");

      // Note: This would require a signer (wallet) to call endAuction
      // For now, we'll just show what should happen
      console.log(
        "🔧 To end the auction, you need to call endAuction(8) from a wallet"
      );
      console.log("🔧 Then call settleAuction(8) to complete the settlement");
    } else {
      console.log("❌ Auction 8 is not ready to be ended");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

endAuction8();

async function endAuction8() {
  const provider = new ethers.JsonRpcProvider("https://sepolia.drpc.org");

  const auctionABI = [
    "function endAuction(uint256 auctionId) external",
    "function getAuction(uint256 auctionId) view returns (tuple(uint256 auctionId, address nftContract, uint256 tokenId, address seller, uint8 auctionType, uint256 startingPrice, uint256 reservePrice, uint256 buyNowPrice, uint256 currentPrice, uint256 startTime, uint256 endTime, uint256 bidIncrement, address highestBidder, uint256 highestBid, uint8 status, bool allowPartialFulfillment, uint256 minBidders, uint256 totalBidders, bool isSettled, uint256 extensionThreshold, uint256 extensionDuration, uint256 revealEndTime, bool revealPhaseStarted))",
  ];

  const auctionContract = new ethers.Contract(
    "0x463a4fff0796AF7C69788463629AeF046A2fc211",
    auctionABI,
    provider
  );

  try {
    console.log("🔍 Checking Auction 8 status before endAuction...");
    const auctionData = await auctionContract.getAuction(8);

    console.log("📊 Auction 8 Status:", auctionData.status);
    console.log("📊 Auction 8 Is Settled:", auctionData.isSettled);
    console.log("📊 Auction 8 End Time:", auctionData.endTime);
    console.log("📊 Current Time:", Math.floor(Date.now() / 1000));
    console.log(
      "📊 Is Time Expired:",
      auctionData.endTime < Math.floor(Date.now() / 1000)
    );

    if (
      auctionData.status === 1 &&
      auctionData.endTime < Math.floor(Date.now() / 1000)
    ) {
      console.log("✅ Auction 8 is ready to be ended. Calling endAuction...");

      // Note: This would require a signer (wallet) to call endAuction
      // For now, we'll just show what should happen
      console.log(
        "🔧 To end the auction, you need to call endAuction(8) from a wallet"
      );
      console.log("🔧 Then call settleAuction(8) to complete the settlement");
    } else {
      console.log("❌ Auction 8 is not ready to be ended");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

endAuction8();




