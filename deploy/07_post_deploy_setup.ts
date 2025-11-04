import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // @ts-ignore - hardhat-deploy extends hre with deployments and getNamedAccounts
  const { deployments, getNamedAccounts, ethers } = hre;
  const { get } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("🔧 Setting up post-deploy configuration...");
  console.log("Deployer:", deployer);

  // Get all deployed contracts
  const accessControl = await get("MooveAccessControl");
  const mooveNFT = await get("MooveNFT");
  const customization = await get("MooveCustomization");
  const rentalPass = await get("MooveRentalPass");
  const tradingManager = await get("MooveTradingManager");
  const auction = await get("MooveAuction");

  console.log("📋 Contract Addresses:");
  console.log("- AccessControl:", accessControl.address);
  console.log("- MooveNFT:", mooveNFT.address);
  console.log("- Customization:", customization.address);
  console.log("- RentalPass:", rentalPass.address);
  console.log("- TradingManager:", tradingManager.address);
  console.log("- Auction:", auction.address);

  // Get contract instances
  const accessControlContract = await ethers.getContractAt(
    "MooveAccessControl",
    accessControl.address
  );
  const mooveNFTContract = await ethers.getContractAt(
    "MooveNFT",
    mooveNFT.address
  );
  const customizationContract = await ethers.getContractAt(
    "MooveCustomization",
    customization.address
  );
  const rentalPassContract = await ethers.getContractAt(
    "MooveRentalPass",
    rentalPass.address
  );
  const tradingManagerContract = await ethers.getContractAt(
    "MooveTradingManager",
    tradingManager.address
  );
  const auctionContract = await ethers.getContractAt(
    "MooveAuction",
    auction.address
  );

  console.log("🔐 Setting up roles and permissions...");

  // Grant roles to deployer
  const roles = [
    "MINTER_ROLE",
    "AUCTION_MANAGER_ROLE",
    "CUSTOMIZATION_ADMIN_ROLE",
    "PRICE_MANAGER_ROLE",
    "PAUSER_ROLE",
    "WITHDRAWER_ROLE",
    "TRADER_ROLE",
    "MARKETPLACE_MANAGER_ROLE",
  ];

  for (const role of roles) {
    const roleHash = ethers.keccak256(ethers.toUtf8Bytes(role));
    const hasRole = await accessControlContract.hasRole(roleHash, deployer);

    if (!hasRole) {
      console.log(`Granting ${role} to deployer...`);
      const tx = await accessControlContract.grantRole(roleHash, deployer);
      await tx.wait();
      console.log(`✅ ${role} granted`);
    } else {
      console.log(`✅ ${role} already granted`);
    }
  }

  // Authorize contracts
  console.log("🔗 Authorizing contracts...");

  const contractsToAuthorize = [
    { name: "MooveNFT", address: mooveNFT.address },
    { name: "MooveCustomization", address: customization.address },
    { name: "MooveRentalPass", address: rentalPass.address },
    { name: "MooveTradingManager", address: tradingManager.address },
    { name: "MooveAuction", address: auction.address },
  ];

  for (const contract of contractsToAuthorize) {
    const isAuthorized = await accessControlContract.authorizedContracts(
      contract.address
    );

    if (!isAuthorized) {
      console.log(`Authorizing ${contract.name}...`);
      const tx = await accessControlContract.authorizeContract(
        contract.address
      );
      await tx.wait();
      console.log(`✅ ${contract.name} authorized`);
    } else {
      console.log(`✅ ${contract.name} already authorized`);
    }
  }

  // Configure TradingManager
  console.log("💰 Configuring TradingManager...");

  // Authorize NFT contract in TradingManager
  const isNFTAuthorized = await tradingManagerContract.authorizedNFTContracts(
    mooveNFT.address
  );
  if (!isNFTAuthorized) {
    console.log("Authorizing NFT contract in TradingManager...");
    const tx = await tradingManagerContract.authorizeNFTContract(
      mooveNFT.address
    );
    await tx.wait();
    console.log("✅ NFT contract authorized in TradingManager");
  }

  // Set treasury address if different from deployer
  const currentTreasury = await tradingManagerContract.treasury();
  if (currentTreasury !== deployer) {
    console.log("Setting treasury address...");
    const tx = await tradingManagerContract.updateTreasury(deployer);
    await tx.wait();
    console.log("✅ Treasury address set");
  }

  console.log("🎉 Post-deploy setup completed successfully!");

  // Save addresses to file
  const addresses = {
    network: hre.network.name,
    deployer: deployer,
    contracts: {
      accessControl: accessControl.address,
      mooveNFT: mooveNFT.address,
      customization: customization.address,
      rentalPass: rentalPass.address,
      tradingManager: tradingManager.address,
      auction: auction.address,
    },
    deploymentTime: new Date().toISOString(),
  };

  const fs = require("fs");
  fs.writeFileSync(
    `deployments/${hre.network.name}-addresses.json`,
    JSON.stringify(addresses, null, 2)
  );

  console.log(
    `📄 Addresses saved to deployments/${hre.network.name}-addresses.json`
  );
};

func.tags = ["setup"];
func.id = "post_deploy_setup";
func.dependencies = [
  "deploy_access_control",
  "deploy_nft",
  "deploy_customization",
  "deploy_rental_pass",
  "deploy_trading_manager",
  "deploy_auction",
];

export default func;
