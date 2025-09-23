// Test script to verify the actual contract functions
// Run this in browser console to debug the contract

async function testContractFunctions() {
  try {
    console.log("🔍 Testing contract functions...");

    // Get provider and contract
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const auctionContract = new ethers.Contract(
      "0x329203985A29E3c78aD140B0D3e383D2fE58d832",
      [
        "function totalAuctions() view returns (uint256)",
        "function getAuction(uint256 auctionId) view returns (tuple(uint256 auctionId, address nftContract, uint256 tokenId, address seller, uint8 auctionType, uint256 startingPrice, uint256 reservePrice, uint256 buyNowPrice, uint256 currentPrice, uint256 startTime, uint256 endTime, uint256 bidIncrement, address highestBidder, uint256 highestBid, uint8 status, bool allowPartialFulfillment, uint256 minBidders, uint256 totalBidders, bool isSettled, uint256 extensionThreshold, uint256 extensionDuration, uint256 lastBidTime, uint256 bidCount, bool hasReservePrice, bool isDutchAuction, uint256 dutchStartPrice, uint256 dutchEndPrice, uint256 dutchPriceDecrement, uint256 dutchTimeInterval, bool isSealedBid, uint256 sealedBidDeadline, bool isRevealPhase, uint256 revealDeadline))",
      ],
      signer
    );

    // Test 1: Check if contract is accessible
    console.log("📊 Test 1: Contract accessibility");
    const totalAuctions = await auctionContract.totalAuctions();
    console.log(`✅ totalAuctions(): ${totalAuctions.toString()}`);

    // Test 2: Try to get function signature
    console.log("📊 Test 2: Function signature check");
    try {
      const createAuctionFunction =
        auctionContract.interface.getFunction("createAuction");
      console.log(
        "✅ createAuction function signature:",
        createAuctionFunction.format()
      );
    } catch (error) {
      console.log("❌ createAuction function not found in interface");
    }

    // Test 3: Try different function names
    console.log("📊 Test 3: Testing different function names");
    const possibleNames = [
      "createAuction",
      "create",
      "newAuction",
      "startAuction",
      "addAuction",
      "createNewAuction",
      "initializeAuction",
    ];

    for (const name of possibleNames) {
      try {
        const func = auctionContract.interface.getFunction(name);
        console.log(`✅ Found function: ${name} - ${func.format()}`);
      } catch (error) {
        console.log(`❌ Function not found: ${name}`);
      }
    }

    // Test 4: List all available functions
    console.log("📊 Test 4: All available functions");
    const functions = auctionContract.interface.functions;
    console.log("Available functions:");
    Object.keys(functions).forEach((funcName) => {
      console.log(`  - ${funcName}: ${functions[funcName].format()}`);
    });

    // Test 5: Try to call createAuction with different parameter counts
    console.log(
      "📊 Test 5: Testing createAuction with different parameter counts"
    );

    // Test with 8 parameters
    try {
      console.log("🔍 Testing with 8 parameters...");
      const tx8 = await auctionContract.createAuction(
        "0x40E455515bf712144C1A5D859F19d64b537754f7", // nftContract
        79, // tokenId
        2, // auctionType
        ethers.parseEther("0.001"), // startingPrice
        0, // reservePrice
        0, // buyNowPrice
        300, // duration
        0 // bidIncrement
      );
      console.log("✅ 8 parameters worked!");
    } catch (error8) {
      console.log("❌ 8 parameters failed:", error8.message);
    }

    // Test with 10 parameters
    try {
      console.log("🔍 Testing with 10 parameters...");
      const tx10 = await auctionContract.createAuction(
        "0x40E455515bf712144C1A5D859F19d64b537754f7", // nftContract
        79, // tokenId
        2, // auctionType
        ethers.parseEther("0.001"), // startingPrice
        0, // reservePrice
        0, // buyNowPrice
        300, // duration
        0, // bidIncrement
        300, // extensionThreshold
        600 // extensionDuration
      );
      console.log("✅ 10 parameters worked!");
    } catch (error10) {
      console.log("❌ 10 parameters failed:", error10.message);
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testContractFunctions();
