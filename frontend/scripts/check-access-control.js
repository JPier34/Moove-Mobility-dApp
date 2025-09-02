const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking MooveAccessControl contract address...");

  // Indirizzo del contratto MooveRentalPass deployato
  const rentalPassAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  // ABI minimale per chiamare accessControl()
  const rentalPassABI = ["function accessControl() view returns (address)"];

  try {
    // Connessione al contratto
    const rentalPass = await ethers.getContractAt(
      rentalPassABI,
      rentalPassAddress
    );

    // Recupera l'indirizzo del contratto AccessControl
    const accessControlAddress = await rentalPass.accessControl();

    console.log("✅ MooveRentalPass Address:", rentalPassAddress);
    console.log("✅ MooveAccessControl Address:", accessControlAddress);

    // Verifica se l'indirizzo è valido
    if (accessControlAddress === "0x0000000000000000000000000000000000000000") {
      console.log("❌ AccessControl contract not set!");
    } else {
      console.log("✅ AccessControl contract is deployed!");

      // Prova a verificare se il contratto esiste
      const code = await ethers.provider.getCode(accessControlAddress);
      if (code === "0x") {
        console.log("❌ No contract code found at this address!");
      } else {
        console.log("✅ Contract code found - AccessControl is deployed!");
        console.log("📝 Code length:", code.length, "characters");
      }
    }
  } catch (error) {
    console.error("❌ Error checking AccessControl:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
