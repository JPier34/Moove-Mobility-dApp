const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Updating vehicle prices to reduce total costs...");

  // Contract addresses
  const rentalPassAddress = "0x922f728b5f04A2e38d8Ea95F018b09b4F336CBC3";
  const accessControlAddress = "0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42";

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Updating with account:", deployer.address);

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

    // NEW PRICES - Ridotti per compensare le alte fee di rete
    const newPrices = [
      { type: 0, price: "0.0000001", name: "E-Bike Access" }, // Ridotto di 7.5x
      { type: 1, price: "0.00000015", name: "E-Scooter Access" }, // Ridotto di 6.7x
      { type: 2, price: "0.0000002", name: "Monopattino Access" }, // Ridotto di 6.25x
    ];

    console.log("\n📊 NEW PRICING STRATEGY:");
    console.log("Old prices were too high with network fees");
    console.log("New prices are reduced to make service affordable");

    // Update vehicle prices
    console.log("\n💰 Updating vehicle prices...");

    for (const vehicle of newPrices) {
      try {
        console.log(
          `\n🚗 Updating vehicle type ${vehicle.type} (${vehicle.name})...`
        );

        const priceWei = ethers.parseEther(vehicle.price);
        console.log(`   New Price: ${vehicle.price} ETH`);

        const tx = await rentalPass.setVehicleConfig(
          vehicle.type,
          priceWei,
          vehicle.name,
          {
            maxFeePerGas: ethers.parseUnits("5", "gwei"), // 5 gwei (reduced)
            maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"), // 1 gwei (reduced)
          }
        );

        console.log(`   ⏳ Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(
          `   ✅ Transaction confirmed in block ${receipt.blockNumber}`
        );

        // Verify the price was updated
        const verifiedPrice = await rentalPass.getVehiclePrice(vehicle.type);
        console.log(
          `   ✅ Price verified: ${ethers.formatEther(verifiedPrice)} ETH`
        );
      } catch (error) {
        console.log(
          `   ❌ Failed to update vehicle type ${vehicle.type}:`,
          error.message
        );
      }
    }

    console.log("\n🎉 Price update completed!");
    console.log(`📋 Contract: ${rentalPassAddress}`);
  } catch (error) {
    console.error("❌ Price update failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
