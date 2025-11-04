import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // @ts-ignore - hardhat-deploy extends hre with deployments and getNamedAccounts
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("🚀 Deploying MooveAccessControl...");
  console.log("Deployer:", deployer);

  const maxAdmins = 10; // Default: 10 admins max, can be modified
  const accessControl = await deploy("MooveAccessControl", {
    from: deployer,
    args: [deployer, maxAdmins], // [initialAdmin, maxAdmins]
    log: true,
    waitConfirmations: 1,
  });

  console.log("✅ MooveAccessControl deployed to:", accessControl.address);
  console.log(`✅ Max admins configured: ${maxAdmins}`);

  // Verify on Etherscan
  if (accessControl.newlyDeployed) {
    console.log("🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: accessControl.address,
        constructorArguments: [deployer, maxAdmins],
      });
      console.log("✅ Contract verified on Etherscan");
    } catch (error) {
      console.log("⚠️ Verification failed:", error);
    }
  }
};

func.tags = ["core", "access-control"];
func.id = "deploy_access_control";

export default func;
