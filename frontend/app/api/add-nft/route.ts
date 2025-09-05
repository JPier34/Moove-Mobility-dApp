import { NextRequest, NextResponse } from "next/server";

// Simulazione database in memoria (in produzione usare un database reale)
let nftDatabase: Array<{
  name: string;
  imageHash: string;
  creator: string;
  timestamp: number;
  tokenId?: number;
}> = [];

export async function POST(request: NextRequest) {
  try {
    const nftData = await request.json();

    if (!nftData.name || !nftData.imageHash || !nftData.creator) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verifica se esiste già
    const exists = nftDatabase.find(
      (nft) => nft.name === nftData.name && nft.imageHash === nftData.imageHash
    );

    if (exists) {
      return NextResponse.json(
        { error: "NFT already exists" },
        { status: 409 }
      );
    }

    // Aggiungi al database
    nftDatabase.push({
      name: nftData.name,
      imageHash: nftData.imageHash,
      creator: nftData.creator,
      timestamp: nftData.timestamp || Date.now(),
      tokenId: nftData.tokenId,
    });

    return NextResponse.json({
      success: true,
      message: "NFT added successfully",
      totalNFTs: nftDatabase.length,
    });
  } catch (error) {
    console.error("Error adding NFT:", error);
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


