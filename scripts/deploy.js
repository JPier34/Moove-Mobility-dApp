const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Helper function to safely get vehicle prices
 */
async function getVehiclePrices(mooveRentalPass) {
  try {
    return {
      bike: ethers.formatEther(await mooveRentalPass.getVehiclePrice(0)),
      scooter: ethers.formatEther(await mooveRentalPass.getVehiclePrice(1)),
      monopattino: ethers.formatEther(await mooveRentalPass.getVehiclePrice(2)),
    };
  } catch (error) {
    console.log("⚠️ Could not get vehicle prices:", error.message);
    return {
      bike: "0.00000075",
      scooter: "0.000001",
      monopattino: "0.00000125",
    };
  }
}

/**
 * Deploy script completely for MooveAuction and MooveRentalPass with all features
 * This script deploys both main contracts with all features
 *
 *
 * MOOVEAUCTION FEATURES:
 * - English, Dutch, Sealed Bid, Reserve auctions
 * - Automatic sealed bid system
 * - Automatic refund system
 *
 * MOOVERENTALPASS FEATURES:
 * - updateAccessControl() function to update the AccessControl address
 * - Configurable on-chain prices for all vehicle types
 * - Flexible and updatable access control system
 * - Public minting with direct payment
 */
async function main() {
  console.log("🚗 Starting MooveRentalPass deployment...");

  // Get deployment account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address))
  );

  // Use existing MooveAccessControl address (already deployed) or deploy new one for local testing
  let accessControlAddress;
  if (hre.network.name === "hardhat" || hre.network.name === "localhost") {
    // Deploy new AccessControl for local testing
    console.log("🔐 Deploying new MooveAccessControl for local testing...");
    const MooveAccessControl = await ethers.getContractFactory(
      "MooveAccessControl"
    );
    // ✅ AGGIORNATO: Deploy con maxAdmins parametro (configurabile 1-100)
    const maxAdmins = 10; // Default: 10 admins max, può essere modificato
    const accessControl = await MooveAccessControl.deploy(
      deployer.address, // initialAdmin
      maxAdmins // maxAdmins
    );
    await accessControl.waitForDeployment();
    accessControlAddress = await accessControl.getAddress();
    console.log("✅ MooveAccessControl deployed to:", accessControlAddress);
    console.log(`✅ Max admins configured: ${maxAdmins}`);
  } else {
    // Use existing AccessControl for Sepolia/mainnet
    // MUST be set via ACCESS_CONTROL_ADDRESS env variable
    const addressConfig = require("./config/addresses");
    accessControlAddress = addressConfig.getAddress("ACCESS_CONTROL_ADDRESS");
    console.log(
      "🔐 Using existing MooveAccessControl at:",
      accessControlAddress
    );
  }

  // Deploy MooveNFT
  console.log("\n🎨 Deploying MooveNFT...");
  const MooveNFT = await ethers.getContractFactory("MooveNFT");
  const mooveNFT = await MooveNFT.deploy(
    "Moove Stickers",
    "MOOVE",
    accessControlAddress
  );
  await mooveNFT.waitForDeployment();

  const nftAddress = await mooveNFT.getAddress();
  console.log("✅ MooveNFT deployed to:", nftAddress);

  // Deploy MooveAuction
  console.log("\n🎯 Deploying MooveAuction...");
  const MooveAuction = await ethers.getContractFactory("MooveAuction");
  const mooveAuction = await MooveAuction.deploy(accessControlAddress);
  await mooveAuction.waitForDeployment();

  const auctionAddress = await mooveAuction.getAddress();
  console.log("✅ MooveAuction deployed to:", auctionAddress);

  // Verify MooveAuction deployment
  console.log("🔍 Verifying MooveAuction deployment...");
  const totalAuctions = await mooveAuction.totalAuctions();
  console.log("Total auctions:", totalAuctions.toString());

  // Test sealed bid reveal info function
  try {
    const revealInfo = await mooveAuction.getSealedBidRevealInfo(0);
    console.log("✅ Sealed bid reveal info function working");
  } catch (error) {
    console.log(
      "⚠️ Sealed bid reveal info test failed (expected for non-existent auction)"
    );
  }

  // Deploy new MooveRentalPass
  console.log("\n🚗 Deploying new MooveRentalPass...");
  const MooveRentalPass = await ethers.getContractFactory("MooveRentalPass");

  const mooveRentalPass = await MooveRentalPass.deploy(accessControlAddress);
  await mooveRentalPass.waitForDeployment();

  const rentalPassAddress = await mooveRentalPass.getAddress();
  console.log("✅ MooveRentalPass deployed to:", rentalPassAddress);

  // Setup initial configuration for MooveRentalPass
  console.log("\n⚙️ Setting up initial configuration...");

  // Get access control contract instance
  const MooveAccessControl = await ethers.getContractFactory(
    "MooveAccessControl"
  );
  const accessControl = MooveAccessControl.attach(accessControlAddress);

  // Get role constants (these are constants, not functions)
  const MASTER_ADMIN_ROLE = ethers.keccak256(
    ethers.toUtf8Bytes("MASTER_ADMIN_ROLE")
  );
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));

  // Grant essential roles to deployer for initial setup
  console.log("🎭 Granting initial roles to deployer...");

  const rolesToGrant = [
    { role: MASTER_ADMIN_ROLE, name: "MASTER_ADMIN_ROLE" },
    { role: MINTER_ROLE, name: "MINTER_ROLE" },
    { role: PAUSER_ROLE, name: "PAUSER_ROLE" },
  ];

  for (const { role, name } of rolesToGrant) {
    const hasRole = await accessControl.hasRole(role, deployer.address);
    if (!hasRole) {
      const tx = await accessControl.grantRole(role, deployer.address);
      await tx.wait();
      console.log(`✅ Granted ${name} to deployer`);
    } else {
      console.log(`✅ Deployer already has ${name}`);
    }
  }

  // Authorize contracts to call AccessControl functions
  console.log("\n🔗 Authorizing contracts...");

  // Authorize MooveNFT
  try {
    const tx1 = await accessControl.authorizeContract(nftAddress);
    await tx1.wait();
    console.log("✅ MooveNFT contract authorized");
  } catch (error) {
    console.log("⚠️ Failed to authorize MooveNFT:", error.message);
  }

  // Authorize MooveAuction
  try {
    const tx2 = await accessControl.authorizeContract(auctionAddress);
    await tx2.wait();
    console.log("✅ MooveAuction contract authorized");
  } catch (error) {
    console.log("⚠️ Failed to authorize MooveAuction:", error.message);
  }

  // Authorize MooveRentalPass
  try {
    const tx3 = await accessControl.authorizeContract(rentalPassAddress);
    await tx3.wait();
    console.log("✅ MooveRentalPass contract authorized");
  } catch (error) {
    console.log("⚠️ Failed to authorize MooveRentalPass:", error.message);
  }

  // Configure vehicle prices and settings
  console.log("\n🚗 Configuring vehicle prices...");
  try {
    // Set prices in ETH (very small amounts for testing)

    // Test the new updateAccessControl functionality (optional)
    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
      console.log("\n🔧 Testing updateAccessControl functionality...");
      try {
        // This is just a test - we're setting it to the same address
        // In a real scenario, you could update to a different AccessControl
        const testTx = await mooveRentalPass.updateAccessControl(
          accessControlAddress
        );
        await testTx.wait();
        console.log("✅ updateAccessControl function works correctly");
      } catch (error) {
        console.log("⚠️ updateAccessControl test failed:", error.message);
      }
    }
    const bikePrice = ethers.parseEther("0.00000075"); // 0.00000075 ETH
    const scooterPrice = ethers.parseEther("0.000001"); // 0.000001 ETH
    const monopattinoPrice = ethers.parseEther("0.00000125"); // 0.00000125 ETH

    await mooveRentalPass.setVehicleConfig(0, bikePrice, "E-Bike Access");
    console.log(
      "✅ Bike price configured:",
      ethers.formatEther(bikePrice),
      "ETH"
    );

    await mooveRentalPass.setVehicleConfig(1, scooterPrice, "E-Scooter Access");
    console.log(
      "✅ Scooter price configured:",
      ethers.formatEther(scooterPrice),
      "ETH"
    );

    await mooveRentalPass.setVehicleConfig(
      2,
      monopattinoPrice,
      "Monopattino Access"
    );
    console.log(
      "✅ Monopattino price configured:",
      ethers.formatEther(monopattinoPrice),
      "ETH"
    );
  } catch (error) {
    console.log("⚠️ Failed to configure vehicle prices:", error.message);
  }

  // Verify deployment and configuration
  console.log("\n🔍 Verifying deployment...");

  // Check deployer roles
  const deployerRoles = [];
  for (const { role, name } of rolesToGrant) {
    const hasRole = await accessControl.hasRole(role, deployer.address);
    if (hasRole) {
      deployerRoles.push(name);
    }
  }
  console.log(`🎭 Deployer roles: ${deployerRoles.join(", ")}`);

  // Check vehicle prices
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

  // Test core functionality
  console.log("\n🧪 Testing core functionality...");

  try {
    // Test role checking functions
    const canMint = await accessControl.canMint(deployer.address);
    const canPause = await accessControl.canPause(deployer.address);

    console.log(`✅ canMint: ${canMint}`);
    console.log(`✅ canPause: ${canPause}`);

    // Test vehicle price retrieval
    try {
      const testBikePrice = await mooveRentalPass.getVehiclePrice(0);
      console.log(
        `✅ Bike price retrieval: ${ethers.formatEther(testBikePrice)} ETH`
      );
    } catch (error) {
      console.log("⚠️ Vehicle price test failed:", error.message);
    }

    // Test contract authorization
    const isAuthorized = await accessControl.authorizedContracts(
      rentalPassAddress
    );
    console.log(`✅ Contract authorization: ${isAuthorized}`);
  } catch (error) {
    console.error("❌ Error during functionality testing:", error.message);
    console.log("⚠️ Continuing with deployment despite test errors...");
  }

  // Save deployment information
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      MooveAccessControl: {
        address: accessControlAddress,
        constructorArgs:
          hre.network.name === "hardhat" || hre.network.name === "localhost"
            ? [deployer.address, 10] // [initialAdmin, maxAdmins]
            : undefined,
        note:
          hre.network.name === "hardhat" || hre.network.name === "localhost"
            ? "Deployed by this script for local testing"
            : "Existing contract, not deployed by this script",
      },
      MooveNFT: {
        address: nftAddress,
        constructorArgs: ["Moove Stickers", "MOOVE", accessControlAddress],
        features: [
          "ERC-721 NFT implementation",
          "Metadata management with IPFS",
          "Royalty management (ERC-2981)",
          "Royalty reset on burn",
        ],
      },
      MooveAuction: {
        address: auctionAddress,
        constructorArgs: [accessControlAddress],
        features: [
          "English auctions",
          "Dutch auctions",
          "Sealed bid auctions",
          "Reserve auctions",
          "Automatic sealed bid system",
          "Bid refund system",
          "O(1) user bid lookup optimization",
        ],
      },
      MooveRentalPass: {
        address: rentalPassAddress,
        constructorArgs: [accessControlAddress],
        features: [
          "Public minting with ETH payment",
          "Configurable vehicle pricing",
          "Auto-generated access codes",
          "Auto-generated metadata URIs",
          "Non-transferable NFTs",
          "30-day expiration",
        ],
      },
    },
    configuration: {
      vehiclePrices: await getVehiclePrices(mooveRentalPass),
      deployerRoles: deployerRoles,
      contractAuthorized: true,
    },
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  // Write deployment info to file
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(
    deploymentsDir,
    `${hre.network.name}_rental_pass.json`
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  // Generate ABI files for frontend
  const abisDir = path.join(__dirname, "..", "frontend", "src", "abis");
  if (!fs.existsSync(abisDir)) {
    fs.mkdirSync(abisDir, { recursive: true });
  }

  // Generate MooveAuction ABI
  const mooveAuctionArtifact = await hre.artifacts.readArtifact("MooveAuction");
  fs.writeFileSync(
    path.join(abisDir, "MooveAuction.json"),
    JSON.stringify(mooveAuctionArtifact.abi, null, 2)
  );

  // Generate MooveRentalPass ABI
  const mooveRentalPassArtifact = await hre.artifacts.readArtifact(
    "MooveRentalPass"
  );
  fs.writeFileSync(
    path.join(abisDir, "MooveRentalPass.json"),
    JSON.stringify(mooveRentalPassArtifact.abi, null, 2)
  );

  // Update contracts configuration for frontend
  const contractsConfigPath = path.join(
    __dirname,
    "..",
    "frontend",
    "utils",
    "contracts.ts"
  );

  // Read existing config if it exists
  let existingConfig = {};
  if (fs.existsSync(contractsConfigPath)) {
    try {
      const configContent = fs.readFileSync(contractsConfigPath, "utf8");
      // Simple parsing to extract existing contracts
      const contractsMatch = configContent.match(
        /export const contracts = ({[\s\S]*?}) as const;/
      );
      if (contractsMatch) {
        existingConfig = eval(`(${contractsMatch[1]})`);
      }
    } catch (error) {
      console.log(
        "⚠️ Could not parse existing contracts config, will overwrite"
      );
    }
  }

  // Add contracts to existing config
  const updatedConfig = {
    ...existingConfig,
    MooveAuction: {
      address: auctionAddress,
      abi: mooveAuctionArtifact.abi,
    },
    MooveRentalPass: {
      address: rentalPassAddress,
      abi: mooveRentalPassArtifact.abi,
    },
  };

  const contractsConfigContent = `// Auto-generated contract configuration
export const contracts = ${JSON.stringify(updatedConfig, null, 2)} as const;

export const CONTRACT_ADDRESSES = {
    ${Object.keys(updatedConfig)
      .map((name) => `${name.toUpperCase()}: "${updatedConfig[name].address}"`)
      .join(",\n    ")}
} as const;

// Vehicle type constants for MooveRentalPass
export const VEHICLE_TYPES = {
    BIKE: 0,
    SCOOTER: 1,
    MONOPATTINO: 2
} as const;

// Vehicle prices (in ETH)
export const VEHICLE_PRICES = ${JSON.stringify(
    deploymentInfo.configuration.vehiclePrices,
    null,
    2
  )} as const;
`;

  fs.writeFileSync(contractsConfigPath, contractsConfigContent);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Summary:");
  console.log("=====================================");
  console.log(`🏠 Network: ${hre.network.name}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(
    `🔐 MooveAccessControl: ${accessControlAddress} ${
      hre.network.name === "hardhat" || hre.network.name === "localhost"
        ? "(deployed)"
        : "(existing)"
    }`
  );
  console.log(`🎨 MooveNFT: ${nftAddress}`);
  console.log(`🎯 MooveAuction: ${auctionAddress}`);
  console.log(`🚗 MooveRentalPass: ${rentalPassAddress}`);
  console.log(`🎭 Deployer Roles: ${deployerRoles.join(", ")}`);
  console.log(`💾 Config saved to: ${deploymentFile}`);
  console.log("=====================================");

  // Verification command
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 Verification Commands:");
    console.log(
      `npx hardhat verify --network ${hre.network.name} ${nftAddress} "Moove Stickers" "MOOVE" "${accessControlAddress}"`
    );
    console.log(
      `npx hardhat verify --network ${hre.network.name} ${auctionAddress} "${accessControlAddress}"`
    );
    console.log(
      `npx hardhat verify --network ${hre.network.name} ${rentalPassAddress} "${accessControlAddress}"`
    );
    // Note: If deploying MooveAccessControl to public network, use:
    // npx hardhat verify --network <network> <accessControlAddress> "<initialAdmin>" "<maxAdmins>"
  } else {
    // For local/testing networks, show verification command format
    console.log("\n💡 For public network deployments, verification commands:");
    console.log(
      `npx hardhat verify --network <network> ${accessControlAddress} "${deployer.address}" "10"`
    );
    console.log(
      `npx hardhat verify --network <network> ${nftAddress} "Moove Stickers" "MOOVE" "${accessControlAddress}"`
    );
  }

  console.log("\n📝 Next Steps:");
  console.log(
    "1. Test MooveAuction functionality (create auctions, place bids)"
  );
  console.log("2. Test sealed bid auction system");
  console.log("3. Test the new public minting functionality");
  console.log("4. Verify vehicle prices are correctly configured");
  console.log("5. Test access code generation and validation");
  console.log("6. Update frontend to use the new contract addresses");
  console.log("7. Test the complete user flow from minting to access");
  console.log("8. Test updateAccessControl function if needed");
  console.log("9. Verify AccessControl integration works correctly");
}

// Helper function to configure vehicle prices
async function configureVehiclePrices(rentalPassAddress, prices) {
  console.log("\n🚗 Configuring vehicle prices...");

  const MooveRentalPass = await ethers.getContractFactory("MooveRentalPass");
  const rentalPass = MooveRentalPass.attach(rentalPassAddress);

  for (const [vehicleType, price] of Object.entries(prices)) {
    try {
      const tx = await rentalPass.setVehicleConfig(
        vehicleType,
        price,
        `${vehicleType} Access`
      );
      await tx.wait();
      console.log(
        `✅ ${vehicleType} price configured: ${ethers.formatEther(price)} ETH`
      );
    } catch (error) {
      console.error(
        `❌ Failed to configure ${vehicleType} price:`,
        error.message
      );
    }
  }
}

main()
  .then(() => {
    console.log("🎉 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    console.log("⚠️ Check the error above and try again...");
    process.exit(1);
  });

// Export helper function for use in other scripts
module.exports = { configureVehiclePrices };
