import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // @ts-ignore - hardhat-deploy extends hre with deployments and getNamedAccounts
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("🚀 Deploying MooveNFT...");
  console.log("Deployer:", deployer);

  // Get AccessControl address
  const accessControl = await get("MooveAccessControl");
  console.log("AccessControl address:", accessControl.address);

  const mooveNFT = await deploy("MooveNFT", {
    from: deployer,
    args: [
      "Moove Stickers", // name
      "MOOVE", // symbol
      accessControl.address, // access control
    ],
    log: true,
    waitConfirmations: 1,
  });

  console.log("✅ MooveNFT deployed to:", mooveNFT.address);

  // Verify on Etherscan
  if (mooveNFT.newlyDeployed) {
    console.log("🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: mooveNFT.address,
        constructorArguments: [
          "Moove Stickers",
          "MOOVE",
          accessControl.address,
        ],
      });
      console.log("✅ Contract verified on Etherscan");
    } catch (error) {
      console.log("⚠️ Verification failed:", error);
    }
  }
};

func.tags = ["nft"];
func.id = "deploy_nft";
func.dependencies = ["deploy_access_control"];

export default func;
