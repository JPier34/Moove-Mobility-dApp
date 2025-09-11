import { NextRequest, NextResponse } from "next/server";

// Cache per evitare chiamate duplicate
const ipfsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minuti

const IPFS_GATEWAYS = [
  // Primary: Pinata (most reliable)
  "https://gateway.pinata.cloud/ipfs/",
  "https://app.pinata.cloud/ipfs/",

  // Secondary: Public gateways
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.ipfs.io/ipfs/",

  // Tertiary: Alternative gateways
  "https://dweb.link/ipfs/",
  "https://ipfs.infura.io/ipfs/",
  "https://ipfs.fleek.co/ipfs/",
  "https://nftstorage.link/ipfs/",
  "https://ipfs.filebase.io/ipfs/",

  // Fallback: Direct IPFS gateways
  "https://ipfs-gateway.cloud/ipfs/",
  "https://gateway.optimism.io/ipfs/",
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash");

  if (!hash) {
    return NextResponse.json(
      { error: "Hash parameter is required" },
      { status: 400 }
    );
  }

  // Extract IPFS hash from URL if it's a full URL
  let ipfsHash = hash;
  if (hash.includes("/ipfs/")) {
    ipfsHash = hash.split("/ipfs/")[1];
    console.log(`🔍 Extracted IPFS hash: ${ipfsHash} from URL: ${hash}`);
  }

  // Check cache first
  const cached = ipfsCache.get(ipfsHash);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`📦 Returning cached data for hash: ${ipfsHash}`);
    return NextResponse.json(cached.data);
  }

  // Try each gateway
  for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
    const gateway = IPFS_GATEWAYS[i];
    const url = `${gateway}${ipfsHash}`;

    try {
      console.log(
        `🔄 Trying gateway ${i + 1}/${IPFS_GATEWAYS.length}: ${gateway}`
      );

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json, text/plain, */*",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        // Add timeout
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.text();
        console.log(`✅ Success with gateway ${i + 1}: ${gateway}`);

        // Check if response is HTML (error page)
        if (
          data.trim().startsWith("<!DOCTYPE") ||
          data.trim().startsWith("<html")
        ) {
          console.log(
            `⚠️ Gateway ${gateway} returned HTML page, trying next gateway...`
          );
          continue;
        }

        // Try to parse as JSON first
        let jsonData;
        try {
          jsonData = JSON.parse(data);
          console.log(`✅ Successfully parsed JSON from ${gateway}`);
        } catch (parseError) {
          console.log(
            `⚠️ Response is not JSON from ${gateway}, trying next gateway...`
          );
          continue; // Try next gateway instead of returning error
        }

        // Cache the successful response
        ipfsCache.set(ipfsHash, {
          data: jsonData,
          timestamp: Date.now(),
        });

        return new NextResponse(JSON.stringify(jsonData), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      }
    } catch (error) {
      console.log(`❌ Gateway ${i + 1} failed:`, error);
      continue;
    }
  }

  // Fallback: Return mock data when all gateways fail
  console.log(
    `⚠️ All gateways failed, returning mock data for hash: ${ipfsHash}`
  );
  const mockData = {
    name: `NFT #${ipfsHash.substring(0, 8)}`,
    description:
      "NFT metadata temporarily unavailable - all IPFS gateways failed",
    image: "/images/default-nft.png",
    attributes: [
      { trait_type: "Category", value: "VEHICLE_DECORATION" },
      { trait_type: "Rarity", value: "Common" },
      { trait_type: "Status", value: "Gateway Unavailable" },
    ],
    properties: {
      category: "sticker",
      rarity: "common",
      fallback: true,
    },
  };

  return NextResponse.json(mockData, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
