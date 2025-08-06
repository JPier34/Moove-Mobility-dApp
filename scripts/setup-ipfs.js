const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔧 Setting up IPFS configuration...");

  // Load deployed addresses
  const addressesPath = path.join(
    __dirname,
    "../deployments/sepolia-addresses.json"
  );
  if (!fs.existsSync(addressesPath)) {
    console.log(
      "❌ No deployment addresses found. Please deploy contracts first."
    );
    return;
  }

  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  console.log("📋 Loaded contract addresses:", addresses.contracts);

  // IPFS Configuration
  const ipfsConfig = {
    gateway: "https://gateway.pinata.cloud/ipfs/",
    apiKey: process.env.PINATA_API_KEY || "",
    secretKey: process.env.PINATA_SECRET_KEY || "",
    baseURI: "ipfs://",
    metadata: {
      name: "Moove Stickers",
      description: "Customizable vehicle stickers for the Moove ecosystem",
      image: "ipfs://Qm...", // Placeholder
      external_url: "https://moove-dapp.com",
      attributes: [],
    },
  };

  // Create IPFS configuration file
  const ipfsConfigPath = path.join(__dirname, "../config/ipfs-config.json");
  fs.writeFileSync(ipfsConfigPath, JSON.stringify(ipfsConfig, null, 2));
  console.log("✅ IPFS configuration saved to config/ipfs-config.json");

  // Create metadata templates
  const metadataTemplates = {
    sticker: {
      name: "Moove Sticker #{id}",
      description: "A customizable vehicle sticker",
      image: "ipfs://{imageHash}",
      attributes: [
        {
          trait_type: "Category",
          value: "{category}",
        },
        {
          trait_type: "Rarity",
          value: "{rarity}",
        },
        {
          trait_type: "Customizable",
          value: "{customizable}",
        },
      ],
    },
    rentalPass: {
      name: "Moove Rental Pass #{id}",
      description: "30-day vehicle access pass",
      image: "ipfs://{imageHash}",
      attributes: [
        {
          trait_type: "Vehicle Type",
          value: "{vehicleType}",
        },
        {
          trait_type: "Duration",
          value: "30 days",
        },
        {
          trait_type: "Location",
          value: "{location}",
        },
      ],
    },
  };

  const templatesPath = path.join(
    __dirname,
    "../config/metadata-templates.json"
  );
  fs.writeFileSync(templatesPath, JSON.stringify(metadataTemplates, null, 2));
  console.log("✅ Metadata templates saved to config/metadata-templates.json");

  // Create upload script
  const uploadScript = `
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function uploadToIPFS(filePath, metadata) {
  // Implementation for IPFS upload
  // This will be implemented based on the chosen IPFS service
  console.log("Uploading to IPFS:", filePath);
  
  // Placeholder implementation
  return "Qm..."; // Return IPFS hash
}

async function main() {
  console.log("🚀 Starting IPFS upload...");
  
  // Load configuration
  const config = JSON.parse(fs.readFileSync("./config/ipfs-config.json", "utf8"));
  const templates = JSON.parse(fs.readFileSync("./config/metadata-templates.json", "utf8"));
  
  // Upload metadata templates
  console.log("📤 Uploading metadata templates...");
  
  // Example: Upload sticker metadata
  const stickerMetadata = templates.sticker;
  const stickerHash = await uploadToIPFS("metadata/sticker.json", stickerMetadata);
  console.log("✅ Sticker metadata uploaded:", stickerHash);
  
  // Example: Upload rental pass metadata
  const rentalMetadata = templates.rentalPass;
  const rentalHash = await uploadToIPFS("metadata/rental-pass.json", rentalMetadata);
  console.log("✅ Rental pass metadata uploaded:", rentalHash);
  
  console.log("🎉 IPFS setup completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
`;

  const uploadScriptPath = path.join(__dirname, "upload-ipfs.js");
  fs.writeFileSync(uploadScriptPath, uploadScript);
  console.log("✅ IPFS upload script created: scripts/upload-ipfs.js");

  // Create directories
  const dirs = ["config", "metadata", "images"];
  dirs.forEach((dir) => {
    const dirPath = path.join(__dirname, "..", dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });

  console.log("\n🎯 IPFS Setup Summary:");
  console.log("1. Configuration files created");
  console.log("2. Metadata templates ready");
  console.log("3. Upload script prepared");
  console.log("4. Directories structure created");

  console.log("\n📋 Next Steps:");
  console.log("1. Configure PINATA_API_KEY and PINATA_SECRET_KEY in .env");
  console.log("2. Add images to images/ directory");
  console.log("3. Run: node scripts/upload-ipfs.js");
  console.log("4. Update contract URIs with IPFS hashes");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
