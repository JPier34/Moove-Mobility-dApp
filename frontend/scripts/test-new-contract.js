const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing new MooveRentalPass contract...");

  const rentalPassAddress = "0x922f728b5f04A2e38d8Ea95F018b09b4F336CBC3";

  try {
    const MooveRentalPass = await ethers.getContractFactory("MooveRentalPass");
    const contract = MooveRentalPass.attach(rentalPassAddress);

    console.log("✅ Contract instance created");

    // Test basic functions
    const accessControl = await contract.accessControl();
    console.log("AccessControl address:", accessControl);

    // Test vehicle prices
    console.log("\n🚗 Testing vehicle prices...");
    for (let i = 0; i < 3; i++) {
      try {
        const price = await contract.getVehiclePrice(i);
        const name = await contract.getVehicleName(i);
        console.log(`Vehicle ${i}: ${name} - ${ethers.formatEther(price)} ETH`);
      } catch (error) {
        console.log(`Vehicle ${i}: ❌ Error - ${error.message}`);
      }
    }

    // Test pause status
    try {
      const isPaused = await contract.paused();
      console.log(`\n⏸️ Contract paused: ${isPaused}`);
    } catch (error) {
      console.log(`\n⏸️ Pause status error: ${error.message}`);
    }

    console.log("\n🎉 Contract test completed!");
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error);
