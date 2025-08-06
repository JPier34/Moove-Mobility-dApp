import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("🚀 Deploying MooveTradingManager...");
  console.log("Deployer:", deployer);

  // Get AccessControl address
  const accessControl = await get("MooveAccessControl");
  console.log("AccessControl address:", accessControl.address);

  const tradingManager = await deploy("MooveTradingManager", {
    from: deployer,
    args: [
      accessControl.address, // access control
      deployer, // treasury address (same as deployer for now)
    ],
    log: true,
    waitConfirmations: 1,
  });

  console.log("✅ MooveTradingManager deployed to:", tradingManager.address);

  // Verify on Etherscan
  if (tradingManager.newlyDeployed) {
    console.log("🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: tradingManager.address,
        constructorArguments: [accessControl.address, deployer],
      });
      console.log("✅ Contract verified on Etherscan");
    } catch (error) {
      console.log("⚠️ Verification failed:", error);
    }
  }
};

func.tags = ["trading-manager"];
func.id = "deploy_trading_manager";
func.dependencies = ["deploy_access_control"];

export default func;
