import { NextResponse } from "next/server";

export async function GET() {
  // Check which env vars are loaded
  const envCheck = {
    NEXT_PUBLIC_MOOVE_ACCESS_CONTROL_ADDRESS: process.env.NEXT_PUBLIC_MOOVE_ACCESS_CONTROL_ADDRESS
      ? `${process.env.NEXT_PUBLIC_MOOVE_ACCESS_CONTROL_ADDRESS.substring(0, 10)}...`
      : "❌ NOT FOUND",
    NEXT_PUBLIC_MOOVE_NFT_ADDRESS: process.env.NEXT_PUBLIC_MOOVE_NFT_ADDRESS
      ? `${process.env.NEXT_PUBLIC_MOOVE_NFT_ADDRESS.substring(0, 10)}...`
      : "❌ NOT FOUND",
    NEXT_PUBLIC_MOOVE_AUCTION_ADDRESS: process.env.NEXT_PUBLIC_MOOVE_AUCTION_ADDRESS
      ? `${process.env.NEXT_PUBLIC_MOOVE_AUCTION_ADDRESS.substring(0, 10)}...`
      : "❌ NOT FOUND",
    NEXT_PUBLIC_MOOVE_RENTAL_PASS_ADDRESS: process.env.NEXT_PUBLIC_MOOVE_RENTAL_PASS_ADDRESS
      ? `${process.env.NEXT_PUBLIC_MOOVE_RENTAL_PASS_ADDRESS.substring(0, 10)}...`
      : "❌ NOT FOUND",
    NEXT_PUBLIC_MASTER_WALLET_ADDRESS: process.env.NEXT_PUBLIC_MASTER_WALLET_ADDRESS
      ? `${process.env.NEXT_PUBLIC_MASTER_WALLET_ADDRESS.substring(0, 10)}...`
      : "❌ NOT FOUND",
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || "❌ NOT FOUND",
    NODE_ENV: process.env.NODE_ENV,
  };

  return NextResponse.json({
    message: "Environment Variables Debug (Server-side)",
    env: envCheck,
    allPresent: 
      !!process.env.NEXT_PUBLIC_MOOVE_ACCESS_CONTROL_ADDRESS &&
      !!process.env.NEXT_PUBLIC_MOOVE_NFT_ADDRESS &&
      !!process.env.NEXT_PUBLIC_MOOVE_AUCTION_ADDRESS &&
      !!process.env.NEXT_PUBLIC_MOOVE_RENTAL_PASS_ADDRESS,
  });
}

