// Test script per verificare l'ABI del contratto AccessControl
const { ethers } = require("hardhat");

async function testAccessControlABI() {
  console.log("🔍 Testing AccessControl ABI...");

  const accessControlAddress = "0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42";
  const adminAccount = "0x777382955f33Bb8540602E914D9b650C962EF6Cc";

  try {
    const provider = new ethers.JsonRpcProvider(
      "https://ethereum-sepolia.publicnode.com"
    );

    // ABI completo dal file JSON
    const accessControlABI = [
      {
        inputs: [
          { internalType: "address", name: "initialAdmin", type: "address" },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
      },
      {
        inputs: [],
        name: "DEFAULT_ADMIN_ROLE",
        outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "MASTER_ADMIN_ROLE",
        outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "MINTER_ROLE",
        outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "AUCTION_MANAGER_ROLE",
        outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "bytes32", name: "role", type: "bytes32" },
          { internalType: "address", name: "account", type: "address" },
        ],
        name: "hasRole",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [{ internalType: "address", name: "account", type: "address" }],
        name: "canMint",
        outputs: [
          { internalType: "bool", name: "hasMinterRole", type: "bool" },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [{ internalType: "address", name: "account", type: "address" }],
        name: "canManageAuctions",
        outputs: [
          { internalType: "bool", name: "hasAuctionRole", type: "bool" },
        ],
        stateMutability: "view",
        type: "function",
      },
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

    // Test ABI functions
    console.log("\n🔍 Testing ABI Functions:");

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
      console.error("❌ Error testing roles:", roleError.message);
    }
  } catch (error) {
    console.error("❌ Error testing AccessControl:", error);
  }
}

testAccessControlABI().catch(console.error);
