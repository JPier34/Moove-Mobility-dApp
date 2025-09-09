import { NextResponse } from "next/server";

// Simulazione database in memoria (in produzione usare un database reale)
let nftDatabase: Array<{
  name: string;
  imageHash: string;
  creator: string;
  timestamp: number;
  tokenId?: number;
}> = [];

export async function GET() {
  try {
    // In produzione, questo dovrebbe leggere da un database reale
    // Per ora restituiamo il database in memoria
    return NextResponse.json(nftDatabase);
  } catch (error) {
    console.error("Error syncing NFT cache:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}






