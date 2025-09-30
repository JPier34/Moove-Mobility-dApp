import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { contracts } from "@/utils/contracts";

const client = createPublicClient({
  chain: sepolia,
  transport: http(
    process.env.NEXT_PUBLIC_RPC_URL || "https://ethereum-sepolia.publicnode.com"
  ),
});

export async function POST(request: NextRequest) {
  try {
    const { method, args, contract = "nft" } = await request.json();

    if (!method || !Array.isArray(args)) {
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

    // Call the contract method
    const result = await client.readContract({
      address: contractAddress as `0x${string}`,
      abi: contractABI as readonly unknown[],
      functionName: method,
      args,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Contract call error:", error);
    console.error("Error details:", {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    return NextResponse.json(
      {
        error: "Contract call failed",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
