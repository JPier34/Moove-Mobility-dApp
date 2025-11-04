import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { contracts } from "@/utils/contracts";

// Create client with retry logic and better fallback
// Prefer configured RPC, fallback to reliable public RPCs
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://1rpc.io/sepolia";
const client = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl, {
    retryCount: 2, // Reduced retries to fail faster on rate limits
    retryDelay: 2000,
    timeout: 8000,
    // Add rate limit handling
    fetchOptions: {
      signal: AbortSignal.timeout(8000),
    },
  }),
});

export async function POST(request: NextRequest) {
  let method: string = "unknown";
  let args: unknown[] = [];
  let contract: string = "unknown";

  try {
    // Parse request body
    const requestData = await request.json();
    method = requestData.method;
    args = requestData.args;
    contract = requestData.contract || "nft";

    console.log(`🔍 [API] ${contract}.${method}(${JSON.stringify(args)})`);

    // Validate request
    if (!method || !Array.isArray(args)) {
      console.error("❌ [API] Invalid request:", { method, args });
      return NextResponse.json(
        { error: "Invalid request", details: "Method and args are required" },
        { status: 400 }
      );
    }

    // Validate args (no undefined/null)
    if (args.some((arg) => arg === undefined || arg === null)) {
      console.error("❌ [API] Invalid arguments:", args);
      return NextResponse.json(
        {
          error: "Invalid arguments",
          details: "Arguments cannot be null or undefined",
        },
        { status: 400 }
      );
    }

    // Check contracts config is loaded
    const nftAddress = contracts?.MooveNFT?.address;
    const auctionAddress = contracts?.MooveAuction?.address;

    if (!nftAddress || !auctionAddress) {
      const missingVars = [];
      if (!nftAddress) missingVars.push("NEXT_PUBLIC_MOOVE_NFT_ADDRESS");
      if (!auctionAddress)
        missingVars.push("NEXT_PUBLIC_MOOVE_AUCTION_ADDRESS");

      console.error("❌ [API] Contract config not loaded", {
        nftAddress: nftAddress || "MISSING",
        auctionAddress: auctionAddress || "MISSING",
        missingVars,
        nodeEnv: process.env.NODE_ENV,
      });

      return NextResponse.json(
        {
          error: "Configuration error",
          details: `Contract addresses not available. Missing env vars: ${missingVars.join(
            ", "
          )}`,
          missingVars,
        },
        { status: 503 }
      );
    }

    // Determine which contract to use
    let contractAddress: string;
    let contractABI: unknown;

    if (contract === "auction") {
      contractAddress = contracts.MooveAuction.address;
      contractABI = contracts.MooveAuction.abi;
    } else {
      contractAddress = contracts.MooveNFT.address;
      contractABI = contracts.MooveNFT.abi;
    }

    console.log(`📋 [API] Using contract: ${contractAddress}`);

    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout after 10s")), 10000)
    );

    const contractCallPromise = client.readContract({
      address: contractAddress as `0x${string}`,
      abi: contractABI as readonly unknown[],
      functionName: method,
      args,
    });

    // Race between contract call and timeout
    const result = await Promise.race([contractCallPromise, timeoutPromise]);

    console.log(
      `✅ [API] Success:`,
      typeof result,
      Array.isArray(result) ? `[${result.length} items]` : result
    );

    // Correct BigInt serialization
    const serializedResult = JSON.stringify(result, (key, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    });

    return NextResponse.json(JSON.parse(serializedResult));
  } catch (error) {
    const errorMessage = (error as Error).message || String(error);
    const errorStack = (error as Error).stack;

    console.error("❌ [API] Error:", {
      method,
      args,
      contract,
      message: errorMessage,
      stack: errorStack?.split("\n")[0], // First line only
    });

    let statusCode = 500;
    let errorType = "Contract call failed";
    let shouldLog = true;

    // Better error classification
    if (errorMessage.includes("execution reverted")) {
      errorType = "Contract execution reverted";
      statusCode = 400;

      // Special handling for ownerOf on non-existent tokens
      if (method === "ownerOf") {
        console.log(`ℹ️  [API] Token ${args[0]} does not exist (expected)`);
        shouldLog = false; // Don't log this as error
        return NextResponse.json(
          {
            error: "Token not found",
            tokenId: args[0],
            method: "ownerOf",
          },
          { status: 404 }
        );
      }

      // Special handling for tokenURI on non-existent tokens
      if (method === "tokenURI") {
        console.log(`ℹ️  [API] TokenURI for ${args[0]} unavailable`);
        shouldLog = false;
        return NextResponse.json(
          {
            error: "Token URI not found",
            tokenId: args[0],
            method: "tokenURI",
          },
          { status: 404 }
        );
      }
    } else if (
      errorMessage.includes("network") ||
      errorMessage.includes("fetch failed")
    ) {
      errorType = "Network error";
      statusCode = 503;
    } else if (
      errorMessage.includes("timeout") ||
      errorMessage.includes("timed out")
    ) {
      errorType = "Request timeout";
      statusCode = 504;
    } else if (
      errorMessage.includes("rate limit") ||
      errorMessage.includes("429") ||
      errorMessage.includes("Too Many Requests") ||
      errorMessage.includes("rate limit (600rqs/60s)")
    ) {
      errorType = "Rate limit exceeded";
      statusCode = 429;
      shouldLog = false; // Rate limits are expected, don't spam logs
    } else if (errorMessage.includes("Invalid JSON RPC")) {
      errorType = "RPC error";
      statusCode = 502;
    } else if (errorMessage.includes("insufficient funds")) {
      errorType = "Insufficient funds";
      statusCode = 400;
    }

    // Only log if it's actually an error (not expected 404s)
    if (shouldLog) {
      console.error(`❌ [API] ${errorType}:`, errorMessage);
    }

    return NextResponse.json(
      {
        error: errorType,
        details: errorMessage,
        method,
        args,
        contract,
      },
      { status: statusCode }
    );
  }
}

// Optional: GET endpoint for health check
export async function GET() {
  try {
    // Basic health check
    const isConfigured = Boolean(
      contracts?.MooveNFT?.address && contracts?.MooveAuction?.address
    );

    return NextResponse.json({
      status: "ok",
      configured: isConfigured,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
