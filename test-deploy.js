const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy AccessControl
  const MooveAccessControl = await ethers.getContractFactory(
    "MooveAccessControl"
  );
  const accessControl = await MooveAccessControl.deploy(deployer.address);
  console.log("AccessControl deployed to:", await accessControl.getAddress());

  // Deploy MooveNFT
  const MooveNFT = await ethers.getContractFactory("MooveNFT");
  const mooveNFT = await MooveNFT.deploy(
    "MooveNFT",
    "MNFT",
    await accessControl.getAddress()
  );
  console.log("MooveNFT deployed to:", await mooveNFT.getAddress());

  // Deploy MooveCustomization
  const MooveCustomization = await ethers.getContractFactory(
    "MooveCustomization"
  );
  const mooveCustomization = await MooveCustomization.deploy(
    await mooveNFT.getAddress(),
    deployer.address
  );
  console.log(
    "MooveCustomization deployed to:",
    await mooveCustomization.getAddress()
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
