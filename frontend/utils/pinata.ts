import axios from "axios";

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY!;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY!;

// Cache for IPFS images to improve performance
const imageCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Optimized IPFS gateways with fallback order (Pinata removed due to connection issues)
const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://dweb.link/ipfs/",
  "https://ipfs.fleek.co/ipfs/",
  "https://gateway.ipfs.io/ipfs/",
];

export async function uploadToPinata(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
    }
  );

  return response.data.IpfsHash;
}

export async function uploadJSONToPinata(json: object): Promise<string> {
  const response = await axios.post(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    json,
    {
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
    }
  );

  return response.data.IpfsHash;
}

/**
 * Optimized function to get IPFS image URL with caching and fallback
 */
export async function getIPFSImageUrl(
  ipfsHash: string,
  options: {
    useCache?: boolean;
    timeout?: number;
    preferredGateway?: string;
  } = {}
): Promise<string> {
  const { useCache = true, timeout = 5000, preferredGateway } = options;

  if (!ipfsHash) {
    throw new Error("IPFS hash is required");
  }

  // Clean the hash
  const cleanHash = ipfsHash.replace("ipfs://", "");

  // Check cache first
  if (useCache) {
    const cached = imageCache.get(cleanHash);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.url;
    }
  }

  // Use preferred gateway if specified
  const gateways = preferredGateway
    ? [preferredGateway, ...IPFS_GATEWAYS.filter((g) => g !== preferredGateway)]
    : IPFS_GATEWAYS;

  // Try each gateway with timeout
  for (const gateway of gateways) {
    try {
      const url = `${gateway}${cleanHash}`;

      // Test if image loads with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Cache the successful URL
        if (useCache) {
          imageCache.set(cleanHash, {
            url,
            timestamp: Date.now(),
          });
        }
        return url;
      }
    } catch (error) {
      console.warn(
        `IPFS gateway ${gateway} failed for hash ${cleanHash}:`,
        error
      );
      continue;
    }
  }

  throw new Error(`Failed to load image from IPFS: ${cleanHash}`);
}

/**
 * Preload IPFS image for better performance
 */
export function preloadIPFSImage(ipfsHash: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!ipfsHash) {
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () =>
      reject(new Error(`Failed to preload image: ${ipfsHash}`));

    getIPFSImageUrl(ipfsHash)
      .then((url) => {
        img.src = url;
      })
      .catch(reject);
  });
}

/**
 * Get optimized image URL for city backgrounds
 */
export function getCityImageUrl(ipfsHash: string): string {
  if (!ipfsHash) {
    return "/images/default-city.svg";
  }

  // Use IPFS.io gateway as primary (Pinata removed due to connection issues)
  const cleanHash = ipfsHash.replace("ipfs://", "");
  return `https://ipfs.io/ipfs/${cleanHash}`;
}

/**
 * Clear image cache
 */
export function clearImageCache(): void {
  imageCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{ hash: string; age: number }>;
} {
  const now = Date.now();
  const entries = Array.from(imageCache.entries()).map(([hash, data]) => ({
    hash,
    age: now - data.timestamp,
  }));

  return {
    size: imageCache.size,
    entries,
  };
}
