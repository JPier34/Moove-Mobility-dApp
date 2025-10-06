import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Debug: Log all environment variables
    console.log("🔍 Environment Variables Debug (Server-side):");
    console.log(
      "PINATA_API_KEY:",
      process.env.PINATA_API_KEY
        ? `${process.env.PINATA_API_KEY.substring(0, 10)}...`
        : "undefined"
    );
    console.log(
      "PINATA_SECRET_KEY:",
      process.env.PINATA_SECRET_KEY
        ? `${process.env.PINATA_SECRET_KEY.substring(0, 10)}...`
        : "undefined"
    );
    console.log("NODE_ENV:", process.env.NODE_ENV);

    // Check if variables exist
    const hasApiKey = !!process.env.PINATA_API_KEY;
    const hasSecretKey = !!process.env.PINATA_SECRET_KEY;

    return NextResponse.json({
      success: true,
      environment: {
        PINATA_API_KEY: hasApiKey ? "✅ Found" : "❌ Not found",
        PINATA_SECRET_KEY: hasSecretKey ? "✅ Found" : "❌ Not found",
        NODE_ENV: process.env.NODE_ENV || "undefined",
        hasApiKey,
        hasSecretKey,
        allConfigured: hasApiKey && hasSecretKey,
      },
      debug: {
        apiKeyLength: process.env.PINATA_API_KEY?.length || 0,
        secretKeyLength: process.env.PINATA_SECRET_KEY?.length || 0,
      },
    });
  } catch (error) {
    console.error("❌ Environment test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


