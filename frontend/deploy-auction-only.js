const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying MooveAuction contract...");

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
    // Deploy del contratto MooveAuction
    console.log("📦 Deploying MooveAuction...");
    const MooveAuction = await ethers.getContractFactory("MooveAuction");

    // Usa l'indirizzo del MooveAccessControl appena deployato
    const accessControlAddress = "0x7e83b5E99F217Da22EB33D3CC800c68B88d54165";

    const mooveAuction = await MooveAuction.deploy(accessControlAddress);
    await mooveAuction.waitForDeployment();

    const mooveAuctionAddress = await mooveAuction.getAddress();
    console.log("✅ MooveAuction deployed to:", mooveAuctionAddress);

    // Verifica il deploy
    console.log("🔍 Verifying deployment...");
    const code = await ethers.provider.getCode(mooveAuctionAddress);
    if (code === "0x") {
      console.log("❌ Deployment failed - no code found");
      return;
    }

    console.log("✅ Contract code verified - deployment successful!");

    console.log("\n🎉 MooveAuction deployment completed successfully!");
    console.log("📋 Contract Address:", mooveAuctionAddress);
    console.log("🔗 Network:", network.name);
    console.log("🔐 AccessControl Address:", accessControlAddress);

    // Salva l'indirizzo per uso futuro
    console.log("\n📝 Next steps:");
    console.log("1. Update frontend/utils/contracts.ts with this address");
    console.log("2. Test the auction functionality");

    // Verifica su Etherscan se possibile
    if (network.name === "sepolia") {
      console.log("\n🔍 Etherscan Link:");
      console.log(
        `🏆 Auction: https://sepolia.etherscan.io/address/${mooveAuctionAddress}`
      );
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
