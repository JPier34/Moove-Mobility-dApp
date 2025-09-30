import { NextRequest, NextResponse } from "next/server";

// Simulazione database in memoria (in produzione usare un database reale)
const nftDatabase: Array<{
  name: string;
  imageHash: string;
  creator: string;
  timestamp: number;
  tokenId?: number;
}> = [];

export async function POST(request: NextRequest) {
  try {
    const { name, imageHash } = await request.json();

    if (!name || !imageHash) {
      return NextResponse.json(
        { error: "Name and imageHash are required" },
        { status: 400 }
      );
    }

    // Cerca duplicati
    const nameDuplicate = nftDatabase.find(
      (nft) => nft.name.toLowerCase().trim() === name.toLowerCase().trim()
    );

    const imageDuplicate = nftDatabase.find(
      (nft) => nft.imageHash === imageHash
    );

    const existingNFTs = nftDatabase.filter(
      (nft) =>
        nft.name.toLowerCase().trim() === name.toLowerCase().trim() ||
        nft.imageHash === imageHash
    );

    return NextResponse.json({
      nameDuplicate: !!nameDuplicate,
      imageDuplicate: !!imageDuplicate,
      existingNFTs,
    });
  } catch (error) {
    console.error("Error checking duplicates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return NextResponse.json(nftDatabase);
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
