const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  console.log("🚗 Configuring vehicle prices on MooveRentalPass...");

  // Get deployment account
  const [deployer] = await ethers.getSigners();
  console.log("Configuring with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address))
  );

  // Contract addresses - MUST come from environment variables
  const addressConfig = require("./config/addresses");
  const addresses = addressConfig.getContractAddresses(hre.network.name);

  const rentalPassAddress = addresses.MOOVE_RENTAL_PASS;
  const accessControlAddress = addresses.ACCESS_CONTROL;

  console.log("📋 Using contract addresses from environment:");
  console.log("  RentalPass:", rentalPassAddress);
  console.log("  AccessControl:", accessControlAddress);

  // Get contract instances
  const MooveRentalPass = await ethers.getContractFactory("MooveRentalPass");
  const mooveRentalPass = MooveRentalPass.attach(rentalPassAddress);

  const MooveAccessControl = await ethers.getContractFactory(
    "MooveAccessControl"
  );
  const accessControl = MooveAccessControl.attach(accessControlAddress);

  // Get role constants
  const MASTER_ADMIN_ROLE = ethers.keccak256(
    ethers.toUtf8Bytes("MASTER_ADMIN_ROLE")
  );

  // Check if deployer has MASTER_ADMIN_ROLE
  console.log("\n🔍 Checking deployer roles...");
  try {
    const hasMasterRole = await accessControl.hasRole(
      MASTER_ADMIN_ROLE,
      deployer.address
    );
    console.log(`MASTER_ADMIN_ROLE: ${hasMasterRole}`);

    if (!hasMasterRole) {
      console.log(
        "❌ Deployer doesn't have MASTER_ADMIN_ROLE. Cannot configure prices."
      );
      return;
    }
  } catch (error) {
    console.log("⚠️ Error checking roles:", error.message);
    console.log("Proceeding anyway...");
  }

  // Configure vehicle prices
  console.log("\n🚗 Configuring vehicle prices...");
  try {
    // Set prices in ETH (very small amounts for testing)
    const bikePrice = ethers.parseEther("0.00000075"); // 0.00000075 ETH
    const scooterPrice = ethers.parseEther("0.000001"); // 0.000001 ETH
    const monopattinoPrice = ethers.parseEther("0.00000125"); // 0.00000125 ETH

    console.log("Setting bike price...");
    const tx1 = await mooveRentalPass.setVehicleConfig(
      0,
      bikePrice,
      "E-Bike Access"
    );
    await tx1.wait();
    console.log(
      "✅ Bike price configured:",
      ethers.formatEther(bikePrice),
      "ETH"
    );

    console.log("Setting scooter price...");
    const tx2 = await mooveRentalPass.setVehicleConfig(
      1,
      scooterPrice,
      "E-Scooter Access"
    );
    await tx2.wait();
    console.log(
      "✅ Scooter price configured:",
      ethers.formatEther(scooterPrice),
      "ETH"
    );

    console.log("Setting monopattino price...");
    const tx3 = await mooveRentalPass.setVehicleConfig(
      2,
      monopattinoPrice,
      "Monopattino Access"
    );
    await tx3.wait();
    console.log(
      "✅ Monopattino price configured:",
      ethers.formatEther(monopattinoPrice),
      "ETH"
    );

    console.log("\n🎉 All vehicle prices configured successfully!");
  } catch (error) {
    console.log("❌ Failed to configure vehicle prices:", error.message);
  }

  // Verify configuration
  console.log("\n🔍 Verifying configuration...");
  try {
    const bikePrice = await mooveRentalPass.getVehiclePrice(0);
    const scooterPrice = await mooveRentalPass.getVehiclePrice(1);
    const monopattinoPrice = await mooveRentalPass.getVehiclePrice(2);

    console.log(`🚲 Bike price: ${ethers.formatEther(bikePrice)} ETH`);
    console.log(`🛴 Scooter price: ${ethers.formatEther(scooterPrice)} ETH`);
    console.log(
      `🛹 Monopattino price: ${ethers.formatEther(monopattinoPrice)} ETH`
    );
  } catch (error) {
    console.log("⚠️ Could not verify vehicle prices:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });





















































