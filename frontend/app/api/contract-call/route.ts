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
    let contractABI: any;

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
      abi: contractABI as any,
      functionName: method,
      args,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Contract call error:", error);
    return NextResponse.json(
      { error: "Contract call failed" },
      { status: 500 }
    );
  }
}
