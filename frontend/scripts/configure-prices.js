const { ethers } = require("hardhat");

/**
 * Script per configurare i prezzi dei veicoli dopo il deploy
 * Risolve il problema "Vehicle type not configured"
 */
async function main() {
  console.log("💰 Configuring vehicle prices for MooveRentalPass...");

  // Contract addresses
  const rentalPassAddress = "0x9B8a455064038a03413D9563D42a493417d73454";
  const accessControlAddress = "0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42";

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Configuring with account:", deployer.address);

  try {
    // Get contract instances
    const MooveRentalPass = await ethers.getContractFactory("MooveRentalPass");
    const rentalPass = MooveRentalPass.attach(rentalPassAddress);

    const MooveAccessControl = await ethers.getContractFactory(
      "MooveAccessControl"
    );
    const accessControl = MooveAccessControl.attach(accessControlAddress);

    // Check if deployer has MASTER_ADMIN_ROLE
    const MASTER_ADMIN_ROLE = ethers.keccak256(
      ethers.toUtf8Bytes("MASTER_ADMIN_ROLE")
    );
    const hasRole = await accessControl.hasRole(
      MASTER_ADMIN_ROLE,
      deployer.address
    );

    if (!hasRole) {
      console.log("❌ Deployer doesn't have MASTER_ADMIN_ROLE");
      return;
    }
    console.log("✅ Deployer has MASTER_ADMIN_ROLE");

    // Check current vehicle prices
    console.log("\n🔍 Checking current vehicle prices...");
    try {
      const currentBikePrice = await rentalPass.getVehiclePrice(0);
      console.log(
        "🚲 Current bike price:",
        ethers.formatEther(currentBikePrice),
        "ETH"
      );
    } catch (error) {
      console.log("🚲 Bike price: Not configured");
    }

    try {
      const currentScooterPrice = await rentalPass.getVehiclePrice(1);
      console.log(
        "🛴 Current scooter price:",
        ethers.formatEther(currentScooterPrice),
        "ETH"
      );
    } catch (error) {
      console.log("🛴 Scooter price: Not configured");
    }

    try {
      const currentMonopattinoPrice = await rentalPass.getVehiclePrice(2);
      console.log(
        "🛹 Current monopattino price:",
        ethers.formatEther(currentMonopattinoPrice),
        "ETH"
      );
    } catch (error) {
      console.log("🛹 Monopattino price: Not configured");
    }

    // Configure vehicle prices with proper error handling
    console.log("\n💰 Configuring vehicle prices...");

    const prices = [
      { type: 0, price: "0.00000075", name: "E-Bike Access" },
      { type: 1, price: "0.000001", name: "E-Scooter Access" },
      { type: 2, price: "0.00000125", name: "Monopattino Access" },
    ];

    for (const vehicle of prices) {
      try {
        console.log(
          `\n🚗 Configuring vehicle type ${vehicle.type} (${vehicle.name})...`
        );

        const priceWei = ethers.parseEther(vehicle.price);
        console.log(
          `   Price: ${vehicle.price} ETH (${priceWei.toString()} wei)`
        );

        const tx = await rentalPass.setVehicleConfig(
          vehicle.type,
          priceWei,
          vehicle.name,
          {
            maxFeePerGas: ethers.parseUnits("8", "gwei"),
            maxPriorityFeePerGas: ethers.parseUnits("1.5", "gwei"),
          }
        );

        console.log(`   ⏳ Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(
          `   ✅ Transaction confirmed in block ${receipt.blockNumber}`
        );

        // Verify the price was set
        const verifiedPrice = await rentalPass.getVehiclePrice(vehicle.type);
        console.log(
          `   ✅ Price verified: ${ethers.formatEther(verifiedPrice)} ETH`
        );
      } catch (error) {
        console.log(
          `   ❌ Failed to configure vehicle type ${vehicle.type}:`,
          error.message
        );

        // Try to get more details about the error
        if (error.data) {
          try {
            const decodedError = rentalPass.interface.parseError(error.data);
            console.log(`   📝 Decoded error:`, decodedError);
          } catch (decodeError) {
            console.log(`   📝 Raw error data:`, error.data);
          }
        }
      }
    }

    // Final verification
    console.log("\n🔍 Final verification of all vehicle prices...");
    for (const vehicle of prices) {
      try {
        const price = await rentalPass.getVehiclePrice(vehicle.type);
        const name = await rentalPass.getVehicleName(vehicle.type);
        console.log(`✅ ${name}: ${ethers.formatEther(price)} ETH`);
      } catch (error) {
        console.log(`❌ Vehicle type ${vehicle.type}: ${error.message}`);
      }
    }

    console.log("\n🎉 Price configuration completed!");
    console.log(`📋 Contract: ${rentalPassAddress}`);
    console.log(`🔐 AccessControl: ${accessControlAddress}`);
  } catch (error) {
    console.error("❌ Configuration failed:", error);

    // Provide helpful debugging information
    console.log("\n🔧 Debugging Information:");
    console.log("- Check if the contract is paused");
    console.log("- Verify AccessControl integration");
    console.log("- Check if the contract has the right permissions");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
