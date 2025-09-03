const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying MooveAccessControl contract...");

  // Recupera l'account deployer
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Verifica il balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.01")) {
    console.log("⚠️  Warning: Low balance for deployment");
  }

  try {
    // Deploy del contratto MooveAccessControl
    console.log("📦 Deploying MooveAccessControl...");
    const MooveAccessControl = await ethers.getContractFactory(
      "MooveAccessControl"
    );

    // Il deployer diventa automaticamente il master admin
    const accessControl = await MooveAccessControl.deploy(deployer.address);

    console.log("⏳ Waiting for deployment confirmation...");
    await accessControl.waitForDeployment();

    const accessControlAddress = await accessControl.getAddress();
    console.log("✅ MooveAccessControl deployed to:", accessControlAddress);

    // Verifica il deploy
    console.log("🔍 Verifying deployment...");
    const code = await ethers.provider.getCode(accessControlAddress);
    if (code === "0x") {
      console.log("❌ Deployment failed - no code found");
      return;
    }

    console.log("✅ Contract code verified - deployment successful!");

    // Test delle funzioni principali
    console.log("🧪 Testing contract functions...");

    // Verifica che il deployer sia master admin
    const isMasterAdmin = await accessControl.hasRole(
      await accessControl.MASTER_ADMIN_ROLE(),
      deployer.address
    );
    console.log("👑 Deployer is Master Admin:", isMasterAdmin);

    // Verifica permessi di minting
    const canMint = await accessControl.canMint(deployer.address);
    console.log("🎨 Deployer can mint:", canMint);

    // Verifica permessi di gestione aste
    const canManageAuctions = await accessControl.canManageAuctions(
      deployer.address
    );
    console.log("🏆 Deployer can manage auctions:", canManageAuctions);

    // Verifica stato globale
    const isGloballyPaused = await accessControl.isGloballyPaused();
    console.log("⏸️  System is globally paused:", isGloballyPaused);

    // Verifica numero di master admin
    const masterAdminCount = await accessControl.masterAdminCount();
    console.log("👥 Number of Master Admins:", masterAdminCount.toString());

    console.log("\n🎉 MooveAccessControl deployment completed successfully!");
    console.log("📋 Contract Address:", accessControlAddress);
    console.log("🔗 Network:", network.name);
    console.log("⛽ Gas used:", "Check transaction receipt");

    // Salva l'indirizzo per uso futuro
    console.log("\n📝 Next steps:");
    console.log("1. Update frontend/utils/contracts.ts with this address");
    console.log("2. Deploy MooveRentalPass with AccessControl reference");
    console.log("3. Test the admin panel functionality");

    // Verifica su Etherscan se possibile
    if (network.name === "sepolia") {
      console.log("\n🔍 Verifying contract on Etherscan...");
      try {
        await hre.run("verify:verify", {
          address: accessControlAddress,
          constructorArguments: [deployer.address],
        });
        console.log("✅ Contract verified on Etherscan");
      } catch (error) {
        console.log("⚠️ Verification failed:", error.message);
      }
    }
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

