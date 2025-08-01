const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy script per MooveAccessControl
 * Gestisce la configurazione iniziale dei ruoli e permessi per l'ecosistema Moove
 */
async function main() {
  console.log("🔐 Starting MooveAccessControl deployment...");

  // Get deployment account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address))
  );

  // Deploy MooveAccessControl
  console.log("\n🔐 Deploying MooveAccessControl...");
  const MooveAccessControl = await ethers.getContractFactory(
    "MooveAccessControl"
  );

  const mooveAccessControl = await MooveAccessControl.deploy(deployer.address);
  await mooveAccessControl.waitForDeployment();

  const accessControlAddress = await mooveAccessControl.getAddress();
  console.log("✅ MooveAccessControl deployed to:", accessControlAddress);

  // Setup initial configuration
  console.log("\n⚙️ Setting up initial configuration...");

  // Get role constants
  const MINTER_ROLE = await mooveAccessControl.MINTER_ROLE();
  const AUCTION_MANAGER_ROLE = await mooveAccessControl.AUCTION_MANAGER_ROLE();
  const CUSTOMIZATION_ADMIN_ROLE =
    await mooveAccessControl.CUSTOMIZATION_ADMIN_ROLE();
  const PRICE_MANAGER_ROLE = await mooveAccessControl.PRICE_MANAGER_ROLE();
  const PAUSER_ROLE = await mooveAccessControl.PAUSER_ROLE();
  const WITHDRAWER_ROLE = await mooveAccessControl.WITHDRAWER_ROLE();

  // Grant essential roles to deployer for initial setup
  console.log("🎭 Granting initial roles to deployer...");

  const rolesToGrant = [
    { role: MINTER_ROLE, name: "MINTER_ROLE" },
    { role: AUCTION_MANAGER_ROLE, name: "AUCTION_MANAGER_ROLE" },
    { role: CUSTOMIZATION_ADMIN_ROLE, name: "CUSTOMIZATION_ADMIN_ROLE" },
    { role: PRICE_MANAGER_ROLE, name: "PRICE_MANAGER_ROLE" },
    { role: PAUSER_ROLE, name: "PAUSER_ROLE" },
    { role: WITHDRAWER_ROLE, name: "WITHDRAWER_ROLE" },
  ];

  for (const { role, name } of rolesToGrant) {
    const tx = await mooveAccessControl.grantRole(role, deployer.address);
    await tx.wait();
    console.log(`✅ Granted ${name} to deployer`);
  }

  // Setup additional emergency contacts (esempio con indirizzi di team members)
  console.log("\n🚨 Setting up emergency contacts...");

  // Esempio di indirizzi emergency (sostituisci con indirizzi reali del team)
  const emergencyContacts = [
    // "0x1234567890123456789012345678901234567890", // Team Member 1
    // "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", // Team Member 2
  ];

  for (const contact of emergencyContacts) {
    if (contact && contact !== deployer.address) {
      try {
        const tx = await mooveAccessControl.addEmergencyContact(contact);
        await tx.wait();
        console.log(`✅ Added emergency contact: ${contact}`);
      } catch (error) {
        console.log(
          `⚠️ Failed to add emergency contact ${contact}:`,
          error.message
        );
      }
    }
  }

  // Verify deployment and roles
  console.log("\n🔍 Verifying deployment...");

  // Check master admin count
  const masterAdminCount = await mooveAccessControl.masterAdminCount();
  console.log(`👥 Master admin count: ${masterAdminCount}`);

  // Check deployer roles
  const deployerRoles = [];
  for (const { role, name } of rolesToGrant) {
    const hasRole = await mooveAccessControl.hasRole(role, deployer.address);
    if (hasRole) {
      deployerRoles.push(name);
    }
  }
  console.log(`🎭 Deployer roles: ${deployerRoles.join(", ")}`);

  // Check contract state
  const isGloballyPaused = await mooveAccessControl.isGloballyPaused();
  const timeLockDuration = await mooveAccessControl.timeLockDuration();

  console.log(`⏸️ Globally paused: ${isGloballyPaused}`);
  console.log(
    `⏰ Time lock duration: ${timeLockDuration} seconds (${
      timeLockDuration / 3600
    } hours)`
  );

  // Test core functionality
  console.log("\n🧪 Testing core functionality...");

  try {
    // Test role checking functions
    const canMint = await mooveAccessControl.canMint(deployer.address);
    const canManageAuctions = await mooveAccessControl.canManageAuctions(
      deployer.address
    );
    const canPause = await mooveAccessControl.canPause(deployer.address);

    console.log(`✅ canMint: ${canMint}`);
    console.log(`✅ canManageAuctions: ${canManageAuctions}`);
    console.log(`✅ canPause: ${canPause}`);

    // Test time lock scheduling (non-destructive test)
    const testOperationId = ethers.keccak256(
      ethers.toUtf8Bytes("test_operation")
    );
    const scheduleTx = await mooveAccessControl.scheduleTimeLockOperation(
      testOperationId
    );
    await scheduleTx.wait();
    console.log("✅ Time lock operation scheduled successfully");

    // Cancel the test operation
    const cancelTx = await mooveAccessControl.cancelTimeLockOperation(
      testOperationId
    );
    await cancelTx.wait();
    console.log("✅ Time lock operation cancelled successfully");
  } catch (error) {
    console.error("❌ Error during functionality testing:", error.message);
  }

  // Save deployment information
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      MooveAccessControl: {
        address: accessControlAddress,
        constructorArgs: [deployer.address],
        roles: {
          MASTER_ADMIN_ROLE: await mooveAccessControl.MASTER_ADMIN_ROLE(),
          MINTER_ROLE: await mooveAccessControl.MINTER_ROLE(),
          AUCTION_MANAGER_ROLE: await mooveAccessControl.AUCTION_MANAGER_ROLE(),
          CUSTOMIZATION_ADMIN_ROLE:
            await mooveAccessControl.CUSTOMIZATION_ADMIN_ROLE(),
          PRICE_MANAGER_ROLE: await mooveAccessControl.PRICE_MANAGER_ROLE(),
          PAUSER_ROLE: await mooveAccessControl.PAUSER_ROLE(),
          WITHDRAWER_ROLE: await mooveAccessControl.WITHDRAWER_ROLE(),
          UPGRADER_ROLE: await mooveAccessControl.UPGRADER_ROLE(),
          METADATA_MANAGER_ROLE:
            await mooveAccessControl.METADATA_MANAGER_ROLE(),
        },
      },
    },
    configuration: {
      masterAdminCount: Number(masterAdminCount),
      timeLockDuration: Number(timeLockDuration),
      emergencyContacts: emergencyContacts.length,
      globallyPaused: isGloballyPaused,
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
    `${hre.network.name}_access_control.json`
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  // Generate ABI file for frontend
  const abisDir = path.join(__dirname, "..", "frontend", "src", "abis");
  if (!fs.existsSync(abisDir)) {
    fs.mkdirSync(abisDir, { recursive: true });
  }

  const mooveAccessControlArtifact = await hre.artifacts.readArtifact(
    "MooveAccessControl"
  );
  fs.writeFileSync(
    path.join(abisDir, "MooveAccessControl.json"),
    JSON.stringify(mooveAccessControlArtifact.abi, null, 2)
  );

  // Update contracts configuration for frontend
  const contractsConfigPath = path.join(
    __dirname,
    "..",
    "frontend",
    "src",
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

  // Add MooveAccessControl to existing config
  const updatedConfig = {
    ...existingConfig,
    MooveAccessControl: {
      address: accessControlAddress,
      abi: mooveAccessControlArtifact.abi,
    },
  };

  const contractsConfigContent = `// Auto-generated contract configuration
export const contracts = ${JSON.stringify(updatedConfig, null, 2)} as const;

export const CONTRACT_ADDRESSES = {
    ${Object.keys(updatedConfig)
      .map((name) => `${name.toUpperCase()}: "${updatedConfig[name].address}"`)
      .join(",\n    ")}
} as const;

// Role constants for MooveAccessControl
export const ACCESS_CONTROL_ROLES = ${JSON.stringify(
    deploymentInfo.contracts.MooveAccessControl.roles,
    null,
    2
  )} as const;
`;

  fs.writeFileSync(contractsConfigPath, contractsConfigContent);

  console.log("\n🎉 MooveAccessControl deployment completed successfully!");
  console.log("\n📋 Summary:");
  console.log("=====================================");
  console.log(`🏠 Network: ${hre.network.name}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`🔐 MooveAccessControl: ${accessControlAddress}`);
  console.log(`👥 Master Admins: ${masterAdminCount}`);
  console.log(`⏰ Time Lock: ${timeLockDuration / 3600} hours`);
  console.log(`🚨 Emergency Contacts: ${emergencyContacts.length + 1}`); // +1 for deployer
  console.log(`💾 Config saved to: ${deploymentFile}`);
  console.log("=====================================");

  // Verification command
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 Verification Command:");
    console.log(
      `npx hardhat verify --network ${hre.network.name} ${accessControlAddress} "${deployer.address}"`
    );
  }

  console.log("\n📝 Next Steps:");
  console.log(
    "1. Update your NFT and Auction contracts to use this AccessControl"
  );
  console.log(
    "2. Authorize your NFT and Auction contracts using authorizeContract()"
  );
  console.log("3. Grant specific roles to team members as needed");
  console.log("4. Test integration with your existing contracts");
  console.log(
    "5. Consider implementing trading-specific extensions (see analysis)"
  );
}

// Helper function to verify contract authorization
async function authorizeContractsAfterDeploy(
  accessControlAddress,
  contractsToAuthorize
) {
  console.log("\n🔗 Authorizing contracts...");

  const MooveAccessControl = await ethers.getContractFactory(
    "MooveAccessControl"
  );
  const accessControl = MooveAccessControl.attach(accessControlAddress);

  for (const contractAddress of contractsToAuthorize) {
    try {
      const tx = await accessControl.authorizeContract(contractAddress);
      await tx.wait();
      console.log(`✅ Authorized contract: ${contractAddress}`);
    } catch (error) {
      console.error(
        `❌ Failed to authorize contract ${contractAddress}:`,
        error.message
      );
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

// Export helper function for use in other scripts
module.exports = { authorizeContractsAfterDeploy };
