import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    // Check if Pinata is configured
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      // For testing purposes, return a mock response
      console.log(
        "⚠️ Pinata API keys not configured, returning mock response for testing"
      );
      return NextResponse.json({
        success: true,
        hash: "QmMockHashForTesting123456789",
        url: "ipfs://QmMockHashForTesting123456789",
        type: "image",
        mock: true,
      });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = (formData.get("type") as string) || "image";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size too large. Maximum 10MB allowed." },
        { status: 400 }
      );
    }

    // Validate file type for images
    if (file.type.startsWith("image/")) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            error:
              "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
          },
          { status: 400 }
        );
      }
    }

    // Upload to Pinata
    const pinataFormData = new FormData();
    pinataFormData.append("file", file);

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      pinataFormData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
      }
    );

    const hash = response.data.IpfsHash;

    return NextResponse.json({
      success: true,
      hash,
      url: `ipfs://${hash}`,
      type,
    });
  } catch (error) {
    console.error("IPFS upload error:", error);

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          error: `Pinata upload failed: ${
            error.response?.data?.error || error.message
          }`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if Pinata is configured
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      // For testing purposes, return a mock response
      console.log(
        "⚠️ Pinata API keys not configured, returning mock metadata response for testing"
      );
      return NextResponse.json({
        success: true,
        hash: "QmMockMetadataHashForTesting123456789",
        url: "ipfs://QmMockMetadataHashForTesting123456789",
        mock: true,
      });
    }

    const { metadata } = await request.json();

    if (!metadata) {
      return NextResponse.json(
        { error: "No metadata provided" },
        { status: 400 }
      );
    }

    // Validate metadata
    if (!metadata.name || !metadata.description || !metadata.image) {
      return NextResponse.json(
        { error: "Missing required metadata fields" },
        { status: 400 }
      );
    }

    // Upload metadata to Pinata
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      metadata,
      {
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
      }
    );

    const hash = response.data.IpfsHash;

    return NextResponse.json({
      success: true,
      hash,
      url: `ipfs://${hash}`,
    });
  } catch (error) {
    console.error("IPFS metadata upload error:", error);

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          error: `Pinata upload failed: ${
            error.response?.data?.error || error.message
          }`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
