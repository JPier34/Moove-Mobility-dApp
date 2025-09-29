const { ethers } = require("hardhat");

async function checkAuction4Status() {
    console.log("🔍 Checking Auction #4 Status...");
    
    // Contract addresses
    const auctionAddress = "0x6096c74Ed257b14c601210e0B6256e39D534154e";
    
    // Get provider
    const provider = new ethers.JsonRpcProvider("https://sepolia.drpc.org");
    
    // Create contract instance
    const auctionContract = new ethers.Contract(
        auctionAddress,
        [
            "function totalAuctions() view returns (uint256)",
            "function getAuction(uint256 auctionId) view returns (tuple(uint256 auctionId, address nftContract, uint256 tokenId, address seller, uint8 auctionType, uint256 startingPrice, uint256 reservePrice, uint256 buyNowPrice, uint256 currentPrice, uint256 startTime, uint256 endTime, uint256 bidIncrement, address highestBidder, uint256 highestBid, uint8 status, bool allowPartialFulfillment, uint256 minBidders, uint256 totalBidders, bool isSettled, uint256 extensionThreshold, uint256 extensionDuration, uint256 revealEndTime, bool revealPhaseStarted))"
        ],
        provider
    );
    
    try {
        console.log("\n📊 === AUCTION #4 STATUS CHECK ===");
        
        // Check total auctions
        const totalAuctions = await auctionContract.totalAuctions();
        console.log(`Total auctions: ${totalAuctions}`);
        
        // Check auction #4 specifically
        console.log("\n🔍 Auction #4 Analysis:");
        
        try {
            const auction = await auctionContract.getAuction(4);
            const currentTime = Math.floor(Date.now() / 1000);
            
            console.log(`Auction #4:`, {
                auctionId: auction.auctionId.toString(),
                tokenId: auction.tokenId.toString(),
                seller: auction.seller,
                auctionType: Number(auction.auctionType),
                status: Number(auction.status),
                startingPrice: ethers.formatEther(auction.startingPrice),
                startTime: new Date(Number(auction.startTime) * 1000).toISOString(),
                endTime: new Date(Number(auction.endTime) * 1000).toISOString(),
                currentTime: new Date().toISOString(),
                timeExpired: currentTime >= Number(auction.endTime),
                highestBidder: auction.highestBidder,
                highestBid: ethers.formatEther(auction.highestBid),
                totalBidders: Number(auction.totalBidders),
                isSettled: auction.isSettled
            });
            
            // Check auction status
            const status = Number(auction.status);
            const statusText = {
                0: "PENDING",
                1: "ACTIVE", 
                2: "REVEAL",
                3: "ENDED",
                4: "SETTLED",
                5: "CANCELLED"
            };
            
            console.log(`\nStatus Analysis:`);
            console.log(`- Status: ${status} (${statusText[status] || "UNKNOWN"})`);
            console.log(`- Is Active: ${status === 1}`);
            console.log(`- Time Expired: ${currentTime >= Number(auction.endTime)}`);
            
            if (status !== 1) {
                console.log(`❌ Auction #4 is not ACTIVE (status: ${status})`);
            } else if (currentTime >= Number(auction.endTime)) {
                console.log(`⚠️  Auction #4 is ACTIVE but time has expired!`);
            } else {
                console.log(`✅ Auction #4 is ACTIVE and time has not expired`);
            }
            
        } catch (error) {
            console.log(`❌ Error checking auction #4:`, error.message);
        }
        
    } catch (error) {
        console.error("❌ General error:", error);
    }
}

checkAuction4Status()
    .then(() => {
        console.log("\n✅ Status check completed");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Status check failed:", error);
        process.exit(1);
    });





