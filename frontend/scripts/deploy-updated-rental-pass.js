const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying updated MooveRentalPass...");

  // Get deployment account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address))
  );

  // Contract addresses
  const newAccessControlAddress = "0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42";
  const oldRentalPassAddress = "0x460353902aF2A73f0323EC888BBFcE64681932E8";

  console.log("New MooveAccessControl:", newAccessControlAddress);
  console.log("Old MooveRentalPass:", oldRentalPassAddress);

  // Step 1: Deploy new MooveRentalPass with new AccessControl
  console.log("\n🚗 Step 1: Deploying new MooveRentalPass...");

  const MooveRentalPass = await ethers.getContractFactory("MooveRentalPass");
  const newMooveRentalPass = await MooveRentalPass.deploy(
    newAccessControlAddress
  );
  await newMooveRentalPass.waitForDeployment();

  const newRentalPassAddress = await newMooveRentalPass.getAddress();
  console.log("✅ New MooveRentalPass deployed to:", newRentalPassAddress);

  // Step 2: Configure roles on new AccessControl
  console.log("\n🎭 Step 2: Configuring roles...");

  const MooveAccessControl = await ethers.getContractFactory(
    "MooveAccessControl"
  );
  const newAccessControl = MooveAccessControl.attach(newAccessControlAddress);

  const MASTER_ADMIN_ROLE = ethers.keccak256(
    ethers.toUtf8Bytes("MASTER_ADMIN_ROLE")
  );
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));

  // Grant roles to deployer
  const rolesToGrant = [
    { role: MASTER_ADMIN_ROLE, name: "MASTER_ADMIN_ROLE" },
    { role: MINTER_ROLE, name: "MINTER_ROLE" },
    { role: PAUSER_ROLE, name: "PAUSER_ROLE" },
  ];

  for (const { role, name } of rolesToGrant) {
    const tx = await newAccessControl.grantRole(role, deployer.address);
    await tx.wait();
    console.log(`✅ Granted ${name} to deployer`);
  }

  // Step 3: Authorize new MooveRentalPass
  console.log("\n🔗 Step 3: Authorizing new MooveRentalPass...");

  const authTx = await newAccessControl.authorizeContract(newRentalPassAddress);
  await authTx.wait();
  console.log("✅ New MooveRentalPass authorized");

  // Step 4: Configure vehicle prices
  console.log("\n💰 Step 4: Configuring vehicle prices...");

  const bikePrice = ethers.parseEther("0.00000075");
  const scooterPrice = ethers.parseEther("0.000001");
  const monopattinoPrice = ethers.parseEther("0.00000125");

  await newMooveRentalPass.setVehicleConfig(0, bikePrice, "E-Bike Access");
  console.log(
    "✅ Bike price configured:",
    ethers.formatEther(bikePrice),
    "ETH"
  );

  await newMooveRentalPass.setVehicleConfig(
    1,
    scooterPrice,
    "E-Scooter Access"
  );
  console.log(
    "✅ Scooter price configured:",
    ethers.formatEther(scooterPrice),
    "ETH"
  );

  await newMooveRentalPass.setVehicleConfig(
    2,
    monopattinoPrice,
    "Monopattino Access"
  );
  console.log(
    "✅ Monopattino price configured:",
    ethers.formatEther(monopattinoPrice),
    "ETH"
  );

  // Step 5: Verify everything works
  console.log("\n🔍 Step 5: Verifying configuration...");

  // Verify roles
  for (const { role, name } of rolesToGrant) {
    const hasRole = await newAccessControl.hasRole(role, deployer.address);
    console.log(`${name}: ${hasRole}`);
  }

  // Verify contract authorization
  const isAuthorized = await newAccessControl.authorizedContracts(
    newRentalPassAddress
  );
  console.log("MooveRentalPass authorized:", isAuthorized);

  // Verify vehicle prices
  const bikePriceCheck = await newMooveRentalPass.getVehiclePrice(0);
  const scooterPriceCheck = await newMooveRentalPass.getVehiclePrice(1);
  const monopattinoPriceCheck = await newMooveRentalPass.getVehiclePrice(2);

  console.log(`🚲 Bike price: ${ethers.formatEther(bikePriceCheck)} ETH`);
  console.log(`🛴 Scooter price: ${ethers.formatEther(scooterPriceCheck)} ETH`);
  console.log(
    `🛹 Monopattino price: ${ethers.formatEther(monopattinoPriceCheck)} ETH`
  );

  // Step 6: Save deployment info
  console.log("\n💾 Step 6: Saving deployment info...");

  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      MooveAccessControl: {
        address: newAccessControlAddress,
        note: "New working AccessControl",
      },
      MooveRentalPass: {
        address: newRentalPassAddress,
        oldAddress: oldRentalPassAddress,
        note: "Updated contract with AccessControl update function",
      },
    },
    roles: {
      MASTER_ADMIN_ROLE,
      MINTER_ROLE,
      PAUSER_ROLE,
    },
    vehiclePrices: {
      bike: ethers.formatEther(bikePrice),
      scooter: ethers.formatEther(scooterPrice),
      monopattino: ethers.formatEther(monopattinoPrice),
    },
    timestamp: new Date().toISOString(),
  };

  const deploymentFile = `deployments/${hre.network.name}_updated_rental_pass.json`;
  const fs = require("fs");

  // Ensure deployments directory exists
  if (!fs.existsSync("deployments")) {
    fs.mkdirSync("deployments");
  }

  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("✅ Deployment info saved to:", deploymentFile);

  // Step 7: Generate frontend config
  console.log("\n🌐 Step 7: Generating frontend configuration...");

  const frontendConfig = `// Auto-generated contract configuration (UPDATED RENTAL PASS)
export const contracts = {
  MooveAccessControl: {
    address: "${newAccessControlAddress}",
    abi: [/* ABI will be generated by hardhat */],
  },
  MooveRentalPass: {
    address: "${newRentalPassAddress}",
    abi: [/* ABI will be generated by hardhat */],
  },
} as const;

export const CONTRACT_ADDRESSES = {
  MOOVEACCESSCONTROL: "${newAccessControlAddress}",
  MOOVERENTALPASS: "${newRentalPassAddress}",
} as const;

// Vehicle type constants for MooveRentalPass
export const VEHICLE_TYPES = {
  BIKE: 0,
  SCOOTER: 1,
  MONOPATTINO: 2,
} as const;

// Vehicle prices (in ETH) - NOW CONFIGURED ON CONTRACT
export const VEHICLE_PRICES = {
  bike: "${ethers.formatEther(bikePrice)}",
  scooter: "${ethers.formatEther(scooterPrice)}",
  monopattino: "${ethers.formatEther(monopattinoPrice)}",
} as const;
`;

  const frontendConfigFile = "frontend/utils/contracts-updated-rental-pass.ts";
  fs.writeFileSync(frontendConfigFile, frontendConfig);
  console.log("✅ Frontend config generated:", frontendConfigFile);

  console.log("\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("\n📋 Summary of Changes:");
  console.log(`- New MooveRentalPass: ${newRentalPassAddress}`);
  console.log(`- Uses new AccessControl: ${newAccessControlAddress}`);
  console.log("- All roles configured");
  console.log("- Vehicle prices configured");
  console.log("- AccessControl update function available");
  console.log("- Frontend config generated");

  console.log("\n🔄 Next Steps:");
  console.log("1. Update frontend/utils/contracts.ts with new addresses");
  console.log("2. Test the frontend with new contracts");
  console.log("3. Verify minting works correctly");
  console.log("4. Test AccessControl update function if needed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
