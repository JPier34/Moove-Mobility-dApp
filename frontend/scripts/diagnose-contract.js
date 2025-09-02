const { ethers } = require("hardhat");

/**
 * Script per diagnosticare lo stato del contratto MooveRentalPass
 */
async function main() {
  console.log("🔍 Diagnosing MooveRentalPass contract...");

  // Contract addresses
  const rentalPassAddress = "0x9B8a455064038a03413D9563D42a493417d73454";
  const accessControlAddress = "0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42";

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Diagnosing with account:", deployer.address);

  try {
    // Get contract instances
    const MooveRentalPass = await ethers.getContractFactory("MooveRentalPass");
    const rentalPass = MooveRentalPass.attach(rentalPassAddress);

    const MooveAccessControl = await ethers.getContractFactory(
      "MooveAccessControl"
    );
    const accessControl = MooveAccessControl.attach(accessControlAddress);

    console.log("\n📋 Contract Information:");
    console.log(`MooveRentalPass: ${rentalPassAddress}`);
    console.log(`MooveAccessControl: ${accessControlAddress}`);

    // Check if contracts are paused
    console.log("\n⏸️ Pause Status:");
    try {
      const isPaused = await rentalPass.paused();
      console.log(`MooveRentalPass paused: ${isPaused}`);
    } catch (error) {
      console.log(`❌ Error checking pause status: ${error.message}`);
    }

    // Check AccessControl integration
    console.log("\n🔐 AccessControl Integration:");
    try {
      const currentAccessControl = await rentalPass.accessControl();
      console.log(`Current AccessControl: ${currentAccessControl}`);
      console.log(
        `Matches expected: ${currentAccessControl === accessControlAddress}`
      );
    } catch (error) {
      console.log(`❌ Error checking AccessControl: ${error.message}`);
    }

    // Check roles on AccessControl
    console.log("\n🎭 Role Check on AccessControl:");
    const roles = [
      {
        name: "MASTER_ADMIN_ROLE",
        hash: ethers.keccak256(ethers.toUtf8Bytes("MASTER_ADMIN_ROLE")),
      },
      {
        name: "MINTER_ROLE",
        hash: ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE")),
      },
      {
        name: "PAUSER_ROLE",
        hash: ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE")),
      },
    ];

    for (const role of roles) {
      try {
        const hasRole = await accessControl.hasRole(
          role.hash,
          deployer.address
        );
        console.log(`${role.name}: ${hasRole}`);
      } catch (error) {
        console.log(`${role.name}: ❌ Error - ${error.message}`);
      }
    }

    // Check contract authorization
    console.log("\n🔗 Contract Authorization:");
    try {
      const isAuthorized = await accessControl.authorizedContracts(
        rentalPassAddress
      );
      console.log(`MooveRentalPass authorized: ${isAuthorized}`);
    } catch (error) {
      console.log(`❌ Error checking authorization: ${error.message}`);
    }

    // Check vehicle configuration
    console.log("\n🚗 Vehicle Configuration:");
    for (let i = 0; i < 3; i++) {
      try {
        const price = await rentalPass.getVehiclePrice(i);
        const name = await rentalPass.getVehicleName(i);
        console.log(`Vehicle ${i}: ${name} - ${ethers.formatEther(price)} ETH`);
      } catch (error) {
        console.log(`Vehicle ${i}: ❌ Not configured - ${error.message}`);
      }
    }

    // Try to call setVehicleConfig directly
    console.log("\n🧪 Testing setVehicleConfig function:");
    try {
      const bikePrice = ethers.parseEther("0.00000075");
      console.log("Attempting to set bike price...");

      const tx = await rentalPass.setVehicleConfig(
        0,
        bikePrice,
        "E-Bike Access",
        {
          maxFeePerGas: ethers.parseUnits("8", "gwei"),
          maxPriorityFeePerGas: ethers.parseUnits("1.5", "gwei"),
        }
      );

      console.log("✅ Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed in block:", receipt.blockNumber);

      // Verify the price was set
      const verifiedPrice = await rentalPass.getVehiclePrice(0);
      console.log(
        "✅ Price verified:",
        ethers.formatEther(verifiedPrice),
        "ETH"
      );
    } catch (error) {
      console.log("❌ setVehicleConfig failed:", error.message);

      // Try to decode the error
      if (error.data) {
        try {
          const decodedError = rentalPass.interface.parseError(error.data);
          console.log("📝 Decoded error:", decodedError);
        } catch (decodeError) {
          console.log("📝 Raw error data:", error.data);
        }
      }
    }

    // Check contract owner/admin
    console.log("\n👑 Contract Ownership:");
    try {
      const owner = await rentalPass.owner();
      console.log(`Owner: ${owner}`);
      console.log(`Matches deployer: ${owner === deployer.address}`);
    } catch (error) {
      console.log(`❌ Error checking ownership: ${error.message}`);
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
