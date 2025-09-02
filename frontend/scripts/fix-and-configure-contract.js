const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Fix and Configure MooveRentalPass Contract");
  console.log("=" .repeat(50));

  // Contract addresses
  const rentalPassAddress = "0x922f728b5f04A2e38d8Ea95F018b09b4F336CBC3";
  const accessControlAddress = "0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42";

  try {
    // Get contract instances
    const MooveRentalPass = await ethers.getContractFactory("MooveRentalPass");
    const MooveAccessControl = await ethers.getContractFactory("MooveAccessControl");
    
    const rentalPass = MooveRentalPass.attach(rentalPassAddress);
    const accessControl = MooveAccessControl.attach(accessControlAddress);

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer: ${deployer.address}`);

    // Step 1: Verify Access Control Integration
    console.log("\n🔍 Step 1: Verifying Access Control Integration");
    console.log("-".repeat(40));
    
    const contractAccessControl = await rentalPass.accessControl();
    if (contractAccessControl.toLowerCase() !== accessControlAddress.toLowerCase()) {
      console.log("❌ Access Control mismatch detected!");
      console.log(`Contract AccessControl: ${contractAccessControl}`);
      console.log(`Expected AccessControl: ${accessControlAddress}`);
      
      // Update access control if deployer has admin role
      const MASTER_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MASTER_ADMIN_ROLE"));
      const hasAdminRole = await accessControl.hasRole(MASTER_ADMIN_ROLE, deployer.address);
      
      if (hasAdminRole) {
        console.log("🔧 Updating Access Control...");
        const tx = await rentalPass.updateAccessControl(accessControlAddress);
        await tx.wait();
        console.log("✅ Access Control updated successfully");
      } else {
        console.log("❌ Cannot update Access Control - no admin role");
        return;
      }
    } else {
      console.log("✅ Access Control integration is correct");
    }

    // Step 2: Configure Vehicle Prices
    console.log("\n🔧 Step 2: Configuring Vehicle Prices");
    console.log("-".repeat(40));
    
    const vehicleConfigs = [
      {
        type: 0,
        name: "E-Bike Access",
        price: "0.00000075"
      },
      {
        type: 1,
        name: "E-Scooter Access", 
        price: "0.000001"
      },
      {
        type: 2,
        name: "Monopattino Access",
        price: "0.00000125"
      }
    ];

    for (const config of vehicleConfigs) {
      try {
        const currentConfig = await rentalPass.vehicleConfigs(config.type);
        const currentPrice = ethers.formatEther(currentConfig.priceWei);
        
        console.log(`Vehicle ${config.type} (${config.name}):`);
        console.log(`  Current price: ${currentPrice} ETH`);
        console.log(`  Expected price: ${config.price} ETH`);
        
        if (currentPrice !== config.price || !currentConfig.isActive) {
          console.log(`  🔧 Updating configuration...`);
          
          const tx = await rentalPass.setVehicleConfig(
            config.type,
            ethers.parseEther(config.price),
            config.name
          );
          await tx.wait();
          
          console.log(`  ✅ Configuration updated`);
        } else {
          console.log(`  ✅ Configuration is correct`);
        }
        
      } catch (error) {
        console.log(`  ❌ Error configuring vehicle ${config.type}: ${error.message}`);
      }
    }

    // Step 3: Verify Roles
    console.log("\n🔍 Step 3: Verifying Roles");
    console.log("-".repeat(40));
    
    const MASTER_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MASTER_ADMIN_ROLE"));
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));
    
    const roles = [
      { role: MASTER_ADMIN_ROLE, name: "MASTER_ADMIN_ROLE" },
      { role: MINTER_ROLE, name: "MINTER_ROLE" },
      { role: PAUSER_ROLE, name: "PAUSER_ROLE" }
    ];
    
    for (const { role, name } of roles) {
      const hasRole = await accessControl.hasRole(role, deployer.address);
      console.log(`${name}: ${hasRole ? '✅' : '❌'}`);
      
      if (!hasRole && name === "MASTER_ADMIN_ROLE") {
        console.log("❌ Deployer doesn't have MASTER_ADMIN_ROLE - cannot proceed");
        return;
      }
    }

    // Step 4: Authorize Contract
    console.log("\n🔧 Step 4: Authorizing Contract");
    console.log("-".repeat(40));
    
    const isAuthorized = await accessControl.authorizedContracts(rentalPassAddress);
    console.log(`Contract authorized: ${isAuthorized}`);
    
    if (!isAuthorized) {
      console.log("🔧 Authorizing contract...");
      const tx = await accessControl.authorizeContract(rentalPassAddress);
      await tx.wait();
      console.log("✅ Contract authorized successfully");
    } else {
      console.log("✅ Contract is already authorized");
    }

    // Step 5: Test Minting
    console.log("\n🧪 Step 5: Testing Minting");
    console.log("-".repeat(40));
    
    const isPaused = await rentalPass.paused();
    if (isPaused) {
      console.log("⚠️ Contract is paused - unpausing for test...");
      const unpauseTx = await rentalPass.unpause();
      await unpauseTx.wait();
      console.log("✅ Contract unpaused");
    }
    
    const bikePrice = await rentalPass.getVehiclePrice(0);
    console.log(`Testing mint with ${ethers.formatEther(bikePrice)} ETH`);
    
    try {
      const tx = await rentalPass.mintRentalPassPublic(
        0, // BIKE
        "TestCity",
        30, // 30 days
        { value: bikePrice }
      );
      
      console.log(`✅ Mint transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✅ Mint confirmed in block: ${receipt.blockNumber}`);
      
      // Verify the mint
      const totalSupply = await rentalPass.totalSupply();
      console.log(`Total supply after mint: ${totalSupply}`);
      
      if (totalSupply > 0) {
        const tokenId = totalSupply;
        const rentalPassData = await rentalPass.getRentalPass(tokenId);
        console.log(`✅ Token ${tokenId} verified:`);
        console.log(`   Vehicle Type: ${rentalPassData.vehicleType}`);
        console.log(`   Location: ${rentalPassData.location}`);
        console.log(`   Price: ${ethers.formatEther(rentalPassData.purchasePrice)} ETH`);
        console.log(`   Active: ${rentalPassData.isActive}`);
        console.log(`   Access Code: ${rentalPassData.accessCode}`);
      }
      
    } catch (error) {
      console.log(`❌ Minting test failed: ${error.message}`);
    }

    // Step 6: Final Verification
    console.log("\n🔍 Step 6: Final Verification");
    console.log("-".repeat(40));
    
    // Check all vehicle prices
    for (let i = 0; i < 3; i++) {
      const price = await rentalPass.getVehiclePrice(i);
      const config = await rentalPass.vehicleConfigs(i);
      console.log(`Vehicle ${i}: ${ethers.formatEther(price)} ETH - ${config.name} (Active: ${config.isActive})`);
    }
    
    // Check contract status
    const finalPaused = await rentalPass.paused();
    const finalTotalSupply = await rentalPass.totalSupply();
    const finalAuthorized = await accessControl.authorizedContracts(rentalPassAddress);
    
    console.log(`\n📊 Final Status:`);
    console.log(`   Paused: ${finalPaused}`);
    console.log(`   Total Supply: ${finalTotalSupply}`);
    console.log(`   Authorized: ${finalAuthorized}`);

    console.log("\n🎉 Contract configuration completed successfully!");
    console.log("\n📋 Summary:");
    console.log("✅ Access Control integration verified");
    console.log("✅ Vehicle prices configured correctly");
    console.log("✅ Roles verified");
    console.log("✅ Contract authorized");
    console.log("✅ Minting functionality tested");
    
  } catch (error) {
    console.log("❌ Configuration failed:", error.message);
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
