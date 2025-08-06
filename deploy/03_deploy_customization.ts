import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("🚀 Deploying MooveCustomization...");
  console.log("Deployer:", deployer);

  // Get contract addresses
  const accessControl = await get("MooveAccessControl");
  const mooveNFT = await get("MooveNFT");
  console.log("AccessControl address:", accessControl.address);
  console.log("MooveNFT address:", mooveNFT.address);

  const customization = await deploy("MooveCustomization", {
    from: deployer,
    args: [
      mooveNFT.address, // mooveNFT address
      accessControl.address, // access control
    ],
    log: true,
    waitConfirmations: 1,
  });

  console.log("✅ MooveCustomization deployed to:", customization.address);

  // Verify on Etherscan
  if (customization.newlyDeployed) {
    console.log("🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: customization.address,
        constructorArguments: [mooveNFT.address, accessControl.address],
      });
      console.log("✅ Contract verified on Etherscan");
    } catch (error) {
      console.log("⚠️ Verification failed:", error);
    }
  }
};

func.tags = ["customization"];
func.id = "deploy_customization";
func.dependencies = ["deploy_access_control", "deploy_nft"];

export default func;
