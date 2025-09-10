const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy completo del sistema Moove
 * Include: MooveAccessControl, MooveNFT, MooveAuction, MooveRentalPass, MooveCustomization, MooveTradingManager
 */
async function main() {
  console.log("🚀 Starting complete Moove system deployment...");

  // Recupera l'account deployer
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Verifica il balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.1")) {
    console.log("⚠️  Warning: Low balance for complete deployment");
  }

  const deploymentInfo = {
    network: network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {},
  };

  try {
    // ========================================
    // 1. DEPLOY MOOVEACCESSCONTROL
    // ========================================
    console.log("\n🔐 Step 1: Deploying MooveAccessControl...");
    const MooveAccessControl = await ethers.getContractFactory(
      "MooveAccessControl"
    );
    const accessControl = await MooveAccessControl.deploy(deployer.address);
    await accessControl.waitForDeployment();

    const accessControlAddress = await accessControl.getAddress();
    console.log("✅ MooveAccessControl deployed to:", accessControlAddress);
    deploymentInfo.contracts.MooveAccessControl = accessControlAddress;

    // ========================================
    // 2. DEPLOY MOOVENFT
    // ========================================
    console.log("\n🎨 Step 2: Deploying MooveNFT...");
    const MooveNFT = await ethers.getContractFactory("MooveNFT");
    const mooveNFT = await MooveNFT.deploy(
      "MooveNFT",
      "MNFT",
      accessControlAddress
    );
    await mooveNFT.waitForDeployment();

    const mooveNFTAddress = await mooveNFT.getAddress();
    console.log("✅ MooveNFT deployed to:", mooveNFTAddress);
    deploymentInfo.contracts.MooveNFT = mooveNFTAddress;

    // ========================================
    // 3. DEPLOY MOOVEAUCTION (AGGIORNATO)
    // ========================================
    console.log("\n🏆 Step 3: Deploying MooveAuction (Updated)...");
    const MooveAuction = await ethers.getContractFactory("MooveAuction");
    const mooveAuction = await MooveAuction.deploy(accessControlAddress);
    await mooveAuction.waitForDeployment();

    const mooveAuctionAddress = await mooveAuction.getAddress();
    console.log("✅ MooveAuction deployed to:", mooveAuctionAddress);
    deploymentInfo.contracts.MooveAuction = mooveAuctionAddress;

    // ========================================
    // 4. DEPLOY MOOVERENTALPASS
    // ========================================
    console.log("\n🚗 Step 4: Deploying MooveRentalPass...");
    const MooveRentalPass = await ethers.getContractFactory("MooveRentalPass");
    const mooveRentalPass = await MooveRentalPass.deploy(accessControlAddress);
    await mooveRentalPass.waitForDeployment();

    const mooveRentalPassAddress = await mooveRentalPass.getAddress();
    console.log("✅ MooveRentalPass deployed to:", mooveRentalPassAddress);
    deploymentInfo.contracts.MooveRentalPass = mooveRentalPassAddress;

    // ========================================
    // 5. DEPLOY MOOVECUSTOMIZATION
    // ========================================
    console.log("\n🎨 Step 5: Deploying MooveCustomization...");
    const MooveCustomization = await ethers.getContractFactory(
      "MooveCustomization"
    );
    const mooveCustomization = await MooveCustomization.deploy(
      mooveNFTAddress,
      accessControlAddress
    );
    await mooveCustomization.waitForDeployment();

    const mooveCustomizationAddress = await mooveCustomization.getAddress();
    console.log(
      "✅ MooveCustomization deployed to:",
      mooveCustomizationAddress
    );
    deploymentInfo.contracts.MooveCustomization = mooveCustomizationAddress;

    // ========================================
    // 6. DEPLOY MOOVETRADINGMANAGER
    // ========================================
    console.log("\n💱 Step 6: Deploying MooveTradingManager...");
    const MooveTradingManager = await ethers.getContractFactory(
      "MooveTradingManager"
    );
    const mooveTradingManager = await MooveTradingManager.deploy(
      accessControlAddress,
      deployer.address // Treasury address
    );
    await mooveTradingManager.waitForDeployment();

    const mooveTradingManagerAddress = await mooveTradingManager.getAddress();
    console.log(
      "✅ MooveTradingManager deployed to:",
      mooveTradingManagerAddress
    );
    deploymentInfo.contracts.MooveTradingManager = mooveTradingManagerAddress;

    // ========================================
    // 7. CONFIGURAZIONE CONTRATTI
    // ========================================
    console.log("\n⚙️ Step 7: Configuring contracts...");

    // Autorizza i contratti nell'AccessControl
    console.log("🔐 Authorizing contracts in AccessControl...");
    await accessControl.authorizeContract(mooveNFTAddress);
    await accessControl.authorizeContract(mooveAuctionAddress);
    await accessControl.authorizeContract(mooveRentalPassAddress);
    await accessControl.authorizeContract(mooveCustomizationAddress);
    await accessControl.authorizeContract(mooveTradingManagerAddress);
    console.log("✅ All contracts authorized");

    // Autorizza il TradingManager per l'NFT
    console.log("🔗 Authorizing TradingManager for NFT...");
    await mooveTradingManager.authorizeNFTContract(mooveNFTAddress);
    console.log("✅ TradingManager authorized for NFT");

    // ========================================
    // 8. VERIFICA DEPLOYMENT
    // ========================================
    console.log("\n🔍 Step 8: Verifying deployment...");

    // Verifica che tutti i contratti siano deployati
    const contracts = [
      { name: "MooveAccessControl", address: accessControlAddress },
      { name: "MooveNFT", address: mooveNFTAddress },
      { name: "MooveAuction", address: mooveAuctionAddress },
      { name: "MooveRentalPass", address: mooveRentalPassAddress },
      { name: "MooveCustomization", address: mooveCustomizationAddress },
      { name: "MooveTradingManager", address: mooveTradingManagerAddress },
    ];

    for (const contract of contracts) {
      const code = await ethers.provider.getCode(contract.address);
      if (code === "0x") {
        console.log(`❌ ${contract.name} deployment failed - no code found`);
        return;
      }
      console.log(`✅ ${contract.name} verified`);
    }

    // ========================================
    // 9. SALVATAGGIO INFORMAZIONI
    // ========================================
    console.log("\n💾 Step 9: Saving deployment information...");

    // Salva le informazioni di deployment
    const deploymentPath = path.join(__dirname, "deployment-info.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("📄 Deployment info saved to:", deploymentPath);

    // Genera il file di configurazione per il frontend
    const frontendConfig = `// Generated deployment configuration
// Network: ${network.name}
// Deployer: ${deployer.address}
// Timestamp: ${deploymentInfo.timestamp}

export const CONTRACT_ADDRESSES = {
  MooveAccessControl: "${accessControlAddress}",
  MooveNFT: "${mooveNFTAddress}",
  MooveAuction: "${mooveAuctionAddress}",
  MooveRentalPass: "${mooveRentalPassAddress}",
  MooveCustomization: "${mooveCustomizationAddress}",
  MooveTradingManager: "${mooveTradingManagerAddress}",
} as const;

export const NETWORK_CONFIG = {
  name: "${network.name}",
  chainId: ${network.config.chainId || "unknown"},
  rpcUrl: "${network.config.url || "unknown"}",
} as const;
`;

    const frontendConfigPath = path.join(
      __dirname,
      "frontend",
      "config",
      "contracts.ts"
    );
    fs.writeFileSync(frontendConfigPath, frontendConfig);
    console.log("📄 Frontend config saved to:", frontendConfigPath);

    // ========================================
    // 10. RIEPILOGO FINALE
    // ========================================
    console.log("\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("=" * 50);
    console.log("📋 Contract Addresses:");
    console.log(`🔐 MooveAccessControl: ${accessControlAddress}`);
    console.log(`🎨 MooveNFT: ${mooveNFTAddress}`);
    console.log(`🏆 MooveAuction: ${mooveAuctionAddress}`);
    console.log(`🚗 MooveRentalPass: ${mooveRentalPassAddress}`);
    console.log(`🎨 MooveCustomization: ${mooveCustomizationAddress}`);
    console.log(`💱 MooveTradingManager: ${mooveTradingManagerAddress}`);
    console.log("=" * 50);

    if (network.name === "sepolia") {
      console.log("\n🔍 Etherscan Links:");
      console.log(
        `🔐 AccessControl: https://sepolia.etherscan.io/address/${accessControlAddress}`
      );
      console.log(
        `🎨 NFT: https://sepolia.etherscan.io/address/${mooveNFTAddress}`
      );
      console.log(
        `🏆 Auction: https://sepolia.etherscan.io/address/${mooveAuctionAddress}`
      );
      console.log(
        `🚗 RentalPass: https://sepolia.etherscan.io/address/${mooveRentalPassAddress}`
      );
      console.log(
        `🎨 Customization: https://sepolia.etherscan.io/address/${mooveCustomizationAddress}`
      );
      console.log(
        `💱 TradingManager: https://sepolia.etherscan.io/address/${mooveTradingManagerAddress}`
      );
    }

    console.log("\n📝 Next Steps:");
    console.log("1. Update frontend with new contract addresses");
    console.log("2. Test all contract interactions");
    console.log("3. Verify contracts on Etherscan (if on testnet)");
    console.log("4. Deploy to mainnet when ready");
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);

    if (error.message.includes("insufficient funds")) {
      console.log("💡 Solution: Add more ETH to your account");
    } else if (error.message.includes("nonce")) {
      console.log("💡 Solution: Wait a moment and try again");
    } else if (error.message.includes("gas")) {
      console.log("💡 Solution: Increase gas limit in hardhat.config.js");
    }

    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment script failed:", error);
    process.exit(1);
  });
