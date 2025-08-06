import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("🚀 Deploying MooveAuction...");
  console.log("Deployer:", deployer);

  // Get AccessControl address
  const accessControl = await get("MooveAccessControl");
  console.log("AccessControl address:", accessControl.address);

  const auction = await deploy("MooveAuction", {
    from: deployer,
    args: [
      accessControl.address, // access control
    ],
    log: true,
    waitConfirmations: 1,
  });

  console.log("✅ MooveAuction deployed to:", auction.address);

  // Verify on Etherscan
  if (auction.newlyDeployed) {
    console.log("🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: auction.address,
        constructorArguments: [accessControl.address],
      });
      console.log("✅ Contract verified on Etherscan");
    } catch (error) {
      console.log("⚠️ Verification failed:", error);
    }
  }
};

func.tags = ["auction"];
func.id = "deploy_auction";
func.dependencies = ["deploy_access_control"];

export default func;
