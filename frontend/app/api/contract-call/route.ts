import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { contracts } from "@/utils/contracts";

const client = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || "https://1rpc.io/sepolia"),
});

export async function POST(request: NextRequest) {
  let method: string = "unknown";
  let args: unknown[] = [];
  let contract: string = "unknown";

  try {
    const requestData = await request.json();
    method = requestData.method;
    args = requestData.args;
    contract = requestData.contract || "nft";

    console.log(
      `🔍 API Contract Call: ${contract}.${method}(${JSON.stringify(args)})`
    );

    if (!method || !Array.isArray(args)) {
      console.error("❌ Invalid request:", { method, args });
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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

    console.log(`📋 Using contract: ${contractAddress}`);

    // Call the contract method
    const result = await client.readContract({
      address: contractAddress as `0x${string}`,
      abi: contractABI as readonly unknown[],
      functionName: method,
      args,
    });

    console.log(`✅ Contract call successful:`, result);

    // ✅ FIX: Handle BigInt serialization
    const serializedResult = JSON.parse(
      JSON.stringify(result, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    return NextResponse.json(serializedResult);
  } catch (error) {
    console.error("❌ Contract call error:", error);
    console.error("❌ Error details:", {
      message: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name,
    });

    // Provide more specific error information
    const errorMessage = (error as Error).message;
    let statusCode = 500;
    let errorType = "Contract call failed";

    if (errorMessage.includes("execution reverted")) {
      errorType = "Contract execution reverted";
      statusCode = 400;
    } else if (errorMessage.includes("network")) {
      errorType = "Network error";
      statusCode = 503;
    } else if (errorMessage.includes("timeout")) {
      errorType = "Request timeout";
      statusCode = 504;
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
