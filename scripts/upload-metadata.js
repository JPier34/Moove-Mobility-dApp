const pinataSDK = require("@pinata/sdk");
const fs = require("fs");
const path = require("path");

async function uploadToIPFS() {
  if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_KEY) {
    console.error("❌ Pinata API keys not found in environment variables");
    return;
  }

  const pinata = new pinataSDK(
    process.env.PINATA_API_KEY,
    process.env.PINATA_SECRET_KEY
  );

  console.log("📤 Uploading metadata to IPFS via Pinata...");

  // Test Pinata connection
  try {
    await pinata.testAuthentication();
    console.log("✅ Pinata authentication successful");
  } catch (error) {
    console.error("❌ Pinata authentication failed:", error);
    return;
  }

  const vehicles = [
    {
      type: "bike",
      name: "Electric Bike #001",
      description: "High-performance electric bike for urban mobility",
      image: "./metadata/vehicles/bike-001.jpg",
      attributes: [
        { trait_type: "Vehicle Type", value: "Electric Bike" },
        { trait_type: "Battery Level", value: "100%" },
        { trait_type: "Max Speed", value: "25 km/h" },
        { trait_type: "Range", value: "50 km" },
        { trait_type: "Weight", value: "22 kg" },
        { trait_type: "Color", value: "Blue" },
        { trait_type: "Location", value: "Milan" },
      ],
      vehicle_specs: {
        max_speed: "25 km/h",
        range: "50 km",
        weight: "22 kg",
        battery_capacity: "500Wh",
      },
    },
    {
      type: "scooter",
      name: "Electric Scooter #001",
      description: "Eco-friendly electric scooter with premium features",
      image: "./metadata/vehicles/scooter-001.jpg",
      attributes: [
        { trait_type: "Vehicle Type", value: "Electric Scooter" },
        { trait_type: "Battery Level", value: "100%" },
        { trait_type: "Max Speed", value: "20 km/h" },
        { trait_type: "Range", value: "30 km" },
        { trait_type: "Weight", value: "15 kg" },
        { trait_type: "Color", value: "Red" },
        { trait_type: "Location", value: "Rome" },
      ],
      vehicle_specs: {
        max_speed: "20 km/h",
        range: "30 km",
        weight: "15 kg",
        battery_capacity: "350Wh",
      },
    },
    {
      type: "monopattino",
      name: "Electric Monopattino #001",
      description: "Compact electric monopattino perfect for city rides",
      image: "./metadata/vehicles/monopattino-001.jpg",
      attributes: [
        { trait_type: "Vehicle Type", value: "Electric Monopattino" },
        { trait_type: "Battery Level", value: "100%" },
        { trait_type: "Max Speed", value: "15 km/h" },
        { trait_type: "Range", value: "25 km" },
        { trait_type: "Weight", value: "12 kg" },
        { trait_type: "Color", value: "Green" },
        { trait_type: "Location", value: "Naples" },
      ],
      vehicle_specs: {
        max_speed: "15 km/h",
        range: "25 km",
        weight: "12 kg",
        battery_capacity: "250Wh",
      },
    },
  ];

  const uploadedMetadata = [];

  for (let i = 0; i < vehicles.length; i++) {
    const vehicle = vehicles[i];

    try {
      // Upload image first (if file exists)
      let imageHash = "";
      const imagePath = path.join(__dirname, "..", vehicle.image);

      if (fs.existsSync(imagePath)) {
        console.log(`📷 Uploading image for ${vehicle.name}...`);
        const imageStream = fs.createReadStream(imagePath);
        const imageResult = await pinata.pinFileToIPFS(imageStream, {
          pinataMetadata: {
            name: `${vehicle.type}-image-${i + 1}`,
          },
        });
        imageHash = imageResult.IpfsHash;
        console.log(`✅ Image uploaded: ipfs://${imageHash}`);
      } else {
        console.log(`⚠️ Image file not found: ${imagePath}, using placeholder`);
        imageHash = "QmPlaceholderHash"; // Placeholder
      }

      // Create metadata JSON
      const metadata = {
        name: vehicle.name,
        description: vehicle.description,
        image: `ipfs://${imageHash}`,
        attributes: vehicle.attributes,
        vehicle_specs: vehicle.vehicle_specs,
        external_url: "https://moove.io",
        animation_url: "", // Could be used for 3D models
        background_color: "FFFFFF",
      };

      // Upload metadata JSON
      console.log(`📄 Uploading metadata for ${vehicle.name}...`);
      const metadataResult = await pinata.pinJSONToIPFS(metadata, {
        pinataMetadata: {
          name: `${vehicle.type}-metadata-${i + 1}`,
        },
      });

      uploadedMetadata.push({
        tokenId: i,
        metadataHash: metadataResult.IpfsHash,
        metadataURI: `ipfs://${metadataResult.IpfsHash}`,
        imageHash: imageHash,
        vehicleType: vehicle.type,
      });

      console.log(`✅ Metadata uploaded: ipfs://${metadataResult.IpfsHash}`);
    } catch (error) {
      console.error(`❌ Failed to upload ${vehicle.name}:`, error);
    }
  }

  // Save uploaded metadata info
  const metadataFile = path.join(
    __dirname,
    "..",
    "deployments",
    "ipfs-metadata.json"
  );
  fs.writeFileSync(metadataFile, JSON.stringify(uploadedMetadata, null, 2));

  console.log("\n🎉 IPFS upload completed!");
  console.log(`📁 Metadata saved to: ${metadataFile}`);
  console.log("\n📋 Uploaded URIs:");
  uploadedMetadata.forEach((item, index) => {
    console.log(`${index}: ${item.metadataURI}`);
  });

  return uploadedMetadata;
}

if (require.main === module) {
  uploadToIPFS()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Upload failed:", error);
      process.exit(1);
    });
}

module.exports = { uploadToIPFS };
