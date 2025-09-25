const { ethers } = require("hardhat");

async function testAccessControl() {
  console.log("🔍 Testing AccessControl Contract...");

  const accessControlAddress = "0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42";
  const adminAccount = "0x777382955f33Bb8540602E914D9b650C962EF6Cc";

  try {
    const provider = new ethers.JsonRpcProvider(
      "https://ethereum-sepolia.publicnode.com"
    );

    // Simple ABI with just the functions we need
    const accessControlABI = [
      "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
      "function MASTER_ADMIN_ROLE() view returns (bytes32)",
      "function MINTER_ROLE() view returns (bytes32)",
      "function AUCTION_MANAGER_ROLE() view returns (bytes32)",
      "function hasRole(bytes32 role, address account) view returns (bool)",
      "function canMint(address account) view returns (bool)",
      "function canManageAuctions(address account) view returns (bool)",
    ];

    const accessControl = new ethers.Contract(
      accessControlAddress,
      accessControlABI,
      provider
    );

    console.log(`📋 Contract Address: ${accessControlAddress}`);
    console.log(`👤 Admin Account: ${adminAccount}`);

    // Test if contract is deployed
    const code = await provider.getCode(accessControlAddress);
    console.log(`📦 Contract Deployed: ${code !== "0x"}`);

    if (code === "0x") {
      console.log("❌ Contract not deployed at this address!");
      return;
    }

    // Get role constants
    console.log("\n🔍 Getting Role Constants:");

    try {
      const DEFAULT_ADMIN_ROLE = await accessControl.DEFAULT_ADMIN_ROLE();
      console.log(`✅ DEFAULT_ADMIN_ROLE: ${DEFAULT_ADMIN_ROLE}`);

      const MASTER_ADMIN_ROLE = await accessControl.MASTER_ADMIN_ROLE();
      console.log(`✅ MASTER_ADMIN_ROLE: ${MASTER_ADMIN_ROLE}`);

      const MINTER_ROLE = await accessControl.MINTER_ROLE();
      console.log(`✅ MINTER_ROLE: ${MINTER_ROLE}`);

      const AUCTION_MANAGER_ROLE = await accessControl.AUCTION_MANAGER_ROLE();
      console.log(`✅ AUCTION_MANAGER_ROLE: ${AUCTION_MANAGER_ROLE}`);

      // Test hasRole function
      console.log("\n🔍 Testing hasRole Function:");

      const hasDefaultAdmin = await accessControl.hasRole(
        DEFAULT_ADMIN_ROLE,
        adminAccount
      );
      console.log(`✅ Has DEFAULT_ADMIN_ROLE: ${hasDefaultAdmin}`);

      const hasMasterAdmin = await accessControl.hasRole(
        MASTER_ADMIN_ROLE,
        adminAccount
      );
      console.log(`✅ Has MASTER_ADMIN_ROLE: ${hasMasterAdmin}`);

      const hasMinter = await accessControl.hasRole(MINTER_ROLE, adminAccount);
      console.log(`✅ Has MINTER_ROLE: ${hasMinter}`);

      const hasAuctionManager = await accessControl.hasRole(
        AUCTION_MANAGER_ROLE,
        adminAccount
      );
      console.log(`✅ Has AUCTION_MANAGER_ROLE: ${hasAuctionManager}`);

      // Test convenience functions
      console.log("\n🔍 Testing Convenience Functions:");

      const canMint = await accessControl.canMint(adminAccount);
      console.log(`✅ Can Mint: ${canMint}`);

      const canManageAuctions = await accessControl.canManageAuctions(
        adminAccount
      );
      console.log(`✅ Can Manage Auctions: ${canManageAuctions}`);
    } catch (roleError) {
      console.error("❌ Error getting roles:", roleError.message);
    }
  } catch (error) {
    console.error("❌ Error testing AccessControl:", error);
  }
}

testAccessControl().catch(console.error);
