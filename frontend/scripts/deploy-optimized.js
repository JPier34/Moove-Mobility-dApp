const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy script ottimizzato per MooveRentalPass
 * Riduce i costi di gas per il deploy su Sepolia
 */
async function main() {
  console.log("🚗 Starting OPTIMIZED MooveRentalPass deployment...");

  // Get deployment account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address))
  );

  // Use existing MooveAccessControl address
  const accessControlAddress = "0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42";
  console.log("🔐 Using existing MooveAccessControl at:", accessControlAddress);

  // Deploy new MooveRentalPass with optimized gas settings
  console.log("\n🚗 Deploying new MooveRentalPass (OPTIMIZED)...");

  const MooveRentalPass = await ethers.getContractFactory("MooveRentalPass");

  // Estimate gas first
  const deploymentData = MooveRentalPass.interface.encodeDeploy([
    accessControlAddress,
  ]);
  const estimatedGas = await ethers.provider.estimateGas({
    from: deployer.address,
    data: deploymentData,
  });

  console.log("📊 Estimated gas for deployment:", estimatedGas.toString());

  // Deploy with optimized gas settings
  const mooveRentalPass = await MooveRentalPass.deploy(accessControlAddress, {
    gasLimit: estimatedGas.mul(120).div(100), // +20% buffer
    maxFeePerGas: ethers.parseUnits("8", "gwei"), // Reduced from 10 gwei
    maxPriorityFeePerGas: ethers.parseUnits("1.5", "gwei"), // Reduced priority fee
  });

  console.log("⏳ Waiting for deployment confirmation...");
  await mooveRentalPass.waitForDeployment();

  const rentalPassAddress = await mooveRentalPass.getAddress();
  console.log("✅ New MooveRentalPass deployed to:", rentalPassAddress);

  // Get deployment receipt for gas used
  const deploymentReceipt = await mooveRentalPass.deploymentTransaction();
  const receipt = await deploymentReceipt.wait();
  const gasUsed = receipt.gasUsed;
  const gasPrice = receipt.gasPrice;
  const totalCost = gasUsed * gasPrice;

  console.log("📊 Deployment Gas Info:");
  console.log(`- Gas Used: ${gasUsed.toString()}`);
  console.log(`- Gas Price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
  console.log(`- Total Cost: ${ethers.formatEther(totalCost)} ETH`);

  // Basic configuration only (minimal gas usage)
  console.log("\n⚙️ Setting up minimal configuration...");

  try {
    // Get access control contract instance
    const MooveAccessControl = await ethers.getContractFactory(
      "MooveAccessControl"
    );
    const accessControl = MooveAccessControl.attach(accessControlAddress);

    // Grant only essential role (MINTER_ROLE) to deployer
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));

    const hasRole = await accessControl.hasRole(MINTER_ROLE, deployer.address);
    if (!hasRole) {
      console.log("🎭 Granting MINTER_ROLE to deployer...");
      const tx = await accessControl.grantRole(MINTER_ROLE, deployer.address, {
        maxFeePerGas: ethers.parseUnits("8", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("1.5", "gwei"),
      });
      await tx.wait();
      console.log("✅ MINTER_ROLE granted");
    } else {
      console.log("✅ Deployer already has MINTER_ROLE");
    }

    // Authorize the contract
    console.log("🔗 Authorizing MooveRentalPass contract...");
    const authTx = await accessControl.authorizeContract(rentalPassAddress, {
      maxFeePerGas: ethers.parseUnits("8", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("1.5", "gwei"),
    });
    await authTx.wait();
    console.log("✅ Contract authorized");

    // Configure only one vehicle price to save gas
    console.log("💰 Configuring basic vehicle price...");
    const bikePrice = ethers.parseEther("0.00000075");
    await mooveRentalPass.setVehicleConfig(0, bikePrice, "E-Bike Access", {
      maxFeePerGas: ethers.parseUnits("8", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("1.5", "gwei"),
    });
    console.log(
      "✅ Bike price configured:",
      ethers.formatEther(bikePrice),
      "ETH"
    );
  } catch (error) {
    console.log("⚠️ Configuration failed:", error.message);
    console.log("⚠️ Contract deployed but not fully configured");
  }

  // Save minimal deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      MooveAccessControl: {
        address: accessControlAddress,
        note: "Existing working contract",
      },
      MooveRentalPass: {
        address: rentalPassAddress,
        note: "New contract with updateAccessControl function",
        gasUsed: gasUsed.toString(),
        totalCost: ethers.formatEther(totalCost),
      },
    },
    deploymentTime: new Date().toISOString(),
    note: "Minimal deployment - additional configuration may be needed",
  };

  const deploymentFile = `deployments/${hre.network.name}_rental_pass_optimized.json`;
  if (!fs.existsSync("deployments")) {
    fs.mkdirSync("deployments");
  }
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("✅ Deployment info saved to:", deploymentFile);

  console.log("\n🎉 OPTIMIZED DEPLOYMENT COMPLETED!");
  console.log("\n📋 Summary:");
  console.log(`- New MooveRentalPass: ${rentalPassAddress}`);
  console.log(`- Gas Used: ${ethers.formatEther(totalCost)} ETH`);
  console.log(`- Uses AccessControl: ${accessControlAddress}`);

  console.log("\n⚠️ IMPORTANT:");
  console.log("This is a minimal deployment. You may need to:");
  console.log("1. Configure additional vehicle prices");
  console.log("2. Grant additional roles if needed");
  console.log("3. Test the updateAccessControl function");

  console.log("\n🔍 Verification Command:");
  console.log(
    `npx hardhat verify --network ${hre.network.name} ${rentalPassAddress} "${accessControlAddress}"`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
