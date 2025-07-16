const { ethers } = require("hardhat");
const { uploadToIPFS } = require("./upload-metadata");

async function main() {
  console.log("🚲 Minting sample NFTs with IPFS metadata...");

  const [deployer] = await ethers.getSigners();
  console.log("Minting with account:", deployer.address);

  // Load deployment info
  const deploymentFile = `./deployments/${hre.network.name}.json`;
  const deployment = require(deploymentFile);

  // Get contract instance
  const mooveNFT = await ethers.getContractAt(
    "MooveNFT",
    deployment.contracts.MooveNFT.address
  );

  // Upload metadata to IPFS first
  console.log("📤 Uploading metadata to IPFS...");
  const ipfsMetadata = await uploadToIPFS();

  if (!ipfsMetadata || ipfsMetadata.length === 0) {
    console.error("❌ No IPFS metadata available");
    return;
  }

  // Mint NFTs with IPFS metadata
  const vehicleTypes = [0, 1, 2]; // 'BIKE', 'SCOOTER', 'MONOPATTINO'
  const dailyRates = [
    ethers.parseEther("0.05"),
    ethers.parseEther("0.08"),
    ethers.parseEther("0.06"),
  ];
  const locations = ["Milan Center", "Rome Center", "Naples Center"];

  for (let i = 0; i < ipfsMetadata.length; i++) {
    const metadata = ipfsMetadata[i];

    try {
      const tx = await mooveNFT.mintVehicleNFT(
        deployer.address,
        vehicleTypes[i],
        `Vehicle #${String(i + 1).padStart(3, "0")}`,
        `Premium electric vehicle for urban mobility`,
        metadata.metadataURI,
        dailyRates[i],
        locations[i]
      );

      await tx.wait();
      console.log(
        `✅ Minted NFT ${i} with IPFS metadata: ${metadata.metadataURI}`
      );
    } catch (error) {
      console.error(`❌ Failed to mint NFT ${i}:`, error);
    }
  }

  console.log("\n🎉 Sample minting completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Minting failed:", error);
    process.exit(1);
  });
