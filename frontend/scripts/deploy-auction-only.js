const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting MooveAuction deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.01")) {
    throw new Error("Insufficient balance for deployment");
  }

  // Deploy MooveAuction
  console.log("🎯 Deploying MooveAuction...");
  const MooveAuction = await ethers.getContractFactory("MooveAuction");
  
  // Use existing AccessControl address
  const accessControlAddress = "0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42";
  console.log("🔐 Using AccessControl at:", accessControlAddress);
  
  const mooveAuction = await MooveAuction.deploy(accessControlAddress);

  console.log("⏳ Waiting for deployment...");
  await mooveAuction.waitForDeployment();

  const auctionAddress = await mooveAuction.getAddress();
  console.log("✅ MooveAuction deployed to:", auctionAddress);

  // Verify deployment
  console.log("🔍 Verifying deployment...");
  const auctionId = await mooveAuction.nextAuctionId();
  console.log("Next auction ID:", auctionId.toString());

  console.log("🎉 Deployment completed successfully!");
  console.log("📋 Contract Address:", auctionAddress);
  console.log(
    "🔗 Etherscan:",
    `https://sepolia.etherscan.io/address/${auctionAddress}`
  );

  return {
    auctionAddress,
    deployer: deployer.address,
  };
}

main()
  .then((result) => {
    console.log("✅ Deployment successful:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
