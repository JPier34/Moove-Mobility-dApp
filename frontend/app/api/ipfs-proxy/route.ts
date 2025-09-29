import { NextRequest, NextResponse } from "next/server";

// Cache per evitare chiamate duplicate
const ipfsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minuti - Increased for better performance

const IPFS_GATEWAYS = [
  // Primary: Most reliable gateways only
  "https://ipfs.io/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",

  // Secondary: Alternative gateways
  "https://dweb.link/ipfs/",
  "https://gateway.ipfs.io/ipfs/",
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash");
  const url = searchParams.get("url");

  if (!hash && !url) {
    return NextResponse.json(
      { error: "Hash or URL parameter is required" },
      { status: 400 }
    );
  }

  // Extract IPFS hash from URL if it's a full URL
  let ipfsHash = hash || url;
  if (ipfsHash && ipfsHash.includes("/ipfs/")) {
    ipfsHash = ipfsHash.split("/ipfs/")[1];
    console.log(`🔍 Extracted IPFS hash: ${ipfsHash} from URL: ${hash || url}`);
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
        // Reduce timeout to 5 seconds for faster fallback
        signal: AbortSignal.timeout(5000),
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

        // Check content type to determine if it's JSON or binary
        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          // Try to parse as JSON for metadata
          let jsonData;
          try {
            jsonData = JSON.parse(data);
            console.log(`✅ Successfully parsed JSON from ${gateway}`);

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
                "Access-Control-Allow-Methods":
                  "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
              },
            });
          } catch (parseError) {
            console.log(
              `⚠️ Failed to parse JSON from ${gateway}, trying next gateway...`
            );
            continue;
          }
        } else {
          // For images and other binary content, return the raw data
          console.log(`✅ Successfully fetched binary content from ${gateway}`);

          return new NextResponse(data, {
            status: 200,
            headers: {
              "Content-Type": contentType || "application/octet-stream",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
          });
        }
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
