const { ethers } = require("hardhat");

async function checkAdminPermissions() {
  console.log("🔍 Checking Admin Permissions...");

  // Contract addresses from contracts.ts
  const accessControlAddress = "0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42";
  const nftAddress = "0x40E455515bf712144C1A5D859F19d64b537754f7";
  const auctionAddress = "0xd13E0582e7f13a8260A7C768B641e8C1Aee26585";
  const rentalPassAddress = "0x52d95a8Fd4D8c0Ad210DCAD3BA8EBd533EB5420a";

  // Admin account
  const adminAccount = "0x777382955f33Bb8540602E914D9b650C962EF6Cc";

  try {
    const provider = new ethers.JsonRpcProvider(
      "https://ethereum-sepolia.publicnode.com"
    );

    // Get AccessControl contract with complete ABI
    const accessControlABI = [
      "function hasRole(bytes32 role, address account) view returns (bool)",
      "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
      "function MASTER_ADMIN_ROLE() view returns (bytes32)",
      "function MINTER_ROLE() view returns (bytes32)",
      "function AUCTION_MANAGER_ROLE() view returns (bytes32)",
      "function WITHDRAWER_ROLE() view returns (bytes32)",
      "function PAUSER_ROLE() view returns (bytes32)",
      "function canMint(address account) view returns (bool)",
      "function canManageAuctions(address account) view returns (bool)",
      "function canWithdraw(address account) view returns (bool)",
      "function canPause(address account) view returns (bool)",
    ];

    const accessControl = new ethers.Contract(
      accessControlAddress,
      accessControlABI,
      provider
    );

    console.log("\n📋 Contract Addresses:");
    console.log(`🔐 MooveAccessControl: ${accessControlAddress}`);
    console.log(`🎨 MooveNFT: ${nftAddress}`);
    console.log(`🏛️ MooveAuction: ${auctionAddress}`);
    console.log(`🚗 MooveRentalPass: ${rentalPassAddress}`);
    console.log(`👤 Admin Account: ${adminAccount}`);

    // Check roles using the new functions
    console.log("\n🔍 Checking Roles for Admin Account:");

    try {
      const canMint = await accessControl.canMint(adminAccount);
      console.log(`✅ Can Mint: ${canMint}`);
    } catch (error) {
      console.log(`❌ Can Mint: Error - ${error.message}`);
    }

    try {
      const canManageAuctions = await accessControl.canManageAuctions(
        adminAccount
      );
      console.log(`✅ Can Manage Auctions: ${canManageAuctions}`);
    } catch (error) {
      console.log(`❌ Can Manage Auctions: Error - ${error.message}`);
    }

    try {
      const canWithdraw = await accessControl.canWithdraw(adminAccount);
      console.log(`✅ Can Withdraw: ${canWithdraw}`);
    } catch (error) {
      console.log(`❌ Can Withdraw: Error - ${error.message}`);
    }

    try {
      const canPause = await accessControl.canPause(adminAccount);
      console.log(`✅ Can Pause: ${canPause}`);
    } catch (error) {
      console.log(`❌ Can Pause: Error - ${error.message}`);
    }

    // Check specific roles
    console.log("\n🔍 Checking Specific Roles:");

    try {
      const defaultAdminRole = await accessControl.DEFAULT_ADMIN_ROLE();
      const hasDefaultAdmin = await accessControl.hasRole(
        defaultAdminRole,
        adminAccount
      );
      console.log(`✅ DEFAULT_ADMIN_ROLE: ${hasDefaultAdmin}`);
    } catch (error) {
      console.log(`❌ DEFAULT_ADMIN_ROLE: Error - ${error.message}`);
    }

    try {
      const masterAdminRole = await accessControl.MASTER_ADMIN_ROLE();
      const hasMasterAdmin = await accessControl.hasRole(
        masterAdminRole,
        adminAccount
      );
      console.log(`✅ MASTER_ADMIN_ROLE: ${hasMasterAdmin}`);
    } catch (error) {
      console.log(`❌ MASTER_ADMIN_ROLE: Error - ${error.message}`);
    }

    try {
      const minterRole = await accessControl.MINTER_ROLE();
      const hasMinter = await accessControl.hasRole(minterRole, adminAccount);
      console.log(`✅ MINTER_ROLE: ${hasMinter}`);
    } catch (error) {
      console.log(`❌ MINTER_ROLE: Error - ${error.message}`);
    }

    try {
      const auctionManagerRole = await accessControl.AUCTION_MANAGER_ROLE();
      const hasAuctionManager = await accessControl.hasRole(
        auctionManagerRole,
        adminAccount
      );
      console.log(`✅ AUCTION_MANAGER_ROLE: ${hasAuctionManager}`);
    } catch (error) {
      console.log(`❌ AUCTION_MANAGER_ROLE: Error - ${error.message}`);
    }

    // Check if contracts exist and are deployed
    console.log("\n🔍 Checking Contract Deployment:");

    const contracts = [
      { name: "MooveAccessControl", address: accessControlAddress },
      { name: "MooveNFT", address: nftAddress },
      { name: "MooveAuction", address: auctionAddress },
      { name: "MooveRentalPass", address: rentalPassAddress },
    ];

    for (const contract of contracts) {
      try {
        const code = await provider.getCode(contract.address);
        const isDeployed = code !== "0x";
        console.log(
          `${isDeployed ? "✅" : "❌"} ${contract.name}: ${
            isDeployed ? "Deployed" : "Not Deployed"
          }`
        );
      } catch (error) {
        console.log(
          `❌ ${contract.name}: Error checking deployment - ${error.message}`
        );
      }
    }
  } catch (error) {
    console.error("❌ Error checking admin permissions:", error);
  }
}

checkAdminPermissions().catch(console.error);
