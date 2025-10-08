const { ethers } = require("ethers");

/**
 * Script per diagnosticare il problema dell'evento BidPlaced corrotto usando ABI diretto
 */
async function main() {
  console.log("🔍 Diagnosing BidPlaced event corruption...");

  // Contract addresses from utils/contracts.ts
  const auctionAddress = "0xE8f6836A0054B83b9a952e8B62D92e62f5c67606";
  const nftAddress = "0x40E455515bf712144C1A5D859F19d64b537754f7";

  // RPC URL (using the same as in the frontend)
  const rpcUrl = "https://ethereum-sepolia.publicnode.com";
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // Minimal ABI for the functions we need
  const auctionABI = [
    "function paused() view returns (bool)",
    "function totalAuctions() view returns (uint256)",
    "function getAuction(uint256 auctionId) view returns (tuple(uint256 auctionId, address nftContract, uint256 tokenId, address seller, uint8 auctionType, uint256 startingPrice, uint256 reservePrice, uint256 buyNowPrice, uint256 currentPrice, uint256 startTime, uint256 endTime, uint256 bidIncrement, address highestBidder, uint256 highestBid, uint8 status, bool allowPartialFulfillment, uint256 minBidders, uint256 totalBidders, bool isSettled, uint256 extensionThreshold, uint256 extensionDuration, uint256 revealEndTime, bool revealPhaseStarted))",
    "function platformFeePercentage() view returns (uint256)",
    "event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount, bool isHighestBid)",
  ];

  try {
    // Create contract instance
    const auction = new ethers.Contract(auctionAddress, auctionABI, provider);

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
      const latestBlock = await provider.getBlockNumber();
      console.log(`Latest block: ${latestBlock}`);

      // Look for BidPlaced events in the last 200 blocks
      const fromBlock = Math.max(0, latestBlock - 200);
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
          console.log(
            `  Expected auctionId: 7, got: ${event.args.auctionId.toString()}`
          );
          console.log(
            `  Expected bidder: 0xa70e3fA6D66Ec3aa94de67C10c5Ddbeea9bF44A6, got: ${event.args.bidder}`
          );
          console.log(
            `  Expected amount: 0.001 ETH, got: ${ethers.formatEther(
              event.args.amount
            )} ETH`
          );
        }
      });
    } catch (error) {
      console.log(`❌ Error querying events: ${error.message}`);
    }

    // Check contract bytecode
    console.log("\n🔍 Contract Verification:");
    try {
      const code = await provider.getCode(auctionAddress);
      console.log(`Contract code length: ${code.length} characters`);
      console.log(`Contract deployed: ${code !== "0x"}`);

      // Try to call a simple view function to verify ABI compatibility
      const platformFee = await auction.platformFeePercentage();
      console.log(`Platform fee: ${platformFee.toString()}%`);
    } catch (error) {
      console.log(`❌ Error verifying contract: ${error.message}`);
    }

    // Check the specific transaction that had corrupted events
    console.log("\n🔍 Analyzing Corrupted Transaction:");
    try {
      const txHash =
        "0x7df42d55f62f610305d437a045a192a3b98fbd4756adeabd5e9ee77aaffca807";
      const receipt = await provider.getTransactionReceipt(txHash);

      if (receipt) {
        console.log(`Transaction found in block: ${receipt.blockNumber}`);
        console.log(`Gas used: ${receipt.gasUsed.toString()}`);
        console.log(`Status: ${receipt.status === 1 ? "Success" : "Failed"}`);

        // Decode logs
        console.log(`\nLogs (${receipt.logs.length}):`);
        receipt.logs.forEach((log, index) => {
          console.log(`\nLog ${index + 1}:`);
          console.log(`  Address: ${log.address}`);
          console.log(`  Topics: ${log.topics.length}`);
          console.log(`  Data: ${log.data}`);

          // Try to decode as BidPlaced event
          try {
            const decoded = auction.interface.parseLog(log);
            if (decoded && decoded.name === "BidPlaced") {
              console.log(`  ✅ Decoded as BidPlaced:`);
              console.log(
                `    AuctionId: ${decoded.args.auctionId.toString()}`
              );
              console.log(`    Bidder: ${decoded.args.bidder}`);
              console.log(
                `    Amount: ${ethers.formatEther(decoded.args.amount)} ETH`
              );
              console.log(`    IsHighestBid: ${decoded.args.isHighestBid}`);
            }
          } catch (decodeError) {
            console.log(`  ❌ Could not decode as BidPlaced event`);
          }
        });
      } else {
        console.log("❌ Transaction not found");
      }
    } catch (error) {
      console.log(`❌ Error analyzing transaction: ${error.message}`);
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
 * Script per diagnosticare il problema dell'evento BidPlaced corrotto usando ABI diretto
 */
async function main() {
  console.log("🔍 Diagnosing BidPlaced event corruption...");

  // Contract addresses from utils/contracts.ts
  const auctionAddress = "0xE8f6836A0054B83b9a952e8B62D92e62f5c67606";
  const nftAddress = "0x40E455515bf712144C1A5D859F19d64b537754f7";

  // RPC URL (using the same as in the frontend)
  const rpcUrl = "https://ethereum-sepolia.publicnode.com";
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // Minimal ABI for the functions we need
  const auctionABI = [
    "function paused() view returns (bool)",
    "function totalAuctions() view returns (uint256)",
    "function getAuction(uint256 auctionId) view returns (tuple(uint256 auctionId, address nftContract, uint256 tokenId, address seller, uint8 auctionType, uint256 startingPrice, uint256 reservePrice, uint256 buyNowPrice, uint256 currentPrice, uint256 startTime, uint256 endTime, uint256 bidIncrement, address highestBidder, uint256 highestBid, uint8 status, bool allowPartialFulfillment, uint256 minBidders, uint256 totalBidders, bool isSettled, uint256 extensionThreshold, uint256 extensionDuration, uint256 revealEndTime, bool revealPhaseStarted))",
    "function platformFeePercentage() view returns (uint256)",
    "event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount, bool isHighestBid)",
  ];

  try {
    // Create contract instance
    const auction = new ethers.Contract(auctionAddress, auctionABI, provider);

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
      const latestBlock = await provider.getBlockNumber();
      console.log(`Latest block: ${latestBlock}`);

      // Look for BidPlaced events in the last 200 blocks
      const fromBlock = Math.max(0, latestBlock - 200);
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
          console.log(
            `  Expected auctionId: 7, got: ${event.args.auctionId.toString()}`
          );
          console.log(
            `  Expected bidder: 0xa70e3fA6D66Ec3aa94de67C10c5Ddbeea9bF44A6, got: ${event.args.bidder}`
          );
          console.log(
            `  Expected amount: 0.001 ETH, got: ${ethers.formatEther(
              event.args.amount
            )} ETH`
          );
        }
      });
    } catch (error) {
      console.log(`❌ Error querying events: ${error.message}`);
    }

    // Check contract bytecode
    console.log("\n🔍 Contract Verification:");
    try {
      const code = await provider.getCode(auctionAddress);
      console.log(`Contract code length: ${code.length} characters`);
      console.log(`Contract deployed: ${code !== "0x"}`);

      // Try to call a simple view function to verify ABI compatibility
      const platformFee = await auction.platformFeePercentage();
      console.log(`Platform fee: ${platformFee.toString()}%`);
    } catch (error) {
      console.log(`❌ Error verifying contract: ${error.message}`);
    }

    // Check the specific transaction that had corrupted events
    console.log("\n🔍 Analyzing Corrupted Transaction:");
    try {
      const txHash =
        "0x7df42d55f62f610305d437a045a192a3b98fbd4756adeabd5e9ee77aaffca807";
      const receipt = await provider.getTransactionReceipt(txHash);

      if (receipt) {
        console.log(`Transaction found in block: ${receipt.blockNumber}`);
        console.log(`Gas used: ${receipt.gasUsed.toString()}`);
        console.log(`Status: ${receipt.status === 1 ? "Success" : "Failed"}`);

        // Decode logs
        console.log(`\nLogs (${receipt.logs.length}):`);
        receipt.logs.forEach((log, index) => {
          console.log(`\nLog ${index + 1}:`);
          console.log(`  Address: ${log.address}`);
          console.log(`  Topics: ${log.topics.length}`);
          console.log(`  Data: ${log.data}`);

          // Try to decode as BidPlaced event
          try {
            const decoded = auction.interface.parseLog(log);
            if (decoded && decoded.name === "BidPlaced") {
              console.log(`  ✅ Decoded as BidPlaced:`);
              console.log(
                `    AuctionId: ${decoded.args.auctionId.toString()}`
              );
              console.log(`    Bidder: ${decoded.args.bidder}`);
              console.log(
                `    Amount: ${ethers.formatEther(decoded.args.amount)} ETH`
              );
              console.log(`    IsHighestBid: ${decoded.args.isHighestBid}`);
            }
          } catch (decodeError) {
            console.log(`  ❌ Could not decode as BidPlaced event`);
          }
        });
      } else {
        console.log("❌ Transaction not found");
      }
    } catch (error) {
      console.log(`❌ Error analyzing transaction: ${error.message}`);
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
