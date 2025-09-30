const { ethers } = require("hardhat");

/**
 * Script per diagnosticare il problema dell'evento BidPlaced corrotto
 */
async function main() {
  console.log("🔍 Diagnosing BidPlaced event corruption...");

  // Contract addresses from utils/contracts.ts
  const auctionAddress = "0x463a4fff0796AF7C69788463629AeF046A2fc211";
  const nftAddress = "0x40E455515bf712144C1A5D859F19d64b537754f7";

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Diagnosing with account:", deployer.address);

  try {
    // Get contract instances
    const MooveAuction = await ethers.getContractFactory("MooveAuction");
    const auction = MooveAuction.attach(auctionAddress);

    const MooveNFT = await ethers.getContractFactory("MooveNFT");
    const nft = MooveNFT.attach(nftAddress);

    console.log("\n📋 Contract Information:");
    console.log(`MooveAuction: ${auctionAddress}`);
    console.log(`MooveNFT: ${nftAddress}`);

    // Check contract pause status
    console.log("\n⏸️ Contract Status:");
    try {
      const isPaused = await auction.paused();
      console.log(`MooveAuction paused: ${isPaused}`);
    } catch (error) {
      console.log(`❌ Error checking pause status: ${error.message}`);
    }

    // Check total auctions
    console.log("\n📊 Auction Statistics:");
    try {
      const totalAuctions = await auction.totalAuctions();
      console.log(`Total auctions: ${totalAuctions.toString()}`);
    } catch (error) {
      console.log(`❌ Error getting total auctions: ${error.message}`);
    }

    // Check specific auction (auction 7)
    console.log("\n🎯 Checking Auction #7:");
    try {
      const auctionData = await auction.getAuction(7);
      console.log("Auction data:", {
        auctionId: auctionData.auctionId.toString(),
        nftContract: auctionData.nftContract,
        tokenId: auctionData.tokenId.toString(),
        seller: auctionData.seller,
        auctionType: auctionData.auctionType,
        startingPrice: ethers.formatEther(auctionData.startingPrice),
        currentPrice: ethers.formatEther(auctionData.currentPrice),
        highestBidder: auctionData.highestBidder,
        highestBid: ethers.formatEther(auctionData.highestBid),
        status: auctionData.status,
        isSettled: auctionData.isSettled,
        startTime: new Date(Number(auctionData.startTime) * 1000).toISOString(),
        endTime: new Date(Number(auctionData.endTime) * 1000).toISOString(),
      });
    } catch (error) {
      console.log(`❌ Error getting auction 7: ${error.message}`);
    }

    // Check recent BidPlaced events
    console.log("\n🔍 Checking Recent BidPlaced Events:");
    try {
      // Get the latest block number
      const latestBlock = await ethers.provider.getBlockNumber();
      console.log(`Latest block: ${latestBlock}`);

      // Look for BidPlaced events in the last 100 blocks
      const fromBlock = Math.max(0, latestBlock - 100);
      const toBlock = latestBlock;

      console.log(`Searching blocks ${fromBlock} to ${toBlock}...`);

      const filter = auction.filters.BidPlaced();
      const events = await auction.queryFilter(filter, fromBlock, toBlock);

      console.log(`Found ${events.length} BidPlaced events:`);

      events.forEach((event, index) => {
        console.log(`\nEvent ${index + 1}:`);
        console.log(`  Block: ${event.blockNumber}`);
        console.log(`  Transaction: ${event.transactionHash}`);
        console.log(`  AuctionId: ${event.args.auctionId.toString()}`);
        console.log(`  Bidder: ${event.args.bidder}`);
        console.log(`  Amount: ${ethers.formatEther(event.args.amount)} ETH`);
        console.log(`  IsHighestBid: ${event.args.isHighestBid}`);

        // Check if this looks corrupted
        const isCorrupted =
          event.args.auctionId.toString() === "1000000000000000" ||
          event.args.bidder === "0x0000000000000000000000000000000000000001" ||
          event.args.amount.toString() === "0";

        if (isCorrupted) {
          console.log(`  ⚠️  CORRUPTED EVENT DETECTED!`);
        }
      });
    } catch (error) {
      console.log(`❌ Error querying events: ${error.message}`);
    }

    // Test placing a small bid to see if the event is emitted correctly
    console.log("\n🧪 Testing Bid Placement (Dry Run):");
    try {
      // Check if we can call placeBid (without actually sending ETH)
      const auctionData = await auction.getAuction(7);

      if (auctionData.status === 0) {
        // Active auction
        console.log("Auction 7 is active, testing bid placement...");

        // Calculate minimum bid
        const currentBid = auctionData.highestBid;
        const bidIncrement = auctionData.bidIncrement;
        const minimumBid = currentBid + bidIncrement;

        console.log(
          `Current highest bid: ${ethers.formatEther(currentBid)} ETH`
        );
        console.log(`Bid increment: ${ethers.formatEther(bidIncrement)} ETH`);
        console.log(
          `Minimum bid required: ${ethers.formatEther(minimumBid)} ETH`
        );

        // Check if we have enough ETH
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);

        if (balance > minimumBid) {
          console.log("✅ Account has sufficient balance for test bid");
          console.log("⚠️  Skipping actual bid placement to avoid corruption");
        } else {
          console.log("❌ Insufficient balance for test bid");
        }
      } else {
        console.log(`Auction 7 status: ${auctionData.status} (not active)`);
      }
    } catch (error) {
      console.log(`❌ Error testing bid placement: ${error.message}`);
    }

    // Check contract bytecode and verify it matches expected ABI
    console.log("\n🔍 Contract Verification:");
    try {
      const code = await ethers.provider.getCode(auctionAddress);
      console.log(`Contract code length: ${code.length} characters`);
      console.log(`Contract deployed: ${code !== "0x"}`);

      // Try to call a simple view function to verify ABI compatibility
      const platformFee = await auction.platformFeePercentage();
      console.log(`Platform fee: ${platformFee.toString()}%`);
    } catch (error) {
      console.log(`❌ Error verifying contract: ${error.message}`);
    }
  } catch (error) {
    console.error("❌ Diagnosis failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

/**
 * Script per diagnosticare il problema dell'evento BidPlaced corrotto
 */
async function main() {
  console.log("🔍 Diagnosing BidPlaced event corruption...");

  // Contract addresses from utils/contracts.ts
  const auctionAddress = "0x463a4fff0796AF7C69788463629AeF046A2fc211";
  const nftAddress = "0x40E455515bf712144C1A5D859F19d64b537754f7";

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Diagnosing with account:", deployer.address);

  try {
    // Get contract instances
    const MooveAuction = await ethers.getContractFactory("MooveAuction");
    const auction = MooveAuction.attach(auctionAddress);

    const MooveNFT = await ethers.getContractFactory("MooveNFT");
    const nft = MooveNFT.attach(nftAddress);

    console.log("\n📋 Contract Information:");
    console.log(`MooveAuction: ${auctionAddress}`);
    console.log(`MooveNFT: ${nftAddress}`);

    // Check contract pause status
    console.log("\n⏸️ Contract Status:");
    try {
      const isPaused = await auction.paused();
      console.log(`MooveAuction paused: ${isPaused}`);
    } catch (error) {
      console.log(`❌ Error checking pause status: ${error.message}`);
    }

    // Check total auctions
    console.log("\n📊 Auction Statistics:");
    try {
      const totalAuctions = await auction.totalAuctions();
      console.log(`Total auctions: ${totalAuctions.toString()}`);
    } catch (error) {
      console.log(`❌ Error getting total auctions: ${error.message}`);
    }

    // Check specific auction (auction 7)
    console.log("\n🎯 Checking Auction #7:");
    try {
      const auctionData = await auction.getAuction(7);
      console.log("Auction data:", {
        auctionId: auctionData.auctionId.toString(),
        nftContract: auctionData.nftContract,
        tokenId: auctionData.tokenId.toString(),
        seller: auctionData.seller,
        auctionType: auctionData.auctionType,
        startingPrice: ethers.formatEther(auctionData.startingPrice),
        currentPrice: ethers.formatEther(auctionData.currentPrice),
        highestBidder: auctionData.highestBidder,
        highestBid: ethers.formatEther(auctionData.highestBid),
        status: auctionData.status,
        isSettled: auctionData.isSettled,
        startTime: new Date(Number(auctionData.startTime) * 1000).toISOString(),
        endTime: new Date(Number(auctionData.endTime) * 1000).toISOString(),
      });
    } catch (error) {
      console.log(`❌ Error getting auction 7: ${error.message}`);
    }

    // Check recent BidPlaced events
    console.log("\n🔍 Checking Recent BidPlaced Events:");
    try {
      // Get the latest block number
      const latestBlock = await ethers.provider.getBlockNumber();
      console.log(`Latest block: ${latestBlock}`);

      // Look for BidPlaced events in the last 100 blocks
      const fromBlock = Math.max(0, latestBlock - 100);
      const toBlock = latestBlock;

      console.log(`Searching blocks ${fromBlock} to ${toBlock}...`);

      const filter = auction.filters.BidPlaced();
      const events = await auction.queryFilter(filter, fromBlock, toBlock);

      console.log(`Found ${events.length} BidPlaced events:`);

      events.forEach((event, index) => {
        console.log(`\nEvent ${index + 1}:`);
        console.log(`  Block: ${event.blockNumber}`);
        console.log(`  Transaction: ${event.transactionHash}`);
        console.log(`  AuctionId: ${event.args.auctionId.toString()}`);
        console.log(`  Bidder: ${event.args.bidder}`);
        console.log(`  Amount: ${ethers.formatEther(event.args.amount)} ETH`);
        console.log(`  IsHighestBid: ${event.args.isHighestBid}`);

        // Check if this looks corrupted
        const isCorrupted =
          event.args.auctionId.toString() === "1000000000000000" ||
          event.args.bidder === "0x0000000000000000000000000000000000000001" ||
          event.args.amount.toString() === "0";

        if (isCorrupted) {
          console.log(`  ⚠️  CORRUPTED EVENT DETECTED!`);
        }
      });
    } catch (error) {
      console.log(`❌ Error querying events: ${error.message}`);
    }

    // Test placing a small bid to see if the event is emitted correctly
    console.log("\n🧪 Testing Bid Placement (Dry Run):");
    try {
      // Check if we can call placeBid (without actually sending ETH)
      const auctionData = await auction.getAuction(7);

      if (auctionData.status === 0) {
        // Active auction
        console.log("Auction 7 is active, testing bid placement...");

        // Calculate minimum bid
        const currentBid = auctionData.highestBid;
        const bidIncrement = auctionData.bidIncrement;
        const minimumBid = currentBid + bidIncrement;

        console.log(
          `Current highest bid: ${ethers.formatEther(currentBid)} ETH`
        );
        console.log(`Bid increment: ${ethers.formatEther(bidIncrement)} ETH`);
        console.log(
          `Minimum bid required: ${ethers.formatEther(minimumBid)} ETH`
        );

        // Check if we have enough ETH
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);

        if (balance > minimumBid) {
          console.log("✅ Account has sufficient balance for test bid");
          console.log("⚠️  Skipping actual bid placement to avoid corruption");
        } else {
          console.log("❌ Insufficient balance for test bid");
        }
      } else {
        console.log(`Auction 7 status: ${auctionData.status} (not active)`);
      }
    } catch (error) {
      console.log(`❌ Error testing bid placement: ${error.message}`);
    }

    // Check contract bytecode and verify it matches expected ABI
    console.log("\n🔍 Contract Verification:");
    try {
      const code = await ethers.provider.getCode(auctionAddress);
      console.log(`Contract code length: ${code.length} characters`);
      console.log(`Contract deployed: ${code !== "0x"}`);

      // Try to call a simple view function to verify ABI compatibility
      const platformFee = await auction.platformFeePercentage();
      console.log(`Platform fee: ${platformFee.toString()}%`);
    } catch (error) {
      console.log(`❌ Error verifying contract: ${error.message}`);
    }
  } catch (error) {
    console.error("❌ Diagnosis failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });


