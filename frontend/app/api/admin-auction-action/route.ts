import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

// Admin private key for server-side transactions
const ADMIN_PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ||
  "https://ethereum-sepolia-rpc.publicnode.com";

export async function POST(request: NextRequest) {
  try {
    if (!ADMIN_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Admin private key not configured" },
        { status: 500 }
      );
    }

    const { auctionId, action } = await request.json();

    if (!auctionId || !action) {
      return NextResponse.json(
        { error: "Missing auctionId or action" },
        { status: 400 }
      );
    }

    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);

    // Create contract instance
    const auctionContract = new ethers.Contract(
      contracts.MooveAuction.address,
      contracts.MooveAuction.abi,
      wallet
    );

    let tx;
    let result;

    switch (action) {
      case "endAuction":
        // Check auction status first
        const auctionData = await auctionContract.getAuction(auctionId);
        const status = Number(auctionData.status);
        const endTime = Number(auctionData.endTime);
        const currentTime = Math.floor(Date.now() / 1000);

        console.log(`🔍 Auction ${auctionId} status check:`, {
          status,
          endTime,
          currentTime,
          isExpired: currentTime >= endTime,
        });

        if (status !== 1) {
          return NextResponse.json(
            { error: `Auction ${auctionId} is not ACTIVE (status: ${status})` },
            { status: 400 }
          );
        }

        if (currentTime < endTime) {
          return NextResponse.json(
            { error: `Auction ${auctionId} has not expired yet` },
            { status: 400 }
          );
        }

        tx = await auctionContract.endAuction(auctionId);
        result = await tx.wait();
        break;

      case "settleAuction":
        tx = await auctionContract.settleAuction(auctionId);
        result = await tx.wait();
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      transactionHash: tx.hash,
      blockNumber: result.blockNumber,
      gasUsed: result.gasUsed.toString(),
      auctionId,
      action,
    });
  } catch (error) {
    console.error("Server-side auction action failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check auction status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const auctionId = searchParams.get("auctionId");

    if (!auctionId) {
      return NextResponse.json(
        { error: "Missing auctionId parameter" },
        { status: 400 }
      );
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const auctionContract = new ethers.Contract(
      contracts.MooveAuction.address,
      contracts.MooveAuction.abi,
      provider
    );

    const auctionData = await auctionContract.getAuction(auctionId);
    const currentTime = Math.floor(Date.now() / 1000);

    return NextResponse.json({
      auctionId,
      status: Number(auctionData.status),
      auctionType: Number(auctionData.auctionType),
      endTime: Number(auctionData.endTime),
      currentTime,
      isExpired: currentTime >= Number(auctionData.endTime),
      isSettled: auctionData.isSettled,
      highestBidder: auctionData.highestBidder,
      highestBid: auctionData.highestBid.toString(),
    });
  } catch (error) {
    console.error("Failed to get auction status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
