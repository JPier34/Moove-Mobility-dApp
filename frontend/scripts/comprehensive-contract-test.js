const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Comprehensive MooveRentalPass Contract Test");
  console.log("=".repeat(50));

  // Contract addresses from the latest deployment
  const rentalPassAddress = "0x922f728b5f04A2e38d8Ea95F018b09b4F336CBC3";
  const accessControlAddress = "0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42";

  try {
    // Get contract instances
    const MooveRentalPass = await ethers.getContractFactory("MooveRentalPass");
    const MooveAccessControl = await ethers.getContractFactory(
      "MooveAccessControl"
    );

    const rentalPass = MooveRentalPass.attach(rentalPassAddress);
    const accessControl = MooveAccessControl.attach(accessControlAddress);

    console.log("✅ Contract instances created");
    console.log(`📋 RentalPass: ${rentalPassAddress}`);
    console.log(`📋 AccessControl: ${accessControlAddress}`);

    // Test 1: Basic Contract Info
    console.log("\n🔍 Test 1: Basic Contract Information");
    console.log("-".repeat(40));

    const name = await rentalPass.name();
    const symbol = await rentalPass.symbol();
    const initialTotalSupply = await rentalPass.totalSupply();
    const isPaused = await rentalPass.paused();

    console.log(`Name: ${name}`);
    console.log(`Symbol: ${symbol}`);
    console.log(`Total Supply: ${initialTotalSupply}`);
    console.log(`Paused: ${isPaused}`);

    // Test 2: Access Control Integration
    console.log("\n🔍 Test 2: Access Control Integration");
    console.log("-".repeat(40));

    const contractAccessControl = await rentalPass.accessControl();
    console.log(`Contract AccessControl: ${contractAccessControl}`);
    console.log(`Expected AccessControl: ${accessControlAddress}`);
    console.log(
      `✅ Match: ${
        contractAccessControl.toLowerCase() ===
        accessControlAddress.toLowerCase()
      }`
    );

    // Test 3: Vehicle Price Configuration
    console.log("\n🔍 Test 3: Vehicle Price Configuration");
    console.log("-".repeat(40));

    const expectedPrices = {
      0: "0.00000075", // BIKE
      1: "0.000001", // SCOOTER
      2: "0.00000125", // MONOPATTINO
    };

    for (let i = 0; i < 3; i++) {
      try {
        const price = await rentalPass.getVehiclePrice(i);
        const priceEth = ethers.formatEther(price);
        const expected = expectedPrices[i];

        console.log(
          `Vehicle ${i}: ${priceEth} ETH (Expected: ${expected} ETH)`
        );
        console.log(`✅ Price Match: ${priceEth === expected}`);

        // Check vehicle config
        const config = await rentalPass.vehicleConfigs(i);
        console.log(
          `   Config - Active: ${config.isActive}, Name: ${config.name}`
        );
      } catch (error) {
        console.log(`❌ Vehicle ${i}: Error - ${error.message}`);
      }
    }

    // Test 4: Role Verification
    console.log("\n🔍 Test 4: Role Verification");
    console.log("-".repeat(40));

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer: ${deployer.address}`);

    const MASTER_ADMIN_ROLE = ethers.keccak256(
      ethers.toUtf8Bytes("MASTER_ADMIN_ROLE")
    );
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));

    const hasMasterAdmin = await accessControl.hasRole(
      MASTER_ADMIN_ROLE,
      deployer.address
    );
    const hasMinter = await accessControl.hasRole(
      MINTER_ROLE,
      deployer.address
    );
    const hasPauser = await accessControl.hasRole(
      PAUSER_ROLE,
      deployer.address
    );

    console.log(`Master Admin Role: ${hasMasterAdmin}`);
    console.log(`Minter Role: ${hasMinter}`);
    console.log(`Pauser Role: ${hasPauser}`);

    // Test 5: Contract Authorization
    console.log("\n🔍 Test 5: Contract Authorization");
    console.log("-".repeat(40));

    const isAuthorized = await accessControl.authorizedContracts(
      rentalPassAddress
    );
    console.log(`RentalPass Authorized: ${isAuthorized}`);

    // Test 6: Minting Test (if not paused)
    if (!isPaused) {
      console.log("\n🔍 Test 6: Minting Test");
      console.log("-".repeat(40));

      const testUser = deployer; // Use deployer for testing
      const bikePrice = await rentalPass.getVehiclePrice(0);

      console.log(`Testing mint with ${ethers.formatEther(bikePrice)} ETH`);

      try {
        const tx = await rentalPass.connect(testUser).mintRentalPassPublic(
          0, // BIKE
          "TestCity",
          30, // 30 days
          { value: bikePrice }
        );

        console.log(`✅ Mint transaction sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`✅ Mint confirmed in block: ${receipt.blockNumber}`);

        // Check the minted token
        const newTotalSupply = await rentalPass.totalSupply();
        console.log(`New Total Supply: ${newTotalSupply}`);

        if (newTotalSupply > 0) {
          const tokenId = newTotalSupply;
          const rentalPassData = await rentalPass.getRentalPass(tokenId);
          console.log(`✅ Token ${tokenId} minted successfully`);
          console.log(`   Vehicle Type: ${rentalPassData.vehicleType}`);
          console.log(`   Location: ${rentalPassData.location}`);
          console.log(
            `   Price: ${ethers.formatEther(rentalPassData.purchasePrice)} ETH`
          );
          console.log(`   Active: ${rentalPassData.isActive}`);
          console.log(`   Access Code: ${rentalPassData.accessCode}`);
        }
      } catch (error) {
        console.log(`❌ Minting failed: ${error.message}`);
      }
    } else {
      console.log("\n⚠️ Test 6: Skipped - Contract is paused");
    }

    // Test 7: Access Code Validation
    console.log("\n🔍 Test 7: Access Code Validation");
    console.log("-".repeat(40));

    const currentTotalSupply = await rentalPass.totalSupply();
    if (currentTotalSupply > 0) {
      const tokenId = 1; // First token
      try {
        const rentalPassData = await rentalPass.getRentalPass(tokenId);
        const accessCode = rentalPassData.accessCode;

        console.log(`Testing access code: ${accessCode}`);

        const isValid = await rentalPass.isAccessCodeValid(accessCode);
        console.log(`✅ Access code valid: ${isValid.valid}`);
        console.log(`   Token ID: ${isValid.tokenId}`);
        console.log(
          `   Expiration: ${new Date(
            Number(isValid.expirationDate) * 1000
          ).toISOString()}`
        );
      } catch (error) {
        console.log(`❌ Access code validation failed: ${error.message}`);
      }
    } else {
      console.log("⚠️ No tokens to test access code validation");
    }

    console.log("\n🎉 Comprehensive test completed!");
  } catch (error) {
    console.log("❌ Test failed:", error.message);
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
