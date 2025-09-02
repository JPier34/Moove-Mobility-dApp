const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Quick test of MooveRentalPass...");

  const rentalPassAddress = "0x9B8a455064038a03413D9563D42a493417d73454";

  try {
    const MooveRentalPass = await ethers.getContractFactory("MooveRentalPass");
    const contract = MooveRentalPass.attach(rentalPassAddress);

    console.log("✅ Contract instance created");

    // Test basic functions
    const accessControl = await contract.accessControl();
    console.log("AccessControl address:", accessControl);

    // Test vehicle price
    try {
      const price = await contract.getVehiclePrice(0);
      console.log("Bike price:", ethers.formatEther(price), "ETH");
    } catch (error) {
      console.log("Bike price error:", error.message);
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error);
